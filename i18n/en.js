// English: every text the scripts put on the page. i18n/de.js and i18n/fr.js
// hold the same entries in the same order; tools/check_i18n.py compares them.
// Data only: strings, lists and nested groups. A {blank} is filled in by the
// script; an entry with `one` and `other` is chosen by the number it mentions.
// The toy model's own data (its sentences, the word map, the example prompts)
// is not here: it stays English in every language and lives in model.js.

const STRINGS = {
  lang: 'en',
  locale: 'en-GB',

  glossary: 'Glossary',

  units: {
    bits: '{n} bits',
    gb: '{n} GB',
    // Model sizes on the buttons of the Hardware tab; {billions} is the same size counted in billions.
    billions: '{n}B',
    trillions: '{n}T',
    tokensPerSecond: '{n} tokens/s',
  },

  // Glossary tooltips: endings a mention in the text may add to a glossary
  // term, and endings of a term that a mention may leave out.
  terms: {
    endings: ['s'],
    dropped: ['s'],
  },

  bars: {
    title: '{label}: {value}',
  },

  map: {
    groups: { animals: 'Animals', home: 'Home', language: 'Language', food: 'Food', actions: 'Actions' },
    notEdible: 'not edible',
    edible: 'edible',
    hits: 'From your prompt: {words}',
    none: 'None of your words are on this small map. Try: cat, garden, milk.',
  },

  patch: {
    label: 'Patch {n}',
    stat: 'Patch {n} of {total} becomes one vector',
  },

  layers: {
    embedding: 'Embedding, before any layer',
    layer: 'Layer {n}',
    vectorAtStart: 'Vector for {token} straight from the embedding, before any layer',
    vectorAfter: 'Vector for {token} after layer {layer} of {total}',
  },

  network: {
    columns: ['vector in', 'neurons', 'neurons', 'vector out'],
    hint: 'Each circle is a neuron and each line a weight: blue for negative, orange for positive. A line shows stronger the more signal passes along it. Point at a neuron, or use the arrow keys.',
    input: "An input: number {n} of the token's vector, {value}. Nothing is calculated here yet.",
    neuron: 'This neuron multiplies each of its {inputs} inputs by the weight on its line and adds them up: {sum}. Squashed into the range from -1 to 1, it passes on {value}.',
  },

  quantization: {
    label: 'Stored with {bits} bits: each weight is one of {values} allowed values',
    error: 'Average rounding error: {error}',
    errorTiny: 'Average rounding error: less than {limit}',
  },

  testTime: {
    after: {
      one: 'The same weights after {n} training step on this request',
      other: 'The same weights after {n} training steps on this request',
    },
  },

  attention: {
    stat: '“{from}” draws most from “{to}” ({share}).',
  },

  experts: {
    tile: 'E{n}',
    stat: 'The router sends “{token}” to experts {names}. The other {rest} do no work for this token.',
  },

  prediction: {
    rest: {
      one: '{n} other token has the remaining {share}.',
      other: '{n} other tokens share the remaining {share}.',
    },
  },

  sampling: {
    rest: {
      one: '{n} other token has the remaining {share}. It holds tickets too.',
      other: '{n} other tokens share the remaining {share}. They hold tickets too.',
    },
    picked: 'Picked “{token}”',
    pickedUnseen: 'Picked “{token}”, one of the tokens not shown',
  },

  loop: {
    stop: 'Stop',
    stat: {
      one: '{n} token added, {n} pass through the model.',
      other: '{n} tokens added, {n} passes through the model.',
    },
  },

  retrieval: {
    score: { one: '{n} shared word', other: '{n} shared words' },
    nothing: '(Nothing in the library fits, so the prompt goes in unchanged.)',
  },

  // The hand-stepped exchanges: the calculator here, the tool chain on the Agents tab.
  transcript: {
    stat: 'Step {n} of {total}: {note}',
  },

  agent: {
    question: 'What is {factors}?',
    answer: '{factors} is {product}.',
    notes: [
      'The question arrives as text, like any prompt.',
      'The model does not guess. It writes a request for the calculator tool.',
      'Ordinary software runs the calculator and pastes the result into the text.',
      'The loop continues: with the result in its context window, the model writes the answer.',
    ],
  },

  cost: {
    input: 'Input',
    cached: 'Cached',
    compacted: 'Compacted',
    output: 'Output',
    stat: {
      one: 'After {n} turn the model has read {input} tokens and written {output}. With caching the reading is billed like {cached} tokens. With compaction only {compacted} are read at all.',
      other: 'After {n} turns the model has read {input} tokens and written {output}. With caching the reading is billed like {cached} tokens. With compaction only {compacted} are read at all.',
    },
  },

  // Resource meters. The reasons shown below the title are data-cpu, data-gpu and data-memory in the page.
  load: {
    names: { cpu: 'CPU', gpu: 'GPU', memory: 'Memory' },
    levels: ['hardly used', 'low', 'medium', 'high'],
    title: '{name}: {level}',
  },

  // The classifier's four answers are the word-map groups of the same name.
  classifier: {
    none: 'No evidence for any answer: all are equally likely.',
    tied: { one: '{n} answer is tied at {share}.', other: '{n} answers are tied at {share}.' },
    top: 'Most likely: {choice} ({share}).',
  },

  tooltip: {
    paperFirst: 'Click once to keep this note, twice to open the source.',
    paperOpen: 'Click again to open the source.',
    paperTitle: '{title} ({by})',
  },

  extras: {
    closeAll: 'Close all',
    openAll: 'Open all {n}',
  },

  reading: {
    nothing: 'Nothing read yet.',
    last: 'Just read: “{sentence}”',
    chartStart: 'nothing read',
    chartEnd: 'all {n} sentences read',
  },

  descent: {
    rates: ['Small steps', 'Medium steps', 'Too large'],
    low: 'weight too low',
    high: 'weight too high',
    start: 'Start',
    step: 'Step {n}',
    stat: '{position}: weight {weight}, loss {loss}.',
    statOffChart: '{position}: weight {weight}, loss {loss}. Off the chart: every step now overshoots further.',
    statSettled: '{position}: weight {weight}, loss {loss}. At the bottom: more steps change almost nothing.',
  },

  // Hand-written to show the typical difference.
  tuning: {
    base: 'Base model',
    tuned: 'After post-training',
    prompt: 'What is the capital of France?',
    baseText: ' What is the capital of Spain? What is the capital of Italy? Test your knowledge with our geography quiz and',
    baseNote: 'The base model treats the question as the start of a document and carries on in the same style.',
    tunedText: '\nThe capital of France is Paris.',
    tunedNote: 'After post-training, the same text is treated as a question to answer.',
  },

  feedback: {
    pairs: [
      {
        prompt: 'Explain what a token is to a ten-year-old.',
        answers: [
          'A token is a sub-word unit produced by a byte-pair-encoding tokenizer.',
          'A token is a small piece of a word, like a building brick. The computer builds every sentence out of these pieces.',
        ],
      },
      {
        prompt: 'Is the Earth flat?',
        answers: [
          'No. The Earth is round, which has been measured in many independent ways.',
          'People have different views on this, and it is not for me to say.',
        ],
      },
      {
        prompt: 'My program crashes. Fix it.',
        answers: [
          'Done! It should work now.',
          'I can help. Please show me the error message and the part of the code where it happens.',
        ],
      },
    ],
    next: 'Comparison {n} of {total}. Click the answer you prefer.',
    done: 'All {n} judged (you preferred {letters}). Each choice becomes a signal: make answers like the preferred one more likely.',
  },

  evaluation: {
    readBefore: 'Read before',
    neverRead: 'Never read',
    sentences: 'Never read: {sentences}',
  },

  lora: {
    rank: 'Rank {n}',
    full: 'Full table',
    addOn: 'Add-on',
    stat: 'The add-on trains {share} as many weights as the full table.',
  },

  autonomy: [
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
  ],

  harness: {
    // Who is at work at a station: the caption on its tile, and the words used inside the sentence below.
    actors: {
      harness: { label: 'harness', inSentence: 'the harness' },
      model: { label: 'model', inSentence: 'the model' },
    },
    stations: [
      { title: 'Build the input', note: 'It joins the system prompt, the tool descriptions, the conversation so far and the latest results into one text.' },
      { title: 'Model writes', note: 'It reads that text and writes either an answer or a tool request. This is the only station where the model is involved.' },
      { title: 'Read the output', note: 'It checks what came back. A plain answer ends the loop; a tool request goes on.' },
      { title: 'Check and run', note: 'It checks the request against its rules, asks you if needed, then runs the tool.' },
      { title: 'Record the result', note: 'It adds the result to the conversation, and shortens older parts if the context window is filling up. Then round again.' },
    ],
    tile: '{n}. {title}',
    stat: 'Round {round}, station {n} ({actor}): {note}',
  },

  chain: {
    question: 'How many hours are left in this year?',
    answer: 'About {hours} hours are left in this year, counted from the start of today.',
    notes: [
      'One question, but no single tool can answer it.',
      'The model has no clock. Unless the date was put into its input, it has to ask for it.',
      'The harness runs the tool. This is the real date on your device.',
      'The first result has become part of the second request.',
      'Computed by this page.',
      'The second result feeds the third request.',
      'Computed by this page.',
      'Only now does the model answer. Three tools, each depending on the one before.',
    ],
  },

  // The tool calls themselves, such as list_events(day), stay as they are in every language.
  mcp: {
    servers: {
      calendar: {
        name: 'Calendar',
        tools: ['Returns the events on a given day.', 'Adds an event to the calendar.'],
      },
      files: {
        name: 'Files',
        tools: ['Returns the text of a file.', 'Finds files whose text matches a query.'],
      },
      weather: {
        name: 'Weather',
        tools: ['Returns the weather forecast for a city.'],
      },
    },
    line: '{call}: {description}',
    none: '(no tools connected)',
    stat: {
      one: '{n} tool on offer. Its description takes up {tokens} tokens of the context window before you have typed a word.',
      other: '{n} tools on offer. Their descriptions take up {tokens} tokens of the context window before you have typed a word.',
    },
  },

  hardware: {
    machines: {
      phone: 'iPhone 18 Pro',
      laptop: 'Laptop without a graphics card',
      pc: 'PC with a 24 GB graphics card',
      mac: 'Mac with 64 GB of unified memory',
      spark: 'NVIDIA DGX Spark, 128 GB',
      studio: 'Mac Studio with M5 Ultra, 512 GB',
      server: 'One data-centre GPU, with its share of the server',
    },
    sorts: { listed: 'As listed', speed: 'Fastest', efficiency: 'Most per watt' },
    size: '{parameters} billion parameters at {bits} bits per weight: {size} GB.',
    sizeTooBig: '{parameters} billion parameters at {bits} bits per weight: {size} GB. None of these machines can hold it. It takes about {cards} data-centre GPUs working together.',
    specs: '{memory} GB · reads {bandwidth} GB/s · {watts} W',
    yes: 'Yes',
    no: 'No',
    doesNotRun: 'does not run',
  },

  // Hand-written: what the robot's model outputs at each moment, and what happens.
  robot: {
    actions: [
      { output: '(nothing yet)', note: 'The camera picture and the instruction go in: "Put the block in the bowl."' },
      { output: 'move right 80, gripper open', note: 'The model sees the block to the right and moves over it.' },
      { output: 'move down 110, gripper open', note: 'It lowers the open gripper around the block.' },
      { output: 'stay, gripper close', note: 'It closes the gripper. From here on the block moves with it.' },
      { output: 'move up 110, gripper closed', note: 'It lifts the block clear of the table.' },
      { output: 'move right 260, gripper closed', note: 'It carries the block over to the bowl.' },
      { output: 'move down 110, gripper closed', note: 'It lowers the block into the bowl.' },
      { output: 'stay, gripper open', note: 'It lets go. The block stays where it is.' },
      { output: 'move up 110, gripper open', note: 'It moves away. The task is done.' },
    ],
    bowl: 'bowl',
    stat: 'Moment {n} of {total}: {note}',
  },

  search: {
    // Small words a search ignores, and endings it ignores at the end of a searched word.
    stopWords: ['a', 'an', 'the', 'of', 'to', 'in', 'on', 'is', 'are', 'and', 'or', 'what', 'how', 'do', 'does', 'why'],
    endings: ['s'],
    placeEvent: '{place} · {year}',
    placeOptional: '{place} · optional',
    hint: 'Type a word, for example "token", "MCP" or "AlphaFold".',
    results: { one: '{n} place', other: '{n} places' },
    resultsOrMore: '{n} or more places',
    nothing: 'Nothing found.',
  },

  narration: {
    listen: 'Listen',
    listenLabel: 'Listen: {title}',
    pause: 'Pause',
    pauseLabel: 'Pause: {title}',
    failed: 'The recording could not be played. Try again',
    failedLabel: 'Could not play: {title}. Try again',
  },

  // The research papers: who wrote each and what it says. Titles and addresses are in papers.js.
  papers: {
    attention: {
      by: 'Vaswani and others, 2017',
      summary: 'Until then, most language models read a sentence one word after another. This paper drops that and relies on attention alone, so all words are processed at once. Such a network, the transformer, trains far faster on far more text.',
    },
    bengio: {
      by: 'Bengio and others, 2003',
      summary: 'Replaces counting word sequences with a neural network. It learns a vector for every word, so that similar words get similar vectors, and predicts the next word from them.',
    },
    alexnet: {
      by: 'Krizhevsky, Sutskever and Hinton, 2012',
      summary: 'A deep network trained on two graphics cards wins the leading image-recognition contest with far fewer errors than the runner-up. It convinced the field that deep networks, large data sets and GPUs belong together.',
    },
    word2vec: {
      by: 'Mikolov and others, 2013',
      summary: 'A very simple network learns word vectors from more than a billion words in less than a day. The vectors turn out to capture relations: the step from "man" to "woman" resembles the step from "king" to "queen".',
    },
    bahdanau: {
      by: 'Bahdanau, Cho and Bengio, 2014',
      summary: 'Earlier translation networks squeezed a whole sentence into one vector. Here the network looks back at the source words that matter for each word it writes. This is the first use of attention in translation, the idea the transformer later builds on.',
    },
    distill: {
      by: 'Hinton, Vinyals and Dean, 2015',
      summary: 'A small network is trained to reproduce the full probabilities a large one gives, not just its top answer. It ends up far better than if it had learned from the data alone.',
    },
    moe: {
      by: 'Jacobs, Jordan, Nowlan and Hinton, 1991',
      summary: "Several small networks each learn part of a task, and a gating network learns which of them to trust for each input. Today's mixture-of-experts models use the same idea inside every layer.",
    },
    bpe: {
      by: 'Sennrich, Haddow and Birch, 2015',
      summary: 'Translation models of the time knew a fixed list of whole words and failed on the rest. Splitting rare words into frequent pieces with byte pair encoding lets a model read and write any word.',
    },
    vit: {
      by: 'Dosovitskiy and others, 2020',
      summary: 'Cuts an image into small square patches and feeds them to an ordinary transformer as if they were words. With enough training images it matches the networks built specially for vision.',
    },
    clip: {
      by: 'Radford and others, 2021',
      summary: 'Trained on 400 million images with their captions, the model learns to place a picture and its description close together. It can then recognise things it was never explicitly taught, from a description alone.',
    },
    bitnet: {
      by: 'Ma and others, 2024',
      summary: 'A language model trained from the start with every weight limited to −1, 0 or +1. It comes close to an ordinary model of the same size while needing far less memory and energy.',
    },
    ttt: {
      by: 'Sun and others, 2019',
      summary: 'Before answering, the model briefly trains on the very input in front of it, using a task that needs no labels. This helps when the input differs from the training data.',
    },
    tttLlm: {
      by: 'Akyürek and others, 2024',
      summary: 'Applies test-time training to a language model: a short round of training on the examples of each puzzle before answering. Accuracy on the ARC puzzles rises several times over.',
    },
    gpt1: {
      by: 'Radford and others, 2018',
      summary: 'The first GPT. A transformer is first trained to predict the next word on thousands of books, then adapted with little effort to many different language tasks.',
    },
    gpt2: {
      by: 'Radford and others, 2019',
      summary: 'GPT-2. A larger model trained on text from millions of web pages writes coherent paragraphs and handles tasks such as summarising without being trained for them.',
    },
    gpt3: {
      by: 'Brown and others, 2020',
      summary: 'GPT-3, with 175 billion parameters. Shown a few examples in the prompt, it carries out new tasks without any further training.',
    },
    bert: {
      by: 'Devlin and others, 2018',
      summary: 'A transformer trained to fill in hidden words, using the text on both sides of the gap. It reads but does not write, and set new records on tests of language understanding.',
    },
    rag: {
      by: 'Lewis and others, 2020',
      summary: 'Before answering, the system looks up fitting passages in a large collection of text and gives them to the model along with the question. Answers become more accurate and can be kept up to date.',
    },
    nucleus: {
      by: 'Holtzman and others, 2019',
      summary: 'Always picking the most likely word makes text dull and repetitive; picking freely makes it incoherent. The paper proposes drawing only from the smallest set of words that together are likely enough: top-p.',
    },
    cot: {
      by: 'Wei and others, 2022',
      summary: 'If the examples in a prompt show the steps of the reasoning and not only the answer, the model writes out its own steps too, and solves many more arithmetic and logic problems.',
    },
    react: {
      by: 'Yao and others, 2022',
      summary: "The model alternates between writing a thought, requesting an action such as a search, and reading the result. This loop is the basic pattern of today's agents.",
    },
    prefs: {
      by: 'Christiano and others, 2017',
      summary: "People are shown two short clips of a system's behaviour and say which is better. From such comparisons alone it learns tasks for which nobody could write down a score.",
    },
    instructgpt: {
      by: 'Ouyang and others, 2022',
      summary: 'InstructGPT. A language model is trained further on human demonstrations and on human rankings of its answers. People prefer its answers to those of a model a hundred times larger.',
    },
    lora: {
      by: 'Hu and others, 2021',
      summary: 'To adapt a model, leave all its weights untouched and train a small add-on beside them. This needs a fraction of the memory, and the add-on is a small file that can be swapped.',
    },
    rt2: {
      by: 'Brohan and others, 2023',
      summary: 'A model that understands images and text is trained to write robot movements as tokens. The robot can then follow instructions about objects it never met in its robot training.',
    },
    graphcast: {
      by: 'Lam and others, 2022; in Science 2023',
      summary: 'A network trained on forty years of weather records makes a ten-day forecast for the whole globe in under a minute, and beats the leading conventional system on most of the measures tested.',
    },
    alphafold: {
      by: 'Jumper and others, 2021',
      summary: 'Describes AlphaFold 2, which predicts the three-dimensional shape of a protein from its sequence of building blocks, in many cases as accurately as an experiment.',
    },
    mcculloch: {
      by: 'McCulloch and Pitts, 1943',
      summary: 'Describes a nerve cell as a simple switch: it fires or it does not, depending on the signals it receives. The authors show that networks of such cells can carry out the operations of logic. These cells do not learn yet, but artificial neural networks grew from this picture.',
    },
    shannon: {
      by: 'Shannon, 1948',
      summary: 'The founding paper of information theory: it measures information in bits and shows how much of it a noisy line can carry. On the way, Shannon builds English-like text by choosing each letter or word according to how often it follows the ones before. That is a language model in miniature.',
    },
    turing: {
      by: 'Turing, 1950',
      summary: 'Turing swaps the question "Can machines think?" for a game: a judge exchanges written messages with a person and a machine and must tell which is which. He then answers nine objections one by one, among them Ada Lovelace\'s, and ends with ideas for a machine that learns like a child.',
    },
    dartmouth: {
      by: 'McCarthy, Minsky, Rochester and Shannon, 1955',
      summary: 'A request for funding for a summer workshop in 1956: ten researchers, two months. It rests on the conjecture that every aspect of learning and intelligence can be described so precisely that a machine can simulate it. The term "artificial intelligence" comes from this proposal.',
    },
    perceptron: {
      by: 'Rosenblatt, 1958',
      summary: "A psychologist's theory of how a brain could store what it perceives: not as stored pictures, but in the strength of the connections between its cells. The perceptron built on this idea learns from examples to tell patterns apart, as its connections grow stronger or weaker.",
    },
    wiener: {
      by: 'Wiener, 1960',
      summary: 'Wiener argues that machines which learn can develop strategies their makers did not foresee, and act faster than people can step in. If we cannot interfere once a machine is running, he writes, we had better be sure that the purpose we gave it is the one we really want.',
    },
    good: {
      by: 'Good, 1965',
      summary: 'Defines an "ultraintelligent machine" as one that far surpasses people in every intellectual activity. Designing machines is one of those activities, so it could design still better machines, and Good expects an "intelligence explosion". The much-quoted sentence about the last invention comes from here.',
    },
    eliza: {
      by: 'Weizenbaum, 1966',
      summary: 'Weizenbaum explains how his program holds a conversation: it looks for keywords in what the user typed and rearranges the sentence by fixed rules. Its best-known script imitates a psychotherapist. He lays the mechanism open on purpose, so that the impression of understanding disappears.',
    },
    searle: {
      by: 'Searle, 1980',
      summary: 'Introduces the Chinese room: a person who follows rules for Chinese symbols gives the right answers without understanding a word. Searle concludes that running a program is never enough by itself for understanding. The journal printed the paper together with replies from many other researchers and his answers to them.',
    },
    backprop: {
      by: 'Rumelhart, Hinton and Williams, 1986',
      summary: 'Describes a procedure that adjusts the weights of a network again and again, so that its output comes closer to the desired one. In the process the inner layers, which nobody instructs directly, come to represent useful features of the task. Others had found the method earlier; this paper made it known.',
    },
    hawking: {
      by: 'Rory Cellan-Jones, BBC News, 2014',
      summary: 'Asked about his new speech system, which uses a simple form of AI to suggest his next words, Hawking says that such tools have proved very useful. A machine that matched or surpassed people, however, would redesign itself at an ever faster rate, and humans, limited by slow biological evolution, could not compete.',
    },
    alphago: {
      by: 'Silver and others, 2016',
      summary: 'Describes AlphaGo: one neural network proposes moves, a second judges positions, and a search combines the two. The networks learned from games by human experts and from games the program played against itself. The paper reports a 5–0 win over the European champion; the match against Lee Sedol followed in March 2016.',
    },
    gnmt: {
      by: 'Wu and others, 2016',
      summary: 'Describes the neural network behind the renewed Google Translate. It reads a sentence and writes the translation with the help of attention, and it splits rare words into pieces. On simple sentences judged by people it made about 60 percent fewer errors than the phrase-based system before it.',
    },
    bitterLesson: {
      by: 'Sutton, 2019',
      summary: 'A short essay on seventy years of AI research. In chess, Go, speech recognition and computer vision, methods built on human knowledge of the subject helped at first and were then overtaken by general methods, search and learning, that grow with computing power. Sutton calls this the bitter lesson.',
    },
    parrots: {
      by: 'Bender, Gebru and others, 2021',
      summary: 'Asks whether language models can be too big. It lists the costs of ever larger models: the energy they use, training text that is too vast to check and carries prejudices, and readers who take fluent text for understanding. It calls such a model a "stochastic parrot" that stitches word sequences together by probability, without reference to meaning.',
    },
    mcp: {
      by: 'Anthropic, 2024',
      summary: "Anthropic's announcement of 25 November 2024. Until then every data source needed its own custom connection to an AI system; MCP replaces these with a single open protocol. The specification, developer kits and a collection of ready-made servers were released as open source the same day.",
    },
    geminiEnergy: {
      by: 'Elsworth and others, 2025',
      summary: "Google measures the energy, emissions and water used to answer prompts in its own data centres, counting not only the AI chips but also the host machines, idle capacity and data-centre overhead. The median text prompt to Gemini comes to 0.24 watt-hours, less than nine seconds of television. It is the company's own measurement, and it covers answering prompts, not training.",
    },
    gentleSingularity: {
      by: 'Altman, 2025',
      summary: "An essay by OpenAI's chief executive on the years ahead. In a remark in brackets he says that an average ChatGPT query uses about 0.34 watt-hours, about what a high-efficiency light bulb uses in a couple of minutes. The essay does not say how the figure was measured.",
    },
  },
};
