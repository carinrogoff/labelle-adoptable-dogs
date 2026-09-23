# Labelle Adoptable Dogs

A website listing The Labelle Foundation's adoptable dogs that updates itself from
their Instagram posts. Built as a demo for a pitch to the Labelle team.

- `site/index.html`: adoptable dogs grid with filters, plus a page for each dog
- `site/how-it-works.html`: the pitch, including a box where you can paste any caption and see the profile it produces
- `site/js/parse-caption.js`: turns a caption into a dog profile (shared by the browser and Node)
- `site/js/sample-posts.js`: demo data. Rome, Cosmides and Mr. Lemon are real captions with their real photos; the rest are examples with placeholder photos from dog.ceo.
- `scripts/sync.mjs`: builds `site/data/dogs.json` from sample data or the live Instagram feed

Live demo: https://carinrogoff.github.io/labelle-adoptable-dogs/

## Run it locally

```bash
npm run sync   # rebuild site/data/dogs.json from the sample posts
npm test       # parser tests
npm run dev    # http://localhost:8080
```

No dependencies to install. It only needs Node 18+ and Python 3 (for the local server).

## How captions are read

A post becomes a dog profile when it starts with **"Meet [name]"** and includes
**"The Important Stuff"** (or at least two recognizable fields). The parser tolerates the
variations seen so far: bullets or none, "Breed" vs "Breed/Mix", "Estimated Adult Size" vs
"Estimated Size Full Grown", headers with or without colons, and sections in any order.

| In the caption | On the site |
| --- | --- |
| `ADOPTED` (all caps), `#adopted`, or a line starting "Adopted" | Moves to "Happy tails" |
| A later post saying `ADOPTED` that names the dog | Same |
| `adoption pending` / `PENDING` | "Adoption pending" badge |
| `FOSTER NEEDED` | "Foster needed" badge and a foster application button |

The newest post about a dog wins if they're reposted. Puppy ages are shown with a
current estimate ("about 11 weeks now"), since the posted age goes out of date.

## Going live (once Labelle agrees)

1. **Instagram account:** It must be a Business or Creator account (most rescues already are).
2. **Meta app:** At developers.facebook.com, create an app and add the **Instagram API with Instagram Login** product.
   Request only the `instagram_business_basic` permission, which gives read-only access to posts.
   Add a Labelle account holder as an Instagram tester so the app doesn't need App Review.
3. **Token:** The Labelle account holder authorizes the app once. Exchange the result for a
   **long-lived token** (valid 60 days). The workflow refreshes it hourly, so it never expires as long as the sync keeps running.
4. **Turn on hourly sync:** Add the token as the repo secret `IG_ACCESS_TOKEN`
   (Settings → Secrets and variables → Actions). From then on, `.github/workflows/sync.yml`
   pulls new posts every hour and republishes the site. Until the secret exists, it only
   publishes when you push changes.
5. **Remove the demo banner** from `site/index.html`, and point a subdomain such as
   `adopt.labellefoundation.org` at the site.

Test the live feed locally:

```bash
IG_ACCESS_TOKEN=... npm run sync
```

Photos are downloaded into `site/img/ig/` because Instagram's image URLs expire.
