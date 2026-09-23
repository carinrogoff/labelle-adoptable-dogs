import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCaption, buildDogs, ageToMonths } from '../site/js/parse-caption.js';
import posts from '../site/js/sample-posts.js';

const caption = (id) => posts.find((p) => p.id === id).caption;

test('real Labelle captions parse in all three formats', () => {
  const rome = parseCaption(caption('sample-rome'));
  assert.equal(rome.name, 'Rome');
  assert.equal(rome.breed, 'Shar Pei mix'); // "— more details on the last slide" stripped
  assert.equal(rome.sizeGroup, 'Large');
  assert.equal(rome.sex, 'Male');
  assert.match(rome.fosterNote, /quiet little leader[\s\S]*favorites/);

  const cosmides = parseCaption(caption('sample-cosmides'));
  assert.equal(cosmides.breed, 'Chi Doxie Mix'); // "Breed:" label
  assert.equal(cosmides.sizeGroup, 'Small'); // "Estimated Size Full Grown:" label
  assert.equal(cosmides.ageGroup, 'Puppy'); // "14-weeks-old"
  assert.equal(cosmides.rescueStory, 'Cosmides was rescued from Bakersfield Shelter!');
  assert.ok(!cosmides.fosterNote.startsWith('“'));

  const lemon = parseCaption(caption('sample-mr-lemon'));
  assert.equal(lemon.name, 'Mr. Lemon');
});

test('non-listing posts are skipped', () => {
  assert.equal(parseCaption('We need your help! Link in bio to donate 💚'), null);
  assert.equal(parseCaption('🍀 Get Lucky with Labelle Adoption Event!\nRSVP at the link in bio'), null);
  assert.equal(parseCaption('Meet our amazing volunteers! Thank you all ❤️'), null);
});

test('adoption status', () => {
  const story = '🐾 Meet Bo\n✨ The Important Stuff\nAge: 2 years\nGender: Male\n🐾 Rescue Story:\nBo was adopted from a breeder, then surrendered.';
  assert.equal(parseCaption(story).status, 'available');
  assert.equal(parseCaption('ADOPTED 🎉\n' + story).status, 'adopted');
  assert.equal(parseCaption(story + '\n#adopted').status, 'adopted');
});

test('a later ADOPTED announcement marks the dog adopted', () => {
  const { dogs } = buildDogs(posts);
  assert.equal(dogs.find((d) => d.name === 'Waffles').status, 'adopted');
  assert.equal(dogs.find((d) => d.name === 'Rome').status, 'available');
});

test('an older announcement does not mark a newer listing adopted', () => {
  const { dogs } = buildDogs([
    { id: '1', timestamp: '2026-01-01', caption: 'ADOPTED! Rome went home 🎉' },
    { id: '2', timestamp: '2026-02-01', caption: caption('sample-rome') },
  ]);
  assert.equal(dogs[0].status, 'available');
});

test('ages', () => {
  assert.equal(Math.round(ageToMonths('7 weeks') * 10) / 10, 1.6);
  assert.equal(ageToMonths('1.5 years'), 18);
  assert.equal(ageToMonths('6 mos'), 6);
  assert.equal(ageToMonths('unknown'), null);
});
