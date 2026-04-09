# Troubleshooting — Merged Draft (Part VI)

Merged from Claude, GPT, and Grok research | 2026-04-09
All conflicts resolved per arbitration/conflicts.md

---

## 18. Common Glaze Defects

Each defect below includes causes ranked by likelihood, specific fixes, and cone-range/kiln-type caveats where applicable.

---

### 18.1 Crawling

**What it looks like:** Molten glaze pulls away from areas of the pot during firing, forming beads or islands of glaze with bare clay patches between them.

**Causes (ranked by likelihood):**

1. **Dusty, greasy, or contaminated bisqueware** — oils from handling or dust create barriers that prevent adhesion. Hamer notes that crawling often begins with poor *dry-glaze* adhesion before the kiln even gets hot. [Hamer, *Potter's Dictionary*, 3rd ed., p. 89; Mayco *Ceramics 101*, p. 18; Digitalfire "crawling"]

2. **Excessive drying shrinkage** — glazes with high raw clay content (especially uncalcined kaolin or ball clay) shrink excessively as they dry, cracking the raw glaze layer. These cracks become separation points when the glaze melts. [Digitalfire "crawling"; Ceramic Arts Network "5 Glaze Defects"]

3. **Excessively thick application** — thick layers crack more during drying and take longer to melt through. [Hamer, p. 89; BigCeramicStore]

4. **High surface tension in the melt** — some materials (zirconium, tin oxide, high zinc) increase surface tension, causing the melt to bead up rather than wet the body. [Digitalfire "crawling"]

5. **Thickened/evaporated glaze slurry** — Hamer notes that a slurry that has thickened by evaporation is more likely to crawl because the melted glaze prefers to pull together. [Hamer, p. 89]

6. **Highly alkaline glazes** — Rhodes notes these can have high surface tension when melted, making them vulnerable to crawling even while being fluid enough to run. [Rhodes, p. 227]

**Fixes:**
- Clean bisqueware thoroughly before glazing (damp sponge wipe)
- Apply glaze at appropriate thickness (thinner coats)
- Calcine high-shrinkage materials — replace a portion of raw kaolin with calcined kaolin
- Add a small amount of gum (CMC) to improve raw-layer adhesion
- Reduce zirconium and tin oxide if possible
- Add a small amount of flux to reduce surface tension in the melt
- Recondition thickened slurry — don't just add water; re-sieve and check SG

**Cone/kiln caveats:** More common in matte glazes (higher alumina = higher viscosity/surface tension). More common in high-clay low-fire glazes. Some potters intentionally exploit crawling as a decorative effect with purpose-formulated crawl glazes.

---

### 18.2 Pinholing and Bloating

**What it looks like:** Pinholes are tiny holes (about pinhead size) in the fired glaze surface, sometimes penetrating to the clay body. Bloating is a more severe form where trapped gas causes the clay body itself to swell.

**Causes (ranked by likelihood):**

1. **Incomplete burnout of organic matter or carbonates** — gases escape from the clay body during glaze firing, after the glaze surface has sealed. This is especially common when bisque firing was too fast or too low. Steve Davis (Aardvark Clay) identifies incomplete carbon burnout as a shared root cause of bloating, black coring, pinholing, and blistering. [Digitalfire "Glaze Pinholes"; Mayco *Ceramics 101*, p. 12; Davis, "An Oxidized Bisque Firing," Aardvark Clay PDF]

2. **Insufficient soak time at peak temperature** — the glaze doesn't have enough time in its fluid state to heal over burst bubbles. [Digitalfire; Ceramic Arts Network "5 Glaze Defects"]

3. **Excessively fast ramp through the burnout zone (600–900°C)** — volatiles don't escape before the surface seals. [Glazy "Common Glaze Defects"]

4. **Thick glaze application** — more material to outgas through. [BigCeramicStore]

5. **Rough, grogged, or trimmed body surfaces** — Digitalfire notes pinholes often form when glaze dries over surface voids from trimming or coarse grog. [Digitalfire "Glaze Pinholes"]

6. **Body contamination** — plaster bits, calcium nodules that outgas at high temperature.

**Fixes:**
- Slow bisque firing, especially through 600–900°C burnout zone
- Add a **soak at peak glaze temperature** — 10–30 minutes allows the surface to heal. The "drop-and-hold" technique (fire slightly past peak, then drop temperature and soak) is effective for some glazes.
- Apply glaze at appropriate thickness
- Smooth rough trimmed areas before glazing
- Ensure proper kiln ventilation during early firing

**Cone/kiln caveats:** Low-fire (cone 06) is more prone because bisque and glaze temps are close together. Gas kilns in reduction need extra attention to early ventilation. High-fire stoneware is less prone if properly bisqued.

---

### 18.3 Crazing

**What it looks like:** A network of fine cracks in the glaze surface, similar to crackle in old china.

**Primary cause: Thermal expansion mismatch.** The glaze's coefficient of thermal expansion (CTE) is higher than the clay body's. As the kiln cools, the glaze contracts more than the clay, putting the glaze under tension until it cracks. [Digitalfire "Glaze Crazing"; Hamer, p. 89; Rhodes, pp. 172-183]

**Per arbitration ruling:** Process tweaks (slow cooling, thinner application) are secondary mitigations only. **The primary cure is changing the glaze chemistry to fix the expansion mismatch.**

**Contributing factors:**
1. **Too much sodium, potassium, or lithium** in the glaze formula (high-expansion fluxes) — visible in the Seger unity formula when the flux column is normalized. [Rhodes, pp. 172-183; Digitalfire]
2. **Thick application** — thicker glaze has less body compression acting on it. [Chen et al., *Materials* 16(16), 2023, PMC10456388 — academic confirmation]
3. **Underfired glaze** — silica hasn't fully dissolved into the glass matrix
4. **Delayed crazing** — appears weeks/months after firing, triggered by moisture absorption into porous bodies. Hamer explains that porous earthenware absorbs atmospheric moisture and expands permanently, while the glaze does not. [Hamer, p. 89]
5. **Thermal shock** — rapid cooling through quartz inversion (~573°C)

**Primary fixes (chemistry):**
- Increase silica (flint/quartz) in the glaze — lowers thermal expansion
- Increase alumina (add more clay/kaolin to the recipe)
- Decrease high-expansion fluxes: reduce sodium, potassium, lithium
- Substitute low-expansion fluxes: increase calcium (whiting), magnesium (talc, dolomite), zinc, or barium

**Secondary mitigations (process):**
- Apply glaze thinner
- Fire to full maturity
- Slow the cooling rate through quartz inversion (~573°C)

**Why it matters for functional ware:** Digitalfire reports measured strength losses of roughly **300–400%** in freshly fired ware with crazed glazes — cracks act as failure initiation sites. Crazed surfaces also harbor bacteria and can allow leaching of colorants. [Digitalfire "Glaze Crazing"; Digitalfire "Glaze Leaching Test"]

**Intentional crazing:** Some traditions (raku, Chinese Guan/Ge ware) use crazing decoratively, rubbing ink or tea into the cracks. This is an aesthetic choice, not a defect, in non-functional ware.

---

### 18.4 Shivering

**What it looks like:** The opposite of crazing — the glaze lifts off the body in sharp, razor-edged flakes or slivers. **This is a safety hazard** for functional ware because glass slivers can end up in food or drink.

Hamer states plainly: "shivering is the worse defect because sharp flakes of glaze detach from the pot and the result is dangerous on table and kitchen ware." [Hamer, p. 89]

**Cause:** Glaze CTE is much lower than the body's, putting the glaze under excessive compression. The glaze can't stretch enough and pops off. Compression concentrates at sharp edges, lips, and rims. [Digitalfire; Glazy; Ceramic Arts Network "5 Glaze Defects"]

**Fixes:**
- Decrease silica in the glaze (raises expansion)
- Increase high-expansion fluxes — more soda feldspar or nepheline syenite. Rhodes specifically recommends "increasing the high-expansion oxides in the glaze." [Rhodes, pp. 326-327]
- Apply glaze thinner, especially on edges
- Round off sharp edges on forms (compression concentrates at sharp angles)

**Note:** A small amount of compression in the glaze is actually *desirable* — it makes the glaze stronger and more durable (like tempered glass). The problem is when compression exceeds the glaze's strength. [Chen et al., *Materials* 16(16), 2023 — confirms that glaze cracks do not form when expansion coefficient is lower than the body's]

---

### 18.5 Running and Dripping

**What it looks like:** Glaze becomes too fluid during firing and flows down vertical surfaces, pooling at the base and potentially fusing the piece to the kiln shelf.

**Causes (ranked by likelihood):**

1. **Overfiring** — firing beyond the glaze's intended cone makes it too fluid. [Digitalfire; BigCeramicStore; Mayco *Ceramics 101*, p. 17]

2. **Excessively thick application** — more material + gravity = more flow

3. **High flux / low alumina recipe** — too much flux creates an overly fluid melt. Digitalfire shows that dramatic cone-6 running often traces to high sodium and lithium coupled with low silica — a chemistry choice, not just an application error. [Digitalfire "Runny Ceramic Glazes"]

4. **Layered glazes creating eutectics** — two glazes can create a lower melting point at their interface, causing excessive flow even at the correct temperature

5. **Highly alkaline glazes** — Rhodes notes these can be both runny and prone to crawling simultaneously. [Rhodes, p. 227]

**Fixes:**
- Fire to the correct cone (don't overfire)
- Apply glaze thinner, especially on the lower half of vertical pieces
- Reduce flux / increase alumina or silica in the recipe
- Test layered combinations on **vertical test tiles** before committing
- Keep the bottom ¼ inch of the pot glaze-free as a safety margin
- Use a **catch tray** (bisque dish or kiln shelf cookie) under pieces with known runny glazes
- Use a stable liner glaze inside to prevent pooling in the bottom of forms [Digitalfire]

**Cone/kiln caveats:** Especially common with combination/layered glazes at cone 6 — the eutectic effect makes individually-stable glazes very runny when layered. Many cone 6 potters routinely use kiln cookies as insurance. Running can also increase in reduction atmospheres for some glazes.

---

### 18.6 Color Inconsistency

**What it looks like:** Uneven color across a piece, or inconsistent results between firings.

**Causes (ranked by likelihood):**

1. **Uneven glaze thickness** — thicker areas appear darker/more saturated; thinner areas lighter. [BigCeramicStore; Digitalfire]

2. **Poorly mixed glaze** — Rhodes warns that heavier materials settle, and if the bucket isn't stirred frequently, portions of glaze used have the wrong composition. This is "a direct route to color and surface inconsistency." [Rhodes, p. 300]

3. **Cross-contamination** — especially copper, which is notorious for "traveling" in the kiln. Even tiny amounts create green spots on other glazes. Manganese and chrome are also contaminators. [Digitalfire; general practice]

4. **Kiln atmosphere/placement variation** — different locations experience different heat, airflow, or reduction. [BigCeramicStore]

5. **Batch variation** — different batches of raw materials can have slightly different chemistry. [BigCeramicStore; Mayco, p. 17]

**Fixes:**
- Apply at consistent thickness (use SG measurement)
- Stir/remix glaze thoroughly before each use
- Sieve regularly to ensure even colorant distribution
- Clean tools between colors
- Document kiln placement and correlate with results
- For critical color matching, use glaze from the same batch
- In shared studios, fire copper-glazed pieces separately or where drips won't reach other work

---

### 18.7 Blistering

**What it looks like:** Large bubbles (larger than pinholes) form in the glaze surface, often leaving a "moonscape" of burst craters.

**Causes (ranked by likelihood):**

1. **Excessively thick application** — more material = more trapped gas. Rhodes specifically notes blisters form where glaze pools on the inside bottom of bowls. [Rhodes, p. 332; Digitalfire "Glaze Blisters"]

2. **Underfired bisque / body outgassing** — incomplete organic burnout means gases escape through sealed glaze at peak temperature. [Mayco *Ceramics 101*, p. 12; Davis, "An Oxidized Bisque Firing," Aardvark Clay PDF]

3. **Volatile flux components** — sodium oxide and borate frits become volatile above ~1200°C. [Digitalfire "Glaze Blisters"]

4. **Residual moisture** — pieces not fully dry before glaze firing

5. **Excessively fast firing** — gases released too quickly

**Fixes:**
- Apply glaze thinner (especially watch bowl interiors)
- Ensure pieces are completely dry before loading
- Slow the firing, especially in the upper temperature range
- Add a soak at peak temperature to allow bubbles to heal
- Some potters find slower *cooling* helps more than a peak soak — gives the glaze more time in its fluid state to heal
- Ensure thorough bisque firing

**Cone/kiln caveats:** Low-fire more susceptible. Rhodes notes that reduction makes lead-glaze blistering more likely — fritted lead glazes are less prone than raw lead. [Rhodes, pp. 231, 252, 332]

---

### 18.8 Dry / Underfired Glaze

**What it looks like:** A rough, matte-looking glaze that should be glossy. The glaze particles have sintered but not fully fused into smooth glass.

**Causes (ranked by likelihood):**

1. **Kiln didn't reach target temperature** — element degradation in electric kilns, insufficient gas pressure in gas kilns. [BigCeramicStore; Mayco *Ceramics 101*, p. 13]

2. **Wrong glaze for the cone range** — e.g., a cone 10 glaze fired to cone 6

3. **Cold spots in the kiln** — uneven heat distribution (bottom, near doors)

4. **Glaze recipe has insufficient flux** — Vince Pitelka notes that if the kiln reached temperature but the glaze still looks dry, the formula needs more effective fluxing relative to alumina and silica. [Pitelka, "Common Glaze Faults" PDF]

5. **Too-thin application** — not enough material to form a continuous glass layer

**Fixes:**
- Verify kiln temperature with **witness cones** (not just the controller)
- Check kiln elements (electric) regularly — they degrade over hundreds of firings
- Ensure glaze matches your firing temperature
- **Refire** — often the simplest fix. Most underfired glazes fire perfectly on a second pass at the correct temperature, though some glazes develop slightly different colors/surfaces when refired
- If the formula is the problem, add flux or reformulate for your cone

**Cone/kiln caveats:** Exact cone is critical — varies by kiln type (electric vs. gas). Mayco: underfired = "cloudy/milky/lacking sheen." [Mayco *Ceramics 101*, p. 13]

---

### 18.9 Bonus: Additional Defects

**Carbon Coring / Black Coring:** Dark discoloration in the center of the clay body cross-section, caused by incomplete carbon burnout during bisque. Common with dense bodies, fast bisques, and kilns with poor early oxidation. Fix: slower bisque with good ventilation through the 600–900°C range. [Davis, "An Oxidized Bisque Firing," Aardvark Clay PDF]

**Dunting:** Cracking of the fired piece due to thermal shock during cooling, particularly through quartz inversion (~573°C) and cristobalite inversion (~226°C). Fix: slow cooling rate, especially through these critical temperature points. [Standard ceramic practice]

**Leaching (Food Safety):** Unstable glaze chemistries can release colorant metals (copper, lead, barium, manganese) into food/drink, especially in acidic conditions. Digitalfire distinguishes watertightness from chemical durability — "doesn't leak water" is not the same as "food-safe glaze chemistry." Crazing makes leaching worse because cracks expose more surface area and porous clay can harbor contamination. Functional ware should have a dense body (typically under ~1% porosity) and a stable, well-fitted glaze. [Digitalfire "Leaking of Fired Ceramics"; Digitalfire "Glaze Leaching Test"; Digitalfire "Glaze Crazing"]
