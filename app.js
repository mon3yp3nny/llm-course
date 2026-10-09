const TOKEN_COLORS = 5;
const TOP_CANDIDATES = 8;
const CONTEXT_TOKENS = 6;
const MAX_SHADE = 45;
const STEP_DELAY_MS = 220;
const MAX_NEW_TOKENS = 40;
const MIN_NEW_TOKENS = 8;
const SVG_NS = 'http://www.w3.org/2000/svg';
const BIT_OPTIONS = [16, 8, 4, 2];
const MAX_TRAINING_STEPS = 5;
const TOOLTIP_GAP = 8;
const MAP_CENTER = { x: 300, y: 175 };
const MAP_DEPTH = 190;
const MAP_DEPTH_CENTER = 0.35;
const MAP_TILT = 0.22;
const MAP_YAW_MID = 0.62;
const MAP_YAW_STILL = 1.1;
const MAP_SWAY = 0.83;
const MAP_AXIS_Y = 338;
const MAP_AXIS_LABEL_GAP = 45;
const MAP_SWAY_MS = 3200;
const MAP_EASE = 0.12;
const MAP_FADE = 0.55;
const MAP_DRAG_SPEED = 0.008;
const MAP_KEY_STEP = 0.15;
const EXAMPLE_WEIGHTS = tokenVector('example weights');

const $ = (id) => document.getElementById(id);

function svgNode(name, attrs, text) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  if (text) el.textContent = text;
  return el;
}
const promptInput = $('prompt-input');
const temperatureInput = $('temperature');

const state = {
  tokens: [],
  embedIndex: 1,
  layer: 0,
  mapMode: '2d',
  patchIndex: 3,
  bits: 4,
  trainingSteps: 0,
  agentStep: 1,
  turns: 10,
  expertIndex: 1,
  attentionIndex: 0,
  exampleIndex: ATTENTION_EXAMPLE.tokens.indexOf(' it'),
  picks: new Map(),
  generated: [],
  timer: null,
};

function showSpaces(token) {
  return token.replace(/ /g, '·').replace(/\n/g, '↵').replace(/\t/g, '→');
}

function chip(text, index, tag = 'span') {
  const el = document.createElement(tag);
  el.className = `chip c${index % TOKEN_COLORS}`;
  el.dataset.index = index;
  el.textContent = text;
  if (tag === 'button') el.type = 'button';
  return el;
}

function withCaption(el, caption) {
  const small = document.createElement('small');
  small.textContent = caption;
  el.append(small);
  return el;
}

function temperature() {
  return Number(temperatureInput.value);
}

// Steps 1 to 3

function renderTokens() {
  const text = promptInput.value;
  const { tokens } = state;
  const ids = tokens.map(tokenId);

  $('char-count').textContent = text.length;
  $('chat-user').textContent = text;
  $('char-count-2').textContent = text.length;
  $('token-count').textContent = tokens.length;

  $('token-chips').replaceChildren(...tokens.map((token, i) => chip(showSpaces(token), i)));
  $('id-chips').replaceChildren(...tokens.map((token, i) => withCaption(chip(showSpaces(token), i), ids[i])));
  $('id-sequence').textContent = `[${ids.join(', ')}]`;
}

// Step 4

function vectorCells(vector) {
  return vector.map((value) => {
    const cell = document.createElement('span');
    cell.className = value < 0 ? 'neg' : 'pos';
    cell.style.setProperty('--strength', `${Math.round(Math.abs(value) * 60)}%`);
    cell.textContent = fmt(value, 2);
    return cell;
  });
}

// The word map is drawn from 3D positions. In 2D the view is straight on, so
// depth is invisible; in 3D it is tilted and turned around its vertical axis.
const wordMap = { items: [], yaw: 0, tilt: 0, userYaw: undefined, frame: null, visible: false };
const stillQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function buildWordMap() {
  const svg = $('word-map');
  const add = (parent, name, attrs, text) => {
    const el = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    if (text) el.textContent = text;
    parent.append(el);
    return el;
  };
  const depth = (edible) => (edible - MAP_DEPTH_CENTER) * MAP_DEPTH;

  // The third direction, drawn as a line that only shows once the map is turned.
  wordMap.axis = { el: add(svg, 'line', { class: 'axis' }), from: depth(0), to: depth(1) };
  for (const [label, edible, shift] of [[t('map.notEdible'), 0, -MAP_AXIS_LABEL_GAP], [t('map.edible'), 1, MAP_AXIS_LABEL_GAP]]) {
    const el = add(svg, 'text', { class: 'group', 'text-anchor': 'middle', y: 4 }, label);
    wordMap.items.push({ el, x: MAP_CENTER.x, y: MAP_AXIS_Y, z: depth(edible) + shift, onlyIn3d: true });
  }

  for (const { group, x, y, words } of WORD_MAP) {
    const average = words.reduce((sum, word) => sum + word[3], 0) / words.length;
    const label = add(svg, 'text', { class: 'group', 'text-anchor': 'middle' }, t(`map.groups.${group}`));
    wordMap.items.push({ el: label, x, y, z: depth(average) });
    for (const [word, wx, wy, edible] of words) {
      const g = add(svg, 'g', { class: 'word', 'data-word': word });
      add(g, 'circle', { r: 4 });
      add(g, 'text', { x: 9, y: 5 }, word);
      wordMap.items.push({ el: g, x: wx, y: wy, z: depth(edible) });
    }
  }
  layoutWordMap();
}

// Turns a 3D position by the current yaw and tilt and drops it onto the screen.
function projectOnMap(x, y, z) {
  const { yaw, tilt } = wordMap;
  const dx = x - MAP_CENTER.x;
  const dy = y - MAP_CENTER.y;
  const turnedX = dx * Math.cos(yaw) + z * Math.sin(yaw);
  const turnedZ = -dx * Math.sin(yaw) + z * Math.cos(yaw);
  return {
    x: MAP_CENTER.x + turnedX,
    y: MAP_CENTER.y + dy * Math.cos(tilt) - turnedZ * Math.sin(tilt),
    near: dy * Math.sin(tilt) + turnedZ * Math.cos(tilt),
  };
}

function layoutWordMap() {
  const strength = wordMap.tilt / MAP_TILT;
  const placed = wordMap.items.map((item) => ({ item, ...projectOnMap(item.x, item.y, item.z) }));
  // Far words are drawn first and fainter, so near ones sit on top.
  placed.sort((a, b) => a.near - b.near);
  for (const { item, x, y, near } of placed) {
    const closeness = Math.max(-1, Math.min(1, near / MAP_DEPTH));
    const faded = 1 - MAP_FADE * strength * (1 - closeness) / 2;
    item.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    item.el.style.opacity = item.onlyIn3d ? strength : faded;
    item.el.parentNode.append(item.el);
  }

  const { el, from, to } = wordMap.axis;
  const start = projectOnMap(MAP_CENTER.x, MAP_AXIS_Y, from);
  const end = projectOnMap(MAP_CENTER.x, MAP_AXIS_Y, to);
  for (const [name, value] of [['x1', start.x], ['y1', start.y], ['x2', end.x], ['y2', end.y]]) {
    el.setAttribute(name, value.toFixed(1));
  }
  el.style.opacity = strength;
}

function animateWordMap(time) {
  // Off screen or in a hidden tab there is nothing to see: stop until the map is back.
  if (!wordMap.visible) {
    wordMap.frame = null;
    return;
  }
  const threeD = state.mapMode === '3d';
  const still = stillQuery.matches;
  const swaying = threeD && wordMap.userYaw === undefined;
  const targetTilt = threeD ? MAP_TILT : 0;
  let targetYaw = 0;
  if (threeD) targetYaw = wordMap.userYaw ?? (still ? MAP_YAW_STILL : MAP_YAW_MID + Math.sin(time / MAP_SWAY_MS) * MAP_SWAY);

  const ease = still ? 1 : MAP_EASE;
  wordMap.yaw += (targetYaw - wordMap.yaw) * ease;
  wordMap.tilt += (targetTilt - wordMap.tilt) * ease;
  layoutWordMap();

  const settled = Math.abs(targetYaw - wordMap.yaw) < 0.002 && Math.abs(targetTilt - wordMap.tilt) < 0.002;
  wordMap.frame = (swaying && !still) || !settled ? requestAnimationFrame(animateWordMap) : null;
}

function startWordMap() {
  if (wordMap.frame === null && wordMap.visible) wordMap.frame = requestAnimationFrame(animateWordMap);
}

// The map only moves while it can be seen; coming back into view picks up where it stopped.
function watchWordMap() {
  new IntersectionObserver(([entry]) => {
    wordMap.visible = entry.isIntersecting;
    startWordMap();
  }).observe($('word-map'));
}

function setMapMode(mode) {
  state.mapMode = mode;
  wordMap.userYaw = undefined;
  document.querySelectorAll('#map-mode button').forEach((el) => {
    el.classList.toggle('selected', el.dataset.mode === mode);
    el.setAttribute('aria-pressed', el.dataset.mode === mode);
  });
  $('word-map').classList.toggle('three-d', mode === '3d');
  $('map-hint').hidden = mode !== '3d';
  startWordMap();
}

// Hands the map back to its automatic swing, which it eases into from wherever it was left.
function releaseWordMap() {
  if (wordMap.userYaw === undefined) return;
  wordMap.userYaw = undefined;
  // Several full turns look the same as none, so do not unwind them.
  wordMap.yaw = Math.atan2(Math.sin(wordMap.yaw), Math.cos(wordMap.yaw));
  startWordMap();
}

function turnWordMap(amount) {
  if (state.mapMode !== '3d') return;
  wordMap.userYaw = (wordMap.userYaw ?? wordMap.yaw) + amount;
  startWordMap();
}

function renderEmbeddings() {
  const { tokens } = state;
  const chips = tokens.map((token, i) => {
    const el = chip(showSpaces(token), i, 'button');
    el.classList.toggle('selected', i === state.embedIndex);
    el.setAttribute('aria-pressed', i === state.embedIndex);
    return el;
  });
  $('embed-chips').replaceChildren(...chips);

  const token = tokens[state.embedIndex];
  $('vector-label').textContent = token === undefined ? '' : showSpaces(token);
  $('vector-label').parentElement.hidden = token === undefined;
  $('vector-cells').replaceChildren(...(token === undefined ? [] : vectorCells(tokenVector(token))));

  const inPrompt = new Set(tokens.map(normalize));
  const hits = [];
  document.querySelectorAll('#word-map .word').forEach((el) => {
    const hit = inPrompt.has(el.dataset.word);
    el.classList.toggle('hit', hit);
    if (hit) hits.push(el.dataset.word);
  });
  $('map-stat').textContent = hits.length
    ? t('map.hits', { words: hits.join(', ') })
    : t('map.none');
}

// Step 4, optional: image patches

function renderPatches() {
  const perSide = PATCH_IMAGE.length / PATCH_SIZE;
  const patches = Array.from({ length: perSide * perSide }, (_, index) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'patch';
    el.dataset.patch = index;
    el.setAttribute('aria-label', t('patch.label', { n: index + 1 }));
    el.classList.toggle('selected', index === state.patchIndex);
    el.setAttribute('aria-pressed', index === state.patchIndex);
    const top = Math.floor(index / perSide) * PATCH_SIZE;
    const left = (index % perSide) * PATCH_SIZE;
    for (let row = top; row < top + PATCH_SIZE; row++) {
      for (const pixel of PATCH_IMAGE[row].slice(left, left + PATCH_SIZE)) {
        const cell = document.createElement('span');
        if (pixel !== '.') cell.className = pixel === 'o' ? 'coloured' : 'dark';
        el.append(cell);
      }
    }
    return el;
  });
  $('patches').replaceChildren(...patches);
  $('patch-label').textContent = t('patch.stat', { n: state.patchIndex + 1, total: patches.length });
  $('patch-cells').replaceChildren(...vectorCells(tokenVector(`patch ${state.patchIndex}`)));
}

// Step 5

function renderNetwork() {
  // The network drawing follows the same selected token as the layer demo.
  renderNeuralNet();
  const { tokens, embedIndex, layer } = state;
  const buttons = Array.from({ length: LAYER_COUNT + 1 }, (_, n) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.layer = n;
    el.textContent = n;
    el.title = n === 0 ? t('layers.embedding') : t('layers.layer', { n });
    el.setAttribute('aria-label', el.title);
    el.classList.toggle('passed', n < layer);
    el.classList.toggle('selected', n === layer);
    el.setAttribute('aria-pressed', n === layer);
    return el;
  });
  $('layer-stack').replaceChildren(...buttons);

  const token = tokens[embedIndex];
  if (token === undefined) {
    $('layer-label').textContent = '';
    $('layer-cells').replaceChildren();
    return;
  }
  const label = document.createElement('strong');
  label.textContent = showSpaces(token);
  $('layer-label').replaceChildren(...(layer === 0
    ? tNodes('layers.vectorAtStart', { token: label })
    : tNodes('layers.vectorAfter', { token: label, layer, total: LAYER_COUNT })));
  $('layer-cells').replaceChildren(...vectorCells(layerVector(tokens, embedIndex, layer)));
}

// Step 5, optional: quantization

function renderQuantization() {
  const { bits } = state;
  $('bit-options').replaceChildren(...BIT_OPTIONS.map((option) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.bits = option;
    el.textContent = t('units.bits', { n: option });
    el.classList.toggle('selected', option === bits);
    el.setAttribute('aria-pressed', option === bits);
    return el;
  }));

  const stored = EXAMPLE_WEIGHTS.map((value) => quantize(value, bits));
  const error = stored.reduce((sum, value, i) => sum + Math.abs(value - EXAMPLE_WEIGHTS[i]), 0) / stored.length;
  $('weights-original').replaceChildren(...vectorCells(EXAMPLE_WEIGHTS));
  $('weights-stored').replaceChildren(...vectorCells(stored));
  $('quant-label').textContent = t('quantization.label', { bits, values: fmt(2 ** bits) });
  $('quant-error').textContent = error < 0.001
    ? t('quantization.errorTiny', { limit: fmt(0.001, 3) })
    : t('quantization.error', { error: fmt(error, 3) });

  const largest = modelSizeGb(BIT_OPTIONS[0]);
  $('size-bars').replaceChildren(...BIT_OPTIONS.map((option) => (
    barRow(t('units.bits', { n: option }), modelSizeGb(option) / largest, t('units.gb', { n: fmt(modelSizeGb(option)) }), option === bits)
  )));
}

// Step 5, optional: test-time training

// The line above the weights before any step is the caption of the row above it, as written in the page.
const UNTRAINED_LABEL = $('weights-original').previousElementSibling?.textContent ?? '';

function renderTestTimeTraining() {
  const steps = state.trainingSteps;
  $('ttt-label').textContent = steps === 0 ? UNTRAINED_LABEL : tn('testTime.after', steps);
  $('ttt-cells').replaceChildren(...vectorCells(trainedWeights(EXAMPLE_WEIGHTS, steps)));
  $('ttt-step').disabled = steps >= MAX_TRAINING_STEPS;
}

// Step 6

function renderAttentionRow(chipsId, statId, tokens, index, weights) {
  const maxWeight = Math.max(...weights, 0);
  let strongest = 0;

  const chips = tokens.map((token, i) => {
    const el = chip(showSpaces(token), i, 'button');
    el.className = 'chip weighted';
    el.classList.toggle('selected', i === index);
    el.setAttribute('aria-pressed', i === index);
    if (i > index) {
      el.classList.add('hidden-token');
      return withCaption(el, '–');
    }
    if (weights[i] > weights[strongest]) strongest = i;
    el.style.setProperty('--shade', `${Math.round((weights[i] / maxWeight) * MAX_SHADE)}%`);
    return withCaption(el, pct(weights[i]));
  });
  $(chipsId).replaceChildren(...chips);
  $(statId).textContent = tokens.length
    ? t('attention.stat', { from: showSpaces(tokens[index]), to: showSpaces(tokens[strongest]), share: pct(weights[strongest]) })
    : '';
}

function renderAttentionExample() {
  const { tokens, weights } = ATTENTION_EXAMPLE;
  renderAttentionRow('example-chips', 'example-stat', tokens, state.exampleIndex, weights[state.exampleIndex]);
}

function renderAttention() {
  const { tokens, attentionIndex } = state;
  const weights = tokens.length ? attentionWeights(tokens, attentionIndex) : [];
  renderAttentionRow('attention-chips', 'attention-stat', tokens, attentionIndex, weights);
}

// Step 6, optional: mixture of experts

function renderExperts() {
  const { tokens, expertIndex } = state;
  $('moe-chips').replaceChildren(...tokens.map((token, i) => {
    const el = chip(showSpaces(token), i, 'button');
    el.classList.toggle('selected', i === expertIndex);
    el.setAttribute('aria-pressed', i === expertIndex);
    return el;
  }));

  const token = tokens[expertIndex];
  if (token === undefined) {
    $('experts').replaceChildren();
    $('moe-stat').textContent = '';
    return;
  }
  const scores = expertScores(token);
  const active = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]).slice(0, ACTIVE_EXPERTS);
  $('experts').replaceChildren(...scores.map((score, i) => {
    const el = document.createElement('span');
    el.classList.toggle('active', active.includes(i));
    el.textContent = t('experts.tile', { n: i + 1 });
    return withCaption(el, pct(score));
  }));
  const names = listAnd(active.map((i) => i + 1).sort((a, b) => a - b));
  $('moe-stat').textContent = t('experts.stat', { token: showSpaces(token), names, rest: EXPERT_COUNT - ACTIVE_EXPERTS });
}

// Steps 7 and 8

function barRow(labelText, fraction, valueText, picked) {
  const row = document.createElement('div');
  row.className = 'bar-row';
  row.classList.toggle('picked', picked);
  row.title = t('bars.title', { label: labelText, value: valueText });

  const label = document.createElement('span');
  label.className = 'bar-label';
  label.textContent = labelText;
  const track = document.createElement('span');
  track.className = 'bar-track';
  const fill = document.createElement('span');
  fill.className = 'bar-fill';
  fill.style.width = `${fraction * 100}%`;
  track.append(fill);
  const value = document.createElement('span');
  value.className = 'bar-value';
  value.textContent = valueText;

  row.append(label, track, value);
  return row;
}

function renderBars(container, probs, pickedToken) {
  container.replaceChildren(...probs.slice(0, TOP_CANDIDATES).map(({ token, p }) => (
    barRow(showSpaces(token), p, pct(p), token === pickedToken)
  )));
}

// What the candidates below the shown ones hold together, as a sentence.
function restShare(key, probs) {
  const rest = probs.slice(TOP_CANDIDATES);
  const share = rest.reduce((sum, entry) => sum + entry.p, 0);
  return tn(key, rest.length, { share: pct(share) });
}

function renderPrediction() {
  const { tokens } = state;
  const probs = nextTokenProbs(tokens);
  const tail = tokens.slice(-CONTEXT_TOKENS).join('');
  const blank = document.createElement('span');
  blank.className = 'blank';
  blank.textContent = '?';
  $('predict-context').replaceChildren((tokens.length > CONTEXT_TOKENS ? '…' : '') + tail + ' ', blank);
  renderBars($('predict-bars'), probs);
  $('predict-stat').textContent = restShare('prediction.rest', probs);
}

function renderSampling(pickedToken) {
  $('temperature-value').textContent = fmt(temperature(), 1);
  const probs = applyTemperature(nextTokenProbs(state.tokens), temperature());
  renderBars($('sample-bars'), probs, pickedToken);
  $('sample-stat').textContent = restShare('sampling.rest', probs);

  const tally = [...state.picks].sort((a, b) => b[1] - a[1]).map(([token, count], i) => {
    const el = document.createElement('span');
    el.className = `chip c${i % TOKEN_COLORS}`;
    el.textContent = `${showSpaces(token)} ×${count}`;
    return el;
  });
  $('pick-tally').replaceChildren(...tally);
  const shown = probs.slice(0, TOP_CANDIDATES).some(({ token }) => token === pickedToken);
  $('pick-result').textContent = pickedToken === undefined
    ? ''
    : t(shown ? 'sampling.picked' : 'sampling.pickedUnseen', { token: showSpaces(pickedToken) });
}

function pickToken() {
  const token = sampleToken(applyTemperature(nextTokenProbs(state.tokens), temperature()));
  state.picks.set(token, (state.picks.get(token) || 0) + 1);
  renderSampling(token);
}

// Step 9

// The button's resting label is the one written in the page.
const GENERATE_LABEL = $('generate').textContent;

function renderLoop() {
  const prompt = document.createElement('span');
  prompt.className = 'prompt-text';
  prompt.textContent = promptInput.value;
  const generated = state.generated.map((token, i) => {
    const el = document.createElement('span');
    el.className = `c${i % TOKEN_COLORS}`;
    el.textContent = token;
    return el;
  });
  $('loop-output').replaceChildren(prompt, ...generated);
  $('generate').textContent = state.timer ? t('loop.stop') : GENERATE_LABEL;
  const count = state.generated.length;
  $('loop-stat').textContent = count ? tn('loop.stat', count) : '';
}

function stopGenerating() {
  clearInterval(state.timer);
  state.timer = null;
  renderLoop();
}

function startGenerating() {
  let added = 0;
  state.timer = setInterval(() => {
    const context = [...state.tokens, ...state.generated];
    const token = sampleToken(applyTemperature(nextTokenProbs(context), temperature()));
    state.generated.push(token);
    added += 1;
    const sentenceEnded = token === '.' && added >= MIN_NEW_TOKENS;
    if (sentenceEnded || added >= MAX_NEW_TOKENS) stopGenerating();
    else renderLoop();
  }, STEP_DELAY_MS);
  renderLoop();
}

function resetLoop() {
  state.generated = [];
  stopGenerating();
}

// Step 7, optional: retrieval

function renderRetrieval() {
  const results = searchLibrary(promptInput.value);
  const best = results.reduce((top, result) => (result.score > top.score ? result : top));
  const found = best.score > 0 ? best : undefined;

  $('library').replaceChildren(...results.map((result) => {
    const row = document.createElement('div');
    row.classList.toggle('best', result === found);
    const text = document.createElement('span');
    text.textContent = result.text;
    const score = document.createElement('small');
    score.textContent = tn('retrieval.score', result.score);
    row.append(text, score);
    return row;
  }));

  const prompt = document.createElement('span');
  prompt.className = 'prompt-text';
  prompt.textContent = promptInput.value;
  if (!found) {
    $('rag-output').replaceChildren(prompt, `\n\n${t('retrieval.nothing')}`);
    return;
  }
  const marker = document.createElement('span');
  marker.className = 'marker';
  marker.textContent = LIBRARY_MARKER;
  $('rag-output').replaceChildren(marker, `\n${found.text}\n\n`, prompt);
}

// Step 9, optional: agents

const AGENT_FACTORS = [1234, 5678];
const AGENT_PRODUCT = AGENT_FACTORS[0] * AGENT_FACTORS[1];
// The markers and the tool call are written as real systems write them, in every language.
const AGENT_STEPS = [
  { marker: '[user]', text: t('agent.question', { factors: AGENT_FACTORS.join(' × ') }) },
  { marker: '[assistant]', text: `calculator(${AGENT_FACTORS.join(' * ')})` },
  { marker: '[tool]', text: String(AGENT_PRODUCT) },
  { marker: '[assistant]', text: t('agent.answer', { factors: AGENT_FACTORS.join(' × '), product: fmt(AGENT_PRODUCT) }) },
].map((step, i) => ({ ...step, note: STRINGS.agent.notes[i] }));

// Shows the first `shown` lines of a hand-stepped exchange, with a note on the latest one.
function renderTranscript(steps, shown, outputId, statId, nextId) {
  const lines = steps.slice(0, shown);
  $(outputId).replaceChildren(...lines.flatMap(({ marker, text }, i) => {
    const label = document.createElement('span');
    label.className = 'marker';
    label.textContent = marker;
    return [i ? '\n' : '', label, ` ${text}`];
  }));
  $(statId).textContent = t('transcript.stat', { n: shown, total: steps.length, note: lines[lines.length - 1].note });
  $(nextId).disabled = shown >= steps.length;
}

function renderAgent() {
  renderTranscript(AGENT_STEPS, state.agentStep, 'agent-output', 'agent-stat', 'agent-next');
}

// Step 9, optional: input and output tokens

const CHAT_SIZES = { system: 300, question: 30, answer: 200 };
// Input that was read on the previous turn comes from the cache at this share of the price.
const CACHED_PRICE = 0.1;
// Once the earlier turns exceed this many tokens, the harness swaps them for a summary of that size.
const COMPACT_ABOVE = 2000;
const SUMMARY_SIZE = 300;

// Adds up a conversation turn by turn, three ways: as it is, with caching, and with compaction.
function conversationCost(turns) {
  const { system, question, answer } = CHAT_SIZES;
  let history = 0;
  let compacted = 0;
  const totals = { input: 0, billedWithCache: 0, inputCompacted: 0, output: turns * answer };
  for (let turn = 1; turn <= turns; turn++) {
    // Each turn the model reads the system prompt, everything said so far and the new question.
    const read = system + history + question;
    totals.input += read;
    // Only the previous answer and the new question are new; the rest was read last turn.
    const fresh = turn === 1 ? read : answer + question;
    totals.billedWithCache += fresh + (read - fresh) * CACHED_PRICE;

    if (compacted > COMPACT_ABOVE) compacted = SUMMARY_SIZE;
    totals.inputCompacted += system + compacted + question;

    history += question + answer;
    compacted += question + answer;
  }
  return totals;
}

function renderTokenCost() {
  const turns = state.turns;
  const { input, billedWithCache, inputCompacted, output } = conversationCost(turns);
  const count = (value) => fmt(Math.round(value));

  $('turns-count').textContent = turns;
  $('io-bars').replaceChildren(
    barRow(t('cost.input'), 1, count(input), false),
    barRow(t('cost.cached'), billedWithCache / input, count(billedWithCache), false),
    barRow(t('cost.compacted'), inputCompacted / input, count(inputCompacted), false),
    barRow(t('cost.output'), output / input, count(output), false),
  );
  $('io-stat').textContent = tn('cost.stat', turns, {
    input: count(input), output: count(output), cached: count(billedWithCache), compacted: count(inputCompacted),
  });
}

// Resource meters: a step lists its demand as data-load="cpu,gpu,memory", each from 0 to 3,
// and the reason for each level as data-cpu, data-gpu and data-memory, shown in a tooltip.

// In the order of data-load; each is also the name of the attribute that holds its reason.
const LOAD_KINDS = ['cpu', 'gpu', 'memory'];
const LOAD_MAX = 3;

function buildLoadMeters() {
  document.querySelectorAll('.load').forEach((el) => {
    const note = document.createElement('span');
    note.className = 'load-note';
    note.textContent = el.textContent;
    const meters = el.dataset.load.split(',').map((level, i) => {
      const meter = document.createElement('span');
      meter.className = 'meter';
      meter.tabIndex = 0;
      // The level is drawn as dots; a screen reader gets it in words.
      meter.setAttribute('role', 'img');
      const name = t(`load.names.${LOAD_KINDS[i]}`);
      const title = t('load.title', { name, level: STRINGS.load.levels[level] });
      meter.setAttribute('aria-label', title);
      meter.dataset.tipTitle = title;
      meter.dataset.tip = el.dataset[LOAD_KINDS[i]];
      meter.setAttribute('aria-describedby', 'tooltip');
      meter.append(name);
      for (let pip = 1; pip <= LOAD_MAX; pip++) {
        const dot = document.createElement('i');
        dot.classList.toggle('on', pip <= Number(level));
        meter.append(dot);
      }
      return meter;
    });
    el.replaceChildren(...meters, note);
  });
}

// Different path: classifier

function renderClassifier() {
  const probs = topicProbs(state.tokens);
  $('classify-input').textContent = promptInput.value;
  const name = (choice) => t(`map.groups.${choice}`);
  $('classify-bars').replaceChildren(...probs.map(({ choice, p }) => barRow(name(choice), p, pct(p), false)));

  const top = probs.reduce((best, entry) => (entry.p > best.p ? entry : best));
  const tied = probs.filter((entry) => entry.p === top.p).length;
  $('classify-stat').textContent = tied === probs.length
    ? t('classifier.none')
    : tied > 1
      ? tn('classifier.tied', tied, { share: pct(top.p) })
      : t('classifier.top', { choice: name(top.choice), share: pct(top.p) });
  // What a program would receive: the answers by their fixed names, numbers with a decimal point.
  const fields = probs.map(({ choice, p }) => `"${choice}": ${p.toFixed(2)}`);
  $('classify-output').textContent = `{ ${fields.join(', ')} }`;
}

// Glossary tooltips: every introduced term (dfn) and, in each section, the
// first plain mention of a glossary term explain themselves on hover or focus.

function termKey(text) {
  return text.trim().toLocaleLowerCase(LOCALE).replace(/\s+/g, ' ');
}

// A word without each of the given endings it ends in. A doubled letter is not
// an ending: "loss" is not "los" with an s.
function withoutEndings(word, endings) {
  return endings
    .filter((ending) => word.endsWith(ending))
    .map((ending) => word.slice(0, -ending.length))
    .filter((stem, i, stems) => stem.length >= 3 && stem.at(-1) !== word.at(-1) && stems.indexOf(stem) === i);
}

// The glossary, and every spelling under which the text may mention an entry:
// the term itself, further spellings its dt lists in data-also (inflected forms,
// for example), and the term without an ending the language lets a mention drop.
function glossaryEntries() {
  const entries = new Map();
  const spellings = new Map();
  document.querySelectorAll('.glossary dt').forEach((dt) => {
    const dd = dt.nextElementSibling.cloneNode(true);
    dd.querySelector('a')?.remove();
    const key = termKey(dt.textContent);
    entries.set(key, { term: dt.textContent, definition: dd.textContent.trim() });
    const also = (dt.dataset.also ?? '').split(',').map(termKey).filter(Boolean);
    for (const spelling of [key, ...withoutEndings(key, STRINGS.terms.dropped), ...also]) {
      if (!spellings.has(spelling)) spellings.set(spelling, key);
    }
  });
  // The entry a piece of text names, as written or with an ending a mention may add.
  const find = (text) => {
    const spelling = termKey(text);
    if (spellings.has(spelling)) return spellings.get(spelling);
    const stem = withoutEndings(spelling, STRINGS.terms.endings).find((candidate) => spellings.has(candidate));
    return spellings.get(stem);
  };
  return { entries, spellings, find };
}

function addTermTooltips() {
  const { entries, spellings, find } = glossaryEntries();
  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Longest first, so "test-time training" wins over "training". Names such
  // as "GPT-2" are left alone. A term must stand on its own: no letter or digit
  // directly before or after it, accented letters and umlauts included.
  const alternatives = [...spellings.keys()]
    .sort((a, b) => b.length - a.length)
    .map((spelling) => escape(spelling).replace(/ /g, '\\s+'));
  const endings = STRINGS.terms.endings.map(escape).join('|');
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join('|')})(?:${endings})?(?![\\p{L}\\p{N}])(?!-\\d)`, 'giu');

  // Introduced terms are tab stops. Plain mentions are not: there are hundreds,
  // and each is explained in the glossary as well.
  const makeTerm = (el, key, focusable = true) => {
    if (focusable) el.tabIndex = 0;
    el.dataset.term = key;
    el.setAttribute('aria-describedby', 'tooltip');
  };
  // A dfn can name its glossary entry with data-term when its text differs.
  document.querySelectorAll('.step dfn, .alt-path dfn').forEach((dfn) => {
    const key = find(dfn.dataset.term ?? dfn.textContent);
    if (key) makeTerm(dfn, key);
  });

  document.querySelectorAll('.step, .alt-path').forEach((section) => {
    const seen = new Set();
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
      acceptNode: ({ parentElement }) => (
        parentElement.closest('p, li, td') && !parentElement.closest('.demo, .step-no, .origins-title, .meter, .source')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT
      ),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const text = node.textContent;
      // An introduced term has its own tooltip, so plain mentions nearby need none.
      const dfn = node.parentElement.closest('dfn');
      if (dfn) {
        seen.add(dfn.dataset.term ?? find(text));
        continue;
      }
      const parts = [];
      let end = 0;
      for (const match of text.matchAll(pattern)) {
        const key = find(match[0]);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const el = document.createElement('span');
        el.className = 'term';
        makeTerm(el, key, false);
        el.textContent = match[0];
        parts.push(text.slice(end, match.index), el);
        end = match.index + match[0].length;
      }
      if (parts.length) node.replaceWith(...parts, text.slice(end));
    }
  });

  const tooltip = document.createElement('div');
  tooltip.id = 'tooltip';
  tooltip.className = 'tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.append(tooltip);

  // The link to a paper whose summary a first click has opened.
  let opened = null;

  const show = (target) => {
    // A glossary term looks its text up; anything else carries its own in data-tip.
    const { term, definition } = target.dataset.tip
      ? { term: target.dataset.tipTitle, definition: target.dataset.tip }
      : entries.get(target.dataset.term);
    const name = document.createElement('strong');
    name.textContent = term;
    tooltip.replaceChildren(name, definition);
    if (target.matches('.source')) {
      const hint = document.createElement('em');
      hint.textContent = t(target === opened ? 'tooltip.paperOpen' : 'tooltip.paperFirst');
      tooltip.append(hint);
    }
    tooltip.hidden = false;

    const rect = target.getBoundingClientRect();
    const maxLeft = window.innerWidth - tooltip.offsetWidth - TOOLTIP_GAP;
    const left = Math.max(TOOLTIP_GAP, Math.min(rect.left + rect.width / 2 - tooltip.offsetWidth / 2, maxLeft));
    const fitsAbove = rect.top > tooltip.offsetHeight + 2 * TOOLTIP_GAP;
    const top = fitsAbove ? rect.top - tooltip.offsetHeight - TOOLTIP_GAP : rect.bottom + TOOLTIP_GAP;
    tooltip.style.left = `${left + window.scrollX}px`;
    tooltip.style.top = `${top + window.scrollY}px`;
  };
  const hide = () => {
    tooltip.hidden = true;
    opened = null;
  };
  const onEnter = (event) => {
    const target = event.target.closest?.('[data-term], [data-tip]');
    if (target) show(target);
  };
  const onLeave = (event) => {
    if (event.target.closest?.('[data-term], [data-tip]')) hide();
  };
  // A link to a paper shows its summary on the first click and opens on the
  // second, so the summary can be read on a touch screen too.
  const onClick = (event) => {
    const source = event.target.closest?.('a.source[data-tip]');
    if (!source) {
      if (opened) hide();
      return;
    }
    if (source === opened || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      hide();
      return;
    }
    event.preventDefault();
    opened = source;
    show(source);
  };

  document.addEventListener('mouseover', onEnter);
  document.addEventListener('mouseout', onLeave);
  document.addEventListener('focusin', onEnter);
  document.addEventListener('focusout', onLeave);
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
}

// Wiring

function render() {
  state.tokens = tokenize(promptInput.value);
  const last = Math.max(state.tokens.length - 1, 0);
  state.embedIndex = Math.min(state.embedIndex, last);
  state.expertIndex = Math.min(state.expertIndex, last);
  state.attentionIndex = last;
  state.picks.clear();

  renderTokens();
  renderEmbeddings();
  renderNetwork();
  renderAttention();
  renderExperts();
  renderPrediction();
  renderSampling();
  renderRetrieval();
  renderClassifier();
  resetLoop();
}

function onChipClick(containerId, key, renderStep) {
  $(containerId).addEventListener('click', (event) => {
    const index = event.target.closest('.chip')?.dataset.index;
    if (index === undefined) return;
    state[key] = Number(index);
    renderStep();
  });
}

// A demo redraws its buttons when one is pressed, which would drop the keyboard
// focus; this hands it to the button that replaced the pressed one.
document.addEventListener('click', (event) => {
  const button = event.target.closest?.('.chips button, .segments button, .patch');
  if (!button) return;
  const group = button.parentElement;
  const index = [...group.children].indexOf(button);
  // Noted before the redraw, acted on after it.
  setTimeout(() => {
    if (!button.isConnected) group.children[index]?.focus();
  });
}, true);

// Hovering a token of the prompt highlights the same token in every step.
// Demos with their own example text (.own-tokens) are left out.
document.querySelector('main').addEventListener('mouseover', (event) => {
  const hovered = event.target.closest('.chip');
  document.querySelectorAll('.chip.active').forEach((el) => el.classList.remove('active'));
  if (!hovered || hovered.closest('.own-tokens') || hovered.dataset.index === undefined) return;
  document.querySelectorAll(`.chip[data-index="${hovered.dataset.index}"]`).forEach((el) => {
    if (!el.closest('.own-tokens')) el.classList.add('active');
  });
});

// The two tabs are views of one page; only one is shown at a time.
const views = [...document.querySelectorAll('.view')];

// Side rail: one dot per step of the current view, the one in sight is marked.
const rail = document.querySelector('.rail');
const railLinks = new Map();
function railLink(target, mark, title) {
  const link = document.createElement('a');
  link.href = `#${target.id}`;
  link.innerHTML = `<span class="dot">${mark}</span><span class="label"></span>`;
  link.querySelector('.label').textContent = title;
  railLinks.set(target, link);
  return link;
}
function buildRail() {
  railLinks.clear();
  const steps = views.find((view) => !view.hidden).querySelectorAll('.step');
  rail.replaceChildren(...[...steps].map((step, i) => railLink(step, i + 1, step.dataset.title)));
}

const currentObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    railLinks.forEach((link, step) => link.classList.toggle('current', step === entry.target));
  }
}, { rootMargin: '-45% 0px -45% 0px' });
const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) entry.target.classList.add('seen');
  }
}, { rootMargin: '0px 0px -15% 0px' });
document.querySelectorAll('.step').forEach((step) => {
  currentObserver.observe(step);
  revealObserver.observe(step);
});

function showView(id) {
  views.forEach((view) => { view.hidden = view.id !== id; });
  document.querySelectorAll('.tabs a').forEach((tab) => {
    const selected = tab.getAttribute('href') === `#${id}`;
    tab.classList.toggle('selected', selected);
    tab.setAttribute('aria-current', selected ? 'page' : 'false');
  });
  buildRail();
  // For parts that belong to one tab, such as a narration that is playing.
  document.dispatchEvent(new CustomEvent('viewchange'));
}

// The menu: a button in the corner opens a panel with the tabs, the search and the languages.
const menu = $('menu');
const menuButton = $('menu-open');
const languageButton = $('language-open');
function setLanguages(open) {
  $('language-list').hidden = !open;
  languageButton.setAttribute('aria-expanded', open);
}
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', open);
  if (!open) setLanguages(false);
}
menuButton.addEventListener('click', () => setMenu(menu.hidden));
// Choosing a tab or the search closes it; a language link leaves the page anyway.
menu.addEventListener('click', (event) => {
  if (event.target.closest('.tabs a, .search-open')) setMenu(false);
  else if (event.target === languageButton) setLanguages($('language-list').hidden);
  else if (!event.target.closest('.languages')) setLanguages(false);
});
document.addEventListener('click', (event) => {
  if (!menu.hidden && !event.target.closest('#menu, #menu-open')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || menu.hidden) return;
  setMenu(false);
  menuButton.focus();
});
// The search was opened from the menu, which has closed since; its button takes the focus back.
$('search').addEventListener('close', () => {
  if (document.activeElement === document.body) menuButton.focus();
});

// Goes to an in-page target, switching to the other view first if it lives there.
function route(hash) {
  const target = hash.length > 1 && document.getElementById(hash.slice(1));
  if (!target) return;
  const view = target.closest('.view');
  if (view?.hidden) showView(view.id);
  // A link that points at a folded section opens it.
  if (target.tagName === 'DETAILS') target.open = true;
  if (target === view) window.scrollTo(0, 0);
  else target.scrollIntoView();
}

// Links change the address, and the address change does the routing. This also
// works when the page is opened as a local file, where pushState is refused.
window.addEventListener('hashchange', () => route(location.hash || '#view-use'));
// The later scripts fill their demos after the first routing, which moves what
// lies below them; once everything has loaded, go to the place again.
window.addEventListener('load', () => route(location.hash));
// A link to the address already showing changes nothing, so route it by hand.
document.addEventListener('click', (event) => {
  const href = event.target.closest('a[href^="#"]')?.getAttribute('href');
  if (href && href === location.hash) route(href);
});
// The language links lead to the same place in the other language, so they
// carry the current #... along. Opened from disk they need the file name they
// are written with; on a web server the folder alone gives the shorter address.
const languageLinks = [...document.querySelectorAll('.languages a')].map((link) => {
  const page = link.getAttribute('href');
  return { link, page: location.protocol === 'file:' ? page : page.replace(/index\.html$/, '') || './' };
});
function aimLanguageLinks() {
  for (const { link, page } of languageLinks) link.href = page + location.hash;
}
window.addEventListener('hashchange', aimLanguageLinks);
// Search can change the address without a hashchange, so look again just before a link is used.
document.querySelector('.languages')?.addEventListener('pointerdown', aimLanguageLinks);
document.querySelector('.languages')?.addEventListener('focusin', aimLanguageLinks);
aimLanguageLinks();

// The skip link moves the focus past the tabs without changing the address.
document.querySelector('.skip')?.addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('main').focus();
});

onChipClick('embed-chips', 'embedIndex', () => {
  renderEmbeddings();
  renderNetwork();
});
$('layer-stack').addEventListener('click', (event) => {
  const layer = event.target.closest('button')?.dataset.layer;
  if (layer === undefined) return;
  state.layer = Number(layer);
  renderNetwork();
});
onChipClick('attention-chips', 'attentionIndex', renderAttention);
onChipClick('example-chips', 'exampleIndex', renderAttentionExample);
onChipClick('moe-chips', 'expertIndex', renderExperts);
$('bit-options').addEventListener('click', (event) => {
  const bits = event.target.closest('button')?.dataset.bits;
  if (bits === undefined) return;
  state.bits = Number(bits);
  renderQuantization();
});
temperatureInput.addEventListener('input', () => {
  state.picks.clear();
  renderSampling();
});
$('ttt-step').addEventListener('click', () => {
  state.trainingSteps += 1;
  renderTestTimeTraining();
});
$('ttt-reset').addEventListener('click', () => {
  state.trainingSteps = 0;
  renderTestTimeTraining();
});
$('map-mode').addEventListener('click', (event) => {
  const mode = event.target.closest('button')?.dataset.mode;
  if (mode) setMapMode(mode);
});
$('word-map').addEventListener('pointerdown', (event) => {
  if (state.mapMode !== '3d') return;
  // Kept in a variable: event.currentTarget is gone by the time the drag ends.
  const svg = event.currentTarget;
  svg.setPointerCapture(event.pointerId);
  svg.classList.add('dragging');
  let lastX = event.clientX;
  const onMove = (move) => {
    turnWordMap((move.clientX - lastX) * MAP_DRAG_SPEED);
    lastX = move.clientX;
  };
  const onEnd = () => {
    svg.removeEventListener('pointermove', onMove);
    svg.removeEventListener('pointerup', onEnd);
    svg.removeEventListener('pointercancel', onEnd);
    svg.classList.remove('dragging');
    releaseWordMap();
  };
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onEnd);
  svg.addEventListener('pointercancel', onEnd);
});
$('word-map').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') turnWordMap(-MAP_KEY_STEP);
  if (event.key === 'ArrowRight') turnWordMap(MAP_KEY_STEP);
});
$('word-map').addEventListener('blur', releaseWordMap);
$('patches').addEventListener('click', (event) => {
  const index = event.target.closest('.patch')?.dataset.patch;
  if (index === undefined) return;
  state.patchIndex = Number(index);
  renderPatches();
});
$('turns-slider').addEventListener('input', (event) => {
  state.turns = Number(event.target.value);
  renderTokenCost();
});
$('agent-next').addEventListener('click', () => {
  state.agentStep += 1;
  renderAgent();
});
$('agent-reset').addEventListener('click', () => {
  state.agentStep = 1;
  renderAgent();
});
$('pick').addEventListener('click', pickToken);
$('generate').addEventListener('click', () => (state.timer ? stopGenerating() : startGenerating()));
$('reset').addEventListener('click', resetLoop);
promptInput.addEventListener('input', render);

// One switch in each hero opens or closes every optional section of that view.
views.forEach((view) => {
  const button = view.querySelector('.toggle-extras');
  if (!button) return;
  const extras = [...view.querySelectorAll('details.extra')];
  const allOpen = () => extras.every((el) => el.open);
  const label = () => { button.textContent = allOpen() ? t('extras.closeAll') : t('extras.openAll', { n: extras.length }); };
  button.addEventListener('click', () => {
    const open = !allOpen();
    extras.forEach((el) => { el.open = open; });
    label();
  });
  extras.forEach((el) => el.addEventListener('toggle', label));
  label();
});

// Lines that report what a button press did are read out by screen readers.
const BUTTON_RESULTS = [
  'pick-result', 'agent-stat', 'chain-stat', 'station-stat', 'robot-stat', 'descent-stat', 'ttt-label', 'feedback-stat',
  'neural-stat', 'patch-label', 'example-stat', 'quant-label', 'tuning-stat', 'lora-stat', 'mcp-stat', 'hw-size',
];
for (const id of BUTTON_RESULTS) $(id).setAttribute('role', 'status');

buildWordMap();
watchWordMap();
wireNeuralNet();
buildLoadMeters();
addTermTooltips();
renderTokenCost();
renderQuantization();
renderTestTimeTraining();
renderAttentionExample();
renderAgent();
renderPatches();
render();
buildRail();
route(location.hash);
