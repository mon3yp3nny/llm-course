// Search over the whole page: every step, optional section, timeline event,
// quote and glossary entry is one searchable unit. Uses $ and showView from app.js.

const SEARCH_UNITS = '.step, .alt-path, details.extra, .event, figure.quote, .glossary dl > div';
// Parts of a unit that are not its text: demos, labels and the listening-only paragraphs.
const SEARCH_IGNORED = '.demo, .step-no, .spoken, .listen, .event-year, .event-kind, .extra-tag, script';
const MAX_RESULTS = 40;
const SNIPPET_BEFORE = 50;
const SNIPPET_LENGTH = 150;

const search = { index: null };

const tidy = (text) => text.replace(/\s+/g, ' ').trim();

// Where a unit lives, as shown beside a result: its tab, or the glossary.
function searchPlace(el) {
  if (el.closest('.glossary')) return 'Glossary';
  const view = el.closest('.view');
  const tab = view && document.querySelector(`.tabs a[href="#${view.id}"]`);
  const place = tab ? tab.textContent : '';
  if (el.matches('.event')) return `${place} · ${el.dataset.year}`;
  if (el.matches('details.faq')) return place;
  if (el.matches('details.extra')) return `${place} · optional`;
  return place;
}

function buildSearchIndex() {
  return [...document.querySelectorAll(SEARCH_UNITS)].map((el) => {
    // A unit's text is its own: units nested inside it are found separately.
    const copy = el.cloneNode(true);
    copy.querySelectorAll(`${SEARCH_UNITS}, ${SEARCH_IGNORED}, dd a`).forEach((part) => part.remove());
    // Table cells and list items carry no spaces between them; keep their words apart.
    copy.querySelectorAll('td, th, li, p, dt, dd, h3, summary').forEach((part) => part.append(' '));
    const heading = copy.querySelector('h2, h3, summary, dt, figcaption strong');
    const title = tidy(heading?.textContent ?? '');
    heading?.remove();
    const text = tidy(copy.textContent);
    return { el, title, text, place: searchPlace(el), titleLower: title.toLowerCase(), textLower: text.toLowerCase() };
  }).filter((unit) => unit.title);
}

// Every word of the query must occur; a match in the title counts for more.
function findUnits(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
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

// Text with the searched words marked.
function markWords(text, words) {
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((part, i) => {
    if (i % 2 === 0) return part;
    const mark = document.createElement('mark');
    mark.textContent = part;
    return mark;
  });
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
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const units = findUnits(query);
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
  let status = 'Type a word, for example "token", "MCP" or "AlphaFold".';
  if (query) status = units.length ? `${units.length}${units.length === MAX_RESULTS ? ' or more' : ''} places` : 'Nothing found.';
  $('search-status').textContent = status;
}

// Shows a found unit: switches to its tab, unfolds what hides it and scrolls there.
function goToUnit(el) {
  $('search').close();
  const view = el.closest('.view');
  if (view?.hidden) showView(view.id);
  for (let fold = el.closest('details'); fold; fold = fold.parentElement.closest('details')) fold.open = true;
  el.scrollIntoView({ block: el.matches('.step, .alt-path') ? 'start' : 'center' });
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
