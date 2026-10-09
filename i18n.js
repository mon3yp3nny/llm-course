// Every text the scripts put on the page comes from STRINGS, which the page's
// own language file (i18n/en.js, i18n/de.js or i18n/fr.js) defines just before
// this file loads. The helpers here fill in the blanks and write numbers the
// way that language does. The three language files hold data only, in the same
// shape; tools/check_i18n.py compares them.

const LANG = STRINGS.lang;
const LOCALE = STRINGS.locale;
const PLURAL_RULES = new Intl.PluralRules(LOCALE);
const LIST_FORMAT = new Intl.ListFormat(LOCALE, { type: 'conjunction' });
const NUMBER_FORMATS = new Map();

// The entry at a dotted key such as 'loop.stat'. A missing one shows its key, so it is easy to spot.
function textFor(key) {
  const value = key.split('.').reduce((node, part) => node?.[part], STRINGS);
  return value === undefined ? key : value;
}

function fillIn(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (blank, name) => (name in vars ? vars[name] : blank));
}

// A text with its {blanks} filled in.
function t(key, vars) {
  return fillIn(textFor(key), vars);
}

// The same for an entry with one form per grammatical number ({ one, other }); {n} is the count.
function tn(key, n, vars) {
  const forms = textFor(key);
  return fillIn(forms[PLURAL_RULES.select(n)] ?? forms.other, { n: fmt(n), ...vars });
}

// Like t(), for a text in which a blank is filled with an element: returns the pieces in order.
function tNodes(key, vars = {}) {
  return textFor(key).split(/\{(\w+)\}/).map((piece, i) => (i % 2 ? vars[piece] ?? `{${piece}}` : piece));
}

function numberFormat(digits, style = 'decimal') {
  const name = `${style} ${digits}`;
  if (!NUMBER_FORMATS.has(name)) {
    const fixed = digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits };
    NUMBER_FORMATS.set(name, new Intl.NumberFormat(LOCALE, { style, ...fixed }));
  }
  return NUMBER_FORMATS.get(name);
}

// A number as the language writes it; with `digits`, always that many decimal places.
function fmt(value, digits) {
  return numberFormat(digits).format(value);
}

// A share between 0 and 1 as a percentage. A share too small to round to 1 shows as "<1".
function pct(p, digits = 0) {
  const format = numberFormat(digits, 'percent');
  if (digits === 0 && p > 0 && p < 0.01) return format.format(0.01).replace('1', '<1');
  return format.format(p);
}

// "3 and 7", "3 und 7", "3 et 7".
function listAnd(items) {
  return LIST_FORMAT.format(items.map(String));
}
