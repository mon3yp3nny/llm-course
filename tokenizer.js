// Toy tokenizer: illustrates the idea of subword tokens, not a real BPE.

const VOCAB_SIZE = 50000;
const MIN_STEM = 3;
// Longest first, so "ization" wins over "ion".
const SUFFIXES = [
  'ization', 'ations', 'ation', 'ments', 'ment', 'ness', 'able', 'ible',
  'tion', 'ings', 'ing', 'ers', 'est', 'ful', 'ous', 'ive', 'ly', 'ed', 'er', 's',
];

function splitWord(word) {
  const lower = word.toLowerCase();
  for (const suffix of SUFFIXES) {
    const stemLength = word.length - suffix.length;
    if (lower.endsWith(suffix) && stemLength >= MIN_STEM && word.length > 5) {
      return [word.slice(0, stemLength), word.slice(stemLength)];
    }
  }
  return [word];
}

// Returns token strings that concatenate back to the original text.
function tokenize(text) {
  const pieces = text.match(/\s*(?:\p{L}+|\d+|[^\s\p{L}\d])|\s+/gu) || [];
  const tokens = [];
  for (const piece of pieces) {
    const [, space, body] = piece.match(/^(\s*)(.*)$/su);
    if (/^\p{L}+$/u.test(body)) {
      const [stem, ...rest] = splitWord(body);
      tokens.push(space + stem, ...rest);
    } else {
      tokens.push(piece);
    }
  }
  return tokens;
}

// Stable made-up ID (FNV-1a hash) standing in for a vocabulary lookup.
function tokenId(token) {
  let hash = 0x811c9dc5;
  for (const char of token) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % VOCAB_SIZE;
}
