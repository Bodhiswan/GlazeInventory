export const COMMERCIAL_GLAZE_BRANDS = [
  // Major North American manufacturers
  "AMACO",
  "Axner",
  "Big Ceramic Store",
  "Brackers Good Earth Clays",
  "Clay-King",
  "Coyote Glazes",
  "Crawford's Pottery",
  "Duncan",
  "Georgies",
  "Highwater Clays",
  "Laguna",
  "Mayco",
  "Minnesota Clay",
  "New Mexico Clay",
  "Sheffield Pottery",
  "Spectrum Glazes",
  "Speedball",
  "Standard Ceramic Supply",
  "Tucker's Pottery Supplies",
  // UK & Ireland
  "Bath Potters Supplies",
  "Potclays",
  "Potterycrafts",
  "Reward",
  "Scarva",
  "Valentine Clays",
  "Wengers",
  // Europe
  "Botz",
  "Colorobbia",
  "Ferro",
  "Sibelco",
  "Solargil",
  // Australia & New Zealand
  "Keane Ceramics",
  "Walker Ceramics",
  // Specialty / Raku / Misc
  "Amaco Potters Choice",
  "Amaco Celadon",
  "Amaco Teacher's Palette",
  "Amaco Velvet",
  "Coyote Shino",
  "Mayco Stroke & Coat",
  "Mayco Crystalites",
  "Mayco Stoneware",
  "Mayco Elements",
  "Spectrum 500 Series",
  "Spectrum 900 Series",
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
