export type GuidePart = {
  slug: string;
  number: string;
  title: string;
  description: string;
  status: "live" | "coming-soon";
};

export const GUIDE_PARTS: GuidePart[] = [
  {
    slug: "foundations",
    number: "I",
    title: "Foundations",
    description:
      "What a glaze is, how it differs from paint, cone ranges, specific gravity, surface preparation, and the chemistry behind it all.",
    status: "live",
  },
  {
    slug: "application",
    number: "II",
    title: "Application Methods",
    description:
      "Dipping, pouring, spraying, brushing, trailing, sponging — equipment, technique, and when to use each method.",
    status: "live",
  },
  {
    slug: "layering",
    number: "III",
    title: "Layering Theory & Practice",
    description:
      "Why glazes interact when layered, eutectic melting, viscosity and flow, layering strategies, and systematic testing.",
    status: "live",
  },
  {
    slug: "decorative",
    number: "IV",
    title: "Resist & Decorative Techniques",
    description:
      "Wax resist, sgraffito, mishima, underglaze techniques, overglaze enamels, and combining methods.",
    status: "live",
  },
  {
    slug: "firing",
    number: "V",
    title: "Firing Considerations",
    description:
      "How oxidation, reduction, ramp rate, cooling, and kiln type affect your glaze results.",
    status: "live",
  },
  {
    slug: "troubleshooting",
    number: "VI",
    title: "Troubleshooting",
    description:
      "Crawling, pinholing, crazing, shivering, running, blistering — causes, fixes, and the science behind each defect.",
    status: "live",
  },
  {
    slug: "traditions",
    number: "VII",
    title: "International Traditions",
    description:
      "Glazing techniques from Japan, China, Korea, the Islamic world, the Mediterranean, Europe, the Americas, Africa, and beyond.",
    status: "coming-soon",
  },
];

export function getGuidePart(slug: string): GuidePart | undefined {
  return GUIDE_PARTS.find((p) => p.slug === slug);
}
