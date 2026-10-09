// Toy model: every piece shows a real mechanism with small or made-up numbers.
// Depends on tokenize() and tokenId() from tokenizer.js.

const VECTOR_SIZE = 8;
const LAYER_COUNT = 12;
// How much of a vector one layer replaces.
const LAYER_CHANGE = 0.25;
const EXPERT_COUNT = 8;
const ACTIVE_EXPERTS = 2;
const ROUTER_SHARPNESS = 3;
const EXAMPLE_PARAMETERS = 7e9;
const TRAINING_STEP = 0.06;
// The classifier's answers, named by the word-map group each one counts.
const TOPICS = ['animals', 'home', 'food', 'language'];
const TOPIC_SHARPNESS = 1.2;
const ATTENTION_SHARPNESS = 1.5;
// How much the last two tokens, the last token, and plain frequency each count.
const MIX = { tri: 0.6, bi: 0.3, uni: 0.1 };

// Hand-placed for illustration: related words sit close together. Each word
// is [word, x, y, edible]; the last value (0 to 1) is the third direction of
// the 3D view, roughly "can you eat it?". The words stay English in every
// language, like the sentences the toy model has read; a group's visible name
// comes from the strings file.
const WORD_MAP = [
  { group: 'animals', x: 120, y: 30, words: [['cat', 95, 70, 0], ['dog', 150, 95, 0], ['mouse', 80, 120, 0.2], ['bird', 175, 55, 0.3], ['fish', 140, 140, 0.85]] },
  { group: 'home', x: 465, y: 30, words: [['house', 430, 65, 0], ['garden', 500, 95, 0.15], ['kitchen', 420, 115, 0.5], ['mat', 510, 55, 0], ['sofa', 480, 140, 0]] },
  { group: 'language', x: 305, y: 135, words: [['word', 270, 165, 0], ['token', 335, 160, 0], ['sentence', 262, 205, 0], ['model', 388, 190, 0]] },
  { group: 'food', x: 125, y: 225, words: [['milk', 90, 260, 1], ['bread', 155, 285, 1], ['cheese', 100, 310, 1], ['water', 180, 250, 0.9]] },
  { group: 'actions', x: 440, y: 225, words: [['sat', 410, 260, 0], ['slept', 480, 270, 0], ['ran', 430, 305, 0], ['walk', 505, 310, 0], ['ate', 370, 290, 0.7]] },
];

// Hand-written attention weights for an example sentence. Row i says how much
// token i draws from tokens 0 to i; each row adds up to 1.
const ATTENTION_EXAMPLE = {
  tokens: ['The', ' cat', ' sat', ' on', ' the', ' mat', ' because', ' it', ' was', ' tired', '.'],
  weights: [
    [1],
    [0.35, 0.65],
    [0.05, 0.6, 0.35],
    [0.03, 0.12, 0.55, 0.3],
    [0.05, 0.1, 0.15, 0.4, 0.3],
    [0.02, 0.1, 0.3, 0.3, 0.13, 0.15],
    [0.02, 0.2, 0.4, 0.05, 0.03, 0.15, 0.15],
    [0.03, 0.62, 0.08, 0.02, 0.02, 0.12, 0.04, 0.07],
    [0.02, 0.25, 0.05, 0.01, 0.01, 0.04, 0.1, 0.42, 0.1],
    [0.01, 0.4, 0.06, 0.01, 0.01, 0.03, 0.08, 0.25, 0.1, 0.05],
    [0.02, 0.1, 0.2, 0.02, 0.02, 0.08, 0.1, 0.06, 0.1, 0.2, 0.1],
  ],
};

// A tiny picture for the image-patch demo: x is dark, o is coloured, . is empty.
const PATCH_SIZE = 4;
const PATCH_IMAGE = [
  'x..........x',
  'xx........xx',
  'xxx......xxx',
  'xxxxxxxxxxxx',
  'xxxxxxxxxxxx',
  'xxoxxxxxxoxx',
  'xxoxxxxxxoxx',
  'xxxxxxxxxxxx',
  'xxxxx..xxxxx',
  'xxxx.xx.xxxx',
  '.xxxxxxxxxx.',
  '..xxxxxxxx..',
];

const CORPUS_SENTENCES = [
  'The cat sat on the mat.', 'The cat sat on the sofa.', 'The cat slept on the mat.',
  'The cat slept in the garden.', 'The cat ate the fish.', 'The cat drank the milk.',
  'The cat ran to the kitchen.', 'The cat saw a mouse.', 'The cat chased the mouse.',
  'The mouse ran under the sofa.', 'The mouse ate the cheese.', 'The dog sat on the mat.',
  'The dog ran in the garden.', 'The dog chased the bird.', 'The dog slept in the house.',
  'The dog ate the bread.', 'The bird sat in the garden.', 'The bird saw the cat.',
  'A bird sang in the garden.', 'A cat is a small animal.', 'A dog is a good friend.',
  'A mouse is a small animal.', 'The house has a small kitchen.', 'The house has a big garden.',
  'The kitchen was warm and quiet.', 'The garden was big and green.', 'The mat was soft and warm.',
  'She gave the cat some milk.', 'She gave the dog some bread.', 'She sat on the sofa with the cat.',
  'He walked the dog in the garden.', 'He sat in the kitchen and ate bread.',
  'They walked to the house.', 'They sat in the garden and talked.',
  'The cat was wondering about the mouse.', 'The dog was wondering about the bird.',
  'She was wondering about the model.', 'He was thinking about the words.',
  'A model reads text one token at a time.', 'A model predicts the next token.',
  'The model predicts the next word.', 'The model reads the words.',
  'The model picks one token and starts again.', 'A token is a small piece of text.',
  'A word can be one token or many.', 'Every token becomes a number.',
  'Every number becomes a vector.', 'The words become tokens.', 'The tokens become numbers.',
  'The text is cut into tokens.', 'The answer is written one token at a time.',
  'The sentence was short and clear.', 'The next word was a surprise.',
  'It was a warm day.', 'It was a quiet night.', 'It sat on the mat and slept.',
  'It ran to the garden.', 'Then the cat slept.', 'Then the dog ran to the house.',
  'Then the model picked the next token.', 'Then she walked to the kitchen.',
  'And the cat sat on the mat again.', 'And the mouse ran away.',
];
const CORPUS = CORPUS_SENTENCES.join(' ');

function normalize(token) {
  return token.trim().toLowerCase();
}

// Small seeded random generator (mulberry32), so the same token always gets the same numbers.
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Made-up vector with values between -1 and 1.
function tokenVector(token, salt = '') {
  const random = seededRandom(tokenId(token + salt));
  return Array.from({ length: VECTOR_SIZE }, () => random() * 2 - 1);
}

// Made-up vector of the token at `index` after `layer` layers. Each layer
// shifts it a little, depending on the token and everything before it.
function layerVector(tokens, index, layer) {
  const context = tokens.slice(0, index + 1).join('');
  let vector = tokenVector(tokens[index]);
  for (let n = 1; n <= layer; n++) {
    const change = tokenVector(context, `layer${n}`);
    vector = vector.map((value, i) => (1 - LAYER_CHANGE) * value + LAYER_CHANGE * change[i]);
  }
  return vector;
}

// Rounds a value between -1 and 1 to the nearest of 2^bits evenly spaced values.
function quantize(value, bits) {
  const step = 2 / (2 ** bits - 1);
  return Math.round((value + 1) / step) * step - 1;
}

// Made-up effect of a few training steps on a row of weights.
function trainedWeights(weights, steps) {
  const direction = tokenVector('training direction');
  return weights.map((weight, i) => Math.max(-1, Math.min(1, weight + steps * TRAINING_STEP * direction[i])));
}

function modelSizeGb(bits) {
  return (EXAMPLE_PARAMETERS * bits) / 8 / 1e9;
}

// Made-up router: a share for each expert, adding up to 1.
function expertScores(token) {
  const random = seededRandom(tokenId(token + 'router'));
  return softmax(Array.from({ length: EXPERT_COUNT }, () => random() * ROUTER_SHARPNESS));
}

function softmax(scores) {
  const max = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((value) => value / sum);
}

// How much the token at `index` draws from itself and each earlier token.
function attentionWeights(tokens, index) {
  const query = tokenVector(tokens[index], 'query');
  const scores = tokens.slice(0, index + 1).map((token) => {
    const key = tokenVector(token, 'key');
    return ATTENTION_SHARPNESS * query.reduce((sum, q, i) => sum + q * key[i], 0);
  });
  return softmax(scores);
}

// Tiny classifier: a probability per topic, from how many tokens belong to its word group.
function topicProbs(tokens) {
  const words = tokens.map(normalize);
  const scores = TOPICS.map((topic) => {
    const known = WORD_MAP.find(({ group }) => group === topic).words.map(([word]) => word);
    return TOPIC_SHARPNESS * words.filter((word) => known.includes(word)).length;
  });
  return softmax(scores).map((p, i) => ({ choice: TOPICS[i], p }));
}

// Tiny retrieval: scores each library text by the distinct words it shares with the query.
// English in every language, like the prompt it is matched against.
const LIBRARY = [
  'Cats sleep 12 to 16 hours a day.',
  'Most adult cats cannot digest milk well.',
  'Dogs were domesticated from wolves more than 15,000 years ago.',
  'A token is about three quarters of an English word on average.',
  'The transformer design was introduced in 2017.',
];
const LIBRARY_MARKER = 'Use this information to answer:';
const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'is', 'are', 'was', 'were', 'and', 'from', 'about', 'what', 'how', 'do', 'doe', 'it']);

function contentWords(text) {
  const words = (text.toLowerCase().match(/\p{L}+/gu) || []).map((word) => word.replace(/s$/, ''));
  return new Set(words.filter((word) => !STOPWORDS.has(word)));
}

function searchLibrary(query) {
  const wanted = contentWords(query);
  return LIBRARY.map((text) => ({
    text,
    score: [...contentWords(text)].filter((word) => wanted.has(word)).length,
  }));
}

// A miniature network for the drawing in step 5: the vector goes in, passes two
// rows of neurons, and comes out again. The weights are made up; the sums are real.
const NETWORK_SIZES = [VECTOR_SIZE, 6, 6, VECTOR_SIZE];
// One table per pair of neighbouring layers: weights[layer][to][from].
const NETWORK_WEIGHTS = NETWORK_SIZES.slice(1).map((size, layer) => {
  const random = seededRandom(tokenId(`network layer ${layer}`));
  return Array.from({ length: size }, () => (
    Array.from({ length: NETWORK_SIZES[layer] }, () => random() * 2 - 1)
  ));
});

// Each neuron's weighted sum of its inputs, and the squashed value it passes on, layer by layer.
function runNetwork(input) {
  const layers = [{ sums: input, values: input }];
  for (const table of NETWORK_WEIGHTS) {
    const previous = layers[layers.length - 1].values;
    const sums = table.map((row) => row.reduce((sum, weight, i) => sum + weight * previous[i], 0));
    layers.push({ sums, values: sums.map(Math.tanh) });
  }
  return layers;
}

// Count which token follows which in a text (by default the whole corpus).
function buildCounts(text = CORPUS) {
  const counts = { uni: new Map(), bi: new Map(), tri: new Map() };
  const add = (map, key, token) => {
    if (!map.has(key)) map.set(key, new Map());
    const row = map.get(key);
    row.set(token, (row.get(token) || 0) + 1);
  };
  const tokens = text ? tokenize(' ' + text) : [];
  tokens.forEach((token, i) => {
    counts.uni.set(token, (counts.uni.get(token) || 0) + 1);
    if (i >= 1) add(counts.bi, normalize(tokens[i - 1]), token);
    if (i >= 2) add(counts.tri, normalize(tokens[i - 2]) + '\n' + normalize(tokens[i - 1]), token);
  });
  return counts;
}

const COUNTS = buildCounts();

// Probability of every known token coming next, most likely first.
function nextTokenProbs(tokens, counts = COUNTS) {
  const context = tokens.map(normalize).filter(Boolean);
  if (context.length === 0) context.push('.');
  const last = context[context.length - 1];
  const sources = [
    [MIX.tri, counts.tri.get(context[context.length - 2] + '\n' + last)],
    [MIX.bi, counts.bi.get(last)],
    [MIX.uni, counts.uni],
  ].filter(([, row]) => row);
  const totalWeight = sources.reduce((sum, [weight]) => sum + weight, 0);

  const probs = new Map();
  for (const [weight, row] of sources) {
    let rowTotal = 0;
    for (const count of row.values()) rowTotal += count;
    for (const [token, count] of row) {
      probs.set(token, (probs.get(token) || 0) + (weight / totalWeight) * (count / rowTotal));
    }
  }
  return [...probs].map(([token, p]) => ({ token, p })).sort((a, b) => b.p - a.p);
}

// Training demos

const TEST_SENTENCES = ['The cat sat on the mat.', 'The dog ran in the garden.', 'A model predicts the next token.'];
// Built from words the model knows, in combinations it has never read.
const UNSEEN_SENTENCES = ['The bird slept on the sofa.', 'She gave the mouse some cheese.', 'A token becomes a vector.'];
// Stands in for "never seen": keeps the loss finite for tokens the model gives no chance.
const UNKNOWN_PROBABILITY = 0.001;
const DESCENT_TARGET = 0.7;

// The counting model as it stands after reading only the first sentences of the corpus.
function countsAfterReading(sentenceCount) {
  return buildCounts(CORPUS_SENTENCES.slice(0, sentenceCount).join(' '));
}

// The loss: how surprised the model is, on average, by each next token of the
// given sentences (in bits; lower is better).
function lossAfterReading(counts, sentences = TEST_SENTENCES) {
  let total = 0;
  let guesses = 0;
  for (const sentence of sentences) {
    const tokens = tokenize(' ' + sentence);
    tokens.forEach((token, i) => {
      const guess = nextTokenProbs(tokens.slice(0, i), counts).find((entry) => entry.token === token);
      total -= Math.log2(Math.max(guess ? guess.p : 0, UNKNOWN_PROBABILITY));
      guesses += 1;
    });
  }
  return total / guesses;
}

// A model with a single weight: the loss is lowest when the weight hits the target.
function lossOfWeight(weight) {
  return (weight - DESCENT_TARGET) ** 2;
}

// One step of gradient descent: move against the slope of the loss.
function descentStep(weight, rate) {
  const slope = 2 * (weight - DESCENT_TARGET);
  return weight - rate * slope;
}

// Low temperature sharpens the distribution, high temperature flattens it.
function applyTemperature(probs, temperature) {
  if (temperature === 0) return probs.map((entry, i) => ({ ...entry, p: i === 0 ? 1 : 0 }));
  const powered = probs.map((entry) => Math.pow(entry.p, 1 / temperature));
  const sum = powered.reduce((a, b) => a + b, 0);
  return probs.map((entry, i) => ({ ...entry, p: powered[i] / sum }));
}

function sampleToken(probs) {
  let remaining = Math.random();
  for (const entry of probs) {
    remaining -= entry.p;
    if (remaining <= 0) return entry.token;
  }
  return probs[0].token;
}
