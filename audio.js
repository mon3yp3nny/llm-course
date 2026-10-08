// Narration: a play button next to the title of every step and tab that has a recording.
// The recordings and audio/manifest.js are made by tools/generate_voice.py; if
// the manifest is missing, the page simply has no buttons.

const narration = { audio: new Audio(), button: null };

// The button shows only an icon (drawn in the stylesheet), so it carries its meaning as a label.
function setListening(button, playing) {
  button.classList.toggle('playing', playing);
  button.setAttribute('aria-label', playing ? 'Pause narration' : 'Listen to this section');
  button.title = playing ? 'Pause' : 'Listen';
}

function toggleNarration(button) {
  const { audio } = narration;
  if (narration.button !== button) {
    if (narration.button) setListening(narration.button, false);
    narration.button = button;
    audio.src = button.dataset.src;
  }
  if (audio.paused) {
    // Starting another recording interrupts this one; that is not a failure.
    audio.play().catch((error) => {
      if (error.name !== 'AbortError' && narration.button === button) button.title = 'The recording could not be played';
    });
  } else {
    audio.pause();
  }
}

// Keeps the button on the same line as the title's last word, so it never
// wraps onto a line of its own.
function attachToLastWord(title, button) {
  const text = title.lastChild;
  const words = text.textContent.trimEnd();
  const split = words.lastIndexOf(' ') + 1;
  const keepTogether = document.createElement('span');
  keepTogether.className = 'keep-together';
  keepTogether.append(words.slice(split), button);
  text.textContent = words.slice(0, split);
  title.append(keepTogether);
}

function buildNarration() {
  if (typeof NARRATION === 'undefined') return;
  for (const [id, src] of Object.entries(NARRATION)) {
    const owner = $(id);
    if (!owner) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'listen';
    button.dataset.src = src;
    setListening(button, false);
    attachToLastWord(owner.querySelector('h1, h2'), button);
  }

  const { audio } = narration;
  audio.preload = 'none';
  audio.addEventListener('play', () => setListening(narration.button, true));
  audio.addEventListener('pause', () => setListening(narration.button, false));
  // A tab told as one story plays on: when a chapter ends, the next begins.
  audio.addEventListener('ended', () => {
    const view = narration.button.closest('.view');
    if (view.dataset.narration !== 'spoken') return;
    const chapters = [...view.querySelectorAll('.listen')];
    const next = chapters[chapters.indexOf(narration.button) + 1];
    if (!next) return;
    next.closest('.step').scrollIntoView();
    toggleNarration(next);
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.listen');
    if (button) toggleNarration(button);
  });
  // A recording belongs to its tab: leaving the tab stops it.
  window.addEventListener('hashchange', () => {
    if (narration.button?.closest('.view')?.hidden) audio.pause();
  });
}

buildNarration();
