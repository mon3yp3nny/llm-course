// Search over the whole page: every step, optional section, timeline event,
// quote and glossary entry is one searchable unit. Uses $ and showView from
// app.js and the strings of the page's language.

const SEARCH_UNITS = '.step, .alt-path, details.extra, .event, figure.quote, .glossary dl > div';
// Parts of a unit that are not its text: demos, labels and the listening-only paragraphs.
const SEARCH_IGNORED = '.demo, .step-no, .spoken, .listen, .event-year, .event-kind, .extra-tag, script';
const MAX_RESULTS = 40;
const SNIPPET_BEFORE = 50;
const SNIPPET_LENGTH = 150;

const search = { index: null };

const tidy = (text) => text.replace(/\s+/g, ' ').trim();

// Letters that are written as two when the accent or ligature is left out.
const FOLDED_LETTERS = { 'ß': 'ss', 'œ': 'oe', 'æ': 'ae', '’': "'" };

// One character as a search compares it: lower case and without accents, so
// "qualite" finds "qualité" and "grosse" finds "Größe".
function foldCharacter(character) {
  const plain = character.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  return FOLDED_LETTERS[plain] ?? plain;
}

// A text folded for comparing, and for each folded character where it came from in the original.
function fold(text) {
  let folded = '';
  const origin = [];
  let at = 0;
  for (const character of text) {
    const plain = foldCharacter(character);
    folded += plain;
    for (let i = 0; i < plain.length; i++) origin.push(at);
    at += character.length;
  }
  origin.push(at);
  return { folded, origin };
}

// The words to look for: folded, without the small words of the language and
// without a plural or case ending, so "tokens" also finds "token". An apostrophe
// separates words, as in the French "l'attention".
function searchWords(query) {
  const words = fold(query).folded.split(/[\s']+/)
    // Punctuation around a word, such as a question mark, is not searched for.
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean);
  const stopWords = new Set(STRINGS.search.stopWords.map((word) => fold(word).folded));
  const telling = words.filter((word) => !stopWords.has(word));
  return (telling.length ? telling : words).map((word) => {
    const ending = STRINGS.search.endings.find((end) => word.endsWith(end) && word.length - end.length >= 4);
    return ending ? word.slice(0, -ending.length) : word;
  });
}

// Where a unit lives, as shown beside a result: its tab, or the glossary.
function searchPlace(el) {
  if (el.closest('.glossary')) return t('glossary');
  const view = el.closest('.view');
  const tab = view && document.querySelector(`.tabs a[href="#${view.id}"]`);
  const place = tab ? tab.textContent : '';
  if (el.matches('.event')) return t('search.placeEvent', { place, year: el.dataset.year });
  if (el.matches('details.faq')) return place;
  if (el.matches('details.extra')) return t('search.placeOptional', { place });
  return place;
}

function buildSearchIndex() {
  return [...document.querySelectorAll(SEARCH_UNITS)].map((el) => {
    // A unit's text is its own: units nested inside it are found separately.
    const copy = el.cloneNode(true);
    copy.querySelectorAll(`${SEARCH_UNITS}, ${SEARCH_IGNORED}, dd a`).forEach((part) => part.remove());
    // Table cells and list items carry no spaces between them; keep their words apart.
    copy.querySelectorAll('td, th, li, li > span, p, dt, dd, h3, summary').forEach((part) => part.append(' '));
    const heading = copy.querySelector('h2, h3, summary, dt, figcaption strong');
    const title = tidy(heading?.textContent ?? '');
    heading?.remove();
    const text = tidy(copy.textContent);
    return { el, title, text, place: searchPlace(el), titleLower: fold(title).folded, textLower: fold(text).folded };
  }).filter((unit) => unit.title);
}

// Every word of the query must occur; a match in the title counts for more.
function findUnits(words) {
  if (!words.length) return [];
  const found = [];
  for (const unit of search.index) {
    let score = 0;
    for (const word of words) {
      const inTitle = unit.titleLower.includes(word);
      if (!inTitle && !unit.textLower.includes(word)) { score = 0; break; }
      score += inTitle ? 10 : 1;
      if (unit.titleLower === word) score += 20;
    }
    // The words in the order they were typed count for most.
    if (score && words.length > 1) {
      const phrase = words.join(' ');
      if (unit.titleLower.includes(phrase)) score += 30;
      else if (unit.textLower.includes(phrase)) score += 15;
    }
    if (score) found.push({ unit, score });
  }
  // Equal scores keep the order of the page.
  return found.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS).map(({ unit }) => unit);
}

// Text with the searched words marked. They are found in the folded text and
// marked in the original, so an accented word is marked as it is written.
function markWords(text, words) {
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const { folded, origin } = fold(text);
  const parts = [];
  let end = 0;
  for (const match of folded.matchAll(new RegExp(escaped.join('|'), 'g'))) {
    const from = origin[match.index];
    const to = origin[match.index + match[0].length];
    if (from < end || to === from) continue;
    const mark = document.createElement('mark');
    mark.textContent = text.slice(from, to);
    parts.push(text.slice(end, from), mark);
    end = to;
  }
  return [...parts, text.slice(end)];
}

// The stretch of a unit's text around the first searched word.
function snippet(unit, words) {
  const positions = words.map((word) => unit.textLower.indexOf(word)).filter((at) => at >= 0);
  let start = Math.max(0, (positions.length ? Math.min(...positions) : 0) - SNIPPET_BEFORE);
  let end = Math.min(unit.text.length, start + SNIPPET_LENGTH);
  // Begin and end between words, not inside one.
  if (start > 0) start = unit.text.indexOf(' ', start) + 1;
  if (end < unit.text.length) end = unit.text.lastIndexOf(' ', end);
  return (start > 0 ? '… ' : '') + unit.text.slice(start, end) + (end < unit.text.length ? ' …' : '');
}

function renderSearchResults() {
  const query = $('search-input').value.trim();
  const words = searchWords(query);
  const units = findUnits(words);
  $('search-results').replaceChildren(...units.map((unit) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    const place = document.createElement('span');
    place.className = 'search-place';
    place.textContent = unit.place;
    const title = document.createElement('strong');
    title.append(...markWords(unit.title, words));
    const text = document.createElement('span');
    text.className = 'search-text';
    text.append(...markWords(snippet(unit, words), words));
    button.append(place, title, text);
    button.addEventListener('click', () => goToUnit(unit.el));
    item.append(button);
    return item;
  }));
  let status = t('search.hint');
  if (query && !units.length) status = t('search.nothing');
  else if (units.length === MAX_RESULTS) status = t('search.resultsOrMore', { n: units.length });
  else if (query) status = tn('search.results', units.length);
  $('search-status').textContent = status;
}

// Shows a found unit: switches to its tab, unfolds what hides it and scrolls there.
function goToUnit(el) {
  $('search').close();
  const view = el.closest('.view');
  if (view?.hidden) {
    showView(view.id);
    // Keep the address in step, so reload, back and a copied link show this tab.
    try { history.replaceState(null, '', `#${view.id}`); } catch { /* refused for local files */ }
  }
  for (let fold = el.closest('details'); fold; fold = fold.parentElement.closest('details')) fold.open = true;
  el.scrollIntoView({ block: el.matches('.step, .alt-path') ? 'start' : 'center' });
  // Reading and tabbing go on from the place that was found, not from the search button.
  const stop = el.matches('details') ? el.querySelector('summary') : el;
  if (stop.tagName !== 'SUMMARY' && !stop.hasAttribute('tabindex')) stop.tabIndex = -1;
  stop.focus({ preventScroll: true });
  el.classList.add('search-hit');
  setTimeout(() => el.classList.remove('search-hit'), 2500);
}

function openSearch() {
  search.index ??= buildSearchIndex();
  $('search').showModal();
  $('search-input').select();
  renderSearchResults();
}

$('search-open').addEventListener('click', openSearch);
$('search-close').addEventListener('click', () => $('search').close());
$('search-input').addEventListener('input', renderSearchResults);
$('search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  $('search-results').querySelector('button')?.click();
});
// A click on the dimmed page around the box closes it.
$('search').addEventListener('click', (event) => {
  if (event.target === $('search')) $('search').close();
});
// The arrow keys walk through the results.
$('search').addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  const stops = [$('search-input'), ...$('search-results').querySelectorAll('button')];
  const next = stops.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : -1);
  if (next < 0 || next >= stops.length) return;
  event.preventDefault();
  stops[next].focus();
});
// "/" opens the search, as on many sites, unless you are typing somewhere.
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || $('search').open) return;
  if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
  event.preventDefault();
  openSearch();
});
