// Timeline tab: the year in the bar follows the event in the middle of the
// screen, and the buttons filter by kind. Uses $ from app.js.

const TIME_KINDS = [
  { label: 'Everything', value: 'all' },
  { label: 'Thoughts', value: 'thought' },
  { label: 'Inventions', value: 'invention' },
  { label: 'Releases', value: 'release' },
];

const timeline = { kind: 'all', events: [...document.querySelectorAll('#view-timeline .event')] };

function renderTimeFilter() {
  $('time-filter').replaceChildren(...TIME_KINDS.map(({ label, value }) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.value = value;
    el.textContent = label;
    el.classList.toggle('selected', value === timeline.kind);
    el.setAttribute('aria-pressed', value === timeline.kind);
    return el;
  }));
  for (const event of timeline.events) {
    event.hidden = timeline.kind !== 'all' && event.dataset.kind !== timeline.kind;
  }
}

// Marks one event as the present moment and moves the bar to its year.
function setCurrentEvent(current) {
  for (const event of timeline.events) event.classList.toggle('now', event === current);
  $('time-year').textContent = current.dataset.year;
  const shown = timeline.events.filter((event) => !event.hidden);
  const position = shown.indexOf(current) / Math.max(shown.length - 1, 1);
  $('time-progress').style.width = `${Math.max(position, 0) * 100}%`;
}

// An event becomes the present when it crosses a band just above the middle of the screen.
const currentEventObserver = new IntersectionObserver((entries) => {
  const crossing = entries.filter((entry) => entry.isIntersecting);
  if (crossing.length) setCurrentEvent(crossing[crossing.length - 1].target);
}, { rootMargin: '-40% 0px -55% 0px' });

// Events fade in as they are scrolled into view.
const eventRevealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) entry.target.classList.add('seen');
  }
}, { rootMargin: '0px 0px -10% 0px' });

for (const event of timeline.events) {
  currentEventObserver.observe(event);
  eventRevealObserver.observe(event);
}

$('time-filter').addEventListener('click', (event) => {
  const value = event.target.closest('button')?.dataset.value;
  if (value === undefined) return;
  timeline.kind = value;
  renderTimeFilter();
  const first = timeline.events.find((item) => !item.hidden);
  if (first) setCurrentEvent(first);
});

renderTimeFilter();
setCurrentEvent(timeline.events[0]);
