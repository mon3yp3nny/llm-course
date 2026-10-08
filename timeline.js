// Timeline tab: the year in the bar follows the event in the middle of the
// screen, and the line of time is coloured up to that event. Uses $ from app.js.

// How far below an event's top edge its dot sits, so the coloured line ends on the dot.
const EVENT_DOT_OFFSET = 13;

const timeline = {
  events: [...document.querySelectorAll('#view-timeline .event')],
  eras: [...document.querySelectorAll('#view-timeline .era')],
};

// Marks one event as the present moment: the bar shows its year and era, and
// everything before it counts as passed.
function setCurrentEvent(current) {
  const position = timeline.events.indexOf(current);
  timeline.events.forEach((event, i) => {
    event.classList.toggle('now', i === position);
    event.classList.toggle('passed', i < position);
  });

  const currentEra = current.closest('.era');
  const eraPosition = timeline.eras.indexOf(currentEra);
  timeline.eras.forEach((era, i) => {
    era.classList.toggle('reached', i <= eraPosition);
    // Earlier eras are coloured in full, the current one down to the current event.
    let passed = '0px';
    if (i < eraPosition) passed = '100%';
    if (i === eraPosition) passed = `${current.offsetTop + EVENT_DOT_OFFSET}px`;
    era.style.setProperty('--passed', passed);
  });

  $('time-year').textContent = current.dataset.year;
  $('time-era').textContent = currentEra.dataset.title;
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

setCurrentEvent(timeline.events[0]);
