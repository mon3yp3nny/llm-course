# How an LLM works

An interactive, one-page guide to how large language models work: from the
first character of a prompt to the finished answer, then how models are
trained, how agents are built around them, and what remains open.

Live: https://mon3yp3nny.github.io/llm-course/

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

- `index.html`: all the text, in six tabs (Using, Training, Agents, Mind, Models, FAQ) and a glossary
- `style.css`: the styling, including dark mode and phone layout
- `tokenizer.js`, `model.js`: the toy tokenizer and toy model behind the demos
- `app.js`: the demos of the first tab, the tabs, the tooltips and the step dots
- `network.js`, `training.js`, `agents.js`: the neural network drawing and the demos of the other tabs
- `audio.js`, `audio/`: the narration player and its recordings
- `tools/generate_voice.py`: regenerates the recordings with Google Cloud Text-to-Speech after the text has changed

## What is real and what is simplified

The demos use a tiny counting model, made-up vectors and some hand-written
examples. Every such simplification is labelled where it appears, in a note
that starts with "Simplified:".

The "Models" tab is a snapshot from October 2026 and will age.

## Licence

Released under the MIT licence, see `LICENSE`. In short: use it as you like,
keep the copyright notice, and there is no warranty of any kind.
