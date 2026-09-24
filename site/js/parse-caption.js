// Turns Labelle Foundation Instagram captions into structured dog listings.
// Shared by the sync script (Node) and the live "try a caption" demo (browser).
//
// Captions look roughly like:
//   🐾 Meet Rome
//   <intro paragraph>
//   ✨ The Important Stuff:
//   • Age: 7 weeks
//   Breed/Mix: Shar Pei mix
//   🏡 Foster's Note:
//   <paragraphs>
// but bullets, colons, field labels and section order all vary between posts.

const SECTIONS = [
  ['facts', /^(the )?important stuff$|^(quick )?facts$|^the basics$|^details$/],
  ['fosterNote', /^foster'?s'? notes?$|^from (my|the) foster$/],
  ['rescueStory', /^rescue story$|^(his|her|their|my) story$/],
  ['idealHome', /^ideal home$|^perfect home$|^(his|her|their) ideal home$/],
  ['medical', /^medical( notes| needs)?$|^health$/],
];

// Order matters: first match wins.
const FIELDS = [
  ['sex', /^(gender|sex)$/],
  ['age', /^(current )?age$/],
  ['size', /size|full grown/],
  ['breed', /breed|^mix$/],
  ['weight', /weight/],
  ['vibe', /^(vibe|personality|energy( level)?)$/],
  ['goodWith', /^good with/],
];

const LEADING_JUNK = /^[^\p{L}\p{N}"“]+/u; // emoji, bullets, punctuation
const KV = /^([\p{L}][\p{L}\/ '&-]{0,40}?)\s*:\s*(.+)$/u;

const clean = (s) => s.replace(/[’‘]/g, "'").replace(/ /g, ' ').trim();
const headerKey = (line) =>
  clean(line).replace(LEADING_JUNK, '').replace(/[:\s]+$/, '').toLowerCase();

function matchSection(line) {
  const key = headerKey(line);
  for (const [id, re] of SECTIONS) if (re.test(key)) return id;
  // Unknown header: starts with an emoji/symbol, short, ends in a colon, nothing after it.
  if (LEADING_JUNK.test(line) && /:\s*$/.test(line) && key.length > 0 && key.length < 40) {
    return 'other:' + key;
  }
  return null;
}

function matchField(label) {
  const key = label.toLowerCase().trim();
  for (const [id, re] of FIELDS) if (re.test(key)) return id;
  return null;
}

// "7 weeks", "14-weeks-old", "1.5 years", "6 mos" -> months (number) or null
export function ageToMonths(text) {
  if (!text) return null;
  const m = /(\d+(?:\.\d+)?)\s*[- ]?\s*(weeks?|wks?|months?|mos?|years?|yrs?)/i.exec(text);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith('w')) return n / 4.345;
  if (unit.startsWith('m')) return n;
  return n * 12;
}

export function ageGroup(months) {
  if (months == null) return null;
  if (months < 12) return 'Puppy';
  if (months < 36) return 'Young';
  if (months < 96) return 'Adult';
  return 'Senior';
}

export function sizeGroup(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/x-?large|extra large|giant/.test(t)) return 'XL';
  // "Medium-Large" -> Large (plan for the bigger end)
  if (/large|big/.test(t)) return 'Large';
  if (/medium|mid/.test(t)) return 'Medium';
  if (/small|tiny|toy|mini/.test(t)) return 'Small';
  return null;
}

function sexOf(text) {
  if (!text) return null;
  if (/\bfemale|\bgirl|\bf\b/i.test(text)) return 'Female';
  if (/\bmale|\bboy|\bm\b/i.test(text)) return 'Male';
  return null;
}

function tidyBreed(text) {
  return text
    .replace(/\s*[—–-]+\s*more (details|info)[^.]*$/i, '')
    .replace(/\s*\(more (details|info)[^)]*\)/i, '')
    .trim();
}

const stripQuotes = (s) => s.replace(/^["“]+|["”]+$/g, '').trim();

export function detectStatus(caption) {
  // Case matters: "ADOPTED" / a line starting "Adopted" is an update; "was adopted from" in a story is not.
  if (/#adopted\b/i.test(caption) || /\bADOPTED\b/.test(caption) || /^\W*Adopted\b/m.test(caption)) {
    return 'adopted';
  }
  if (/adoption pending|#pending\b|\bPENDING\b/.test(caption)) return 'pending';
  return 'available';
}

/**
 * Parse one caption. Returns null for posts that aren't a dog listing
 * (fundraisers, events, adoption announcements, etc).
 */
export function parseCaption(caption) {
  if (!caption) return null;
  const lines = caption.split(/\r?\n/).map(clean).filter(Boolean);

  // Name: first "Meet X" line. "Meet" may follow a tag Labelle adds later, e.g. "‼️ADOPTED‼️ 🐾 Meet Rome".
  let name = null;
  let start = 0;
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const m = /(?:^|[^\p{L}])meet\s+(.+?)[\s!.]*$/iu.exec(lines[i]);
    if (m) { name = m[1].trim(); start = i + 1; break; }
  }
  if (!name) return null;

  const facts = {};
  const extraFacts = {};
  const sections = {};
  const intro = [];
  let current = null;

  for (const line of lines.slice(start)) {
    const section = matchSection(line);
    if (section) { current = section; sections[current] ??= []; continue; }

    const body = line.replace(/^[•\-*·▪◦►]\s*/, '');
    const kv = KV.exec(body);
    if (kv) {
      const field = matchField(kv[1]);
      // Accept known fields anywhere; unknown "Label: value" pairs only inside the facts block.
      if (field) { facts[field] ??= kv[2].trim(); continue; }
      if (current === 'facts') { extraFacts[kv[1].trim()] = kv[2].trim(); continue; }
    }

    if (current) sections[current].push(stripQuotes(line));
    else intro.push(line);
  }

  const known = Object.keys(facts).length;
  if (!sections.facts && known < 2) return null; // "Meet our new board member!" etc.

  const ageMonths = ageToMonths(facts.age);
  const text = (id) => (sections[id] ? sections[id].filter(Boolean).join('\n\n') : '');
  const otherSections = Object.entries(sections)
    .filter(([id]) => id.startsWith('other:'))
    .map(([id, body]) => ({ title: titleCase(id.slice(6)), body: body.join('\n\n') }))
    .filter((s) => s.body);

  return {
    name,
    intro: intro.join('\n\n'),
    sex: sexOf(facts.sex),
    age: facts.age || null,
    ageMonths,
    ageGroup: ageGroup(ageMonths),
    breed: facts.breed ? tidyBreed(facts.breed) : null,
    size: facts.size || null,
    sizeGroup: sizeGroup(facts.size),
    weight: facts.weight || null,
    vibe: facts.vibe || null,
    goodWith: facts.goodWith || null,
    extraFacts,
    fosterNote: text('fosterNote'),
    rescueStory: text('rescueStory'),
    idealHome: text('idealHome'),
    medical: text('medical'),
    otherSections,
    needsFoster: /foster needed|needs? (a )?foster|#fosterneeded/i.test(caption),
    status: detectStatus(caption),
  };
}

const titleCase = (s) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

export const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-');

const nameKey = (n) => n.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * posts: [{ id, caption, timestamp, permalink, images: [url] }]
 * Returns listings newest-first, one per dog. Later "ADOPTED" posts that
 * mention a dog by name (e.g. "🎉 Rome found his forever home!") mark it adopted.
 */
export function buildDogs(posts) {
  const sorted = [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const byName = new Map();
  const announcements = [];
  let skipped = 0;

  for (const post of sorted) {
    const parsed = parseCaption(post.caption);
    if (!parsed) {
      if (detectStatus(post.caption || '') === 'adopted') announcements.push(post);
      else skipped++;
      continue;
    }
    const key = nameKey(parsed.name);
    if (byName.has(key)) continue; // newest post about this dog wins
    byName.set(key, {
      ...parsed,
      id: post.id,
      slug: slugify(parsed.name),
      postedAt: post.timestamp,
      permalink: post.permalink,
      images: post.images || [],
    });
  }

  for (const post of announcements) {
    for (const [key, dog] of byName) {
      const re = new RegExp(`\\b${escapeRe(dog.name)}\\b`, 'i');
      const newer = new Date(post.timestamp) >= new Date(dog.postedAt);
      // nameKey fallback catches spacing variants like "Mr.Lemon"; skip it for short names to avoid false hits.
      const loose = key.length >= 5 && nameKey(post.caption).includes(key);
      if (newer && (re.test(post.caption) || loose)) {
        dog.status = 'adopted';
        dog.adoptedAt = post.timestamp;
      }
    }
  }

  // Dedupe slugs
  const seen = new Map();
  for (const dog of byName.values()) {
    const n = seen.get(dog.slug) || 0;
    seen.set(dog.slug, n + 1);
    if (n) dog.slug += '-' + (n + 1);
  }

  return { dogs: [...byName.values()], skipped, announcements: announcements.length };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
