import { ageToMonths, ageGroup } from './parse-caption.js';

const APPLY_URL = 'https://labellefoundation.org/adopt/';
const NEW_DAYS = 7;
const DAY = 86400000;

const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paragraphs = (text) =>
  text.split(/\n{2,}|\n/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');

let dogs = [];

// Puppies age fast: "7 weeks" in a post from a month ago is ~11 weeks today.
function currentAge(dog) {
  const months = ageToMonths(dog.age);
  if (months == null || !dog.postedAt) return { months, label: null };
  const elapsed = (Date.now() - new Date(dog.postedAt)) / (30.44 * DAY);
  const now = months + elapsed;
  if (months >= 12 || elapsed < 0.5) return { months: now, label: null };
  const label = now < 4 ? `about ${Math.round(now * 4.345)} weeks now` : `about ${Math.round(now)} months now`;
  return { months: now, label };
}

const isNew = (dog) => Date.now() - new Date(dog.postedAt) < NEW_DAYS * DAY;
const meta = (dog) => [dog.sex, dog.age, dog.sizeGroup && `${dog.sizeGroup} (grown)`].filter(Boolean).join(' · ');

function badges(dog) {
  const out = [];
  if (dog.status === 'adopted') out.push('<span class="badge adopted">Adopted</span>');
  else {
    if (dog.status === 'pending') out.push('<span class="badge pending">Adoption pending</span>');
    if (dog.needsFoster) out.push('<span class="badge foster">Foster needed</span>');
    if (isNew(dog)) out.push('<span class="badge new">New</span>');
  }
  return out.length ? `<div class="badges">${out.join('')}</div>` : '';
}

const CAMERA =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9Zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>';

function photo(dog) {
  const src = dog.images[0];
  if (!src) return '';
  const n = dog.images.length;
  return `<img src="${esc(src)}" alt="${esc(dog.name)}, ${esc(dog.breed || 'rescue dog')}" loading="lazy">` +
    (n > 1 ? `<span class="photo-count" aria-label="${n} photos">${CAMERA}${n}</span>` : '');
}

function card(dog) {
  return `
    <a class="card" href="#/dog/${esc(dog.slug)}">
      <div class="card-photo">${photo(dog)}${badges(dog)}</div>
      <div class="card-body">
        <h3 class="card-name">${esc(dog.name)}</h3>
        <p class="card-meta">${esc(meta(dog))}</p>
        ${dog.breed ? `<p class="card-breed">${esc(dog.breed)}</p>` : ''}
      </div>
    </a>`;
}

function filtered() {
  const q = $('#q').value.trim().toLowerCase();
  const age = $('#age').value;
  const size = $('#size').value;
  const sex = $('#sex').value;
  return dogs.filter((d) => {
    if (d.status === 'adopted') return false;
    if (age && ageGroup(currentAge(d).months) !== age) return false;
    if (size && d.sizeGroup !== size) return false;
    if (sex && d.sex !== sex) return false;
    if (q) {
      const hay = [d.name, d.breed, d.vibe, d.intro, d.fosterNote, d.idealHome].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderList() {
  const list = filtered();
  const total = dogs.filter((d) => d.status !== 'adopted').length;
  $('#count').textContent = list.length === total ? `${total} dogs` : `${list.length} of ${total} dogs`;
  $('#grid').innerHTML = list.length
    ? list.map(card).join('')
    : `<div class="empty" style="grid-column:1/-1">No dogs match those filters right now.<br>
         <button class="btn btn-ghost btn-small" id="clear">Clear filters</button></div>`;
  $('#clear')?.addEventListener('click', () => {
    $('#filters').reset();
    renderList();
  });

  const adopted = dogs.filter((d) => d.status === 'adopted');
  $('#happy-tails').hidden = !adopted.length;
  $('#adopted-grid').innerHTML = adopted.map(card).join('');
}

function section(title, body, cls = '') {
  if (!body) return '';
  return `<div class="section ${cls}"><h2>${esc(title)}</h2>${paragraphs(body)}</div>`;
}

function renderDetail(dog) {
  const age = currentAge(dog);
  const facts = [
    ['Gender', dog.sex],
    ['Age', dog.age, age.label],
    ['Breed / Mix', dog.breed],
    ['Size (grown)', dog.size],
    ['Weight', dog.weight],
    ['Good with', dog.goodWith],
    ...Object.entries(dog.extraFacts || {}),
  ].filter(([, v]) => v);

  const adopted = dog.status === 'adopted';
  $('#detail').innerHTML = `
    <a class="back" href="#/">← All dogs</a>
    <div class="detail-grid">
      ${carousel(dog)}
      <article>
        <h1>${esc(dog.name)}</h1>
        ${dog.vibe ? `<p class="card-meta">${esc(dog.vibe)}</p>` : ''}
        ${dog.intro ? `<p class="intro">${esc(dog.intro)}</p>` : ''}
        ${adopted ? `<div class="adopted-note">🎉 ${esc(dog.name)} found a forever home! Check out our other adoptable dogs.</div>` : ''}
        <dl class="facts">
          ${facts.map(([k, v, note]) => `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}${note ? `<small>${esc(note)}</small>` : ''}</dd></div>`).join('')}
        </dl>
        <div class="actions">
          ${adopted ? '' : `<a class="btn btn-primary" href="${APPLY_URL}" target="_blank" rel="noopener">Apply to adopt ${esc(dog.name)}</a>`}
          ${dog.needsFoster && !adopted ? `<a class="btn btn-ghost" href="https://www.labellefoundation.org/fosterapp" target="_blank" rel="noopener">Apply to foster</a>` : ''}
          <a class="btn btn-ghost" href="${esc(dog.permalink)}" target="_blank" rel="noopener">View on Instagram</a>
        </div>
        ${section("Foster's note", dog.fosterNote, 'foster-note')}
        ${section('Ideal home', dog.idealHome)}
        ${section('Rescue story', dog.rescueStory)}
        ${section('Medical', dog.medical)}
        ${(dog.otherSections || []).map((s) => section(s.title, s.body)).join('')}
      </article>
    </div>`;

  setupCarousel($('#detail .gallery'));
}

function carousel(dog) {
  const n = dog.images.length;
  const alt = (i) => `${dog.name}, photo ${i + 1} of ${n}`;
  const slides = n
    ? dog.images.map((src, i) =>
        `<div class="slide" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}">
           <img src="${esc(src)}" alt="${esc(alt(i))}"${i ? ' loading="lazy"' : ''} draggable="false">
         </div>`).join('')
    : '<div class="slide"></div>';
  const multi = n > 1;
  return `
    <div class="gallery" aria-roledescription="carousel" aria-label="Photos of ${esc(dog.name)}">
      <div class="gallery-main">
        <div class="track" tabindex="0">${slides}</div>
        ${badges(dog)}
        ${multi ? `
          <button type="button" class="nav-btn prev" aria-label="Previous photo" disabled>‹</button>
          <button type="button" class="nav-btn next" aria-label="Next photo">›</button>
          <span class="counter" aria-live="polite">1 / ${n}</span>` : ''}
      </div>
      ${multi ? `<div class="thumbs">${dog.images.map((src, i) =>
        `<button type="button" data-i="${i}" aria-current="${i === 0}" aria-label="Show photo ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    </div>`;
}

// Native horizontal scroll-snap does the swiping; buttons, thumbs and arrow keys just scroll the track.
let carouselResize;
function setupCarousel(root) {
  carouselResize?.disconnect();
  const track = root.querySelector('.track');
  const slides = track.children;
  if (slides.length < 2) return;
  const prev = root.querySelector('.prev');
  const next = root.querySelector('.next');
  const counter = root.querySelector('.counter');
  const thumbs = [...root.querySelectorAll('.thumbs button')];
  let index = 0;

  const go = (i) => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  const update = () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i === index) return;
    index = i;
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    counter.textContent = `${i + 1} / ${slides.length}`;
    thumbs.forEach((b, j) => b.setAttribute('aria-current', j === i));
    thumbs[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };

  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  thumbs.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.i))));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });
  // Keep the current photo in place if the window is resized.
  carouselResize = new ResizeObserver(() => { track.scrollLeft = index * track.clientWidth; });
  carouselResize.observe(track);
}

function route() {
  const m = /^#\/dog\/(.+)$/.exec(location.hash);
  const dog = m && dogs.find((d) => d.slug === decodeURIComponent(m[1]));
  $('#list-view').hidden = !!dog;
  $('#detail-view').hidden = !dog;
  if (dog) {
    renderDetail(dog);
    document.title = `${dog.name} | Adopt from The Labelle Foundation`;
    window.scrollTo(0, 0);
  } else {
    document.title = 'Adoptable Dogs | The Labelle Foundation';
  }
}

async function init() {
  const res = await fetch('data/dogs.json', { cache: 'no-cache' });
  const data = await res.json();
  dogs = data.dogs;
  const when = new Date(data.generatedAt);
  $('#updated').textContent = `Updated from Instagram ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

  $('#filters').addEventListener('input', renderList);
  window.addEventListener('hashchange', route);
  renderList();
  route();
}

init().catch((err) => {
  console.error(err);
  $('#grid').innerHTML = '<div class="empty" style="grid-column:1/-1">Couldn’t load dogs right now. Please try again soon.</div>';
});
