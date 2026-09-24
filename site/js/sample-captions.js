// Example captions for the "try it" box on how-it-works.html.
import posts from './sample-posts.js';

const caption = (id) => posts.find((p) => p.id === id).caption;

export default [
  { label: 'Cosmides', caption: caption('sample-cosmides') },
  { label: 'Rome', caption: caption('sample-rome') },
  { label: 'Mr. Lemon', caption: caption('sample-mr-lemon') },
  { label: 'Adopted update', caption: '‼️ADOPTED‼️ ' + caption('sample-mr-lemon') },
];
