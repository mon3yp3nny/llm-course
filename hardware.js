// Hardware tab: a rough estimate of which model fits on which kind of machine,
// and how fast it can write at most. Uses $ and segmentButtons from the
// earlier scripts.

// Typical, rounded figures: memory the model can use (GB), how fast that
// memory can be read (GB per second), and the power drawn under load (watts).
// Each machine's name is in the strings file, under its id.
const MACHINES = [
  // A phone lets a single app use only about half of its memory.
  { id: 'phone', memory: 12, bandwidth: 115, watts: 6, usableShare: 0.5 },
  // On an ordinary laptop the system and other programs need a good part of the memory.
  { id: 'laptop', memory: 16, bandwidth: 70, watts: 45, usableShare: 0.6 },
  { id: 'pc', memory: 24, bandwidth: 1000, watts: 600 },
  { id: 'mac', memory: 64, bandwidth: 500, watts: 150 },
  { id: 'spark', memory: 128, bandwidth: 273, watts: 170 },
  { id: 'studio', memory: 512, bandwidth: 1200, watts: 385 },
  { id: 'server', memory: 80, bandwidth: 3000, watts: 1000 },
];
// In billions of parameters. The last is Kimi K3, the largest open-weight model so far.
const MODEL_SIZES = [4, 8, 27, 70, 120, 240, 2800];
const DATA_CENTRE_GPU_GB = 80;
const WEIGHT_BITS = [4, 8, 16];
// A model needs room beside it for the conversation, so it may fill only this share of memory.
const USABLE_SHARE = 0.85;

const SORTS = ['listed', 'speed', 'efficiency'].map((value) => ({ label: t(`hardware.sorts.${value}`), value }));
// The table's own column headings, repeated beside each value where the phone layout stacks the cells.
const MACHINE_HEADINGS = [...document.querySelectorAll('.machines thead th')].slice(1).map((th) => th.textContent.trim());

// A model size on its button: counted in billions of parameters, or in trillions from a thousand billion on.
function sizeLabel(billions) {
  return billions < 1000
    ? t('units.billions', { n: fmt(billions) })
    : t('units.trillions', { n: fmt(billions / 1000), billions: fmt(billions) });
}

const hardware = { parameters: 27, bits: 4, sort: 'listed' };

function renderMachines() {
  const { parameters, bits } = hardware;
  // Billions of parameters times bits, divided by 8, is the size in gigabytes.
  const sizeGb = (parameters * bits) / 8;

  $('hw-sizes').replaceChildren(...segmentButtons(
    MODEL_SIZES.map((value) => ({ label: sizeLabel(value), value })),
    (value) => Number(value) === parameters,
  ));
  $('hw-bits').replaceChildren(...segmentButtons(
    WEIGHT_BITS.map((value) => ({ label: t('units.bits', { n: value }), value })),
    (value) => Number(value) === bits,
  ));
  const fitsOn = ({ memory, usableShare = USABLE_SHARE }) => sizeGb <= memory * usableShare;
  const fitsAnywhere = MACHINES.some(fitsOn);
  const cards = Math.ceil(sizeGb / (DATA_CENTRE_GPU_GB * USABLE_SHARE));
  $('hw-size').textContent = t(fitsAnywhere ? 'hardware.size' : 'hardware.sizeTooBig', {
    parameters: fmt(parameters), bits, size: fmt(sizeGb), cards: fmt(cards),
  });

  $('hw-sort').replaceChildren(...segmentButtons(SORTS, (value) => value === hardware.sort));
  document.querySelectorAll('.machines th').forEach((th) => {
    const key = th.querySelector('.sort')?.dataset.sort;
    if (key) th.setAttribute('aria-sort', key === hardware.sort ? 'descending' : 'none');
  });

  const results = MACHINES.map((machine) => {
    const fits = fitsOn(machine);
    // It cannot write tokens faster than it can read through the weights.
    const speed = fits ? machine.bandwidth / sizeGb : 0;
    return { ...machine, fits, speed, efficiency: speed / machine.watts };
  });
  // Highest first; machines that cannot run the model keep their place at the end.
  if (hardware.sort !== 'listed') results.sort((a, b) => b[hardware.sort] - a[hardware.sort]);

  $('hw-rows').replaceChildren(...results.map(({ id, memory, bandwidth, watts, fits, speed, efficiency }) => {
    const row = document.createElement('tr');
    row.classList.toggle('unfit', !fits);

    const label = document.createElement('td');
    const specs = document.createElement('small');
    specs.textContent = t('hardware.specs', { memory: fmt(memory), bandwidth: fmt(bandwidth), watts: fmt(watts) });
    label.append(t(`hardware.machines.${id}`), specs);
    row.append(label);

    const cells = [
      fits ? t('hardware.yes') : t('hardware.no'),
      fits ? t('units.tokensPerSecond', { n: fmt(Math.round(speed)) }) : t('hardware.doesNotRun'),
      fits ? fmt(efficiency, 2) : '–',
    ];
    for (const [i, text] of cells.entries()) {
      const cell = document.createElement('td');
      cell.dataset.label = MACHINE_HEADINGS[i];
      cell.textContent = text;
      row.append(cell);
    }
    return row;
  }));
}

for (const [id, key] of [['hw-sizes', 'parameters'], ['hw-bits', 'bits']]) {
  $(id).addEventListener('click', (event) => {
    const value = event.target.closest('button')?.dataset.value;
    if (value === undefined) return;
    hardware[key] = Number(value);
    renderMachines();
  });
}

$('hw-sort').addEventListener('click', (event) => {
  const value = event.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  hardware.sort = value;
  renderMachines();
});
// A column heading sorts by that column; clicking it again restores the listed order.
document.querySelector('.machines thead').addEventListener('click', (event) => {
  const key = event.target.closest('.sort')?.dataset.sort;
  if (key === undefined) return;
  hardware.sort = hardware.sort === key ? 'listed' : key;
  renderMachines();
});

renderMachines();
