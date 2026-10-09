// Training tab: demos for how a model is trained. Uses $, barRow and showSpaces
// from app.js, the toy model from model.js and the strings helpers from i18n.js.

const READ_PROMPT = 'The cat';
const READ_CANDIDATES = 6;
const CHART = { width: 600, height: 170, left: 12, right: 12, top: 14, bottom: 26 };
const CURVE_POINTS = 60;
const DESCENT_START = -1.1;
const DESCENT_RANGE = 2.2;
// Small, medium and too large steps; the button labels are descent.rates in the strings file.
const DESCENT_RATES = [0.05, 0.3, 1.05];
const LORA_TABLE_SIDE = 4096;
const LORA_RANKS = [4, 16, 64, 256];
const DESCENT_SETTLED = 0.001;
const DESCENT_LOST = 100;

// The post-training example and the three pairs of answers to judge are
// hand-written illustrations; their text is in the strings file.
const FEEDBACK_PAIRS = STRINGS.feedback.pairs;

// The loss after reading 0, 1, 2, ... sentences: a real learning curve of the tiny model.
const LEARNING_CURVE = Array.from({ length: CORPUS_SENTENCES.length + 1 }, (_, read) => (
  lossAfterReading(countsAfterReading(read))
));

const training = {
  sentencesRead: 8,
  weight: DESCENT_START,
  trail: [],
  rate: DESCENT_RATES[1],
  tuned: false,
  choices: [],
  loraRank: LORA_RANKS[1],
};

// Maps a value range onto the drawing area of a chart.
function chartScale(min, max, top) {
  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  return {
    x: (value) => CHART.left + ((value - min) / (max - min)) * innerWidth,
    y: (value) => CHART.top + (1 - Math.min(value, top) / top) * innerHeight,
  };
}

function chartLabels(left, right) {
  const y = CHART.height - 6;
  return [
    svgNode('text', { x: CHART.left, y }, left),
    svgNode('text', { x: CHART.width - CHART.right, y, 'text-anchor': 'end' }, right),
  ];
}

function segmentButtons(options, isSelected) {
  return options.map(({ label, value }) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.value = value;
    el.textContent = label;
    el.classList.toggle('selected', isSelected(value));
    el.setAttribute('aria-pressed', isSelected(value));
    return el;
  });
}

// Step 2: pre-training

function renderReading() {
  const read = training.sentencesRead;
  const probs = nextTokenProbs(tokenize(READ_PROMPT), countsAfterReading(read));

  $('read-count').textContent = read;
  $('read-last').textContent = read === 0 ? t('reading.nothing') : t('reading.last', { sentence: CORPUS_SENTENCES[read - 1] });
  $('read-bars').replaceChildren(...probs.slice(0, READ_CANDIDATES).map(({ token, p }) => (
    barRow(showSpaces(token), p, pct(p), false)
  )));
  $('read-empty').hidden = probs.length > 0;
  $('loss-value').textContent = fmt(LEARNING_CURVE[read], 1);

  const last = LEARNING_CURVE.length - 1;
  const { x, y } = chartScale(0, last, LEARNING_CURVE[0]);
  const points = LEARNING_CURVE.map((loss, i) => `${x(i).toFixed(1)},${y(loss).toFixed(1)}`).join(' ');
  $('loss-chart').replaceChildren(
    svgNode('line', { class: 'baseline', x1: x(0), x2: x(last), y1: y(0), y2: y(0) }),
    svgNode('polyline', { class: 'curve', points }),
    svgNode('circle', { class: 'marker-dot', cx: x(read), cy: y(LEARNING_CURVE[read]), r: 6 }),
    ...chartLabels(t('reading.chartStart'), t('reading.chartEnd', { n: last })),
  );
}

// Step 3: gradient descent

function renderDescent() {
  const { weight, trail, rate } = training;
  const min = DESCENT_TARGET - DESCENT_RANGE;
  const max = DESCENT_TARGET + DESCENT_RANGE;
  const { x, y } = chartScale(min, max, lossOfWeight(max));
  const onChart = (value) => Math.max(min, Math.min(max, value));
  const dot = (value, attrs) => svgNode('circle', { cx: x(onChart(value)), cy: y(lossOfWeight(value)), ...attrs });

  const curve = Array.from({ length: CURVE_POINTS + 1 }, (_, i) => {
    const value = min + (i / CURVE_POINTS) * (max - min);
    return `${x(value).toFixed(1)},${y(lossOfWeight(value)).toFixed(1)}`;
  }).join(' ');
  $('descent-chart').replaceChildren(
    svgNode('polyline', { class: 'curve faint', points: curve }),
    ...trail.map((value) => dot(value, { class: 'trail-dot', r: 3 })),
    dot(weight, { class: 'marker-dot', r: 6 }),
    ...chartLabels(t('descent.low'), t('descent.high')),
  );

  $('descent-rates').replaceChildren(...segmentButtons(
    DESCENT_RATES.map((value, i) => ({ label: STRINGS.descent.rates[i], value })),
    (value) => Number(value) === rate,
  ));

  const loss = lossOfWeight(weight);
  const offChart = Math.abs(weight - DESCENT_TARGET) > DESCENT_RANGE;
  let key = 'descent.stat';
  if (offChart) key = 'descent.statOffChart';
  else if (loss < DESCENT_SETTLED) key = 'descent.statSettled';
  const position = trail.length ? t('descent.step', { n: trail.length }) : t('descent.start');
  $('descent-stat').textContent = t(key, { position, weight: fmt(weight, 2), loss: fmt(loss, 2) });
  $('descent-step').disabled = Math.abs(weight) > DESCENT_LOST;
}

function resetDescent() {
  training.weight = DESCENT_START;
  training.trail = [];
  renderDescent();
}

// Step 4: post-training

function renderTuning() {
  const mode = training.tuned ? 'tuned' : 'base';
  $('tuning-mode').replaceChildren(...segmentButtons(
    [{ label: t('tuning.base'), value: 'base' }, { label: t('tuning.tuned'), value: 'tuned' }],
    (value) => (value === 'tuned') === training.tuned,
  ));
  const typed = document.createElement('span');
  typed.className = 'prompt-text';
  typed.textContent = t('tuning.prompt');
  $('tuning-output').replaceChildren(typed, t(`tuning.${mode}Text`));
  $('tuning-stat').textContent = t(`tuning.${mode}Note`);
}

// Step 5: feedback

function renderFeedback() {
  const judged = training.choices.length;
  const pair = FEEDBACK_PAIRS[judged];
  const done = pair === undefined;

  $('feedback-prompt').textContent = done ? '' : pair.prompt;
  $('feedback-answers').replaceChildren(...(done ? [] : pair.answers.map((answer, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'answer';
    el.dataset.answer = i;
    const letter = document.createElement('strong');
    letter.textContent = 'AB'[i];
    el.append(letter, answer);
    return el;
  })));
  $('feedback-reset').hidden = !done;

  const letters = training.choices.map((choice) => 'AB'[choice]).join(', ');
  if (done) {
    $('feedback-stat').textContent = t('feedback.done', { n: judged, letters });
  } else {
    $('feedback-stat').textContent = t('feedback.next', { n: judged + 1, total: FEEDBACK_PAIRS.length });
  }
}

// Step 6: evaluation

function renderEvaluation() {
  const rows = [
    { label: t('evaluation.readBefore'), sentences: TEST_SENTENCES },
    { label: t('evaluation.neverRead'), sentences: UNSEEN_SENTENCES },
  ].map(({ label, sentences }) => ({ label, sentences, loss: lossAfterReading(COUNTS, sentences) }));
  const worst = -Math.log2(UNKNOWN_PROBABILITY);

  $('eval-bars').replaceChildren(...rows.map(({ label, loss }) => barRow(label, loss / worst, fmt(loss, 1), false)));
  $('eval-sentences').textContent = t('evaluation.sentences', { sentences: rows[1].sentences.join(' ') });
}

// Step 7: LoRA

function renderLora() {
  const full = LORA_TABLE_SIDE * LORA_TABLE_SIDE;
  // Two thin tables: one of side x rank, one of rank x side.
  const addOn = 2 * LORA_TABLE_SIDE * training.loraRank;
  $('lora-ranks').replaceChildren(...segmentButtons(
    LORA_RANKS.map((rank) => ({ label: t('lora.rank', { n: rank }), value: rank })),
    (value) => Number(value) === training.loraRank,
  ));
  $('lora-bars').replaceChildren(
    barRow(t('lora.full'), 1, fmt(full), false),
    barRow(t('lora.addOn'), addOn / full, fmt(addOn), true),
  );
  $('lora-stat').textContent = t('lora.stat', { share: pct(addOn / full, 1) });
}

// Wiring

$('read-slider').max = CORPUS_SENTENCES.length;
$('read-slider').value = training.sentencesRead;
$('read-slider').addEventListener('input', (event) => {
  training.sentencesRead = Number(event.target.value);
  renderReading();
});

$('descent-step').addEventListener('click', () => {
  training.trail.push(training.weight);
  training.weight = descentStep(training.weight, training.rate);
  renderDescent();
});
$('descent-reset').addEventListener('click', resetDescent);
$('descent-rates').addEventListener('click', (event) => {
  const value = event.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  training.rate = Number(value);
  resetDescent();
});

$('lora-ranks').addEventListener('click', (event) => {
  const value = event.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  training.loraRank = Number(value);
  renderLora();
});

$('tuning-mode').addEventListener('click', (event) => {
  const value = event.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  training.tuned = value === 'tuned';
  renderTuning();
});

$('feedback-answers').addEventListener('click', (event) => {
  const answer = event.target.closest('.answer')?.dataset.answer;
  if (answer === undefined) return;
  training.choices.push(Number(answer));
  renderFeedback();
});
$('feedback-reset').addEventListener('click', () => {
  training.choices = [];
  renderFeedback();
});

renderReading();
renderDescent();
renderTuning();
renderFeedback();
renderEvaluation();
renderLora();
