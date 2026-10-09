#!/usr/bin/env python3
"""Generates the spoken narration of the guide with Google Cloud Text-to-Speech.

For each language it reads the main text of every step from that language's
page (index.html, de/index.html, fr/index.html) and writes one MP3 per step
into audio/<language>/, together with hashes.json (what each recording was
made from) and manifest.js (which recordings the page may offer). A step whose
text, voice and settings have not changed is skipped.

How a recording is made:

  1. The title and every paragraph are turned into their spoken form: symbols,
     abbreviations, names and numbers are rewritten as each language says
     them. The tables for this are below, one block per language.
  2. Each piece is sent to the API on its own and comes back as uncompressed
     sound. The silence around it is cut off.
  3. The pieces are joined with pauses of an exact length: a clear one after
     the title, a shorter one between paragraphs.
  4. ffmpeg brings the whole recording to the same loudness as all the others
     and writes it once as a mono MP3 with a title and a language tag.

Without ffmpeg the script still works, but less well: it asks the API for
finished MP3s (32 kbit/s, pauses only roughly as long as asked for, loudness
as it comes) and says so.

Tables are not read out. Where a step has one, a hidden paragraph in the page,
<p class="spoken" hidden>, says the same thing in a form that suits listening.
A tab marked data-narration="spoken" is read from such paragraphs alone (the
Timeline, told as a story); one marked "off" is not read at all. A single word
can carry its own spoken form in the page: <span data-say="Groot">GR00T</span>.

Needs the gcloud CLI, logged in to an account that may use the Google Cloud
project named in the GCP_PROJECT environment variable (with the Text-to-Speech
API enabled there). Python 3.9 or later, no packages.

    GCP_PROJECT=my-project python3 tools/generate_voice.py --lang de   # what is missing or changed
    python3 tools/generate_voice.py --lang all --dry-run     # only show what would be spoken
    ... --only mcp --only prompt     # just these recordings
    ... --force                      # also those that have not changed
    ... --prune                      # delete recordings of steps that no longer exist

tools/check_voice.py listens to the result and prints what it heard differently.
"""

import argparse
import array
import base64
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.request
import wave
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The project that is billed for the requests. Not kept in the repository.
PROJECT = os.environ.get('GCP_PROJECT')
# The API also has regional hosts, such as eu-texttospeech.googleapis.com.
API_URL = f'https://{os.environ.get("GCP_TTS_HOST", "texttospeech.googleapis.com")}/v1/text:synthesize'

LANGUAGES = {
    'en': {'page': 'index.html', 'code': 'en-GB', 'voice': 'en-GB-Chirp3-HD-Aoede', 'tag': 'eng'},
    'de': {'page': 'de/index.html', 'code': 'de-DE', 'voice': 'de-DE-Chirp3-HD-Aoede', 'tag': 'deu'},
    'fr': {'page': 'fr/index.html', 'code': 'fr-FR', 'voice': 'fr-FR-Chirp3-HD-Aoede', 'tag': 'fra'},
}

# Everything below this line down to the tables changes how a recording sounds
# and is therefore part of its fingerprint. Raise PIPELINE after a change to
# the code that the fingerprint cannot see.
PIPELINE = '2'
SPEAKING_RATE = 1.0
# The API accepts 5,000 bytes per request. A paragraph longer than the first
# number is sent in several requests, split between sentences.
MAX_REQUEST_BYTES = 4500
HARD_LIMIT_BYTES = 5000
# Pauses in seconds: before the first word, after the title, between paragraphs,
# around a sub-heading, between the parts of a split paragraph, after the last word.
PAUSES = {'head': 0.2, 'title': 0.8, 'paragraph': 0.55, 'before-subtitle': 0.9, 'subtitle': 0.55,
          'split': 0.3, 'tail': 0.6}
# Sound below this level (of 32768) at either end of a piece counts as silence.
SILENCE_LEVEL = 160
BITRATE = '64k'
# Loudness of every finished recording, and the highest peak it may have.
LOUDNESS = {'I': -19.0, 'LRA': 11.0, 'TP': -2.0}
MAX_TRUE_PEAK = -1.5
# Without ffmpeg: the pause marks of the Chirp 3 HD voices, sent in "markup".
MARKUP_PAUSES = {'title': '[pause long]', 'paragraph': '[pause]', 'before-subtitle': '[pause long]',
                 'subtitle': '[pause]', 'split': ''}

VOID_TAGS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
# Paragraphs that are labels, figures or small print, not narration.
SKIPPED_PARAGRAPHS = {'step-no', 'load', 'note', 'stat', 'hero-note', 'recap'}


# ---------------------------------------------------------------------------
# Spoken forms
#
# SPOKEN[language] lists what is written and what the voice is given instead.
# An entry matches only as a whole word, with upper and lower case as written.
# The first entry that matches wins, so longer forms come before shorter ones.
# Abbreviations that every voice spells out by itself (LLM, GPU, MCP, GPT, USB,
# IBM ...) are not listed: German and French letter names are how people there
# say them. What is listed is what a voice would read as a word, spell out
# although it is a word, or say in the wrong language.
#
# IPA[language] is for names no respelling gets right: (written, IPA, respelling).
# The API is strict about which sounds it accepts per language and refuses the
# whole request otherwise; the respelling is then used instead. Tested on
# 2026-10-09: en-GB and fr-FR accept the entries below, de-DE refused every
# multi-syllable entry tried, so German has respellings only.
# ---------------------------------------------------------------------------

SPOKEN = {
    # ----- English -----
    'en': [
        ('NVIDIA', 'Nvidia'), ('CUDA', 'Cuda'), ('VRAM', 'V-RAM'), ('LoRA', 'Lora'),
        ('ELIZA', 'Eliza'), ('NEURA', 'Neura'), ('GR00T', 'Groot'), ('1X', 'One X'), ('NEO', 'Neo'),
        ('IDs', 'I Ds'), ('ID', 'I D'), ('VLA', 'V L A'), ('CLI', 'C L I'), ('RLHF', 'R L H F'),
        ('USB-C', 'U S B C'), ('I. J. Good', 'I J Good'),
        ('word2vec', 'word to vec'), ('AlexNet', 'Alex Net'), ('AlphaGo', 'Alpha Go'),
        ('AlphaFold', 'Alpha Fold'), ('GraphCast', 'Graph Cast'), ('OpenClaw', 'Open Claw'),
        ('Karpathy', 'Karpahthy'), ('Sedol', 'Saydol'),
    ],
    # ----- German -----
    'de': [
        ('NVIDIAs', 'Nvidias'), ('NVIDIA', 'Nvidia'), ('CUDA', 'Kuda'), ('VRAM', 'V-RAM'), ('LoRA', 'Lora'),
        # "One X" and not "Wan Ex": a German W is an English V.
        ('ELIZA', 'Eliza'), ('NEURA', 'Neura'), ('GR00T', 'Gruht'), ('1X', 'One X'), ('NEO', 'Neo'),
        # Read as the German words "mit" and "Api" otherwise.
        ('MIT', 'Em-Ai-Ti'), ('APIs', 'A-P-Is'), ('API', 'A-P-I'), ('CLI', 'C-L-I'),
        ('USB-C', 'USB C'),
        # The German letters "I-D" sound like the word "Idee".
        ('IDs', 'Ei-Dis'), ('ID', 'Ei-Di'),
        # The company is called Moonshot; "AI" would be spelt out in German letters.
        ('Moonshot AI', 'Moonshot'),
        ('Llama', 'Lama'), ('word2vec', 'Word to Vec'), ('I. J. Good', 'Irving John Good'),
        ('Geoffrey', 'Jeffrey'), ('Searle', 'Sörl'), ('Erdős', 'Erdösch'),
        ('z. B.', 'zum Beispiel'), ('z.B.', 'zum Beispiel'), ('d. h.', 'das heißt'), ('d.h.', 'das heißt'),
        ('bzw.', 'beziehungsweise'), ('ca.', 'circa'), ('usw.', 'und so weiter'), ('u. a.', 'unter anderem'),
    ],
    # ----- French -----
    'fr': [
        ('NVIDIA', 'Nvidia'), ('CUDA', 'Couda'), ('VRAM', 'V-RAM'), ('LoRA', 'Lora'),
        ('ELIZA', 'Eliza'), ('NEURA', 'Neura'), ('GR00T', 'Groute'), ('1X', 'Ouane X'), ('NEO', 'Néo'),
        ('MIT', 'M I T'), ('CLI', 'C L I'), ('USB-C', 'USB C'),
        # The letters "I D" sound like the word "idée".
        ('IDs', 'identifiants'), ('ID', 'identifiant'),
        # Read as the word "api" otherwise.
        ('APIs', 'A P I'), ('API', 'A P I'),
        ('Llama', 'Lama'), ('word2vec', 'word tou vec'), ('I. J. Good', 'Irving John Good'),
        ('Geoffrey', 'Jeffrey'), ('Copilot', 'Copilote'), ('Dartmouth', 'Dartmeuth'),
        ('p. ex.', 'par exemple'), ('etc.', 'et cetera'), ('c.-à-d.', 'c’est-à-dire'),
    ],
}

IPA = {
    'en': [('Erdős', 'ˈɛədɜːʃ', 'Erdush'), ('Searle', 'sɜːl', 'Surl')],
    'de': [],
    'fr': [('Erdős', 'ɛʁdœʃ', 'Erdeuche'), ('Searle', 'sœʁl', 'Seurl')],
}

# Symbols, said aloud. Applied anywhere, not only at word boundaries.
SYMBOLS = {
    'en': [('→', ', then '), ('×', ' times '), ('≈', ' is about '), ('·', ' a small dot '), ('&', ' and '),
           ('−', ' minus '), ('=', ' equals '), ('+', ' plus ')],
    'de': [('→', ', dann '), ('×', ' mal '), ('≈', ' ungefähr '), ('·', ' ein kleiner Punkt '), ('&', ' und '),
           ('−', ' minus '), ('=', ' gleich '), ('+', ' plus '), ('%', ' Prozent')],
    'fr': [('→', ', puis '), ('×', ' fois '), ('≈', ' environ '), ('·', ' un petit point '), ('&', ' et '),
           ('−', ' moins '), ('=', ' égale '), ('+', ' plus '), ('%', ' pour cent')],
}

# Words that differ by language in the rules further down.
WORDS = {
    'en': {'to': ' to ', 'short': ', or {x} for short,', 'point': '.', 'thousands': ',',
           'per-second': ' per second', 'version-point': '.'},
    'de': {'to': ' bis ', 'short': ', kurz {x},', 'point': ',', 'thousands': '.',
           'per-second': ' pro Sekunde', 'version-point': ' Punkt '},
    'fr': {'to': ' à ', 'short': ', ou {x},', 'point': ',', 'thousands': '',
           'per-second': ' par seconde', 'version-point': ' point '},
}

# Sizes and units after a number: (pattern of the unit, one, several).
# An English billion is a German Milliarde and a French milliard; an English
# trillion is a German Billion and a French billion.
NUMBER = r'(\d+(?:[.,]\d+)?)'
UNITS = {
    'en': [(r'B\b', 'billion', 'billion'), (r'T\b', 'trillion', 'trillion'),
           (r' ?GB\b', 'gigabyte', 'gigabytes'), (r' ?MB\b', 'megabyte', 'megabytes'),
           (r' ?TB\b', 'terabyte', 'terabytes'), (r' ?kW\b', 'kilowatt', 'kilowatts'), (r' ?W\b', 'watt', 'watts')],
    'de': [(r' ?Mrd\.', 'Milliarde', 'Milliarden'), (r' ?Bio\.', 'Billion', 'Billionen'),
           (r' ?Mio\.', 'Million', 'Millionen'), (r'B\b', 'Milliarde', 'Milliarden'), (r'T\b', 'Billion', 'Billionen'),
           (r' ?GB\b', 'Gigabyte', 'Gigabyte'), (r' ?MB\b', 'Megabyte', 'Megabyte'),
           (r' ?TB\b', 'Terabyte', 'Terabyte'), (r' ?kW\b', 'Kilowatt', 'Kilowatt'), (r' ?W\b', 'Watt', 'Watt')],
    'fr': [(r' ?Md\b', 'milliard', 'milliards'), (r'B\b', 'milliard', 'milliards'), (r'T\b', 'billion', 'billions'),
           (r' ?(?:Go|GB)\b', 'gigaoctet', 'gigaoctets'), (r' ?(?:Mo|MB)\b', 'mégaoctet', 'mégaoctets'),
           (r' ?(?:To|TB)\b', 'téraoctet', 'téraoctets'), (r' ?kW\b', 'kilowatt', 'kilowatts'), (r' ?W\b', 'watt', 'watts')],
}
# A unit that stands without a number.
BARE_UNITS = {'en': [('GB', 'gigabytes')], 'de': [('GB', 'Gigabyte')], 'fr': [('GB', 'gigaoctets')]}

# A full stop after one of these does not end a sentence (used only when a
# paragraph is too long for one request and has to be split).
ABBREVIATIONS = {'e.g', 'i.e', 'etc', 'vs', 'Dr', 'Mr', 'Mrs', 'Prof', 'St', 'No', 'Nr', 'bzw', 'ca', 'usw', 'ggf',
                 'evtl', 'z', 'd', 'u', 'M', 'Mme', 'p', 'ex', 'cf', 'env'}

SPACES = '\u00a0\u202f\u2009\u2007'


def whole_word(written):
    """A pattern for `written` where it is not part of a longer word or number."""
    return re.compile(r'(?<!\w)' + re.escape(written) + r'(?!\w)')


def clean(text):
    """Removes what is typography only: soft hyphens, special spaces, line breaks."""
    text = unicodedata.normalize('NFC', text)
    text = re.sub('[\u00ad\u200b\u200c\u2060\ufeff]', '', text)
    return re.sub(r'\s+', ' ', re.sub(f'[{SPACES}]', ' ', text)).strip()


def unit_words(lang, number, one, several):
    value = float(number.replace(',', '.'))
    # French counts everything below two as one: "1,5 milliard".
    single = value < 2 if lang == 'fr' else value == 1
    return f'{number} {one if single else several}'


def spoken_form(text, lang, used=None):
    """Rewrites a piece of text the way the voice of this language should say it.

    `used` collects what was replaced, for the review list of a dry run.
    """
    words = WORDS[lang]
    used = used if used is not None else []

    def swap(pattern, replacement, text, label=None):
        compiled = re.compile(pattern) if isinstance(pattern, str) else pattern
        result, count = compiled.subn(replacement, text)
        if count and label:
            used.append(label)
        return result

    # Numbers first, while the special spaces are still there: "50 000" is one number.
    text = unicodedata.normalize('NFC', text)
    text = re.sub(f'(?<=\\d)[{SPACES}](?=\\d{{3}}(?!\\d))', words['thousands'], text)
    text = clean(text)
    if lang != 'en':
        # A version number keeps its point: "Gemini 2.5" is "2 Punkt 5", not the decimal "2,5".
        # It follows a name (a capital or a hyphen) and is not a quantity.
        text = swap(r'(\b[A-ZÄÖÜÉ]\w*[- ]|[A-Za-z]-|\bversion )(\d+)\.(\d{1,2})'
                    r'(?![\d%]|\.\d| ?(?:%|[BT]\b|[GMT]B\b|[GMT]o\b|k?W\b|M(?:rd|io|d)\b|Bio\b|[Mm]ill|[Bb]ill))',
                    lambda m: m.group(1) + m.group(2) + words['version-point'] + m.group(3), text, 'version number')
        # An English thousands comma left in a translation would be read as a decimal comma.
        text = re.sub(r'(?<![\d.,])[1-9]\d{0,2}(?:,\d{3})+(?![\d,])',
                      lambda m: m.group().replace(',', words['thousands']), text)
        # And an English decimal point as a full stop.
        text = re.sub(r'(?<![\d.,])(\d+)\.(\d{1,2})(?!\d|\.\d)', r'\1,\2', text)

    # What stands in brackets is said as an aside; a bracketed abbreviation is introduced as one.
    # An abbreviation has a second capital or a digit: "(LLM)", "(MoE)", but not a German noun, "(Katze)".
    text = swap(r'\s*\(([A-Z](?=[A-Za-z0-9]*[A-Z0-9])[A-Za-z0-9]{1,6})\)', lambda m: words['short'].format(x=m.group(1)), text, '(abbreviation)')
    text = swap(r'\s*\(([^()]*)\)', r', \1,', text, '(brackets)')
    text = re.sub(r'[\[\]]', '', text)

    # Dashes: a range between numbers, otherwise a short break.
    text = swap(r'(?<=\d)\s?[–—]\s?(?=\d)', words['to'], text, 'range')
    text = re.sub(r'\s?[–—]\s?', ', ', text)
    # "GPT-4" is said without the hyphen, which some voices read as "minus" or "to".
    text = re.sub(r'(?<=[A-Za-z])-(?=\d)', ' ', text)
    # "GPT-4o" is "four o", not "forty".
    text = re.sub(r'(?<=[A-Za-z] )(\d)o(?!\w)', r'\1 o', text)
    text = re.sub(r'(?<!\w)K(\d)(?!\w)', r'K \1', text)

    for unit, one, several in UNITS[lang]:
        # Before a noun the unit is not counted: "a 24-GB card" is "a 24-gigabyte card".
        text = swap(r'(?<![\w.,])' + NUMBER + '-' + unit.replace(' ?', '') + r'(?=[- ]\w)',
                    lambda m: f'{m.group(1)}-{one}', text, one)
        text = swap(r'(?<![\w.,])' + NUMBER + unit, lambda m: unit_words(lang, m.group(1), one, several), text,
                    several)
    for written, spoken in BARE_UNITS[lang]:
        text = swap(whole_word(written), spoken, text, spoken)
    text = swap(r'(?<=\w)/s\b', words['per-second'], text, '/s')

    for written, spoken in SPOKEN[lang]:
        text = swap(whole_word(written), spoken, text, f'{written} → {spoken}')
    for symbol, spoken in SYMBOLS[lang]:
        if symbol in text:
            used.append(f'{symbol} → {spoken.strip()}')
            text = text.replace(symbol, spoken)

    # Tidy up what the replacements left behind.
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([,.])', r'\1', text)
    text = re.sub(r',\s*([.;:!?,])', r'\1', text)
    text = re.sub(r'^[,\s]+', '', text).strip()
    if text and not text.endswith(('.', '?', '!', ':', '…')):
        text += '.'
    if lang == 'fr':
        # The French voice spells out the "l" of "l’étape" when the accented letter after the
        # apostrophe is a single character; with a separate accent mark it reads the word.
        text = re.sub(r'(?<=[’\'])[^\W\d_]', lambda m: unicodedata.normalize('NFD', m.group()), text)
        text = text.replace('’œ', '’oe')
    return text


# ---------------------------------------------------------------------------
# Reading the page
# ---------------------------------------------------------------------------

class NarrationParser(HTMLParser):
    """Collects, per step and per hero, the text a narrator would read aloud."""

    def __init__(self):
        super().__init__()
        self.stack = []        # (tag, classes, id) of the open elements
        self.pieces = {}       # narration id -> list of (kind, text); kind is title, subtitle or text
        self.titles = {}       # narration id -> its heading, also where the heading is not read out
        self.tables = set()    # narration ids that contain a table
        self.spoken = set()    # narration ids that have a paragraph written for listening
        self.steps = []        # every step and hero that could have a recording, in page order
        self.view = None
        self.silent = False    # inside a view marked data-narration="off"
        self.spoken_only = False  # inside a view marked data-narration="spoken"
        self.owner = None      # narration id of the step or hero we are inside
        self.owner_depth = 0
        self.capture = None    # (depth, kind) of the element being collected
        self.say_depth = None  # inside an element whose data-say replaces its text
        self.buffer = []

    def handle_starttag(self, tag, attrs):
        if tag in VOID_TAGS:
            return
        attrs = dict(attrs)
        classes = set((attrs.get('class') or '').split())
        self.stack.append((tag, classes, attrs.get('id')))
        depth = len(self.stack)

        if 'view' in classes:
            self.view = attrs['id']
            self.silent = attrs.get('data-narration') == 'off'
            self.spoken_only = attrs.get('data-narration') == 'spoken'
        elif self.silent:
            return
        elif tag == 'section' and 'step' in classes:
            self.owner, self.owner_depth = attrs['id'], depth
            self.steps.append(self.owner)
        elif tag == 'header' and 'hero' in classes and self.view:
            self.owner, self.owner_depth = self.view, depth
            self.steps.append(self.owner)

        if self.owner is None:
            return
        if tag == 'table':
            self.tables.add(self.owner)
        if self.capture is not None:
            if 'data-say' in attrs and self.say_depth is None:
                self.buffer.append(attrs['data-say'])
                self.say_depth = depth
            return
        parent_tag, parent_classes, _ = self.stack[-2]
        direct_child = depth == self.owner_depth + 1
        in_question = parent_tag == 'div' and 'question' in parent_classes and depth == self.owner_depth + 2
        if tag == 'p' and 'spoken' in classes and direct_child:
            self.spoken.add(self.owner)
        if self.spoken_only:
            paragraph = tag == 'p' and 'spoken' in classes
        else:
            paragraph = tag == 'p' and not classes & SKIPPED_PARAGRAPHS
        if direct_child and tag in ('h1', 'h2'):
            self.capture = (depth, 'title')
        elif direct_child and tag == 'h3' and not self.spoken_only:
            self.capture = (depth, 'subtitle')
        elif direct_child and paragraph:
            self.capture = (depth, 'text')
        elif in_question and tag in ('h3', 'p') and not self.spoken_only:
            self.capture = (depth, 'subtitle' if tag == 'h3' else 'text')
        if self.capture:
            self.buffer = []

    def handle_startendtag(self, tag, attrs):
        if tag not in VOID_TAGS:
            self.handle_starttag(tag, attrs)
            self.handle_endtag(tag)

    def handle_data(self, data):
        if self.capture is not None and self.say_depth is None:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if tag in VOID_TAGS or not self.stack:
            return
        depth = len(self.stack)
        if self.say_depth == depth:
            self.say_depth = None
        if self.capture is not None and self.capture[0] == depth:
            # Only the white space of the source: a no-break space inside "50 000" is still needed.
            kind, text = self.capture[1], re.sub(r'[ \t\n\r\f\v]+', ' ', ''.join(self.buffer)).strip()
            if text and kind == 'title':
                self.titles.setdefault(self.owner, clean(text))
            # A tab told as a story has its titles in the telling already.
            if text and not (kind == 'title' and self.spoken_only):
                self.pieces.setdefault(self.owner, []).append((kind, text))
            self.capture = None
        if self.owner is not None and depth == self.owner_depth:
            self.owner = None
        self.stack.pop()


class Recording:
    """One step's narration: what is written, what is spoken, how it is sent."""

    def __init__(self, key, lang, title, pieces):
        self.key, self.lang, self.title = key, lang, title
        self.used = []      # the replacements that were made, for review
        self.pieces = []    # (kind, written, [spoken parts, each one request])
        for kind, written in pieces:
            spoken = spoken_form(written, lang, self.used)
            if spoken.strip('.?!:… '):
                self.pieces.append((kind, clean(written), split_for_api(spoken)))

    def requests(self):
        return [part for _, _, parts in self.pieces for part in parts]

    def characters(self):
        return sum(len(part) for part in self.requests())

    def written(self):
        return ' '.join(written for _, written, _ in self.pieces)

    def sequence(self):
        """The spoken parts in order, each with the name of the pause that follows it."""
        flat = []
        for index, (kind, _, parts) in enumerate(self.pieces):
            following = self.pieces[index + 1][0] if index + 1 < len(self.pieces) else None
            for number, part in enumerate(parts):
                if number + 1 < len(parts):
                    pause = 'split'
                elif following is None:
                    pause = None
                elif following == 'subtitle':
                    pause = 'before-subtitle'
                else:
                    pause = {'title': 'title', 'subtitle': 'subtitle'}.get(kind, 'paragraph')
                flat.append((part, pause))
        return flat

    def fingerprint(self, mode, album):
        """Changes whenever anything that affects the sound of this recording changes."""
        language = LANGUAGES[self.lang]
        recipe = {
            'pipeline': PIPELINE, 'mode': mode, 'voice': language['voice'], 'rate': SPEAKING_RATE,
            'sequence': self.sequence(), 'pronunciations': [pronunciations(part, self.lang) for part in self.requests()],
            'pauses': PAUSES if mode == 'ffmpeg' else MARKUP_PAUSES,
            'sound': [SILENCE_LEVEL, BITRATE, LOUDNESS, MAX_TRUE_PEAK] if mode == 'ffmpeg' else 'MP3',
            'tags': [self.title, album, language['tag']] if mode == 'ffmpeg' else None,
        }
        return hashlib.sha1(json.dumps(recipe, sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()


def read_narration(lang):
    """Returns the recordings of one language's page, its title and what to warn about."""
    parser = NarrationParser()
    parser.feed((ROOT / LANGUAGES[lang]['page']).read_text(encoding='utf-8'))
    page_title = re.search(r'<title>(.*?)</title>', (ROOT / LANGUAGES[lang]['page']).read_text(encoding='utf-8'), re.S)
    album = clean(page_title.group(1)) if page_title else ''
    recordings, warnings = {}, []
    for key in parser.steps:
        recording = Recording(key, lang, parser.titles.get(key, key), parser.pieces.get(key, []))
        if not recording.pieces:
            warnings.append(f'{key}: nothing to read out, so it gets no recording')
            continue
        if key in parser.tables and key not in parser.spoken:
            warnings.append(f'{key}: has a table but no <p class="spoken" hidden> that tells what it shows')
        recordings[key] = recording
    return recordings, album, warnings


# ---------------------------------------------------------------------------
# Pieces the API accepts
# ---------------------------------------------------------------------------

def size(text):
    return len(text.encode('utf-8'))


def sentences(text):
    """Splits at sentence ends, but not after initials, abbreviations or German ordinals ("30. November").

    A longer number is a year or an amount at the end of a sentence: "… im Jahr 2024. Danach …".
    """
    result, start = [], 0
    for match in re.finditer(r'[.?!…]+["”“»’)]*\s+', text):
        before = text[start:match.start()]
        last_word = before.rsplit(' ', 1)[-1]
        if match.group().lstrip().startswith('.') and (
                len(last_word) == 1 or (last_word.isdigit() and len(last_word) <= 2)
                or last_word in ABBREVIATIONS):
            continue
        result.append(text[start:match.end()].strip())
        start = match.end()
    if text[start:].strip():
        result.append(text[start:].strip())
    return result


def split_for_api(text):
    """Returns the text in as few parts as the API's size limit allows."""
    if size(text) <= MAX_REQUEST_BYTES:
        return [text]
    units = []
    for sentence in sentences(text):
        # A single sentence beyond the limit is cut at commas, then at spaces.
        for separator in (', ', ' '):
            if size(sentence) <= MAX_REQUEST_BYTES:
                break
            units_of_sentence, current = [], ''
            for bit in sentence.split(separator):
                joined = f'{current}{separator}{bit}' if current else bit
                if current and size(joined) > MAX_REQUEST_BYTES:
                    units_of_sentence.append(current + separator.strip())
                    current = bit
                else:
                    current = joined
            units.extend(units_of_sentence)
            sentence = current
        units.append(sentence)
    parts, current = [], ''
    for unit in units:
        joined = f'{current} {unit}'.strip()
        if current and size(joined) > MAX_REQUEST_BYTES:
            parts.append(current)
            current = unit
        else:
            current = joined
    parts.append(current)
    for part in parts:
        assert size(part) <= HARD_LIMIT_BYTES, f'A part of {size(part)} bytes is too long for the API: {part[:80]}…'
    return parts


def pronunciations(text, lang, refused=()):
    """The IPA entries for the names in this text, as the API wants them."""
    return [{'phrase': phrase, 'phoneticEncoding': 'PHONETIC_ENCODING_IPA', 'pronunciation': ipa}
            for phrase, ipa, _ in IPA[lang] if phrase not in refused and whole_word(phrase).search(text)]


def respell(text, lang, phrases):
    for phrase, _, respelling in IPA[lang]:
        if phrase in phrases:
            text = whole_word(phrase).sub(respelling, text)
    return text


# ---------------------------------------------------------------------------
# The API
# ---------------------------------------------------------------------------

class ApiError(Exception):
    pass


class Api:
    """Sends text to the Text-to-Speech API, with a fresh token, patience and readable errors."""

    RETRY_STATUS = {429, 500, 502, 503, 504}
    WAITS = (2, 5, 15, 30)

    def __init__(self):
        self.token = None
        self.refused = set()   # (language, phrase) of IPA entries the API would not take

    def login(self):
        try:
            result = subprocess.run(['gcloud', 'auth', 'print-access-token'], capture_output=True, text=True, check=True)
        except FileNotFoundError:
            raise ApiError('The gcloud CLI was not found. Install it and run "gcloud auth login".')
        except subprocess.CalledProcessError as error:
            raise ApiError('gcloud could not give an access token; run "gcloud auth login".\n' + error.stderr.strip())
        self.token = result.stdout.strip()

    def post(self, body, url=API_URL):
        """Returns the API's answer, or raises ApiError with the API's own message."""
        if not self.token:
            self.login()
        data = json.dumps(body).encode('utf-8')
        fresh_token = False
        for attempt in range(len(self.WAITS) + 1):
            request = urllib.request.Request(url, data=data, headers={
                'Authorization': f'Bearer {self.token}',
                'x-goog-user-project': PROJECT,
                'Content-Type': 'application/json; charset=utf-8',
            })
            try:
                with urllib.request.urlopen(request, timeout=180) as response:
                    return json.load(response)
            except urllib.error.HTTPError as error:
                detail = error.read().decode('utf-8', 'replace')
                try:
                    message = json.loads(detail)['error']['message']
                except (ValueError, KeyError, TypeError):
                    message = detail.strip()[:500]
                problem = f'HTTP {error.code}: {message}'
                # A token lasts an hour; a long run gets a new one once.
                if error.code == 401 and not fresh_token:
                    self.login()
                    fresh_token = True
                    continue
                if error.code not in self.RETRY_STATUS:
                    raise ApiError(problem)
            except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
                problem = f'no answer from the API ({getattr(error, "reason", error)})'
            if attempt == len(self.WAITS):
                raise ApiError(f'{problem} (gave up after {attempt + 1} tries)')
            print(f'    {problem}; trying again in {self.WAITS[attempt]} s', file=sys.stderr)
            time.sleep(self.WAITS[attempt])
        raise ApiError(f'{problem} (gave up after {len(self.WAITS) + 1} tries)')

    def synthesize(self, text, lang, encoding, markup=False):
        language = LANGUAGES[lang]
        config = {'audioEncoding': encoding}
        if SPEAKING_RATE != 1.0:
            config['speakingRate'] = SPEAKING_RATE
        while True:
            refused = {phrase for code, phrase in self.refused if code == lang}
            spoken = respell(text, lang, refused)
            source = {'markup' if markup else 'text': spoken}
            names = pronunciations(spoken, lang, refused)
            if names:
                source['customPronunciations'] = {'pronunciations': names}
            try:
                answer = self.post({'input': source, 'audioConfig': config,
                                    'voice': {'languageCode': language['code'], 'name': language['voice']}})
                return base64.b64decode(answer['audioContent'])
            except ApiError as error:
                # The API names the IPA entries it does not accept. Their respelling is used from then on.
                bad = {entry['phrase'] for entry in names if entry['phrase'] in str(error)}
                if 'pronunciation' not in str(error) or not bad:
                    raise
                print(f'    The API refused the IPA for {", ".join(sorted(bad))}; using the respelling.', file=sys.stderr)
                self.refused.update((lang, phrase) for phrase in bad)


# ---------------------------------------------------------------------------
# Sound
# ---------------------------------------------------------------------------

def read_wav(data):
    """Returns the samples of the API's answer (16 bit, mono) and their rate."""
    with wave.open(io.BytesIO(data)) as sound:
        if sound.getsampwidth() != 2 or sound.getnchannels() != 1:
            raise ApiError('The API answered with sound that is not 16-bit mono.')
        samples = array.array('h')
        samples.frombytes(sound.readframes(sound.getnframes()))
        rate = sound.getframerate()
    if sys.byteorder == 'big':
        samples.byteswap()
    return samples, rate


def trim(samples, rate):
    """Cuts the silence off both ends, which differs from request to request."""
    window = max(1, rate // 100)
    loud = [start for start in range(0, len(samples), window)
            if max(samples[start:start + window]) > SILENCE_LEVEL or min(samples[start:start + window]) < -SILENCE_LEVEL]
    if not loud:
        return samples
    # A little is kept: a soft first sound, and the breath a last word ends on.
    first = max(0, loud[0] - 3 * window)
    last = min(len(samples), loud[-1] + 9 * window)
    return samples[first:last]


def silence(seconds, rate):
    return array.array('h', bytes(2 * int(seconds * rate)))


def run_ffmpeg(arguments):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y'] + arguments, capture_output=True, text=True)
    if result.returncode != 0:
        raise ApiError('ffmpeg failed:\n' + result.stderr.strip()[-800:])
    return result.stderr


def measure(path):
    """Loudness (LUFS) and true peak (dBTP) of a sound file."""
    report = run_ffmpeg(['-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    summary = report[report.rindex('Summary:'):]
    loudness = float(re.search(r'I:\s+(-?[\d.]+|-?inf) LUFS', summary).group(1))
    peak = float(re.search(r'Peak:\s+(-?[\d.]+|-?inf) dBFS', summary).group(1))
    return loudness, peak


def encode(wav, mp3, tags):
    """Brings the recording to the common loudness and writes it as an MP3."""
    target = f'loudnorm=I={LOUDNESS["I"]}:TP={LOUDNESS["TP"]}:LRA={LOUDNESS["LRA"]}'
    # First pass: measure. Second pass: with the measurements the filter can
    # apply one steady gain instead of riding the volume up and down.
    report = run_ffmpeg(['-i', str(wav), '-af', f'{target}:print_format=json', '-f', 'null', '-'])
    measured = json.loads(report[report.rindex('{'):report.rindex('}') + 1])
    if 'inf' in measured['input_i']:
        raise ApiError('The recording is silent.')
    chain = (f'{target}:measured_I={measured["input_i"]}:measured_TP={measured["input_tp"]}'
             f':measured_LRA={measured["input_lra"]}:measured_thresh={measured["input_thresh"]}'
             f':offset={measured["target_offset"]}:linear=true')
    metadata = [part for name, value in tags.items() if value for part in ('-metadata', f'{name}={value}')]
    lower = 0.0
    for _ in range(3):
        filters = chain + (f',volume={-lower:.1f}dB' if lower else '')
        run_ffmpeg(['-i', str(wav), '-af', filters, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame',
                    '-b:a', BITRATE, '-id3v2_version', '3'] + metadata + [str(mp3)])
        loudness, peak = measure(mp3)
        if peak <= MAX_TRUE_PEAK:
            break
        # Resampling and MP3 coding can lift a peak a little above what the filter left.
        lower += peak - MAX_TRUE_PEAK + 0.3
    return loudness, peak


def record(recording, api, folder, album, mode):
    """Makes one recording and returns its length in seconds and a note on its sound."""
    target = folder / f'{recording.key}.mp3'
    lang = recording.lang
    with tempfile.TemporaryDirectory() as temporary:
        unfinished = Path(temporary) / 'recording.mp3'
        if mode == 'ffmpeg':
            samples, rate = silence(PAUSES['head'], 24000), None
            for part, pause in recording.sequence():
                piece, piece_rate = read_wav(api.synthesize(part, lang, 'LINEAR16'))
                if rate is None:
                    rate = piece_rate
                    samples = silence(PAUSES['head'], rate)
                elif piece_rate != rate:
                    raise ApiError(f'The API changed its sample rate from {rate} to {piece_rate} Hz.')
                samples.extend(trim(piece, rate))
                samples.extend(silence(PAUSES[pause] if pause else PAUSES['tail'], rate))
            if sys.byteorder == 'big':
                samples.byteswap()
            wav = Path(temporary) / 'recording.wav'
            with wave.open(str(wav), 'wb') as sound:
                sound.setnchannels(1)
                sound.setsampwidth(2)
                sound.setframerate(rate)
                sound.writeframes(samples.tobytes())
            loudness, peak = encode(wav, unfinished, {'title': recording.title, 'album': album,
                                                      'language': LANGUAGES[lang]['tag']})
            seconds = len(samples) / rate
            note = f'{loudness:.1f} LUFS, peak {peak:.1f} dBTP'
        else:
            # Without ffmpeg: the API's own MP3s, with pause marks in the text, joined as they are.
            requests, current = [], ''
            for part, pause in recording.sequence():
                marked = f'{part} {MARKUP_PAUSES[pause]}'.strip() if pause else part
                if current and size(f'{current} {marked}') > MAX_REQUEST_BYTES:
                    requests.append(current)
                    current = marked
                else:
                    current = f'{current} {marked}'.strip()
            requests.append(current)
            sound = b''.join(api.synthesize(text, lang, 'MP3', markup=True) for text in requests)
            unfinished.write_bytes(sound)
            seconds = len(sound) * 8 / 32000
            note = 'the API\'s own MP3'
        # Only a finished file takes the place of the old one.
        shutil.move(str(unfinished), str(target))
    return seconds, note


# ---------------------------------------------------------------------------
# The run
# ---------------------------------------------------------------------------

def write_manifest(folder, lang, keys, hashes):
    """Lists the recordings that exist. The ?v= makes a browser fetch a new recording instead of its stored copy."""
    manifest = {}
    for key in keys:
        if (folder / f'{key}.mp3').exists():
            version = hashes.get(key, '')[:8]
            manifest[key] = f'{key}.mp3?v={version}' if version else f'{key}.mp3'
    (folder / 'manifest.js').write_text(
        '// Written by tools/generate_voice.py. Maps a step or view id to its recording in this folder.\n'
        f'const NARRATION = {json.dumps(manifest, indent=2)};\n', encoding='utf-8')
    print(f'Wrote audio/{lang}/manifest.js with {len(manifest)} recordings.')


def looks_untranslated(recordings, english):
    """True if most of this page's narration is still word for word the English one."""
    same = sum(1 for key, recording in recordings.items()
               if key in english and recording.written() == english[key].written())
    return bool(recordings) and same > len(recordings) / 2


def generate(lang, options, api, mode):
    """Handles one language. Returns False if something went wrong."""
    folder = ROOT / 'audio' / lang
    hashes_file = folder / 'hashes.json'
    recordings, album, warnings = read_narration(lang)
    hashes = json.loads(hashes_file.read_text(encoding='utf-8')) if hashes_file.exists() else {}

    unknown = [key for key in options.only if key not in recordings]
    if unknown:
        print(f'[{lang}] No such recording: {", ".join(unknown)}', file=sys.stderr)
        return False
    chosen = {key: recording for key, recording in recordings.items() if not options.only or key in options.only}
    pending = {key: recording for key, recording in chosen.items()
               if options.force or hashes.get(key) != recording.fingerprint(mode, album)
               or not (folder / f'{key}.mp3').exists()}
    orphans = sorted(path.stem for path in folder.glob('*.mp3') if path.stem not in recordings) if folder.exists() else []
    orphans += sorted(key for key in hashes if key not in recordings and key not in orphans)

    total = sum(recording.characters() for recording in recordings.values())
    print(f'\n[{lang}] {LANGUAGES[lang]["voice"]}: {len(recordings)} recordings, {total:,} characters in all; '
          f'{len(pending)} to generate ({sum(r.characters() for r in pending.values()):,} characters, '
          f'{sum(len(r.requests()) for r in pending.values())} requests).')
    for warning in warnings:
        print(f'  Warning: {warning}')
    if orphans:
        print(f'  No step for: {", ".join(orphans)}' + ('' if options.prune else ' (remove with --prune)'))

    if options.dry_run:
        for key, recording in chosen.items():
            state = 'to generate' if key in pending else 'up to date'
            print(f'\n[{lang}/{key}] {recording.characters()} characters, {len(recording.requests())} requests, {state}')
            for part, pause in recording.sequence():
                print(f'  {part}')
                if pause in ('title', 'before-subtitle'):
                    print()
            if recording.used:
                print(f'  ~ said differently: {"; ".join(dict.fromkeys(recording.used))}')
            names = [entry['phrase'] for part in recording.requests() for entry in pronunciations(part, lang)]
            if names:
                print(f'  ~ with IPA: {", ".join(dict.fromkeys(names))}')
        return True

    if lang != 'en' and pending and not options.force and looks_untranslated(recordings, read_narration('en')[0]):
        print(f'  {LANGUAGES[lang]["page"]} still has the English text, so nothing is recorded for it '
              '(--force records it anyway).', file=sys.stderr)
        return False
    if pending and not PROJECT:
        print('Set GCP_PROJECT to the Google Cloud project to use, for example:\n'
              '    GCP_PROJECT=my-project python3 tools/generate_voice.py', file=sys.stderr)
        return False

    folder.mkdir(parents=True, exist_ok=True)
    ok = True
    try:
        if options.prune:
            for key in orphans:
                (folder / f'{key}.mp3').unlink(missing_ok=True)
                hashes.pop(key, None)
                print(f'  removed {key}')
        for key, recording in pending.items():
            try:
                seconds, note = record(recording, api, folder, album, mode)
            except ApiError as error:
                print(f'  {key}: {error}', file=sys.stderr)
                ok = False
                break
            hashes[key] = recording.fingerprint(mode, album)
            hashes_file.write_text(json.dumps(hashes, indent=2, sort_keys=True) + '\n', encoding='utf-8')
            print(f'  {key}.mp3  {int(seconds // 60)}:{int(seconds % 60):02d}  '
                  f'{(folder / f"{key}.mp3").stat().st_size // 1024} KB  {note}')
    finally:
        # Also after an error or Ctrl-C, so the page never offers less than is on disk.
        hashes_file.write_text(json.dumps(hashes, indent=2, sort_keys=True) + '\n', encoding='utf-8')
        write_manifest(folder, lang, recordings, hashes)
    return ok


def main():
    parser = argparse.ArgumentParser(description='Generates the narration of the guide. See the top of this file.')
    parser.add_argument('--lang', choices=[*LANGUAGES, 'all'], default='all', help='which page to read (default: all)')
    parser.add_argument('--dry-run', action='store_true', help='show what would be spoken; write and send nothing')
    parser.add_argument('--force', action='store_true', help='generate also what has not changed')
    parser.add_argument('--only', action='append', default=[], metavar='ID',
                        help='only this step or view id (may be given several times, or comma-separated)')
    parser.add_argument('--prune', action='store_true', help='delete recordings whose step no longer exists')
    parser.add_argument('--no-ffmpeg', action='store_true', help='use the API\'s own MP3s even if ffmpeg is installed')
    options = parser.parse_args()
    options.only = [key for value in options.only for key in value.split(',') if key]

    mode = 'ffmpeg' if shutil.which('ffmpeg') and not options.no_ffmpeg else 'api-mp3'
    if mode == 'api-mp3':
        print('Warning: without ffmpeg the recordings are the API\'s own MP3s: 32 kbit/s, pauses and loudness '
              'as they come. Install ffmpeg for the full quality.', file=sys.stderr)
    api = Api()
    results = [generate(lang, options, api, mode) for lang in (LANGUAGES if options.lang == 'all' else [options.lang])]
    sys.exit(0 if all(results) else 1)


if __name__ == '__main__':
    main()
