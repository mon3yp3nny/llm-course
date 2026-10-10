# How an LLM works

An interactive, one-page guide to how large language models work: from the
first character of a prompt to the finished answer, then how models are
trained, how agents are built around them, and what remains open.

Live: https://mon3yp3nny.github.io/llm-course/ (English), with German under
[`de/`](https://mon3yp3nny.github.io/llm-course/de/) and French under
[`fr/`](https://mon3yp3nny.github.io/llm-course/fr/)

## Please note

This is a personal research and learning project. It is not an authoritative
source. The text was written with the help of an AI model, it simplifies on
purpose, and it may contain mistakes or be out of date. Nothing here comes
with a guarantee of accuracy, so do not rely on it for decisions; check
anything that matters against primary sources.

## How it is built

Plain HTML, CSS and JavaScript. There is no build step and there are no
dependencies: open `index.html` in a browser.

## Files

- `index.html`, `de/index.html`, `fr/index.html`: all the text, one page per language, in nine tabs (Using, Training, Agents, Hardware, Robots, Models, Timeline, FAQ, Quotes) and a glossary, all reached through the menu
- `i18n/en.js`, `i18n/de.js`, `i18n/fr.js`: every text the scripts put on the page, one file per language; `i18n.js` holds the helpers that fill them in and format numbers
- `style.css`: the styling, including dark mode and phone layout
- `tokenizer.js`, `model.js`: the toy tokenizer and toy model behind the demos
- `app.js`: the demos of the first tab, the tabs, the tooltips and the step dots
- `search.js`: the search over the whole page
- `papers.js`: the sources the guide links to (research papers, a few essays, announcements and articles), each with a short summary
- `network.js`, `training.js`, `agents.js`, `hardware.js`, `robots.js`, `timeline.js`: the neural network drawing and the demos of the other tabs
- `audio.js`, `audio/en/`, `audio/de/`, `audio/fr/`: the narration player and the recordings of each language, with a `manifest.js` that lists them
- `tools/generate_voice.py`: regenerates the recordings of a language with Google Cloud Text-to-Speech after its text has changed (`--lang en|de|fr|all`, `--dry-run` shows what would be spoken); how names, abbreviations and numbers are said is set in the tables at its top
- `film.js`, `film.css`: the first tab as a short animated film, opened with the camera button beside the first title. It lies over the page and fills the window; a cross leads back. Each page holds the text of the film's scenes in its own language, `film.js` draws and moves a picture for each
- `tools/generate_film_voice.py`, `audio/film/`: speaks a film's text into one recording per language and writes the second each scene begins, which the pictures follow (`--lang en|de|fr|all`); `data-hold` on a scene keeps it longer than its text, and with `--silent` the times are estimated and the film runs without sound
- `tools/check_voice.py`: has the recordings transcribed by Google Cloud Speech-to-Text and prints where that differs from the text, to find mispronounced words
- `tools/check_i18n.py`: checks that the three languages still fit together

## Languages

Each language is a complete page of its own. The three pages share the
stylesheet and the scripts, so they must be the same in everything but the
wording:

- The same elements in the same order, with the same `id`, `class` and
  `data-*` names. Links, the address after `#`, the search, the narration
  and the language switch all rely on them. Only the text between the tags
  and the wording inside `title`, `aria-label`, `placeholder`, `data-title`,
  `data-label`, `data-cpu`, `data-gpu`, `data-memory` and `data-empty` is
  translated.
- A page loads its own `i18n/<language>.js` and `audio/<language>/manifest.js`
  and nothing else of its own. The three strings files have the same entries
  with the same `{blanks}`.
- The toy model stays English everywhere: its sentences, the word map, the
  example prompt and the little library are data in `model.js`, and the text
  around them quotes their numbers. Only labels and explanations are
  translated.
- The glossary is sorted by each language's own alphabet. A term introduced
  in the text (`<dfn>`) is matched to its glossary entry by its wording; where
  the wording differs, as with an inflected form, `data-term` on the `dfn`
  names the entry, or `data-also` on the entry's `dt` lists further spellings.

A change to the content therefore goes into all three pages at once. Afterwards
run

    python3 tools/check_i18n.py

It compares the structure of the three pages and the three strings files, and
checks the links, the glossary terms and the head of each page. It prints
every difference with its line and ends with an error if there is one.

## What is real and what is simplified

The demos use a tiny counting model, made-up vectors and some hand-written
examples. Every such simplification is labelled where it appears, in a note
that starts with "Simplified:".

The "Models" tab is a snapshot from October 2026 and will age.

## Licence

Released under the MIT licence, see `LICENSE`. In short: use it as you like,
keep the copyright notice, and there is no warranty of any kind.
