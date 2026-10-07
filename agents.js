// Agents tab: demos for agentic systems. Uses $, renderTranscript and
// segmentButtons from the earlier scripts, and tokenize from tokenizer.js.

const MS_PER_DAY = 86400000;

const AUTONOMY_LEVELS = [
  {
    label: 'Chatbot',
    decides: 'You, after every single answer.',
    touches: 'Nothing. It only writes text.',
    example: 'Asking a question and reading the reply.',
  },
  {
    label: 'Assistant with tools',
    decides: 'The model, for a few rounds. You approve anything important.',
    touches: 'The tools you have switched on, such as search or a calculator.',
    example: '"Find three flights for Friday and compare them."',
  },
  {
    label: 'Autonomous agent',
    decides: 'The model, for hundreds of rounds, checking in only rarely.',
    touches: 'Files, programs and online services, within its permissions.',
    example: '"Fix this bug and keep going until all tests pass."',
  },
];

const HARNESS_STATIONS = [
  { title: 'Build the input', actor: 'harness', note: 'It joins the system prompt, the tool descriptions, the conversation so far and the latest results into one text.' },
  { title: 'Model writes', actor: 'model', note: 'It reads that text and writes either an answer or a tool request. This is the only station where the model is involved.' },
  { title: 'Read the output', actor: 'harness', note: 'It checks what came back. A plain answer ends the loop; a tool request goes on.' },
  { title: 'Check and run', actor: 'harness', note: 'It checks the request against its rules, asks you if needed, then runs the tool.' },
  { title: 'Record the result', actor: 'harness', note: 'It adds the result to the conversation, and shortens older parts if the context window is filling up. Then round again.' },
];

const MCP_SERVERS = [
  {
    name: 'Calendar',
    tools: [
      { call: 'list_events(day)', description: 'Returns the events on a given day.' },
      { call: 'create_event(title, start, end)', description: 'Adds an event to the calendar.' },
    ],
  },
  {
    name: 'Files',
    tools: [
      { call: 'read_file(path)', description: 'Returns the text of a file.' },
      { call: 'search_files(query)', description: 'Finds files whose text matches a query.' },
    ],
  },
  {
    name: 'Weather',
    tools: [
      { call: 'get_forecast(city, day)', description: 'Returns the weather forecast for a city.' },
    ],
  },
];

// The model's lines are templates; every tool result is computed here for real.
function buildChainSteps() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const newYear = new Date(Date.UTC(now.getFullYear() + 1, 0, 1));
  const isoDate = (date) => date.toISOString().slice(0, 10);
  const days = Math.round((newYear - today) / MS_PER_DAY);
  const hours = days * 24;
  return [
    { marker: '[user]', text: 'How many hours are left in this year?', note: 'One question, but no single tool can answer it.' },
    { marker: '[assistant]', text: 'get_date()', note: 'The model has no clock. Unless the date was put into its input, it has to ask for it.' },
    { marker: '[tool]', text: isoDate(today), note: 'The harness runs the tool. This is the real date on your device.' },
    { marker: '[assistant]', text: `days_between(${isoDate(today)}, ${isoDate(newYear)})`, note: 'The first result has become part of the second request.' },
    { marker: '[tool]', text: String(days), note: 'Computed by this page.' },
    { marker: '[assistant]', text: `calculator(${days} * 24)`, note: 'The second result feeds the third request.' },
    { marker: '[tool]', text: String(hours), note: 'Computed by this page.' },
    { marker: '[assistant]', text: `About ${hours.toLocaleString('en')} hours are left in this year, counted from the start of today.`, note: 'Only now does the model answer. Three tools, each depending on the one before.' },
  ];
}

const CHAIN_STEPS = buildChainSteps();

const agents = {
  level: 1,
  station: 0,
  round: 1,
  chainStep: 1,
  servers: new Set([MCP_SERVERS[0].name]),
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
    who.textContent = actor;
    const name = document.createElement('strong');
    name.textContent = `${i + 1}. ${title}`;
    el.append(who, name);
    return el;
  }));
  const { actor, note } = HARNESS_STATIONS[agents.station];
  $('station-stat').textContent = `Round ${agents.round}, station ${agents.station + 1} (the ${actor}): ${note}`;
}

// Step 3: a chain of tools

function renderChain() {
  renderTranscript(CHAIN_STEPS, agents.chainStep, 'chain-output', 'chain-stat', 'chain-next');
}

// Step 4: MCP

function renderMcp() {
  $('mcp-servers').replaceChildren(...MCP_SERVERS.map(({ name }) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.server = name;
    el.textContent = name;
    el.classList.toggle('selected', agents.servers.has(name));
    el.setAttribute('aria-pressed', agents.servers.has(name));
    return el;
  }));

  const tools = MCP_SERVERS.filter(({ name }) => agents.servers.has(name)).flatMap(({ tools: list }) => list);
  const lines = tools.map(({ call, description }) => `${call}: ${description}`);
  $('mcp-output').textContent = lines.length ? lines.join('\n') : '(no tools connected)';
  const tokens = tokenize(lines.join('\n')).length;
  $('mcp-stat').textContent = `${tools.length} ${tools.length === 1 ? 'tool' : 'tools'} on offer. `
    + `Their descriptions take up ${tokens} tokens of the context window before you have typed a word.`;
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
  const name = event.target.closest('button')?.dataset.server;
  if (name === undefined) return;
  if (agents.servers.has(name)) agents.servers.delete(name);
  else agents.servers.add(name);
  renderMcp();
});

renderAutonomy();
renderHarness();
renderChain();
renderMcp();
