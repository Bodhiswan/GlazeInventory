# Foundations — Merged Draft (Part I)

Merged from Claude, GPT, and Grok research | 2026-04-09
All conflicts resolved per arbitration/conflicts.md

---

## 1. Understanding Ceramic Glazes

### 1.1 What a Glaze Is

A ceramic glaze is a thin layer of glass permanently fused to the surface of a ceramic body through firing. Every glaze, no matter how complex, is built from three essential components:

- **Glass-former (silica / SiO₂):** The backbone of the glaze — silica is the primary glass-forming oxide. On its own, pure silica melts at approximately 1713°C, far too high for practical pottery. [Rhodes, *Clay and Glazes for the Potter*, 3rd ed., Ch. 8-10; Mayco *Ceramics 101*, p. 3]

- **Flux:** Metal oxides that lower the melting point of silica to a practical firing range. Different fluxes work at different temperatures — sodium and potassium are strong low-temperature fluxes, while calcium and magnesium become effective at higher temperatures. [Rhodes, Ch. 8-10; IU Southeast Ceramics Studio Handbook, p. 3]

- **Alumina (Al₂O₃):** The stiffening agent. Alumina increases the viscosity of the molten glaze, preventing it from running off vertical surfaces, and helps it adhere to the clay body. Without sufficient alumina, a glaze would flow like water off the pot. [Rhodes, Ch. 8-10; Mayco *Ceramics 101*, p. 17; IU Southeast Handbook, p. 3]

This three-component model can be expressed more precisely using the **Seger unity formula** (also called the unity molecular formula), which normalizes all fluxes to total 1.00. This makes it possible to compare glazes chemically even when they use different raw materials — and makes it much easier to diagnose problems like crazing, where high-expansion fluxes are the usual culprit. [Rhodes, pp. 172-183; Digitalfire, "Glaze Crazing"]

### 1.2 How Glazes Differ from Paint

Unlike paint, which dries by evaporation and remains a distinct surface coating, ceramic glaze undergoes a permanent chemical transformation during firing. The raw materials melt, flow, and fuse with the clay surface at temperatures between ~900°C and 1300°C+, forming an intermediate layer where glaze and clay intermingle. Once cooled, the glaze is essentially glass bonded to ceramic — it cannot be removed without breaking the object. [Rhodes, Ch. 8; Mayco *Ceramics 101*, p. 17; Digitalfire glossary "glaze"]

This distinction matters practically: paint can be applied to any dry surface, but glaze application depends on the *porosity* of bisqueware to absorb water from the glaze suspension and deposit an even layer of particles on the surface. If you treat glaze like paint, you'll get poor results.

### 1.3 The Role of Bisque Firing

Bisque firing is the first firing of raw (greenware) clay. Its purposes are:

1. **Drive off moisture** — both physical water and chemically-bound water (quartz inversion occurs at 573°C)
2. **Burn out organic matter** — any carbon, plant material, or other organics in the clay
3. **Sinter the clay** — give it structural strength while retaining porosity

The standard bisque temperature range is **cone 08 to cone 04 (~950–1060°C / 1740–1940°F)**. Cone 04 (~1060°C) is the most common bisque temperature across studio pottery. [Digitalfire "bisque"; BigCeramicStore "Choosing a Bisque Temperature"; Mayco *Ceramics 101*, p. 12]

A properly bisqued piece typically retains **>15% porosity** — enough to absorb water from a glaze suspension quickly and deposit an even coating. [Glazy; Digitalfire]

**Important context note:** For low-fire work (cone 06 glaze), Mayco recommends bisque firing 1-2 cones *hotter* than the glaze fire (e.g., bisque to cone 04, glaze to cone 06) to ensure complete organic burnout before glazing. For mid/high-fire work (cone 6+ glaze), bisque is typically fired to cone 04-06, which is *lower* than the eventual glaze temperature. [Mayco *Ceramics 101*, p. 12; standard studio practice]

### 1.4 Cone Ranges

"Cone" refers to pyrometric cones that measure **heatwork** (temperature × time), not temperature alone. The same peak temperature reached quickly produces different results than when reached slowly.

| Range | Cones | Temperature | Typical Use |
|-------|-------|-------------|-------------|
| **Low-fire** | 06 to 02 | ~999–1120°C (1830–2048°F) | Earthenware, bright colors, most commercial brush-on glazes (e.g., Mayco Series 2000) |
| **Mid-fire** | 4 to 7 | ~1162–1240°C (2124–2264°F) | Stoneware, most studio pottery today, good balance of color + durability |
| **High-fire** | 8 to 13 | ~1263–1346°C (2305–2455°F) | Stoneware and porcelain, limited color palette, very durable |

[Orton Ceramic Foundation cone chart; Rhodes, Ch. 1-3; Glazy firing concepts; Mayco *Ceramics 101*, pp. 5, 13]

Cone 6 has become the dominant range in American studio pottery due to the balance of durability, color availability, and energy efficiency with electric kilns. Glazes **must** be fired to their labeled cone — underfired glazes appear cloudy, milky, or lacking sheen and may not be food-safe. [Mayco *Ceramics 101*, p. 13]

---

## 2. Glaze Consistency & Measurement

### 2.1 Specific Gravity

Specific gravity (SG) is the ratio of a glaze slurry's weight to the weight of an equal volume of water. Water = SG 1.0, so a glaze at SG 1.45 weighs 1.45× as much as the same volume of water. SG is the primary metric for ensuring consistent application thickness. [Digitalfire "specific gravity"; Glazy wiki; Sue McLeod Ceramics]

**Target ranges by application method:**

| Method | SG Range | Notes |
|--------|----------|-------|
| **Dipping** | 1.40–1.70 (most commonly 1.43–1.55) | 1-3 second dip. Mayco dry glazes target 1.47–1.51. |
| **Pouring** | 1.50–1.60 | |
| **Brushing** | ~1.25–1.55 | Lower SG because gums/binders do the work. Digitalfire cites 1.34 for a low-fire brush glaze. "Latex house paint" consistency. |
| **Spraying** | ~1.25–1.40 | Thinnest consistency. Requires constant agitation. |

[Digitalfire "specific gravity," "dipping glaze," "pour glazing," "brushing glaze"; Mayco dry glaze mixing PDF; AMACO DL-series product pages (SG 1.52–1.58 depending on formula); Georgies "Converting Brush to Dip" PDF; Rat City Studios]

**Critical insight (GPT):** The "correct" SG is always recipe-specific. Manufacturer documentation shows SG targets varying even within the same product line — AMACO DL-series glazes are recommended at SG 1.52, 1.53, 1.54, or even 1.58 depending on formula. Comparing a brushing glaze's SG to a dipping glaze's SG can be misleading because they use different rheology strategies. [AMACO product pages; Digitalfire "viscosity"]

### 2.2 Measuring Specific Gravity

**Weight-per-volume method (recommended):**
Fill a 100cc graduated cylinder with glaze, weigh it. If 100cc weighs 145g, SG = 1.45. The weight-per-pint variant: weigh a pint of glaze in grams, divide by 473g (weight of a pint of water). This method is unambiguous and works with any glaze consistency. [Sue McLeod Ceramics; The Studio Manager; Glazy SG guide]

**Hydrometer:**
A floating glass instrument with a calibrated stem. Hydrometers *can* work for ceramic glazes, but have practical limitations: most useful glaze slurries cluster tightly around SG 1.4–1.5, making readings compressed and hard to distinguish. Thick or thixotropic glazes can also prevent the hydrometer from floating freely. Most experienced potters prefer weight-per-volume for reliability. [Digitalfire "specific gravity"; Sue McLeod; The Studio Manager]

**Flow testing (supplemental):**
SG alone doesn't fully describe application behavior. Georgies recommends checking flow separately: after mixing, the glaze should keep spinning for about 5 seconds, or evacuate a drip cup in roughly 15–25 seconds. [Georgies "Adjusting a Glaze for Dipping" PDF]

### 2.3 Deflocculants and Flocculants

Glaze suspension chemistry can be modified with additives that change how clay particles interact:

**Deflocculants** (disperse particles → reduce viscosity at same solids content):
- **Darvan 7** — sodium polyelectrolyte (long chain). Causes clay particles to electrically repel each other.
- **Darvan 811** — sodium polyelectrolyte (short chain). Sometimes preferred for glazes/bodies over Darvan 7.
- Dosage: Very small quantities — typically 0.3–0.5% for porcelain, up to double for high-iron stoneware. Powerful — over-deflocculation creates a glaze that settles into impenetrable hard pan.
[Vanderbilt Minerals "DARVAN 7-N" TDS; Digitalfire "deflocculation"; IU Southeast Handbook, pp. 10, 44]

**Flocculants** (attract particles → create thixotropic gel that resists settling):
- **Epsom salts (magnesium sulfate)** — most common. Add as a saturated solution (dissolve in hot water first). Linda Arbuckle recommends only ½–3 teaspoons per 5 gallons if needed.
- **Vinegar (acetic acid)** — works but effect can be temporary as the acid is neutralized by alkaline materials.
- **Calcium chloride** — alternative flocculant.
[Digitalfire "flocculation," "Epsom salts"; Sue McLeod; Linda Arbuckle "Five Great Ceramic Glazing Techniques," p. 4; Hardwick Handmade]

### 2.4 Thixotropy

Thixotropy is a time-dependent behavior where a ceramic suspension is fluid when stirred or shaken but thickens/gels again on standing. This is useful for glaze application — the slurry moves easily in the bucket but stays put on the pot after dipping. Proper flocculation creates controlled thixotropy. [Hamer, *Potter's Dictionary*, 3rd ed., p. 154; Digitalfire "flocculation"]

### 2.5 Sieving

Glazes should be sieved to remove lumps, undissolved particles, and contaminants:

- **80-mesh** — standard for stoneware/earthenware glazes. Mayco recommends "80 mesh or finer" for dipping glazes.
- **100–120 mesh** — finer work
- **200+ mesh** — porcelain or glazes requiring very smooth application
- Pass through 2–3 times. For large batches (>2000g), pre-sieve through 40–60 mesh first.

Rhodes notes that glaze materials are usually ground fine enough to pass 200-mesh, so studio sieving is more about breaking agglomerates, catching contaminants, and re-homogenizing than creating fineness from scratch. [Digitalfire "sieve"; Ceramic Arts Network "Mesh Size"; Rhodes, p. 133; Mayco *Ceramics 101*, p. 18]

**Exception:** Special-effect glazes with coarse materials (granular manganese, ilmenite for speckling) should use a coarser mesh or not be fully sieved, to preserve the desired texture.

### 2.6 Aging Glazes

Freshly mixed glazes benefit from aging — sitting for **24–48 hours minimum** allows minerals to hydrate, clay particles to disperse evenly, and the suspension to reach equilibrium. Some potters age glazes for weeks or months. The aging process can involve bacterial action that contributes to better suspension properties. [Glazy "Mixing Test Recipes"; IU Southeast Handbook, p. 10; Rhodes, Ch. 24]

**Caution:** Glazes with organic binders (CMC gum, gum arabic) can develop mold if aged too long in warm conditions. A few drops of bleach or using distilled water can prevent this.

---

## 3. Surface Preparation Before Glazing

### 3.1 Bisque Temperature and Porosity

Bisque firing temperature is inversely related to porosity: **lower bisque = more porous = faster glaze absorption.**

| Bisque Temp | Porosity | Character |
|-------------|----------|-----------|
| Cone 08 (~950°C) | Very high | "Soft bisque." Absorbs fast — good for dipping but fragile. |
| Cone 06 (~999°C) | High | Popular for low-fire. More porous but more fragile than 04. |
| Cone 04 (~1060°C) | Moderate (~10-15%) | **Most common.** Good balance of strength and porosity. |
| Cone 02–1 (~1120–1137°C) | Low | "Hard bisque." May need dampening before glazing. |

[Sue McLeod; BigCeramicStore; Digitalfire "bisque"]

**Important caveat (GPT):** The clay body matters as much as the cone number. A porcelain body at cone 04 will be much less porous than a coarse stoneware at the same temperature. Highly vitrifying specialty bodies may reach near-zero porosity by cone 04. [Digitalfire "Leaking of Fired Ceramics"; Digitalfire "Zero4"]

### 3.2 Cleaning Bisqueware

Bisqueware must be clean and free of dust, oil, and contaminants before glazing. These create barriers to adhesion and are one of the most common causes of crawling.

- **Damp sponge wipe** — most common method. Wipe all surfaces. [Mayco *Ceramics 101*, p. 18]
- **Compressed air** — for intricate surfaces (use respirator)
- **Rinse under water** — for very dusty pieces, quick rinse and dry

In shared studios, routinely wash all bisqueware under running water — pieces may have been handled by many people.

### 3.3 Wetting/Dampening Before Application

Slightly dampening bisque before glaze application slows absorption, giving more working time and allowing thinner, more even layers. Useful when:
- Bisque is very porous (low bisque temp) and absorbs too fast
- Applying glaze by brush and needing more open time
- Glazing large pieces where fast absorption would cause uneven thickness

**Technique:** Lightly mist or sponge the surface — do not soak.

**Warning (per arbitration):** Over-wetting can move the raw glaze layer, encourage color migration, and increase crawling risk. This technique helps especially with porous low-fire bisque but may cause adhesion problems on already-dense bisque (cone 02+). [Linda Arbuckle, "Five Great Ceramic Glazing Techniques," pp. 4-5; Sue McLeod; BigCeramicStore]

### 3.4 Sanding Bisque

Light sanding with fine-grit sandpaper (220–320 grit) can smooth rough surfaces, remove bumps, or clean kiln debris. **Must** thoroughly clean sanding dust before glazing — leftover dust will cause crawling. Heavy sanding can seal surface pores and reduce absorption locally. [General studio practice; Digitalfire]

### 3.5 Wax Resist on the Foot

Applying wax resist to the bottom/foot prevents glaze from adhering to surfaces that touch the kiln shelf. Glaze melted onto the kiln shelf fuses the pot to it, potentially ruining both.

**Cold liquid wax resist (studio default):** Water-based, commercially available (e.g., Mayco AC-302). Easy to use, brushes clean with soap and water. Repels glaze effectively and burns away in firing. [Mayco "Wax Resist"; Seattle Pottery Supply]

**Hot wax (traditional):** Melted paraffin/beeswax in a dedicated pot. More durable resist with sharper edges, but harder to clean up and poses a fire safety concern. Some production potters still prefer it. [Pottery Crafters; Rat City Studios; Glazy wiki]

The wax burns off completely during firing (with some smoke — ventilate the kiln early). If glaze gets on waxed surface, it wipes off easily with a damp sponge.

**Wheel technique:** Place the pot on a banding wheel, spin it, and hold a wax-loaded brush against the foot for a clean, even wax line.

### 3.6 Uncommon Preparation Techniques

**Terra sigillata as a base layer:** Terra sigillata (an ultra-fine particle slip) can function as an intentional base layer under glaze, creating a very smooth surface. Some suppliers (e.g., Walker Ceramics Australia) explicitly recommend it "best under a glaze." Performance depends on clay body, firing range, and the glaze layered over it. [Walker Ceramics Australia; GPT research]

**Slip at bisque stage:** Slips can be applied in the bisque state for thin, skin-like decorative surfaces under glaze, though shrinkage and firing behavior must be compatible. [Ceramic Arts Network, "How to Decorate Pottery Surfaces with Slips in the Bisque State"]
