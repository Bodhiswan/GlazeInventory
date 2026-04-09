export const CHANGELOG_KEY = "glaze-library-changelog-v5";

export const CHANGES = [
  {
    category: "New",
    items: [
      "Opulence glaze brand added — 74 Mid-South Opulence glazes are now in the library, searchable, and pickable from the inventory add-glaze flow.",
      "Request a brand — the old \"add a glaze\" form has been replaced with a simple \"Request brand\" page; new requests show as an alert in admin analytics.",
      "Richer dashboard welcome — a real product tour with screenshots of the library, inventory, combinations, and contribute pages, plus a Mayco Crystalites hero strip.",
      "Take-the-tour modal — split-layout card with step icons, animated visuals, clickable dots, keyboard arrow navigation, and direct links into each feature.",
      "Dual combinations search — two side-by-side search boxes let you narrow combos by typing one glaze in each.",
      "Combinations filter bar redesigned to match the Library: a single full-width Filters button below the search bars.",
      "Combination popup hero image — one large photo with the rest as small thumbnails that open the carousel on click.",
      "Unified contribution form — submit a firing photo, a combination, or a brand new glaze from one place at /contribute.",
      "Optional clay body field on combination submissions, plus all combination detail fields are now optional.",
      "Clickable cursor on every button so it's obvious what's interactive.",
    ],
  },
  {
    category: "Fixed",
    items: [
      "Clay body entries on custom combinations are now actually saved instead of being silently dropped.",
      "Custom combination layer order is back to top → bottom the way you entered it in the form.",
      "Combination tile titles match the order you entered them in the form (top layer first, separated by /).",
      "Password reset now tells you exactly why a new password was rejected instead of a generic error.",
      "Duplicate display names are no longer allowed — case-insensitive check on sign-up and profile updates.",
      '"+ Add a new glaze" in the contribute form now sits in its own section explaining it creates a brand new glaze for the site.',
      "Contribute form makes it clear that one glaze = a firing example, two or more = a combination.",
      "Faster image loading — Supabase-hosted glaze photos are now served as properly sized WebPs from Supabase's CDN.",
      "Community firing images API now cached at the edge so repeat views don't hit the database.",
    ],
  },
  {
    category: "Previously",
    items: [
      "Seattle Pottery Supply — 167 SP-series glazes added to the catalog with photos, cones, and finishes.",
      "Points & leaderboard — earn points for contributions; see 'People to thank' on the Contribute page and your rank on your profile.",
      "Direct messaging & community firing images — message admins directly and browse firing photos shared by the community.",
      "Up to 5 photos per submission — attach multiple firing photos when adding glazes or publishing combinations.",
      "Brand picker on glaze submissions — pick from an expanded brand list (Chrysanthos, Cesco, Welte, and more) instead of typing freeform.",
      "Smarter firing-image glaze search — brand filter, smart search, and an image-first picker matching the catalog.",
      "Mobile hamburger menu — cleaner mobile nav; username and points now visible in the header on every screen size.",
      "Faster page loads — Suspense streaming on the catalog, combinations, community, and detail pages.",
    ],
  },
];
