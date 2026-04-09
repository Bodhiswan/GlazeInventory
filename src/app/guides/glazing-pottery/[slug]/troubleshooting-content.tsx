import { GuideSection } from "@/components/guide/guide-section";
import {
  Bibliography,
  Cite,
  Reference,
} from "@/components/guide/citation";
import type { TocItem } from "@/components/guide/guide-toc";

export const troubleshootingToc: TocItem[] = [
  { id: "common-defects", label: "18. Common Glaze Defects", level: 2 },
  { id: "crawling", label: "18.1 Crawling", level: 3 },
  { id: "pinholing", label: "18.2 Pinholing & Bloating", level: 3 },
  { id: "crazing", label: "18.3 Crazing", level: 3 },
  { id: "shivering", label: "18.4 Shivering", level: 3 },
  { id: "running", label: "18.5 Running & Dripping", level: 3 },
  { id: "color-inconsistency", label: "18.6 Color Inconsistency", level: 3 },
  { id: "blistering", label: "18.7 Blistering", level: 3 },
  { id: "dry-underfired", label: "18.8 Dry / Underfired Glaze", level: 3 },
  { id: "bonus-defects", label: "18.9 Additional Defects", level: 3 },
];

export function TroubleshootingContent() {
  return (
    <>
      <GuideSection id="common-defects" title="18. Common Glaze Defects">
        <p>
          Every potter encounters glaze defects. The key to solving them is
          understanding whether the root cause is <em>application</em>,{" "}
          <em>chemistry</em>, or <em>firing</em> — because the fix for each is
          completely different. Below, each defect is listed with causes ranked
          by likelihood and specific fixes.
        </p>
      </GuideSection>

      {/* ── 18.1 Crawling ── */}
      <GuideSection id="crawling" title="18.1 Crawling" level={3}>
        <p>
          <strong>What it looks like:</strong> Molten glaze pulls away from
          areas of the pot during firing, forming beads or islands of glaze
          with bare clay patches between them.
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Causes (ranked by likelihood)
        </p>
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            <strong>Dusty, greasy, or contaminated bisqueware</strong> — oils
            from handling or dust create barriers that prevent adhesion. Hamer
            notes that crawling often begins with poor dry-glaze adhesion
            before the kiln gets hot.
            <Cite id="1">Hamer p.89</Cite>
            <Cite id="2">Mayco p.18</Cite>
          </li>
          <li>
            <strong>Excessive drying shrinkage</strong> — glazes with high raw
            clay content (especially uncalcined kaolin or ball clay) shrink
            excessively as they dry, cracking the raw glaze layer.
            <Cite id="3">Digitalfire &ldquo;crawling&rdquo;</Cite>
          </li>
          <li>
            <strong>Excessively thick application</strong> — thick layers
            crack more during drying and take longer to melt through.
            <Cite id="1">Hamer p.89</Cite>
          </li>
          <li>
            <strong>High surface tension in the melt</strong> — zirconium,
            tin oxide, and high zinc increase surface tension, causing the
            melt to bead up rather than wet the body.
            <Cite id="3">Digitalfire &ldquo;crawling&rdquo;</Cite>
          </li>
          <li>
            <strong>Thickened/evaporated slurry</strong> — a slurry that has
            thickened by evaporation is more likely to crawl because the
            melted glaze prefers to pull together.
            <Cite id="1">Hamer p.89</Cite>
          </li>
          <li>
            <strong>Highly alkaline glazes</strong> — Rhodes notes these can
            have high surface tension when melted, making them vulnerable to
            crawling even while being fluid enough to run.
            <Cite id="4">Rhodes p.227</Cite>
          </li>
        </ol>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Fixes
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Clean bisqueware thoroughly before glazing (damp sponge wipe)</li>
          <li>Apply glaze at appropriate thickness (thinner coats)</li>
          <li>
            Calcine high-shrinkage materials — replace a portion of raw kaolin
            with calcined kaolin
          </li>
          <li>Add a small amount of gum (CMC) to improve raw-layer adhesion</li>
          <li>Reduce zirconium and tin oxide if possible</li>
          <li>Recondition thickened slurry — don&apos;t just add water; re-sieve and check SG</li>
        </ul>

        <p>
          <strong>Cone/kiln notes:</strong> More common in matte glazes
          (higher alumina = higher viscosity/surface tension) and high-clay
          low-fire glazes. Some potters intentionally exploit crawling as a
          decorative effect with purpose-formulated crawl glazes.
        </p>
      </GuideSection>

      {/* ── 18.2 Pinholing ── */}
      <GuideSection id="pinholing" title="18.2 Pinholing & Bloating" level={3}>
        <p>
          <strong>What it looks like:</strong> Pinholes are tiny holes (about
          pinhead size) in the fired glaze surface, sometimes penetrating to
          the clay body. Bloating is a more severe form where trapped gas
          causes the clay body itself to swell.
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Causes (ranked by likelihood)
        </p>
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            <strong>Incomplete burnout of organic matter or carbonates</strong>{" "}
            — gases escape from the clay body during glaze firing, after the
            glaze surface has sealed. Steve Davis (Aardvark Clay) identifies
            incomplete carbon burnout as a shared root cause of bloating,
            black coring, pinholing, and blistering.
            <Cite id="3">Digitalfire &ldquo;Glaze Pinholes&rdquo;</Cite>
            <Cite id="2">Mayco p.12</Cite>
            <Cite id="5">Davis, Aardvark Clay</Cite>
          </li>
          <li>
            <strong>Insufficient soak time at peak temperature</strong> — the
            glaze doesn&apos;t have enough time in its fluid state to heal
            over burst bubbles.
            <Cite id="3">Digitalfire</Cite>
          </li>
          <li>
            <strong>Excessively fast ramp through 600–900°C</strong> —
            volatiles don&apos;t escape before the surface seals.
            <Cite id="6">Glazy &ldquo;Common Glaze Defects&rdquo;</Cite>
          </li>
          <li>
            <strong>Thick glaze application</strong> — more material to
            outgas through.
          </li>
          <li>
            <strong>Rough, grogged, or trimmed body surfaces</strong> —
            pinholes often form when glaze dries over surface voids from
            trimming or coarse grog.
            <Cite id="3">Digitalfire &ldquo;Glaze Pinholes&rdquo;</Cite>
          </li>
        </ol>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Fixes
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Slow bisque firing, especially through 600–900°C burnout zone</li>
          <li>
            Add a <strong>soak at peak glaze temperature</strong> — 10–30
            minutes allows the surface to heal. The &ldquo;drop-and-hold&rdquo;
            technique (fire slightly past peak, then drop temperature and soak)
            is effective for some glazes.
          </li>
          <li>Apply glaze at appropriate thickness</li>
          <li>Smooth rough trimmed areas before glazing</li>
          <li>Ensure proper kiln ventilation during early firing</li>
        </ul>

        <p>
          <strong>Cone/kiln notes:</strong> Low-fire (cone 06) is more prone
          because bisque and glaze temps are close together. Gas kilns in
          reduction need extra attention to early ventilation. High-fire
          stoneware is less prone if properly bisqued.
        </p>
      </GuideSection>

      {/* ── 18.3 Crazing ── */}
      <GuideSection id="crazing" title="18.3 Crazing" level={3}>
        <p>
          <strong>What it looks like:</strong> A network of fine cracks in the
          glaze surface, similar to crackle in old china.
        </p>
        <p>
          <strong>Primary cause: thermal expansion mismatch.</strong> The
          glaze&apos;s coefficient of thermal expansion (CTE) is higher than
          the clay body&apos;s. As the kiln cools, the glaze contracts more
          than the clay, putting the glaze under tension until it cracks.
          <Cite id="3">Digitalfire &ldquo;Glaze Crazing&rdquo;</Cite>
          <Cite id="1">Hamer p.89</Cite>
          <Cite id="7">Rhodes pp.172-183</Cite>
        </p>
        <p>
          Process tweaks (slow cooling, thinner application) are secondary
          mitigations only.{" "}
          <strong>
            The primary cure is changing the glaze chemistry to fix the
            expansion mismatch.
          </strong>
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Contributing factors
        </p>
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            <strong>Too much sodium, potassium, or lithium</strong> in the
            glaze formula (high-expansion fluxes).
            <Cite id="7">Rhodes pp.172-183</Cite>
          </li>
          <li>
            <strong>Thick application</strong> — thicker glaze has less body
            compression acting on it.
            <Cite id="8">Chen et al., Materials 16(16), 2023</Cite>
          </li>
          <li>
            <strong>Underfired glaze</strong> — silica hasn&apos;t fully
            dissolved into the glass matrix.
          </li>
          <li>
            <strong>Delayed crazing</strong> — appears weeks or months after
            firing. Hamer explains that porous earthenware absorbs atmospheric
            moisture and expands permanently, while the glaze does not.
            <Cite id="1">Hamer p.89</Cite>
          </li>
          <li>
            <strong>Thermal shock</strong> — rapid cooling through quartz
            inversion (~573°C).
          </li>
        </ol>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Primary fixes (chemistry)
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Increase silica (flint/quartz) in the glaze — lowers thermal expansion</li>
          <li>Increase alumina (add more clay/kaolin to the recipe)</li>
          <li>Decrease high-expansion fluxes: reduce sodium, potassium, lithium</li>
          <li>
            Substitute low-expansion fluxes: increase calcium (whiting),
            magnesium (talc, dolomite), zinc, or barium
          </li>
        </ul>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Secondary mitigations (process)
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Apply glaze thinner</li>
          <li>Fire to full maturity</li>
          <li>Slow the cooling rate through quartz inversion (~573°C)</li>
        </ul>

        <p>
          <strong>Why it matters for functional ware:</strong> Digitalfire
          reports measured strength losses of roughly 300–400% in freshly
          fired ware with crazed glazes — cracks act as failure initiation
          sites. Crazed surfaces also harbor bacteria and can allow leaching
          of colorants.
          <Cite id="3">Digitalfire &ldquo;Glaze Crazing&rdquo;</Cite>
          <Cite id="9">Digitalfire &ldquo;Glaze Leaching Test&rdquo;</Cite>
        </p>

        <p>
          <strong>Intentional crazing:</strong> Some traditions (raku, Chinese
          Guan/Ge ware) use crazing decoratively, rubbing ink or tea into the
          cracks. This is an aesthetic choice, not a defect, in non-functional
          ware.
        </p>
      </GuideSection>

      {/* ── 18.4 Shivering ── */}
      <GuideSection id="shivering" title="18.4 Shivering" level={3}>
        <p>
          <strong>What it looks like:</strong> The opposite of crazing — the
          glaze lifts off the body in sharp, razor-edged flakes or slivers.{" "}
          <strong>This is a safety hazard</strong> for functional ware because
          glass slivers can end up in food or drink.
        </p>
        <p>
          Hamer states plainly: shivering is the worse defect because sharp
          flakes of glaze detach from the pot, and the result is dangerous on
          table and kitchen ware.
          <Cite id="1">Hamer p.89</Cite>
        </p>
        <p>
          <strong>Cause:</strong> Glaze CTE is much lower than the body&apos;s,
          putting the glaze under excessive compression. The glaze can&apos;t
          stretch enough and pops off. Compression concentrates at sharp
          edges, lips, and rims.
          <Cite id="3">Digitalfire</Cite>
          <Cite id="6">Glazy</Cite>
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Fixes
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Decrease silica in the glaze (raises expansion)</li>
          <li>
            Increase high-expansion fluxes — more soda feldspar or nepheline
            syenite.
            <Cite id="10">Rhodes pp.326-327</Cite>
          </li>
          <li>Apply glaze thinner, especially on edges</li>
          <li>
            Round off sharp edges on forms (compression concentrates at sharp
            angles)
          </li>
        </ul>

        <p>
          <strong>Note:</strong> A small amount of compression is actually{" "}
          <em>desirable</em> — it makes the glaze stronger and more durable
          (like tempered glass). The problem is when compression exceeds the
          glaze&apos;s strength.
          <Cite id="8">Chen et al., 2023</Cite>
        </p>
      </GuideSection>

      {/* ── 18.5 Running ── */}
      <GuideSection id="running" title="18.5 Running & Dripping" level={3}>
        <p>
          <strong>What it looks like:</strong> Glaze becomes too fluid during
          firing and flows down vertical surfaces, pooling at the base and
          potentially fusing the piece to the kiln shelf.
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Causes (ranked by likelihood)
        </p>
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            <strong>Overfiring</strong> — firing beyond the glaze&apos;s
            intended cone makes it too fluid.
            <Cite id="3">Digitalfire</Cite>
            <Cite id="2">Mayco p.17</Cite>
          </li>
          <li>
            <strong>Excessively thick application</strong> — more material +
            gravity = more flow.
          </li>
          <li>
            <strong>High flux / low alumina recipe</strong> — too much flux
            creates an overly fluid melt. Dramatic cone-6 running often traces
            to high sodium and lithium coupled with low silica.
            <Cite id="11">Digitalfire &ldquo;Runny Ceramic Glazes&rdquo;</Cite>
          </li>
          <li>
            <strong>Layered glazes creating eutectics</strong> — two glazes
            can create a lower melting point at their interface, causing
            excessive flow even at the correct temperature.
          </li>
          <li>
            <strong>Highly alkaline glazes</strong> — can be both runny and
            prone to crawling simultaneously.
            <Cite id="4">Rhodes p.227</Cite>
          </li>
        </ol>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Fixes
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Fire to the correct cone (don&apos;t overfire)</li>
          <li>
            Apply glaze thinner, especially on the lower half of vertical
            pieces
          </li>
          <li>Reduce flux / increase alumina or silica in the recipe</li>
          <li>
            Test layered combinations on <strong>vertical test tiles</strong>{" "}
            before committing
          </li>
          <li>
            Keep the bottom ¼ inch of the pot glaze-free as a safety margin
          </li>
          <li>
            Use a <strong>catch tray</strong> (bisque dish or kiln shelf
            cookie) under pieces with known runny glazes
          </li>
        </ul>

        <p>
          <strong>Cone/kiln notes:</strong> Especially common with
          combination/layered glazes at cone 6 — the eutectic effect makes
          individually-stable glazes very runny when layered. Many cone 6
          potters routinely use kiln cookies as insurance.
        </p>
      </GuideSection>

      {/* ── 18.6 Color Inconsistency ── */}
      <GuideSection id="color-inconsistency" title="18.6 Color Inconsistency" level={3}>
        <p>
          <strong>What it looks like:</strong> Uneven color across a piece, or
          inconsistent results between firings.
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Causes (ranked by likelihood)
        </p>
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            <strong>Uneven glaze thickness</strong> — thicker areas appear
            darker/more saturated; thinner areas lighter.
            <Cite id="3">Digitalfire</Cite>
          </li>
          <li>
            <strong>Poorly mixed glaze</strong> — Rhodes warns that heavier
            materials settle, and if the bucket isn&apos;t stirred frequently,
            portions of glaze used have the wrong composition.
            <Cite id="12">Rhodes p.300</Cite>
          </li>
          <li>
            <strong>Cross-contamination</strong> — copper is notorious for
            &ldquo;traveling&rdquo; in the kiln. Even tiny amounts create
            green spots on other glazes. Manganese and chrome are also
            contaminators.
            <Cite id="3">Digitalfire</Cite>
          </li>
          <li>
            <strong>Kiln atmosphere/placement variation</strong> — different
            locations experience different heat, airflow, or reduction.
          </li>
          <li>
            <strong>Batch variation</strong> — different batches of raw
            materials can have slightly different chemistry.
            <Cite id="2">Mayco p.17</Cite>
          </li>
        </ol>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Fixes
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Apply at consistent thickness (use SG measurement)</li>
          <li>Stir/remix glaze thoroughly before each use</li>
          <li>Sieve regularly to ensure even colorant distribution</li>
          <li>Clean tools between colors</li>
          <li>Document kiln placement and correlate with results</li>
          <li>
            In shared studios, fire copper-glazed pieces separately or where
            drips won&apos;t reach other work
          </li>
        </ul>
      </GuideSection>

      {/* ── 18.7 Blistering ── */}
      <GuideSection id="blistering" title="18.7 Blistering" level={3}>
        <p>
          <strong>What it looks like:</strong> Large bubbles (larger than
          pinholes) form in the glaze surface, often leaving a
          &ldquo;moonscape&rdquo; of burst craters.
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Causes (ranked by likelihood)
        </p>
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            <strong>Excessively thick application</strong> — more material =
            more trapped gas. Rhodes specifically notes blisters form where
            glaze pools on the inside bottom of bowls.
            <Cite id="13">Rhodes p.332</Cite>
            <Cite id="14">Digitalfire &ldquo;Glaze Blisters&rdquo;</Cite>
          </li>
          <li>
            <strong>Underfired bisque / body outgassing</strong> — incomplete
            organic burnout means gases escape through sealed glaze at peak
            temperature.
            <Cite id="2">Mayco p.12</Cite>
            <Cite id="5">Davis, Aardvark Clay</Cite>
          </li>
          <li>
            <strong>Volatile flux components</strong> — sodium oxide and
            borate frits become volatile above ~1200°C.
            <Cite id="14">Digitalfire &ldquo;Glaze Blisters&rdquo;</Cite>
          </li>
          <li>
            <strong>Residual moisture</strong> — pieces not fully dry before
            glaze firing.
          </li>
          <li>
            <strong>Excessively fast firing</strong> — gases released too
            quickly.
          </li>
        </ol>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Fixes
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Apply glaze thinner (especially watch bowl interiors)</li>
          <li>Ensure pieces are completely dry before loading</li>
          <li>Slow the firing, especially in the upper temperature range</li>
          <li>
            Add a soak at peak temperature to allow bubbles to heal
          </li>
          <li>
            Some potters find slower <em>cooling</em> helps more than a peak
            soak — gives the glaze more time in its fluid state to heal
          </li>
          <li>Ensure thorough bisque firing</li>
        </ul>

        <p>
          <strong>Cone/kiln notes:</strong> Low-fire more susceptible. Rhodes
          notes that reduction makes lead-glaze blistering more likely —
          fritted lead glazes are less prone than raw lead.
          <Cite id="13">Rhodes pp.231, 252, 332</Cite>
        </p>
      </GuideSection>

      {/* ── 18.8 Dry / Underfired ── */}
      <GuideSection id="dry-underfired" title="18.8 Dry / Underfired Glaze" level={3}>
        <p>
          <strong>What it looks like:</strong> A rough, matte-looking glaze
          that should be glossy. The glaze particles have sintered but not
          fully fused into smooth glass.
        </p>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Causes (ranked by likelihood)
        </p>
        <ol className="ml-4 list-decimal space-y-2">
          <li>
            <strong>Kiln didn&apos;t reach target temperature</strong> —
            element degradation in electric kilns, insufficient gas pressure
            in gas kilns.
            <Cite id="2">Mayco p.13</Cite>
          </li>
          <li>
            <strong>Wrong glaze for the cone range</strong> — e.g., a cone 10
            glaze fired to cone 6.
          </li>
          <li>
            <strong>Cold spots in the kiln</strong> — uneven heat
            distribution (bottom, near doors).
          </li>
          <li>
            <strong>Insufficient flux in the formula</strong> — Pitelka notes
            that if the kiln reached temperature but the glaze still looks
            dry, the formula needs more effective fluxing.
            <Cite id="15">Pitelka, &ldquo;Common Glaze Faults&rdquo;</Cite>
          </li>
          <li>
            <strong>Too-thin application</strong> — not enough material to
            form a continuous glass layer.
          </li>
        </ol>

        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-foreground">
          Fixes
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Verify kiln temperature with{" "}
            <strong>witness cones</strong> (not just the controller)
          </li>
          <li>
            Check kiln elements (electric) regularly — they degrade over
            hundreds of firings
          </li>
          <li>Ensure glaze matches your firing temperature</li>
          <li>
            <strong>Refire</strong> — often the simplest fix. Most underfired
            glazes fire perfectly on a second pass at the correct temperature
          </li>
          <li>
            If the formula is the problem, add flux or reformulate for your
            cone
          </li>
        </ul>
      </GuideSection>

      {/* ── 18.9 Bonus ── */}
      <GuideSection id="bonus-defects" title="18.9 Additional Defects" level={3}>
        <p>
          <strong>Carbon Coring / Black Coring:</strong> Dark discoloration in
          the center of the clay body cross-section, caused by incomplete
          carbon burnout during bisque. Common with dense bodies, fast
          bisques, and kilns with poor early oxidation. Fix: slower bisque
          with good ventilation through the 600–900°C range.
          <Cite id="5">Davis, Aardvark Clay</Cite>
        </p>
        <p>
          <strong>Dunting:</strong> Cracking of the fired piece due to thermal
          shock during cooling, particularly through quartz inversion (~573°C)
          and cristobalite inversion (~226°C). Fix: slow cooling rate,
          especially through these critical temperature points.
        </p>
        <p>
          <strong>Leaching (Food Safety):</strong> Unstable glaze chemistries
          can release colorant metals (copper, lead, barium, manganese) into
          food and drink, especially in acidic conditions. Digitalfire
          distinguishes watertightness from chemical durability —
          &ldquo;doesn&apos;t leak water&rdquo; is not the same as
          &ldquo;food-safe glaze chemistry.&rdquo; Crazing makes leaching
          worse because cracks expose more surface area and porous clay can
          harbor contamination. Functional ware should have a dense body
          (typically under ~1% porosity) and a stable, well-fitted glaze.
          <Cite id="16">Digitalfire &ldquo;Leaking of Fired Ceramics&rdquo;</Cite>
          <Cite id="9">Digitalfire &ldquo;Glaze Leaching Test&rdquo;</Cite>
        </p>
      </GuideSection>

      {/* ── References ── */}
      <Bibliography>
        <Reference id="1">
          Frank &amp; Janet Hamer, <em>The Potter&apos;s Dictionary of
          Materials and Techniques</em>, 3rd ed., p. 89.
        </Reference>
        <Reference id="2">
          Mayco Colors, <em>Ceramics 101</em> technical booklet.
        </Reference>
        <Reference id="3">
          Tony Hansen, Digitalfire Reference Library,{" "}
          <a href="https://digitalfire.com" className="underline">
            digitalfire.com
          </a>{" "}
          (articles: &ldquo;Crawling,&rdquo; &ldquo;Glaze Pinholes,&rdquo;
          &ldquo;Glaze Crazing,&rdquo; &ldquo;Runny Ceramic Glazes&rdquo;).
        </Reference>
        <Reference id="4">
          Daniel Rhodes, <em>Clay and Glazes for the Potter</em>, 3rd ed.,
          Krause Publications, 2000, p. 227.
        </Reference>
        <Reference id="5">
          Steve Davis, &ldquo;An Oxidized Bisque Firing,&rdquo; Aardvark Clay
          technical PDF.
        </Reference>
        <Reference id="6">
          Glazy,{" "}
          <a href="https://glazy.org" className="underline">
            glazy.org
          </a>{" "}
          &ldquo;Common Glaze Defects.&rdquo;
        </Reference>
        <Reference id="7">
          Rhodes, pp. 172-183 (thermal expansion, Seger unity formula).
        </Reference>
        <Reference id="8">
          Chen et al., &ldquo;Effect of Glaze Composition on Crack
          Formation,&rdquo; <em>Materials</em> 16(16), 2023, PMC10456388.
        </Reference>
        <Reference id="9">
          Tony Hansen, &ldquo;Glaze Leaching Test,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/glaze+leaching+test" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="10">
          Rhodes, pp. 326-327 (shivering remedies).
        </Reference>
        <Reference id="11">
          Tony Hansen, &ldquo;Runny Ceramic Glazes,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/running+glaze" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="12">
          Rhodes, p. 300 (glaze mixing and settling).
        </Reference>
        <Reference id="13">
          Rhodes, pp. 231, 252, 332 (blistering, lead glazes).
        </Reference>
        <Reference id="14">
          Tony Hansen, &ldquo;Glaze Blisters,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/glaze+blisters" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="15">
          Vince Pitelka, &ldquo;Common Glaze Faults,&rdquo; Appalachian
          Center for Craft PDF.
        </Reference>
        <Reference id="16">
          Tony Hansen, &ldquo;Leaking of Fired Ceramics,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/leaking" className="underline">
            digitalfire.com
          </a>.
        </Reference>
      </Bibliography>
    </>
  );
}
