#!/usr/bin/env python3
"""Generates the narration of the film and the times of its scenes.

Each page of the guide holds the film's scenes as <li class="film-scene"> with one paragraph each.
This script has every paragraph spoken by the voice of the guide, joins them
with pauses into one recording, audio/film/<language>.mp3, and writes beside it
<language>.js with the moment each scene begins. film.js moves its pictures by
those moments, so picture and voice always fit, whatever the length of a text.
A scene whose picture needs more time than its text takes says so in the page:
data-hold="3" keeps it three seconds longer, in silence.

It uses the voice, the spoken forms and the sound pipeline of
tools/generate_voice.py; see there for what is needed (gcloud, GCP_PROJECT,
ffmpeg).

    GCP_PROJECT=my-project python3 tools/generate_film_voice.py              # all languages
    GCP_PROJECT=my-project python3 tools/generate_film_voice.py --lang de
    python3 tools/generate_film_voice.py --lang de --dry-run   # only show what would be spoken
    python3 tools/generate_film_voice.py --lang de --silent    # no recording: times estimated from the text

A film without a recording runs silently.
"""

import argparse
import hashlib
import json
import sys
import tempfile
import wave
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_voice as voice  # noqa: E402

ROOT = voice.ROOT
FOLDER = ROOT / 'audio' / 'film'
# The page of each language; the film is a part of it.
PAGES = {'en': 'index.html', 'de': 'de/index.html', 'fr': 'fr/index.html'}
# Seconds: before the first word, between two scenes, after the last word
# (the last picture stays a moment).
PAUSES = {'head': 0.4, 'scene': 0.9, 'tail': 1.8}
# A scene's picture begins this long before its first word.
LEAD = 0.45
# For --silent: how long the voice takes per character, roughly.
SECONDS_PER_CHARACTER = 0.068


class SceneParser(HTMLParser):
    """Collects the paragraph of every scene, in order."""

    def __init__(self):
        super().__init__()
        self.scenes = []     # (name, text, seconds the scene is held after its text)
        self.title = ''      # the film's name, from the label of its layer
        self.name = None
        self.hold = 0.0
        self.buffer = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id') == 'film':
            self.title = attrs.get('aria-label') or ''
        if tag == 'li' and 'film-scene' in (attrs.get('class') or '').split():
            self.name = attrs.get('data-scene')
            self.hold = float(attrs.get('data-hold') or 0)
        elif tag == 'p' and self.name:
            self.buffer = []

    def handle_data(self, data):
        if self.buffer is not None:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if tag == 'p' and self.buffer is not None:
            self.scenes.append((self.name, voice.clean(''.join(self.buffer)), self.hold))
            self.buffer = None
        elif tag == 'li':
            self.name = None


def read_scenes(lang):
    parser = SceneParser()
    text = (ROOT / PAGES[lang]).read_text(encoding='utf-8')
    parser.feed(text)
    return parser.scenes, voice.clean(parser.title)


def write_times(lang, cues, length, version):
    """Writes what film.js needs: the recording, its length and where each scene begins."""
    FOLDER.mkdir(parents=True, exist_ok=True)
    times = {
        # From the folder film.js lives in. The ?v= makes a browser fetch a new recording instead of its stored copy.
        'src': f'audio/film/{lang}.mp3?v={version}' if version else None,
        'length': round(length, 2),
        'cues': [round(cue, 2) for cue in cues],
    }
    (FOLDER / f'{lang}.js').write_text(
        '// Written by tools/generate_film_voice.py: the film\'s recording and the second each scene begins.\n'
        f'const FILM_VOICE = {json.dumps(times)};\n', encoding='utf-8')
    print(f'Wrote audio/film/{lang}.js: {len(cues)} scenes, {int(length // 60)}:{int(length % 60):02d}.')


def estimate(spoken, holds):
    """Scene times guessed from the length of each text, for a film without a recording."""
    cues, at = [], PAUSES['head']
    for parts, hold in zip(spoken, holds):
        cues.append(max(0.0, at - LEAD))
        at += sum(len(part) for part in parts) * SECONDS_PER_CHARACTER + hold + PAUSES['scene']
    return cues, at - PAUSES['scene'] + PAUSES['tail']


def record(lang, spoken, holds, title):
    """Makes the recording and returns where each scene begins, the length and a note on the sound."""
    api = voice.Api()
    samples, rate, cues = None, None, []
    for index, parts in enumerate(spoken):
        for number, part in enumerate(parts):
            piece, piece_rate = voice.read_wav(api.synthesize(part, lang, 'LINEAR16'))
            if rate is None:
                rate = piece_rate
                samples = voice.silence(PAUSES['head'], rate)
            elif piece_rate != rate:
                raise voice.ApiError(f'The API changed its sample rate from {rate} to {piece_rate} Hz.')
            if number == 0:
                cues.append(max(0.0, len(samples) / rate - LEAD))
            else:
                samples.extend(voice.silence(voice.PAUSES['split'], rate))
            samples.extend(voice.trim(piece, rate))
        samples.extend(voice.silence(holds[index] + (PAUSES['scene'] if index + 1 < len(spoken) else PAUSES['tail']), rate))
    cues[0] = 0.0
    if sys.byteorder == 'big':
        samples.byteswap()
    FOLDER.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        wav = Path(temporary) / 'film.wav'
        with wave.open(str(wav), 'wb') as sound:
            sound.setnchannels(1)
            sound.setsampwidth(2)
            sound.setframerate(rate)
            sound.writeframes(samples.tobytes())
        unfinished = Path(temporary) / 'film.mp3'
        loudness, peak = voice.encode(wav, unfinished, {'title': title, 'language': voice.LANGUAGES[lang]['tag']})
        # Only a finished file takes the place of the old one.
        unfinished.replace(FOLDER / f'{lang}.mp3')
    return cues, len(samples) / rate, f'{loudness:.1f} LUFS, peak {peak:.1f} dBTP'


def generate(lang, options):
    """Handles the film of one language. Returns 0 if all went well."""
    scenes, title = read_scenes(lang)
    used = []
    spoken = [voice.split_for_api(voice.spoken_form(text, lang, used)) for _, text, _ in scenes]
    holds = [hold for _, _, hold in scenes]
    characters = sum(len(part) for parts in spoken for part in parts)
    print(f'[{lang}] {voice.LANGUAGES[lang]["voice"]}: {len(scenes)} scenes, {characters:,} characters, '
          f'{sum(len(parts) for parts in spoken)} requests.')

    if options.dry_run:
        for (name, _, hold), parts in zip(scenes, spoken):
            print(f'\n[{name}]' + (f'  held {hold:g} s longer' if hold else ''))
            for part in parts:
                print(f'  {part}')
        if used:
            print(f'\n~ said differently: {"; ".join(dict.fromkeys(used))}')
        return 0
    if options.silent:
        (FOLDER / f'{lang}.mp3').unlink(missing_ok=True)
        write_times(lang, *estimate(spoken, holds), version=None)
        return 0
    if not voice.PROJECT:
        print('Set GCP_PROJECT to the Google Cloud project to use, for example:\n'
              '    GCP_PROJECT=my-project python3 tools/generate_film_voice.py', file=sys.stderr)
        return 1
    if not voice.shutil.which('ffmpeg'):
        print('The film\'s recording needs ffmpeg, which was not found.', file=sys.stderr)
        return 1
    try:
        cues, length, note = record(lang, spoken, holds, title)
    except voice.ApiError as error:
        print(f'{error}', file=sys.stderr)
        return 1
    recipe = json.dumps([voice.PIPELINE, voice.LANGUAGES[lang]['voice'], PAUSES, spoken, holds], ensure_ascii=False)
    write_times(lang, cues, length, hashlib.sha1(recipe.encode('utf-8')).hexdigest()[:8])
    print(f'  {lang}.mp3  {(FOLDER / f"{lang}.mp3").stat().st_size // 1024} KB  {note}')
    return 0


def main():
    parser = argparse.ArgumentParser(description='Generates the narration of the film. See the top of this file.')
    parser.add_argument('--lang', choices=[*PAGES, 'all'], default='all', help='which page to read (default: all)')
    parser.add_argument('--dry-run', action='store_true', help='show what would be spoken; write and send nothing')
    parser.add_argument('--silent', action='store_true', help='no recording: write scene times estimated from the text')
    options = parser.parse_args()
    results = [generate(lang, options) for lang in (PAGES if options.lang == 'all' else [options.lang])]
    return max(results)


if __name__ == '__main__':
    sys.exit(main())
