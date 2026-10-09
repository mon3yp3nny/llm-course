// Step 5: a miniature neural network, drawn as neurons and the weighted lines
// between them. Loaded before app.js; it uses $, state and svgNode from there
// once the page is running.

const NET = { width: 600, height: 300, sideGap: 46, topGap: 22, bottomGap: 34, radius: 11 };
const NET_LAYER_DELAY_MS = 380;
const NET_LINE_MIN_OPACITY = 0.1;
const NET_LINE_DIMMED_OPACITY = 0.04;

// Elements of the current drawing, kept so a selection only restyles them.
const neuralNet = { lines: [], neurons: [], layers: [], selected: null };

function neuronPosition(layer, index) {
  const columns = NETWORK_SIZES.length - 1;
  const rows = Math.max(...NETWORK_SIZES);
  const spacing = (NET.height - NET.topGap - NET.bottomGap) / rows;
  const middle = NET.topGap + (NET.height - NET.topGap - NET.bottomGap) / 2;
  return {
    x: NET.sideGap + (layer / columns) * (NET.width - 2 * NET.sideGap),
    y: middle + (index - (NETWORK_SIZES[layer] - 1) / 2) * spacing,
  };
}

// Redraws the network for the token selected in step 4; new elements play the
// left-to-right animation.
function renderNeuralNet() {
  const token = state.tokens[state.embedIndex];
  neuralNet.lines = [];
  neuralNet.neurons = [];
  neuralNet.selected = null;
  if (token === undefined) {
    $('neural-net').replaceChildren();
    $('neural-stat').textContent = '';
    return;
  }
  neuralNet.layers = runNetwork(tokenVector(token));
  const elements = [];

  NETWORK_WEIGHTS.forEach((table, layer) => table.forEach((row, to) => row.forEach((weight, from) => {
    const start = neuronPosition(layer, from);
    const end = neuronPosition(layer + 1, to);
    const el = svgNode('line', { x1: start.x, y1: start.y, x2: end.x, y2: end.y, class: weight < 0 ? 'neg' : 'pos' });
    el.style.strokeWidth = 0.5 + 2.5 * Math.abs(weight);
    el.style.setProperty('--delay', `${(layer + 0.5) * NET_LAYER_DELAY_MS}ms`);
    // How much actually travels along the line: the weight times what the sending neuron holds.
    const signal = Math.abs(weight * neuralNet.layers[layer].values[from]);
    neuralNet.lines.push({ el, layer: layer + 1, to, signal });
    elements.push(el);
  })));

  neuralNet.layers.forEach(({ values }, layer) => {
    values.forEach((value, index) => {
      const { x, y } = neuronPosition(layer, index);
      const el = svgNode('g', { class: 'neuron', transform: `translate(${x} ${y})`, 'data-layer': layer, 'data-index': index });
      const circle = svgNode('circle', { r: NET.radius });
      const strength = Math.round(Math.abs(value) * 85);
      circle.style.fill = `color-mix(in srgb, var(--${value < 0 ? 'neg' : 'pos'}) ${strength}%, var(--surface))`;
      el.style.setProperty('--delay', `${layer * NET_LAYER_DELAY_MS}ms`);
      el.append(circle);
      neuralNet.neurons.push({ el, layer, index });
      elements.push(el);
    });
    const { x } = neuronPosition(layer, 0);
    elements.push(svgNode('text', { x, y: NET.height - 8, 'text-anchor': 'middle' }, STRINGS.network.columns[layer]));
  });

  $('neural-net').replaceChildren(...elements);
  styleNeuralNet();
}

// Shows which lines feed the selected neuron, and what it computes.
function styleNeuralNet() {
  const { selected, layers } = neuralNet;
  for (const { el, layer, to, signal } of neuralNet.lines) {
    const feedsSelected = selected && selected.layer === layer && selected.index === to;
    const visible = NET_LINE_MIN_OPACITY + (1 - NET_LINE_MIN_OPACITY) * Math.min(signal, 1);
    el.style.opacity = !selected || feedsSelected ? visible : NET_LINE_DIMMED_OPACITY;
  }
  for (const { el, layer, index } of neuralNet.neurons) {
    el.classList.toggle('selected', Boolean(selected) && selected.layer === layer && selected.index === index);
  }

  if (!selected) {
    $('neural-stat').textContent = t('network.hint');
  } else if (selected.layer === 0) {
    const value = layers[0].values[selected.index];
    $('neural-stat').textContent = t('network.input', { n: selected.index + 1, value: fmt(value, 2) });
  } else {
    const { sums, values } = layers[selected.layer];
    const inputs = NETWORK_SIZES[selected.layer - 1];
    $('neural-stat').textContent = t('network.neuron', {
      inputs, sum: fmt(sums[selected.index], 2), value: fmt(values[selected.index], 2),
    });
  }
}

function selectNeuron(target) {
  const el = target.closest?.('.neuron');
  const next = el ? { layer: Number(el.dataset.layer), index: Number(el.dataset.index) } : null;
  const current = neuralNet.selected;
  if (next?.layer === current?.layer && next?.index === current?.index) return;
  neuralNet.selected = next;
  styleNeuralNet();
}

function wireNeuralNet() {
  const svg = $('neural-net');
  svg.addEventListener('pointerover', (event) => selectNeuron(event.target));
  svg.addEventListener('pointerleave', () => selectNeuron(svg));
  svg.addEventListener('click', (event) => selectNeuron(event.target));
  // Without a pointer: the drawing is one tab stop and the arrow keys walk through its neurons.
  svg.tabIndex = 0;
  svg.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const { neurons, selected } = neuralNet;
    if (!step || !neurons.length) return;
    event.preventDefault();
    const at = selected ? neurons.findIndex((n) => n.layer === selected.layer && n.index === selected.index) : (step > 0 ? -1 : 0);
    const next = neurons[(at + step + neurons.length) % neurons.length];
    neuralNet.selected = { layer: next.layer, index: next.index };
    styleNeuralNet();
  });
  svg.addEventListener('blur', () => selectNeuron(svg));
  $('neural-send').addEventListener('click', renderNeuralNet);
}
