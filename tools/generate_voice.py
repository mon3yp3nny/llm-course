#!/usr/bin/env python3
"""Generates the spoken narration for the page with Google Cloud Text-to-Speech.

Reads the main text of every step from index.html, sends it to the API and
writes one MP3 per step into audio/, plus audio/manifest.js, which tells the
page which recordings exist. Steps whose text has not changed are skipped.

Tables are not read out. Where a step has one, a hidden paragraph in the page,
<p class="spoken" hidden>, says the same thing in a form that suits listening.

Needs the gcloud CLI, logged in to an account that may use the Google Cloud
project named in the GCP_PROJECT environment variable (with the Text-to-Speech
API enabled there).

    GCP_PROJECT=my-project python3 tools/generate_voice.py   # generate what is missing or changed
    python3 tools/generate_voice.py --dry-run                # only show what would be spoken
"""

import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

# The project that is billed for the requests. Not kept in the repository.
PROJECT = os.environ.get('GCP_PROJECT')
VOICE = {'languageCode': 'en-GB', 'name': 'en-GB-Chirp3-HD-Aoede'}
API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'
# The API accepts 5,000 bytes per request; longer texts are sent sentence by sentence in chunks.
MAX_REQUEST_BYTES = 4500

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / 'audio'
HASHES_FILE = AUDIO_DIR / 'hashes.json'
MANIFEST_FILE = AUDIO_DIR / 'manifest.js'

VOID_TAGS = {'input', 'br', 'img', 'meta', 'link', 'hr'}
# Paragraphs that are labels, figures or small print, not narration.
SKIPPED_PARAGRAPHS = {'step-no', 'load', 'note', 'stat', 'hero-note', 'eyebrow', 'recap'}
# Symbols and names a voice would stumble over, with what to say instead.
SPOKEN_REPLACEMENTS = [('·', 'a small dot'), ('→', ', then '), ('×', ' times '), ('≈', ' is about '),
                       ('GR00T', 'Groot'), ('1X', 'One X'), ('NEO', 'Neo')]


class NarrationParser(HTMLParser):
    """Collects, per step and per hero, the text a narrator would read aloud."""

    def __init__(self):
        super().__init__()
        self.stack = []        # (tag, classes, id) of the open elements
        self.texts = {}        # narration id -> list of text pieces
        self.view = None
        self.silent = False    # inside a view marked data-narration="off"
        self.owner = None      # narration id of the step or hero we are inside
        self.owner_depth = 0
        self.capture_depth = None
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
        elif self.silent:
            return
        elif tag == 'section' and 'step' in classes:
            self.owner, self.owner_depth = attrs['id'], depth
        elif tag == 'header' and 'hero' in classes and self.view:
            self.owner, self.owner_depth = self.view, depth

        if self.owner is None or self.capture_depth is not None:
            return
        parent_tag, parent_classes, _ = self.stack[-2]
        direct_child = depth == self.owner_depth + 1
        in_question = parent_tag == 'div' and 'question' in parent_classes and depth == self.owner_depth + 2
        spoken_paragraph = tag == 'p' and not classes & SKIPPED_PARAGRAPHS
        if (direct_child and (tag in ('h1', 'h2', 'h3') or spoken_paragraph)) or (in_question and tag in ('h3', 'p')):
            self.start_capture(depth)

    def start_capture(self, depth):
        self.capture_depth, self.buffer = depth, []

    def handle_data(self, data):
        if self.capture_depth is not None:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if tag in VOID_TAGS or not self.stack:
            return
        depth = len(self.stack)
        if self.capture_depth == depth:
            text = re.sub(r'\s+', ' ', ''.join(self.buffer)).strip()
            if text:
                if not text.endswith(('.', '?', '!', ':')):
                    text += '.'
                self.texts.setdefault(self.owner, []).append(text)
            self.capture_depth = None
        if self.owner is not None and depth == self.owner_depth:
            self.owner = None
        self.stack.pop()


def narration_texts():
    parser = NarrationParser()
    parser.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
    texts = {}
    for key, pieces in parser.texts.items():
        text = ' '.join(pieces)
        for symbol, spoken in SPOKEN_REPLACEMENTS:
            text = text.replace(symbol, spoken)
        # Model sizes such as "70B" or "2.8T" are spoken in full.
        text = re.sub(r'(\d+(?:\.\d+)?)B\b', r'\1 billion', text)
        text = re.sub(r'(\d+(?:\.\d+)?)T\b', r'\1 trillion', text)
        texts[key] = re.sub(r'\s+', ' ', text).strip()
    return texts


def chunks(text):
    """Splits a text at sentence ends into pieces the API accepts."""
    pieces, current = [], ''
    for sentence in re.split(r'(?<=[.?!])\s+', text):
        if current and len((current + ' ' + sentence).encode('utf-8')) > MAX_REQUEST_BYTES:
            pieces.append(current)
            current = sentence
        else:
            current = f'{current} {sentence}'.strip()
    return pieces + [current] if current else pieces


def synthesize(text, token):
    body = json.dumps({'input': {'text': text}, 'voice': VOICE, 'audioConfig': {'audioEncoding': 'MP3'}})
    request = urllib.request.Request(API_URL, data=body.encode('utf-8'), headers={
        'Authorization': f'Bearer {token}',
        'x-goog-user-project': PROJECT,
        'Content-Type': 'application/json; charset=utf-8',
    })
    with urllib.request.urlopen(request, timeout=120) as response:
        return base64.b64decode(json.load(response)['audioContent'])


def main():
    dry_run = '--dry-run' in sys.argv
    texts = narration_texts()
    AUDIO_DIR.mkdir(exist_ok=True)
    hashes = json.loads(HASHES_FILE.read_text()) if HASHES_FILE.exists() else {}
    fingerprint = lambda text: hashlib.sha1((VOICE['name'] + text).encode('utf-8')).hexdigest()
    pending = {key: text for key, text in texts.items()
               if hashes.get(key) != fingerprint(text) or not (AUDIO_DIR / f'{key}.mp3').exists()}

    total = sum(len(text) for text in texts.values())
    print(f'{len(texts)} recordings, {total:,} characters in all; '
          f'{len(pending)} to generate ({sum(len(t) for t in pending.values()):,} characters).')
    if dry_run:
        for key, text in texts.items():
            print(f'\n[{key}] {len(text)} characters\n{text}')
        return

    if pending and not PROJECT:
        sys.exit('Set GCP_PROJECT to the Google Cloud project to use, for example:\n'
                 '    GCP_PROJECT=my-project python3 tools/generate_voice.py')
    if pending:
        token = subprocess.run(['gcloud', 'auth', 'print-access-token'],
                               capture_output=True, text=True, check=True).stdout.strip()
    for key, text in pending.items():
        audio = b''.join(synthesize(piece, token) for piece in chunks(text))
        (AUDIO_DIR / f'{key}.mp3').write_bytes(audio)
        hashes[key] = fingerprint(text)
        HASHES_FILE.write_text(json.dumps(hashes, indent=2, sort_keys=True) + '\n')
        print(f'  {key}.mp3  {len(audio) // 1024} KB')

    # Recordings of steps that no longer exist are dropped from the page, not deleted from disk.
    manifest = {key: f'audio/{key}.mp3' for key in texts if (AUDIO_DIR / f'{key}.mp3').exists()}
    MANIFEST_FILE.write_text(
        '// Written by tools/generate_voice.py. Maps a step or view id to its recording.\n'
        f'const NARRATION = {json.dumps(manifest, indent=2)};\n')
    print(f'Wrote {MANIFEST_FILE.relative_to(ROOT)} with {len(manifest)} recordings.')


if __name__ == '__main__':
    main()
