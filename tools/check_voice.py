#!/usr/bin/env python3
"""Listens to the narration and prints where it heard something else than the text.

Nobody can listen to 130 recordings in three languages after every change, so
this script lets a machine do the first pass: it sends each recording to
Google Cloud Speech-to-Text, compares what comes back with the text of the
page, and prints the words that differ. A name the voice mangles, an
abbreviation it reads as a word or a number it says in the wrong language
shows up as a difference. So do harmless things: the recogniser writes
"fifty thousand" as "50,000" one day and in words the next, and it mishears
rare names by itself. The list is where to listen, not a verdict.

The text is taken from the page exactly as tools/generate_voice.py reads it,
before the spoken forms are applied: if "MIT" is sent to the voice as
"Em-Ai-Ti" and the recogniser writes "MIT", the respelling works.

Needs ffmpeg, the gcloud CLI (logged in) and a Google Cloud project, named in
GCP_PROJECT, with the Speech-to-Text API enabled. Python 3.9 or later, no packages.

    GCP_PROJECT=my-project python3 tools/check_voice.py --lang de
    ... --only mcp --only tl-now     # just these recordings
    ... --all-words                  # also print what was heard in full

About 45 minutes of sound per language; the API bills by the minute.
"""

import argparse
import base64
import difflib
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_voice as voice  # noqa: E402

ROOT = voice.ROOT
API_URL = f'https://{os.environ.get("GCP_STT_HOST", "speech.googleapis.com")}/v1/speech:recognize'
# One request takes at most a minute of sound, so a recording is cut at its pauses.
MAX_SECONDS = 50
CONTEXT = 3   # words printed before and after a difference


def run(arguments):
    result = subprocess.run(arguments, capture_output=True, text=True)
    if result.returncode != 0:
        raise voice.ApiError(f'{arguments[0]} failed:\n' + result.stderr.strip()[-600:])
    return result


def cuts(path):
    """Where to cut a recording so that every part is short enough: in the middle of pauses."""
    length = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                        str(path)]).stdout.strip())
    report = run(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(path), '-af', 'silencedetect=n=-40dB:d=0.3',
                  '-f', 'null', '-']).stderr
    starts = [float(value) for value in re.findall(r'silence_start: (-?[\d.]+)', report)]
    ends = [float(value) for value in re.findall(r'silence_end: (-?[\d.]+)', report)]
    pauses = [(start + end) / 2 for start, end in zip(starts, ends)]
    points, begin = [0.0], 0.0
    while length - begin > MAX_SECONDS:
        within = [pause for pause in pauses if begin + 5 < pause <= begin + MAX_SECONDS]
        begin = within[-1] if within else begin + MAX_SECONDS
        points.append(begin)
    return list(zip(points, points[1:] + [length]))


def transcribe(path, lang, api):
    """Returns what the recogniser heard in one recording."""
    heard = []
    with tempfile.TemporaryDirectory() as temporary:
        for number, (begin, end) in enumerate(cuts(path)):
            part = Path(temporary) / f'{number}.flac'
            run(['ffmpeg', '-hide_banner', '-nostdin', '-y', '-ss', f'{begin:.3f}', '-t', f'{end - begin:.3f}',
                 '-i', str(path), '-ac', '1', '-ar', '16000', '-c:a', 'flac', str(part)])
            config = {'languageCode': voice.LANGUAGES[lang]['code'], 'encoding': 'FLAC', 'sampleRateHertz': 16000,
                      'model': 'latest_long', 'enableAutomaticPunctuation': False}
            body = {'config': config, 'audio': {'content': base64.b64encode(part.read_bytes()).decode('ascii')}}
            try:
                answer = api.post(body, API_URL)
            except voice.ApiError as error:
                # Not every language has every model; the default one always exists.
                if 'model' not in str(error).lower() or 'HTTP 400' not in str(error):
                    raise
                del config['model']
                answer = api.post(body, API_URL)
            heard.extend(result['alternatives'][0]['transcript'].strip()
                         for result in answer.get('results', []) if result.get('alternatives'))
    return ' '.join(heard)


def words(text):
    """The words of a text, without what cannot be heard: case, punctuation, hyphens."""
    text = unicodedata.normalize('NFC', voice.clean(text)).casefold()
    # A separator inside a number is not heard either: 50,000 and 50.000 and 50 000.
    text = re.sub(r'(?<=\d)[.,](?=\d{3}(?!\d))', '', text)
    text = text.replace('’', "'")
    return re.findall(r"[^\W_]+(?:[',.][^\W_]+)*", text)


def squeeze(some_words):
    return re.sub(r"[',.]", '', ''.join(some_words))


def differences(written, heard):
    """Yields (expected words, heard words, words before, words after) wherever the two differ."""
    expected, got = words(written), words(heard)
    matcher = difflib.SequenceMatcher(None, expected, got, autojunk=False)
    for kind, a, b, c, d in matcher.get_opcodes():
        # "Alpha Fold" for "AlphaFold" or "LLMs" for "LLM's" is the same sound.
        if kind == 'equal' or squeeze(expected[a:b]) == squeeze(got[c:d]):
            continue
        yield expected[a:b], got[c:d], expected[max(0, a - CONTEXT):a], expected[b:b + CONTEXT]


def check(lang, options, api):
    """Checks one language. Returns the number of differences, or None if nothing could be checked."""
    folder = ROOT / 'audio' / lang
    recordings, _, _ = voice.read_narration(lang)
    unknown = [key for key in options.only if key not in recordings]
    if unknown:
        print(f'[{lang}] No such recording: {", ".join(unknown)}', file=sys.stderr)
        return None
    chosen = [key for key in recordings if (not options.only or key in options.only)]
    missing = [key for key in chosen if not (folder / f'{key}.mp3').exists()]
    if missing:
        print(f'[{lang}] Not recorded yet: {", ".join(missing)}')
    total = 0
    for key in chosen:
        if key in missing:
            continue
        recording = recordings[key]
        heard = transcribe(folder / f'{key}.mp3', lang, api)
        found = list(differences(recording.written(), heard))
        total += len(found)
        share = difflib.SequenceMatcher(None, words(recording.written()), words(heard), autojunk=False).ratio()
        print(f'\n[{lang}/{key}] {len(found)} differences, {share:.0%} of the words heard as written')
        for expected, got, before, after in found:
            print(f'  … {" ".join(before)} [{" ".join(expected) or "–"}] {" ".join(after)} …')
            print(f'      heard: {" ".join(got) or "(nothing)"}')
        if recording.used:
            print(f'  said differently on purpose: {"; ".join(dict.fromkeys(recording.used))}')
        if options.all_words:
            print(f'  heard in full: {heard}')
    return total


def main():
    parser = argparse.ArgumentParser(description='Compares the recordings with the text. See the top of this file.')
    parser.add_argument('--lang', choices=[*voice.LANGUAGES, 'all'], default='all')
    parser.add_argument('--only', action='append', default=[], metavar='ID',
                        help='only this step or view id (may be given several times, or comma-separated)')
    parser.add_argument('--all-words', action='store_true', help='also print everything that was heard')
    options = parser.parse_args()
    options.only = [key for value in options.only for key in value.split(',') if key]

    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        sys.exit('This check needs ffmpeg and ffprobe to cut the recordings into parts.')
    if not voice.PROJECT:
        sys.exit('Set GCP_PROJECT to a Google Cloud project with the Speech-to-Text API enabled, for example:\n'
                 '    GCP_PROJECT=my-project python3 tools/check_voice.py --lang en')
    api = voice.Api()
    total = 0
    try:
        for lang in (voice.LANGUAGES if options.lang == 'all' else [options.lang]):
            found = check(lang, options, api)
            total += found or 0
    except voice.ApiError as error:
        sys.exit(f'Stopped: {error}')
    print(f'\n{total} differences in all. Listen to those places; not every one is a fault of the voice.')


if __name__ == '__main__':
    main()
