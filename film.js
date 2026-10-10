// Film: the first part of the guide as a short animation, told in scenes and
// shown over the page. The page lists the scenes with the text that is spoken
// (not shown, but kept for a screen reader); this script draws a picture for
// each and moves it in time with the recording. The times come from
// audio/film/<language>.js, which tools/generate_film_voice.py writes. Without
// a recording the film runs silently by the same times.
// Uses tokenize() and tokenId() from tokenizer.js and the toy model from
// model.js, so its numbers are the ones the guide shows for the same prompt.
// Everything lives inside one function, so its names do not meet those of the
// guide's other scripts.

(() => {
const SVG_NS = 'http://www.w3.org/2000/svg';
const FILM_PROMPT = 'The cat sat on the';
// The tokens the toy model adds, taking the most likely one each time.
const FILM_ANSWER_LENGTH = 4;
const STAGE_CENTRE = 480;
const STAGE_MIDDLE = 270;
// Seconds one scene takes to give way to the next.
const FADE = 0.4;
const SKIP_SECONDS = 5;
// The still picture before the start: the first scene this long before it ends.
const POSTER_BEFORE_END = 0.3;
// A monospace character is this wide, measured in its font size.
const CHARACTER = 0.6;
// The word map in 3D, with the measures of the guide's own (app.js): the middle
// it turns around, how deep the third direction reaches and where its middle
// lies, the tilt, and how much far words fade.
const MAP_MIDDLE = { x: 300, y: 175 };
const MAP_DEPTH = 190;
const MAP_DEPTH_MIDDLE = 0.35;
const MAP_TILT = 0.22;
const MAP_FADE = 0.55;
// How far the map swings to the side, in radians, and in how many moments the swing is drawn.
const MAP_SWING = 0.75;
const MAP_MOMENTS = 36;
// Where the drawn token appears in one scene and sets off from in the next.
const WINNER = { x: 660, y: 470 };

const film = { tracks: [], scenes: [], time: 0, length: FILM_VOICE.length, playing: false, audio: null, last: 0, built: false };

const $ = (id) => document.getElementById(id);
const filmTokens = tokenize(FILM_PROMPT);
const numberText = new Intl.NumberFormat(document.documentElement.lang);
const percentText = new Intl.NumberFormat(document.documentElement.lang, { style: 'percent' });
// A leading space belongs to its token; it is shown as a dot, as in the guide.
const tokenLabel = (token) => token.replace(/^ /, '·');

function draw(parent, name, attrs = {}, text) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (text !== undefined) el.textContent = text;
  parent.append(el);
  return el;
}

// One change of an element between two moments of the film. It starts from
// what the element shows at that moment and keeps what it ends with, so the
// whole film is a set of paused animations that can be set to any time.
function change(el, to, from, until, easing = 'ease-in-out') {
  const track = el.animate(to, { delay: from * 1000, duration: Math.max(1, (until - from) * 1000), fill: 'forwards', easing });
  track.pause();
  // Kept even when a later change of the same element covers it: going back in time needs it again.
  track.persist?.();
  film.tracks.push(track);
}

function place(el, x, y) {
  el.style.translate = `${x}px ${y}px`;
  return el;
}

function appear(el, at, seconds = 0.35) {
  el.style.opacity = 0;
  change(el, { opacity: 1 }, at, at + seconds);
  return el;
}

// Appears a little too small and grows into place.
function pop(el, at, seconds = 0.35) {
  el.style.scale = 0.6;
  change(el, { scale: 1 }, at, at + seconds, 'cubic-bezier(0.3, 1.5, 0.5, 1)');
  return appear(el, at, seconds);
}

// A line or curve that is drawn from its start to its end.
function trace(el, from, until) {
  el.setAttribute('pathLength', 1);
  // The gap is longer than the line and the start lies a little inside it:
  // otherwise the round end of a stroke shows as a dot before the line is drawn.
  el.style.strokeDasharray = '1 1.2';
  el.style.strokeDashoffset = 1.1;
  change(el, { strokeDashoffset: 0 }, from, until);
  return el;
}

// A straight arrow that is drawn and then gets its head.
function arrow(parent, x1, y1, x2, y2, from, until) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const point = (back, side) => [
    x2 - back * Math.cos(angle) + side * Math.sin(angle),
    y2 - back * Math.sin(angle) - side * Math.cos(angle),
  ].join(',');
  const group = draw(parent, 'g', { class: 'f-arrow' });
  trace(draw(group, 'line', { x1, y1, x2: x2 - 6 * Math.cos(angle), y2: y2 - 6 * Math.sin(angle) }), from, until);
  appear(draw(group, 'polygon', { points: `${x2},${y2} ${point(12, 6)} ${point(12, -6)}` }), until - 0.1, 0.15);
  return group;
}

// A token on its coloured ground, drawn around its own centre.
function chip(parent, label, x, y, color, { width = 110, height = 48, size = 24 } = {}) {
  const group = place(draw(parent, 'g'), x, y);
  draw(group, 'rect', { class: `f-c${color % 5}`, x: -width / 2, y: -height / 2, width, height, rx: 10 });
  draw(group, 'text', { class: 'f-mono', 'font-size': size, 'text-anchor': 'middle', dy: '0.35em' }, label);
  return group;
}

// Where the i-th of n things in a centred row stands.
const rowX = (i, n, pitch) => STAGE_CENTRE + (i - (n - 1) / 2) * pitch;

// A vector as a strip of cells: the colour says below or above zero, its strength how far.
function vectorCells(parent, values, { size, gap, upright }) {
  const group = draw(parent, 'g');
  values.forEach((value, k) => {
    const at = k * (size.along + gap);
    draw(group, 'rect', {
      class: value < 0 ? 'f-neg' : 'f-pos', 'fill-opacity': (0.15 + 0.85 * Math.abs(value)).toFixed(2), rx: 3,
      x: upright ? 0 : at, y: upright ? at : 0,
      width: upright ? size.across : size.along, height: upright ? size.along : size.across,
    });
  });
  return group;
}

// The scenes. Each draws into its own layer `g`; `at(f)` is the moment a share
// f of the scene has passed, so a picture keeps pace with a text of any length.
const FILM_SCENES = {
  // A prompt goes into a box and a token comes out: the question the film answers.
  start(g, at) {
    const all = place(draw(g, 'g'), 40, 0);
    const prompt = place(draw(all, 'g'), 230, STAGE_MIDDLE);
    draw(prompt, 'rect', { class: 'f-field', x: -150, y: -32, width: 300, height: 64, rx: 32 });
    draw(prompt, 'text', { class: 'f-mono', 'font-size': 22, 'text-anchor': 'middle', dy: '0.35em' }, FILM_PROMPT);
    pop(prompt, at(0.05));
    arrow(all, 392, STAGE_MIDDLE, 448, STAGE_MIDDLE, at(0.25), at(0.35));
    const box = place(draw(all, 'g'), 530, STAGE_MIDDLE);
    draw(box, 'rect', { class: 'f-box', x: -75, y: -75, width: 150, height: 150, rx: 22 });
    draw(box, 'text', { class: 'f-strong', 'font-size': 34, 'text-anchor': 'middle', dy: '0.35em' }, 'LLM');
    pop(box, at(0.18));
    change(box, [{ scale: 1 }, { scale: 1.07 }, { scale: 1 }, { scale: 1.07 }, { scale: 1 }], at(0.4), at(0.68));
    arrow(all, 617, STAGE_MIDDLE, 673, STAGE_MIDDLE, at(0.66), at(0.74));
    pop(chip(all, tokenLabel(film.answer[0]), 740, STAGE_MIDDLE, 0), at(0.76));
  },

  // The prompt is typed into a field, character by character.
  prompt(g, at) {
    const size = 34;
    const step = size * CHARACTER;
    const left = STAGE_CENTRE - (FILM_PROMPT.length * step) / 2;
    draw(g, 'rect', { class: 'f-field', x: STAGE_CENTRE - 280, y: STAGE_MIDDLE - 42, width: 560, height: 84, rx: 16 });
    const typed = (k) => at(0.1 + (0.55 * k) / FILM_PROMPT.length);
    [...FILM_PROMPT].forEach((character, k) => {
      const letter = draw(g, 'text', { class: 'f-mono', 'font-size': size, x: left + k * step, y: STAGE_MIDDLE, dy: '0.35em' }, character);
      appear(letter, typed(k), 0.05);
    });
    const caret = place(draw(g, 'rect', { class: 'f-caret', x: 0, y: STAGE_MIDDLE - 22, width: 3, height: 44 }), left, 0);
    // The caret jumps as each character appears, so it always stands behind the last one.
    change(caret, { translate: `${left + FILM_PROMPT.length * step}px 0px` }, typed(0), typed(FILM_PROMPT.length),
      `steps(${FILM_PROMPT.length}, jump-start)`);
    change(caret, { opacity: 0 }, at(0.85), at(0.9));
  },

  // The sentence falls apart into its tokens; below, a longer word splits in two.
  tokens(g, at) {
    const typedSize = 34;
    const size = 24;
    const step = typedSize * CHARACTER;
    const left = STAGE_CENTRE - (FILM_PROMPT.length * step) / 2;
    const field = draw(g, 'rect', { class: 'f-field', x: STAGE_CENTRE - 280, y: STAGE_MIDDLE - 42, width: 560, height: 84, rx: 16 });
    change(field, { opacity: 0 }, at(0.08), at(0.2));
    let before = 0;
    filmTokens.forEach((token, i) => {
      // Each token starts where it stood in the typed sentence, at the size it was typed in.
      const inSentence = left + (before + token.length / 2) * step;
      before += token.length;
      const group = chip(g, tokenLabel(token), inSentence, STAGE_MIDDLE, i);
      group.style.scale = typedSize / size;
      const ground = group.querySelector('rect');
      const from = at(0.2 + i * 0.04);
      change(group, { translate: `${rowX(i, filmTokens.length, 124)}px ${STAGE_MIDDLE}px`, scale: 1 }, from, from + 0.7);
      appear(ground, from + 0.5);
    });
    // The toy tokenizer's own example of a word in two pieces.
    const pieces = tokenize('tokenization');
    const widths = pieces.map((piece) => piece.length * size * CHARACTER + 28);
    const total = widths[0] + widths[1];
    pieces.forEach((piece, i) => {
      const together = STAGE_CENTRE - total / 2 + (i ? widths[0] + widths[1] / 2 : widths[0] / 2);
      const group = chip(g, piece, together, 410, i + 2, { width: widths[i] });
      appear(group, at(0.66));
      change(group, { translate: `${together + (i ? 9 : -9)}px 410px` }, at(0.8), at(0.9));
    });
  },

  // Under every token its number in the vocabulary appears; then the words fade.
  ids(g, at) {
    const words = place(draw(g, 'g'), 0, 70);
    change(words, { translate: '0px 0px' }, at(0), at(0.18));
    filmTokens.forEach((token, i) => {
      const x = rowX(i, filmTokens.length, 124);
      chip(words, tokenLabel(token), x, 200, i);
      const from = at(0.24 + i * 0.07);
      arrow(g, x, 234, x, 290, from, from + 0.4);
      const id = place(draw(g, 'g'), x, 322);
      draw(id, 'rect', { class: 'f-field', x: -55, y: -24, width: 110, height: 48, rx: 10 });
      draw(id, 'text', { class: 'f-mono', 'font-size': 22, 'text-anchor': 'middle', dy: '0.35em' }, numberText.format(tokenId(token)));
      pop(id, from + 0.3);
    });
    change(words, { opacity: 0.3 }, at(0.78), at(0.9));
  },

  // Each number is swapped for a vector; then the words stand as points on a map,
  // which turns to show that it has more than two directions.
  embeddings(g, at) {
    const vectors = draw(g, 'g');
    const ids = place(draw(vectors, 'g'), 0, 212);
    change(ids, { translate: '0px 0px' }, at(0), at(0.14));
    filmTokens.forEach((token, i) => {
      const x = rowX(i, filmTokens.length, 124);
      const id = place(draw(ids, 'g'), x, 110);
      draw(id, 'rect', { class: 'f-field', x: -55, y: -24, width: 110, height: 48, rx: 10 });
      draw(id, 'text', { class: 'f-mono', 'font-size': 22, 'text-anchor': 'middle', dy: '0.35em' }, numberText.format(tokenId(token)));
      const cells = place(vectorCells(vectors, tokenVector(token), { size: { along: 26, across: 60 }, gap: 6, upright: true }), x - 30, 160);
      [...cells.children].forEach((cell, k) => appear(cell, at(0.15 + i * 0.02 + k * 0.012), 0.2));
    });
    change(vectors, { opacity: 0 }, at(0.4), at(0.46));

    const map = appear(draw(g, 'g'), at(0.44));
    // Where a word of the map stands on the stage once the map is turned by `yaw`
    // and tilted by `tilt`, as in the guide's 3D view: its third value, roughly
    // "can you eat it?", becomes depth.
    const project = ([, x, y, edible], yaw, tilt) => {
      const [dx, dy, z] = [x - MAP_MIDDLE.x, y - MAP_MIDDLE.y, (edible - MAP_DEPTH_MIDDLE) * MAP_DEPTH];
      const turnedX = dx * Math.cos(yaw) + z * Math.sin(yaw);
      const turnedZ = -dx * Math.sin(yaw) + z * Math.cos(yaw);
      const near = Math.max(-1, Math.min(1, (dy * Math.sin(tilt) + turnedZ * Math.cos(tilt)) / MAP_DEPTH));
      return {
        translate: `${(150 + (MAP_MIDDLE.x + turnedX) * 1.25).toFixed(1)}px ${(62 + (MAP_MIDDLE.y + dy * Math.cos(tilt) - turnedZ * Math.sin(tilt)) * 1.12).toFixed(1)}px`,
        // Far words are fainter.
        opacity: (1 - (MAP_FADE * (tilt / MAP_TILT) * (1 - near)) / 2).toFixed(2),
      };
    };
    // The turn, as a row of moments: the map tilts, swings to one side and part of the way back.
    const turn = Array.from({ length: MAP_MOMENTS + 1 }, (_, moment) => {
      const share = moment / MAP_MOMENTS;
      const eased = share * share * (3 - 2 * share);
      return { yaw: MAP_SWING * Math.sin(0.75 * Math.PI * eased), tilt: MAP_TILT * Math.min(1, eased * 3) };
    });
    WORD_MAP.forEach((group, groupIndex) => {
      group.words.forEach((word, wordIndex) => {
        const dot = draw(map, 'g');
        dot.style.translate = project(word, 0, 0).translate;
        draw(dot, 'circle', { class: `f-c${groupIndex % 5} f-dot`, r: 7 });
        draw(dot, 'text', { class: 'f-label', 'font-size': 16, 'text-anchor': 'middle', y: 24 }, word[0]);
        pop(dot, at(0.46 + groupIndex * 0.03 + wordIndex * 0.008), 0.3);
        change(dot, turn.map(({ yaw, tilt }) => project(word, yaw, tilt)), at(0.66), at(1), 'linear');
      });
    });
  },

  // The vectors pass through the layers; after each layer their numbers have changed.
  network(g, at) {
    const slabs = 6;
    const slabX = (k) => 300 + k * 85;
    const lane = (i) => 150 + i * 60;
    const [from, to] = [185, 860];
    const passes = (x) => at(0.06 + (0.88 * (x - from)) / (to - from));
    filmTokens.forEach((token, i) => chip(g, tokenLabel(token), 80, lane(i), i, { width: 84, height: 36, size: 18 }));
    for (let k = 0; k < slabs; k++) {
      const slab = draw(g, 'rect', { class: 'f-layer', x: slabX(k) - 23, y: 105, width: 46, height: 330, rx: 12 });
      slab.style.opacity = 0.45;
      change(slab, [{ opacity: 0.45 }, { opacity: 1 }, { opacity: 0.45 }], passes(slabX(k)) - 0.2, passes(slabX(k)) + 0.5);
    }
    const packet = place(draw(g, 'g'), from, 0);
    change(packet, { translate: `${to}px 0px` }, at(0.06), at(0.94), 'linear');
    // One set of strips per stretch between two layers; the packet shows the set of where it is.
    for (let stretch = 0; stretch <= slabs; stretch++) {
      const set = draw(packet, 'g');
      filmTokens.forEach((token, i) => {
        const values = layerVector(filmTokens, i, (stretch * LAYER_COUNT) / slabs);
        place(vectorCells(set, values, { size: { along: 11, across: 24 }, gap: 1, upright: false }), -48, lane(i) - 12);
      });
      if (stretch > 0) appear(set, passes(slabX(stretch - 1)) - 0.08, 0.16);
      if (stretch < slabs) change(set, { opacity: 0 }, passes(slabX(stretch)) - 0.08, passes(slabX(stretch)) + 0.08);
    }
  },

  // The last token looks back: an arc to every token before it, as thick as its share, which stands below.
  attention(g, at) {
    const last = filmTokens.length - 1;
    // The guide's hand-written example sentence begins with the film's prompt: its shares for this token.
    const weights = ATTENTION_EXAMPLE.weights[last];
    const x = (i) => rowX(i, filmTokens.length, 150);
    const top = 306;
    const chips = filmTokens.map((token, i) => chip(g, tokenLabel(token), x(i), 330, i));
    appear(draw(g, 'rect', { class: 'f-current', x: x(last) - 61, y: 300, width: 122, height: 60, rx: 14 }), at(0.1));
    for (let i = last; i >= 0; i--) {
      const height = i === last ? 70 : 70 + 38 * (last - i);
      const path = i === last
        ? `M ${x(i) - 20} ${top} C ${x(i) - 46} ${top - height}, ${x(i) + 46} ${top - height}, ${x(i) + 20} ${top}`
        : `M ${x(last)} ${top} C ${x(last)} ${top - height}, ${x(i)} ${top - height}, ${x(i)} ${top}`;
      const from = at(0.2 + (last - i) * 0.1);
      const arc = draw(g, 'path', { class: 'f-arc', d: path, 'stroke-width': (2 + 22 * weights[i]).toFixed(1), 'stroke-opacity': (0.3 + 0.7 * weights[i]).toFixed(2) });
      trace(arc, from, from + 0.6);
      const share = draw(g, 'text', { class: 'f-label', 'font-size': 20, 'text-anchor': 'middle', x: x(i), y: 392 }, percentText.format(weights[i]));
      appear(share, from + 0.5);
    }
    // What it gathered is now part of the token itself.
    change(chips[last], [{ scale: 1 }, { scale: 1.12 }, { scale: 1 }], at(0.8), at(0.92));
  },

  // A bar for each of the likeliest next tokens.
  prediction(g, at) {
    filmTokens.forEach((token, i) => chip(g, tokenLabel(token), rowX(i, filmTokens.length + 1, 92), 84, i, { width: 84, height: 36, size: 18 }));
    const open = place(draw(g, 'g'), rowX(filmTokens.length, filmTokens.length + 1, 92), 84);
    draw(open, 'rect', { class: 'f-open', x: -42, y: -18, width: 84, height: 36, rx: 10 });
    draw(open, 'text', { class: 'f-strong', 'font-size': 20, 'text-anchor': 'middle', dy: '0.35em' }, '?');
    pop(open, at(0.06));
    const [left, longest] = [400, 360];
    film.likely.forEach(({ token, p }, row) => {
      const y = 180 + row * 54;
      const from = at(0.2 + row * 0.08);
      appear(draw(g, 'text', { class: 'f-mono', 'font-size': 22, 'text-anchor': 'end', x: left - 16, y, dy: '0.35em' }, tokenLabel(token)), from);
      const width = (longest * p) / film.likely[0].p;
      const bar = draw(g, 'rect', { class: `f-c${row} f-bar`, x: left, y: y - 17, width, height: 34, rx: 6 });
      bar.style.scale = '0 1';
      change(bar, { scale: '1 1' }, from, from + 0.7, 'ease-out');
      appear(draw(g, 'text', { class: 'f-label', 'font-size': 20, x: left + width + 12, y, dy: '0.35em' }, percentText.format(p)), from + 0.5);
    });
    appear(draw(g, 'text', { class: 'f-label', 'font-size': 24, 'text-anchor': 'end', x: left - 16, y: 180 + film.likely.length * 54 }, '…'), at(0.7));
  },

  // A hundred lots, shared out by probability; one is drawn.
  sampling(g, at) {
    const lots = 100;
    const perRow = 10;
    const shares = film.likely.map(({ p }) => Math.round(p * lots));
    const owner = [];
    shares.forEach((share, row) => { for (let n = 0; n < share; n++) owner.push(row); });
    const spot = (n) => [170 + (n % perRow) * 30, 150 + Math.floor(n / perRow) * 30];
    for (let n = 0; n < lots; n++) {
      const [x, y] = spot(n);
      const lot = draw(g, 'circle', { class: owner[n] === undefined ? 'f-other' : `f-c${owner[n]} f-dot`, cx: x, cy: y, r: 11 });
      appear(lot, at(0.05 + n * 0.003), 0.15);
    }
    [...film.likely, null].forEach((entry, row) => {
      const y = 165 + row * 44;
      const line = appear(draw(g, 'g'), at(0.12 + row * 0.04));
      draw(line, 'circle', { class: entry ? `f-c${row} f-dot` : 'f-other', cx: 540, cy: y, r: 11 });
      draw(line, 'text', { class: entry ? 'f-mono' : 'f-label', 'font-size': 22, x: 566, y, dy: '0.35em' }, entry ? tokenLabel(entry.token) : '…');
      const count = entry ? shares[row] : lots - owner.length;
      draw(line, 'text', { class: 'f-label', 'font-size': 22, 'text-anchor': 'end', x: 760, y, dy: '0.35em' }, numberText.format(count));
    });
    // The draw wanders over the lots and stops on one of the likeliest token.
    const hops = [83, 12, 57, 91, 30, 68, 5, 47, 22];
    const ring = place(draw(g, 'circle', { class: 'f-ring', r: 16 }), ...spot(hops[0]));
    appear(ring, at(0.44), 0.1);
    hops.forEach((n, k) => {
      const [x, y] = spot(n);
      const from = at(0.46) + k * ((at(0.74) - at(0.46)) / hops.length);
      change(ring, { translate: `${x}px ${y}px` }, from, from + 0.03);
    });
    change(ring, [{ scale: 1 }, { scale: 1.5 }, { scale: 1 }], at(0.75), at(0.85));
    pop(chip(g, tokenLabel(film.answer[0]), WINNER.x, WINNER.y, 0, { width: 126, height: 54, size: 27 }), at(0.8));
  },

  // The drawn token joins the text and the run starts again, once for every further token.
  loop(g, at) {
    const all = [...filmTokens, ...film.answer];
    const small = { width: 84, height: 36, size: 18 };
    const x = (i) => rowX(i, all.length, 92);
    const y = 300;
    filmTokens.forEach((token, i) => chip(g, tokenLabel(token), x(i), y, i, small));
    const drawn = chip(g, tokenLabel(film.answer[0]), WINNER.x, WINNER.y, 0, small);
    drawn.style.scale = 1.5;
    change(drawn, { translate: `${x(filmTokens.length)}px ${y}px`, scale: 1 }, at(0.04), at(0.24));
    // After each new token an arrow leads from it back to the start: the whole text goes in again.
    film.answer.forEach((token, k) => {
      const arrives = at(0.24 + k * 0.18);
      if (k > 0) pop(chip(g, tokenLabel(token), x(filmTokens.length + k), y, k, small), arrives - 0.35);
      const newest = x(filmTokens.length + k);
      const round = draw(g, 'g', { class: 'f-arrow' });
      trace(draw(round, 'path', { d: `M ${newest} ${y - 40} C ${newest} ${y - 140}, ${x(0)} ${y - 140}, ${x(0)} ${y - 46}` }), arrives, arrives + 0.9);
      appear(draw(round, 'polygon', { points: `${x(0)},${y - 34} ${x(0) - 7},${y - 48} ${x(0) + 7},${y - 48}` }), arrives + 0.8, 0.15);
      // It gives way to the arrow of the next token; the last one stays.
      if (k < film.answer.length - 1) change(round, { opacity: 0 }, at(0.24 + (k + 1) * 0.18) - 0.5, at(0.24 + (k + 1) * 0.18) - 0.2);
    });
  },

  // The nine steps in a row light up one after another, and an arrow leads back to the start.
  end(g, at) {
    const steps = film.scenes.filter((scene) => scene.step);
    const x = (i) => rowX(i, steps.length, 96);
    const y = 240;
    draw(g, 'line', { class: 'f-rule', x1: x(0), y1: y, x2: x(steps.length - 1), y2: y });
    steps.forEach((scene, i) => {
      const dot = place(draw(g, 'g'), x(i), y);
      draw(dot, 'circle', { class: 'f-field', r: 22 });
      const lit = draw(dot, 'circle', { class: 'f-lit', r: 22 });
      draw(dot, 'text', { class: 'f-number', 'font-size': 18, 'text-anchor': 'middle', dy: '0.35em' }, scene.step);
      draw(dot, 'text', { class: 'f-label', 'font-size': 14, 'text-anchor': 'middle', y: 50 }, scene.label);
      const from = at(0.08 + i * 0.07);
      appear(lit, from);
      change(dot, [{ scale: 1 }, { scale: 1.15 }, { scale: 1 }], from, from + 0.5);
    });
    const [first, last] = [x(0), x(steps.length - 1)];
    const round = draw(g, 'g', { class: 'f-arrow' });
    trace(draw(round, 'path', { d: `M ${last} ${y + 70} C ${last} ${y + 170}, ${first} ${y + 170}, ${first} ${y + 76}` }), at(0.74), at(0.92));
    appear(draw(round, 'polygon', { points: `${first},${y + 64} ${first - 7},${y + 78} ${first + 7},${y + 78}` }), at(0.9), 0.15);
  },
};

// Draws every scene into its own layer and sets when each is seen.
function buildFilm() {
  const stage = $('film-stage');
  film.likely = nextTokenProbs(filmTokens).slice(0, 5);
  film.answer = [];
  for (let n = 0; n < FILM_ANSWER_LENGTH; n++) film.answer.push(nextTokenProbs([...filmTokens, ...film.answer])[0].token);
  film.scenes = [...document.querySelectorAll('.film-scene')].map((item, index) => ({
    name: item.dataset.scene,
    step: item.dataset.step,
    label: item.dataset.label,
    text: item.querySelector('p').textContent.replace(/\s+/g, ' ').trim(),
    from: FILM_VOICE.cues[index],
    until: FILM_VOICE.cues[index + 1] ?? film.length,
  }));
  film.scenes.forEach((scene, index) => {
    const layer = draw(stage, 'g');
    if (index > 0) appear(layer, scene.from, FADE);
    if (index < film.scenes.length - 1) change(layer, { opacity: 0 }, scene.until, scene.until + FADE);
    if (scene.step) {
      draw(layer, 'circle', { class: 'f-lit', cx: 46, cy: 46, r: 16 });
      draw(layer, 'text', { class: 'f-number', 'font-size': 16, 'text-anchor': 'middle', x: 46, y: 46, dy: '0.35em' }, scene.step);
      draw(layer, 'text', { class: 'f-label', 'font-size': 18, x: 74, y: 46, dy: '0.35em' }, scene.label);
    }
    FILM_SCENES[scene.name](layer, (share) => scene.from + share * (scene.until - scene.from));
  });
}

// Shows the film as it is at film.time.
function showFilm() {
  // Before the start the stage is not empty: it shows the first scene as it ends.
  const waiting = film.time === 0 && !film.playing;
  const shown = waiting ? film.scenes[0].until - POSTER_BEFORE_END : film.time;
  for (const track of film.tracks) track.currentTime = shown * 1000;
  const current = film.scenes.findLast((scene) => scene.from <= film.time) ?? film.scenes[0];
  if ($('film-caption').textContent !== current.text) $('film-caption').textContent = current.text;
  const share = film.time / film.length;
  $('film-progress').firstElementChild.style.scale = `${share} 1`;
  $('film-progress').setAttribute('aria-valuenow', Math.round(share * 100));
}

function setPlaying(playing) {
  film.playing = playing;
  const button = $('film-play');
  button.classList.toggle('playing', playing);
  button.setAttribute('aria-label', playing ? button.dataset.pause : button.dataset.play);
  button.title = button.getAttribute('aria-label');
}

function tick(now) {
  if (!film.playing) return;
  // With sound the recording keeps the time; without, the clock does.
  film.time = film.audio ? film.audio.currentTime : film.time + (now - film.last) / 1000;
  film.last = now;
  if (film.time >= film.length) {
    film.time = film.length;
    film.audio?.pause();
    setPlaying(false);
  }
  showFilm();
  requestAnimationFrame(tick);
}

function playFilm() {
  if (film.time >= film.length) film.time = 0;
  setPlaying(true);
  film.last = performance.now();
  if (film.audio) {
    film.audio.currentTime = film.time;
    film.audio.play().catch((error) => {
      // A browser that lets no sound start by itself: the film waits for a press of its button.
      if (error.name === 'NotAllowedError') {
        film.time = 0;
        pauseFilm();
        showFilm();
      }
      // A recording that cannot play for another reason does not stop the film: it goes on silently.
      else film.audio = null;
    });
  }
  requestAnimationFrame(tick);
}

function pauseFilm() {
  film.audio?.pause();
  setPlaying(false);
}

function seekFilm(seconds) {
  film.time = Math.min(film.length, Math.max(0, seconds));
  if (film.audio) film.audio.currentTime = film.time;
  showFilm();
}

// The recording is found from where this script lives, so it is the same from every page.
const FILM_FOLDER = document.currentScript.src;
const layer = $('film');
const opener = document.querySelector('.watch');

// The pictures are drawn when the film is first opened, not with every visit of the guide.
function prepareFilm() {
  if (film.built) return;
  film.built = true;
  buildFilm();
  if (!FILM_VOICE.src) return;
  film.audio = new Audio(new URL(FILM_VOICE.src, FILM_FOLDER));
  film.audio.preload = 'auto';
  film.audio.addEventListener('error', () => { film.audio = null; });
  // The recording may end a moment before the film's last picture.
  film.audio.addEventListener('ended', () => {
    film.time = film.length;
    setPlaying(false);
    showFilm();
  });
}

const filmIsOpen = () => !layer.hidden;

function openFilm() {
  if (filmIsOpen()) return;
  prepareFilm();
  // A narration of the guide that is playing gives way to the film.
  if (typeof narration !== 'undefined') narration.audio.pause();
  layer.hidden = false;
  document.documentElement.classList.add('film-open');
  film.time = 0;
  setPlaying(false);
  showFilm();
  // After the click that opened it has run its course, which would otherwise leave the focus on the page below.
  setTimeout(() => $('film-play').focus({ preventScroll: true }));
}

function closeFilm() {
  if (!filmIsOpen()) return;
  pauseFilm();
  layer.hidden = true;
  document.documentElement.classList.remove('film-open');
  opener?.focus({ preventScroll: true });
}

// The film has an address of its own, #film: the Back button closes it, and a link can lead to it.
let openedFromHere = false;
// The click starts the film right away: a browser lets sound begin only in answer to a press.
opener?.addEventListener('click', () => {
  openedFromHere = true;
  openFilm();
  playFilm();
});
window.addEventListener('hashchange', () => (location.hash === '#film' ? openFilm() : closeFilm()));
if (location.hash === '#film') openFilm();
layer.querySelector('.film-close').addEventListener('click', (event) => {
  event.preventDefault();
  // Back to where the reader was; someone who arrived at the film directly goes to the first part.
  if (openedFromHere) history.back();
  else location.hash = '#view-use';
  openedFromHere = false;
});

const toggleFilm = () => (film.playing ? pauseFilm() : playFilm());
$('film-play').addEventListener('click', toggleFilm);
$('film-stage').addEventListener('click', toggleFilm);
// The thin line beside the button shows how far the film is; a click on it leads to that place.
$('film-progress').addEventListener('click', (event) => {
  const line = event.currentTarget.getBoundingClientRect();
  seekFilm(((event.clientX - line.left) / line.width) * film.length);
});
// Space plays and pauses, the arrow keys go back and forth, as in a video player; Escape closes the film.
// Asked before the guide's own keys, which do not apply while the film covers the page.
document.addEventListener('keydown', (event) => {
  if (!filmIsOpen() || event.metaKey || event.ctrlKey || event.altKey) return;
  event.stopPropagation();
  // Escape works from anywhere; the other keys belong to a button while that has the focus.
  if (event.key === 'Escape') layer.querySelector('.film-close').click();
  else if (event.key === 'Tab') trapFocus(event);
  else if (event.target.closest('button, a')) return;
  else if (event.key === ' ') toggleFilm();
  else if (event.key === 'ArrowRight') seekFilm(film.time + SKIP_SECONDS);
  else if (event.key === 'ArrowLeft') seekFilm(film.time - SKIP_SECONDS);
  else return;
  if (event.key !== 'Tab') event.preventDefault();
}, true);

// The Tab key stays among the film's two controls while it is open.
function trapFocus(event) {
  const stops = [$('film-play'), layer.querySelector('.film-close')];
  const next = stops[(stops.indexOf(document.activeElement) + 1) % stops.length];
  event.preventDefault();
  next.focus();
}

// Leaving the tab stops the sound and with it the film.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && film.playing) pauseFilm();
});
})();
