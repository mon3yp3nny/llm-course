// Narration: a play button next to the title of every step and tab that has a recording.
// Each language has its own folder, audio/en/, audio/de/ or audio/fr/, with the
// recordings and a manifest.js that lists them by file name; both are made by
// tools/generate_voice.py. If a language has no manifest or an empty one, its
// page simply has no buttons.
// Nothing is remembered: after a reload no recording is chosen and none plays.

// The folder is found from where this script lives, so it is the same from every page.
const AUDIO_FOLDER = new URL(`audio/${LANG}/`, document.currentScript.src);
// One player for all recordings; `status` tells a screen reader what cannot be seen.
const narration = { audio: new Audio(), button: null, status: null };

// The button shows only an icon (drawn in the stylesheet), so it carries its
// meaning as a label, which names the section: there are dozens of these buttons.
function setListening(button, playing) {
  const title = button.dataset.title;
  button.classList.toggle('playing', playing);
  button.classList.remove('failed');
  if (!playing) setLoading(button, false);
  button.setAttribute('aria-label', t(playing ? 'narration.pauseLabel' : 'narration.listenLabel', { title }));
  button.title = t(playing ? 'narration.pause' : 'narration.listen');
}

// While the recording is on its way, the button pulses gently.
function setLoading(button, loading) {
  button.classList.toggle('loading', loading);
  if (loading) button.setAttribute('aria-busy', 'true');
  else button.removeAttribute('aria-busy');
}

// A recording that is missing or cut off by the network: the button says so
// and stays ready for another try.
function setFailed(button) {
  setListening(button, false);
  button.classList.add('failed');
  button.setAttribute('aria-label', t('narration.failedLabel', { title: button.dataset.title }));
  button.title = t('narration.failed');
  narration.status.textContent = t('narration.failed');
}

function playNarration(button) {
  const { audio } = narration;
  const retry = button.classList.contains('failed');
  if (narration.button !== button || retry) {
    if (narration.button) setListening(narration.button, false);
    narration.button = button;
    audio.src = button.dataset.src;
  }
  narration.status.textContent = '';
  button.classList.remove('failed');
  setLoading(button, true);
  describeToSystem(button);
  // Starting another recording interrupts this one; that is not a failure.
  audio.play().catch((error) => {
    if (error.name !== 'AbortError' && narration.button === button) setFailed(button);
  });
}

function toggleNarration(button) {
  // After a failure the player still counts as playing, so that is asked first.
  const playing = narration.button === button && !narration.audio.paused && !button.classList.contains('failed');
  if (playing) narration.audio.pause();
  else playNarration(button);
}

// The recording before or after this one in the same tab, if there is one.
function neighbour(button, step) {
  const all = [...button.closest('.view').querySelectorAll('.listen')];
  return all[all.indexOf(button) + step];
}

// Lock screen, headset and media keys: show what is playing and let them control it.
function describeToSystem(button) {
  if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
  const { audio } = narration;
  navigator.mediaSession.metadata = new MediaMetadata({ title: button.dataset.title, album: document.title });
  const previous = neighbour(button, -1);
  const next = neighbour(button, 1);
  const seek = (seconds) => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
  };
  const handlers = {
    play: () => playNarration(narration.button),
    pause: () => audio.pause(),
    previoustrack: previous ? () => playNarration(previous) : null,
    nexttrack: next ? () => playNarration(next) : null,
    seekbackward: () => seek(-10),
    seekforward: () => seek(10),
  };
  for (const [action, handler] of Object.entries(handlers)) {
    // A browser that does not know an action throws; the others still work.
    try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
  }
}

// Keeps the button on the same line as the title's last word, so it never
// wraps onto a line of its own.
function attachToLastWord(title, button) {
  // A title may end in a link to the film; the button comes before it, and both stay with the last word.
  const film = title.querySelector(':scope > .watch');
  film?.remove();
  attachBeforeFilm(title, button);
  if (film) button.after(film);
}

function attachBeforeFilm(title, button) {
  const text = title.lastChild;
  // A title that ends in an element, not in plain text, gets the button after it.
  if (text?.nodeType !== Node.TEXT_NODE) {
    title.append(button);
    return;
  }
  // Only an ordinary space or line break ends a word. A no-break space, as French
  // sets before "?" and "!", keeps the mark with its word and the button with both.
  const words = text.textContent.replace(/[ \t\n\r]+$/, '');
  const split = Math.max(words.lastIndexOf(' '), words.lastIndexOf('\n')) + 1;
  const keepTogether = document.createElement('span');
  keepTogether.className = 'keep-together';
  keepTogether.append(words.slice(split), button);
  text.textContent = words.slice(0, split);
  title.append(keepTogether);
}

function buildNarration() {
  if (typeof NARRATION === 'undefined') return;
  for (const [id, file] of Object.entries(NARRATION)) {
    const owner = $(id);
    const title = owner?.querySelector('h1, h2');
    if (!title) continue;
    const name = title.textContent.replace(/\s+/g, ' ').trim();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'listen';
    button.dataset.src = new URL(file, AUDIO_FOLDER).href;
    button.dataset.title = name;
    setListening(button, false);
    // The button sits inside the heading; without this, a list of headings
    // would read the button's label as part of every title.
    title.setAttribute('aria-label', name);
    attachToLastWord(title, button);
  }

  const { audio } = narration;
  audio.preload = 'none';
  narration.status = document.createElement('span');
  narration.status.className = 'listen-status';
  narration.status.setAttribute('role', 'status');
  document.body.append(narration.status);

  audio.addEventListener('play', () => setListening(narration.button, true));
  audio.addEventListener('pause', () => setListening(narration.button, false));
  audio.addEventListener('waiting', () => setLoading(narration.button, true));
  audio.addEventListener('playing', () => setLoading(narration.button, false));
  audio.addEventListener('error', () => {
    if (narration.button) setFailed(narration.button);
  });
  // A tab told as one story plays on: when a chapter ends, the next begins.
  audio.addEventListener('ended', () => {
    const finished = narration.button;
    if (finished.closest('.view').dataset.narration !== 'spoken') return;
    const next = neighbour(finished, 1);
    if (!next) return;
    // The page follows along only for a reader who is still at the chapter that
    // just ended, not for one who has scrolled elsewhere or put the page aside.
    const place = (finished.closest('.step') || finished).getBoundingClientRect();
    const onScreen = place.bottom > 0 && place.top < window.innerHeight;
    if (onScreen && document.visibilityState === 'visible') next.closest('.step').scrollIntoView();
    playNarration(next);
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.listen');
    if (button) toggleNarration(button);
  });
  // A recording belongs to its tab: leaving the tab stops it.
  document.addEventListener('viewchange', () => {
    if (narration.button?.closest('.view')?.hidden) audio.pause();
  });
}

buildNarration();
