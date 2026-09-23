// Demo data shaped like the Instagram API response (after sync.mjs normalizes it).
// Rome, Cosmides and Mr. Lemon are real Labelle captions. So are their photos. Everything else is a made-up
// example in the same style, to show seniors, foster-needed dogs and adoption
// announcements. Their photos are placeholders.

const PROFILE = 'https://www.instagram.com/thelabellefoundation/';
// img('rome', 3) -> rome.jpg, rome-2.jpg, rome-3.jpg (a carousel post)
const img = (name, count = 1) =>
  Array.from({ length: count }, (_, i) => `img/sample/${name}${i ? `-${i + 1}` : ''}.jpg`);

export default [
  {
    id: 'sample-rome',
    timestamp: '2026-09-18T17:00:00Z',
    permalink: 'https://www.instagram.com/p/DdkCBMjkv3U/',
    images: img('rome', 4),
    caption: `🐾 Meet Rome

Smart, social, and incredibly cuddly, Rome is a sweet little leader with a personality that’s impossible not to love. 🤍

✨ The Important Stuff:
• Age: 7 weeks
• Estimated Adult Size: Large
• Breed/Mix: Shar Pei mix — more details on the last slide
• Gender: Male
• Vibe: Social, smart, active, and cuddly

❤️ Rescue Story:
Rome is safe in our care and getting lots of love while he waits for his forever home.

🏡 Foster’s Note:
Rome is a quiet little leader with such an engaging and lovable personality. He’s social, active, sweet, and incredibly smart, but he also has the cuddliest side and loves being close to his people.

With his adorable Rottweiler-like coloring, Rome looks almost identical to his sibling Amalfi, although Rome has a little more light brown around his eyelids. His foster says he’s definitely in the running as one of their favorites! 🥹

🤍 Ideal Home:
Rome would thrive with a loving family ready to give him plenty of playtime, continued training, socialization, and cuddles as he grows. With his smart, sweet personality, he’s sure to make an amazing addition to his forever family. ❤️`,
  },
  {
    id: 'sample-cosmides',
    timestamp: '2026-09-15T18:30:00Z',
    permalink: 'https://www.instagram.com/p/DdfQgV5jcm8/',
    images: img('cosmides', 3),
    caption: `🐾 Meet Cosmides
Please meet Cosmides! This sweet and playful little pup is ready to curl up with her furever family!
✨ The Important Stuff
Gender: Female
Age: 14-weeks-old
Breed: Chi Doxie Mix
Estimated Size Full Grown: Small
🐶 Foster’s Notes:
“Cosmides is a precious and calm little pup who loves a good cuddle and will snuggle through a good movie with you. When she’s not snuggling her people, she is outside exploring. Cosmides loves playing with her foster family’s pup, a German Shepherd, and the two are already best pals! She’s the perfect combination of sweet and snuggly with a fun, adventurous spirit. Cosmides would thrive with a family who shares her love of exploring and adventure, but who is always ready to come home, curl up on the couch, and enjoy some good snuggles. She’s a special little pup who is ready to find her forever family!”
🏡 Ideal Home:
Cosmides would do well in a home that allows her to explore to her hearts desire and snuggle up as long as she wants!
🐾 Rescue Story:
Cosmides was rescued from Bakersfield Shelter!`,
  },
  {
    id: 'sample-mr-lemon',
    timestamp: '2026-09-12T19:00:00Z',
    permalink: 'https://www.instagram.com/p/DdaG7CmnOmH/',
    images: img('mr-lemon', 4),
    caption: `🐾 Meet Mr. Lemon
Me. Lemon is a playful and loving little pup who will add so much light and laughter into a home!
✨ The Important Stuff
Gender: Male
Age: 11-weeks-old
Breed/Mix: Chihuahua Terrier
Estimated Size Full Grown: Medium
🐶 Foster’s Notes:
“Mr Lemons is very energetic and active youngster. A regal, active gentleman who loves to play. His favorite activity right now is chasing around his sibling!”
🏡 Ideal Home:
Mr.Lemon would do well in an active and playful household that is ready to take on his adorable puppy energy!
🐾 Rescue Story:
Mr.Lemon was rescued from Kerman Animal Shelter!`,
  },

  // ---- Made-up examples below ----
  {
    id: 'sample-biscuit',
    timestamp: '2026-09-08T20:00:00Z',
    permalink: PROFILE,
    images: img('biscuit', 4),
    caption: `🐾 Meet Biscuit
This distinguished gentleman is looking for a cozy place to spend his golden years! 👴🏼
✨ The Important Stuff
Gender: Male
Age: 9 years
Breed: Beagle Mix
Estimated Size Full Grown: Medium
Good With: Dogs, cats, and kids
🐶 Foster’s Notes:
“Biscuit is the easiest dog I have ever fostered. He loves slow walks, belly rubs, and a soft bed by the window. He is fully house trained and sleeps through the night.”
🏡 Ideal Home:
A calm home with someone who wants a loyal couch buddy.
🐾 Rescue Story:
Biscuit was surrendered to a crowded shelter after his owner passed away.`,
  },
  {
    id: 'sample-juniper',
    timestamp: '2026-09-05T18:00:00Z',
    permalink: PROFILE,
    images: img('juniper', 4),
    caption: `‼️FOSTER NEEDED‼️
🐾 Meet Juniper
Juniper is a goofy, talkative girl who needs a foster or forever home ASAP!
✨ The Important Stuff
Gender: Female
Age: 2 years
Breed/Mix: Husky Mix
Estimated Size Full Grown: Large
🏡 Ideal Home:
An active home with a secure yard and someone who loves hikes!
🐾 Rescue Story:
Juniper was pulled from the Baldwin Park shelter on her last day.`,
  },
  {
    id: 'sample-pepper',
    timestamp: '2026-08-28T17:00:00Z',
    permalink: PROFILE,
    images: img('pepper'),
    caption: `🐾 Meet Pepper
Pepper has the biggest smile in LA and a heart to match! 💕
✨ The Important Stuff
Gender: Female
Age: 4 years
Breed/Mix: Pit Bull Mix
Estimated Size Full Grown: Medium-Large
🐶 Foster’s Notes:
“Pepper knows sit, down, and paw, rides beautifully in the car, and has never met a person she didn’t love. She would prefer to be the only dog.”
🏡 Ideal Home:
A dog-free home with people who love snuggles and adventures.`,
  },
  {
    id: 'sample-waffles',
    timestamp: '2026-08-20T17:00:00Z',
    permalink: PROFILE,
    images: img('waffles'),
    caption: `🐾 Meet Waffles
Tiny dog, BIG personality! 🧇
✨ The Important Stuff
Gender: Male
Age: 1 year
Breed/Mix: Yorkie Mix
Estimated Size Full Grown: Small`,
  },
  {
    id: 'sample-waffles-adopted',
    timestamp: '2026-09-10T17:00:00Z',
    permalink: PROFILE,
    images: img('waffles'),
    caption: `🎉 ADOPTED! 🎉
Waffles found his forever home! Thank you to his amazing foster and his new family. 🧇❤️`,
  },
];
