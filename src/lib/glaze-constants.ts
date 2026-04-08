export const COMMERCIAL_GLAZE_BRANDS = [
  // North America
  "AMACO",
  "Chrysanthos",
  "Clayscapes Pottery",
  "Coyote Glazes",
  "Duncan",
  "Georgies",
  "Kentucky Mudworks",
  "Laguna",
  "Mayco",
  "Opulence",
  "Penguin Pottery",
  "Seattle Pottery Supply",
  "Spectrum Glazes",
  "Speedball",
  "The Ceramic Shop",
  "Tucker's Glazes",
  // UK & Ireland
  "Bath Potters Supplies",
  "Potclays",
  "Potterycrafts",
  "Scarva",
  // Europe
  "Botz",
  "Ceradel",
  "Colorobbia",
  "Ferro",
  "Hobby Colorobbia",
  "Pemco",
  "Terra Color",
  "Welte",
  // Australia & New Zealand
  "Cesco",
  "Keane Ceramics",
  "Northcote Pottery",
  "Walker Ceramics",
] as const;

export const CUSTOM_GLAZE_CONE_VALUES = ["Cone 06", "Cone 6", "Cone 10", "Cone 6 / Cone 10"] as const;
export const CUSTOM_GLAZE_ATMOSPHERE_VALUES = ["Oxidation", "Reduction", "Both"] as const;

// Color options — match the keywords used by extractGlazeColorTraits in utils.ts
export const CUSTOM_GLAZE_COLOR_OPTIONS = [
  "White", "Cream", "Clear", "Black", "Grey", "Silver", "Gold",
  "Brown", "Amber", "Tan", "Beige",
  "Red", "Burgundy", "Maroon", "Orange", "Coral", "Yellow",
  "Green", "Olive", "Sage", "Teal", "Turquoise", "Aqua",
  "Blue", "Navy", "Indigo", "Purple", "Lavender", "Pink",
] as const;

// Finish options — match the patterns used by extractGlazeFinishTraits in utils.ts
export const CUSTOM_GLAZE_FINISH_OPTIONS = [
  "Glossy", "Matte", "Satin", "Crackle",
  "Transparent", "Translucent", "Opaque",
  "Textured", "Crystalline",
] as const;
