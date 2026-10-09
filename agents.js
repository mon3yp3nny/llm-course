// Agents tab: demos for agentic systems. Uses $, renderTranscript and
// segmentButtons from the earlier scripts, and tokenize from tokenizer.js.
// The wording of every example is in the strings file; fixed here is what must
// not change with the language: who acts at a station, and how a tool is called.

const MS_PER_DAY = 86400000;

const AUTONOMY_LEVELS = STRINGS.autonomy;

// Only the second station is the model's; the rest is the harness.
const STATION_ACTORS = ['harness', 'model', 'harness', 'harness', 'harness'];
const HARNESS_STATIONS = STRINGS.harness.stations.map((station, i) => ({ ...station, actor: STATION_ACTORS[i] }));

const MCP_SERVERS = [
  { id: 'calendar', calls: ['list_events(day)', 'create_event(title, start, end)'] },
  { id: 'files', calls: ['read_file(path)', 'search_files(query)'] },
  { id: 'weather', calls: ['get_forecast(city, day)'] },
].map(({ id, calls }) => ({
  id,
  name: STRINGS.mcp.servers[id].name,
  tools: calls.map((call, i) => ({ call, description: STRINGS.mcp.servers[id].tools[i] })),
}));

// The model's lines are templates; every tool result is computed here for real.
function buildChainSteps() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const newYear = new Date(Date.UTC(now.getFullYear() + 1, 0, 1));
  const isoDate = (date) => date.toISOString().slice(0, 10);
  const days = Math.round((newYear - today) / MS_PER_DAY);
  const hours = days * 24;
  return [
    { marker: '[user]', text: t('chain.question') },
    { marker: '[assistant]', text: 'get_date()' },
    { marker: '[tool]', text: isoDate(today) },
    { marker: '[assistant]', text: `days_between(${isoDate(today)}, ${isoDate(newYear)})` },
    { marker: '[tool]', text: String(days) },
    { marker: '[assistant]', text: `calculator(${days} * 24)` },
    { marker: '[tool]', text: String(hours) },
    { marker: '[assistant]', text: t('chain.answer', { hours: fmt(hours) }) },
  ].map((step, i) => ({ ...step, note: STRINGS.chain.notes[i] }));
}

const CHAIN_STEPS = buildChainSteps();

const agents = {
  level: 1,
  station: 0,
  round: 1,
  chainStep: 1,
  servers: new Set([MCP_SERVERS[0].id]),
};

// Step 1: degrees of autonomy

function renderAutonomy() {
  const level = AUTONOMY_LEVELS[agents.level];
  $('autonomy-levels').replaceChildren(...segmentButtons(
    AUTONOMY_LEVELS.map(({ label }, value) => ({ label, value })),
    (value) => Number(value) === agents.level,
  ));
  $('autonomy-decides').textContent = level.decides;
  $('autonomy-touches').textContent = level.touches;
  $('autonomy-example').textContent = level.example;
}

// Step 2: the harness loop

function renderHarness() {
  $('stations').replaceChildren(...HARNESS_STATIONS.map(({ title, actor }, i) => {
    const el = document.createElement('div');
    el.className = `station ${actor}`;
    el.classList.toggle('current', i === agents.station);
    const who = document.createElement('small');
    who.textContent = t(`harness.actors.${actor}.label`);
    const name = document.createElement('strong');
    name.textContent = t('harness.tile', { n: i + 1, title });
    el.append(who, name);
    return el;
  }));
  const { actor, note } = HARNESS_STATIONS[agents.station];
  $('station-stat').textContent = t('harness.stat', {
    round: agents.round, n: agents.station + 1, actor: t(`harness.actors.${actor}.inSentence`), note,
  });
}

// Step 3: a chain of tools

function renderChain() {
  renderTranscript(CHAIN_STEPS, agents.chainStep, 'chain-output', 'chain-stat', 'chain-next');
}

// Step 4: MCP

function renderMcp() {
  $('mcp-servers').replaceChildren(...MCP_SERVERS.map(({ id, name }) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.server = id;
    el.textContent = name;
    el.classList.toggle('selected', agents.servers.has(id));
    el.setAttribute('aria-pressed', agents.servers.has(id));
    return el;
  }));

  const tools = MCP_SERVERS.filter(({ id }) => agents.servers.has(id)).flatMap(({ tools: list }) => list);
  const lines = tools.map(({ call, description }) => t('mcp.line', { call, description }));
  $('mcp-output').textContent = lines.length ? lines.join('\n') : t('mcp.none');
  const tokens = tokenize(lines.join('\n')).length;
  $('mcp-stat').textContent = tn('mcp.stat', tools.length, { tokens });
}

// Wiring

$('autonomy-levels').addEventListener('click', (event) => {
  const value = event.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  agents.level = Number(value);
  renderAutonomy();
});

$('station-next').addEventListener('click', () => {
  agents.station = (agents.station + 1) % HARNESS_STATIONS.length;
  if (agents.station === 0) agents.round += 1;
  renderHarness();
});
$('station-reset').addEventListener('click', () => {
  agents.station = 0;
  agents.round = 1;
  renderHarness();
});

$('chain-next').addEventListener('click', () => {
  agents.chainStep += 1;
  renderChain();
});
$('chain-reset').addEventListener('click', () => {
  agents.chainStep = 1;
  renderChain();
});

$('mcp-servers').addEventListener('click', (event) => {
  const id = event.target.closest('button')?.dataset.server;
  if (id === undefined) return;
  if (agents.servers.has(id)) agents.servers.delete(id);
  else agents.servers.add(id);
  renderMcp();
});

renderAutonomy();
renderHarness();
renderChain();
renderMcp();
