# How an LLM works

An interactive, one-page guide to how large language models work: from the
first character of a prompt to the finished answer, then how models are
trained, how agents are built around them, and what remains open.

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
