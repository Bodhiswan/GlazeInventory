import { GuideSection } from "@/components/guide/guide-section";
import {
  Bibliography,
  Cite,
  Reference,
} from "@/components/guide/citation";
import { GuideVideo } from "@/components/guide/guide-video";
import type { TocItem } from "@/components/guide/guide-toc";

export const foundationsToc: TocItem[] = [
  { id: "understanding-glazes", label: "1. Understanding Ceramic Glazes", level: 2 },
  { id: "what-a-glaze-is", label: "1.1 What a Glaze Is", level: 3 },
  { id: "glazes-vs-paint", label: "1.2 Glazes vs. Paint", level: 3 },
  { id: "bisque-firing", label: "1.3 The Role of Bisque Firing", level: 3 },
  { id: "cone-ranges", label: "1.4 Cone Ranges", level: 3 },
  { id: "consistency", label: "2. Glaze Consistency & Measurement", level: 2 },
  { id: "specific-gravity", label: "2.1 Specific Gravity", level: 3 },
  { id: "measuring-sg", label: "2.2 Measuring SG", level: 3 },
  { id: "deflocculants-flocculants", label: "2.3 Deflocculants & Flocculants", level: 3 },
  { id: "thixotropy", label: "2.4 Thixotropy", level: 3 },
  { id: "sieving", label: "2.5 Sieving", level: 3 },
  { id: "aging", label: "2.6 Aging Glazes", level: 3 },
  { id: "surface-prep", label: "3. Surface Preparation", level: 2 },
  { id: "bisque-porosity", label: "3.1 Bisque Temp & Porosity", level: 3 },
  { id: "cleaning", label: "3.2 Cleaning Bisqueware", level: 3 },
  { id: "dampening", label: "3.3 Dampening Before Application", level: 3 },
  { id: "wax-resist", label: "3.4 Wax Resist on the Foot", level: 3 },
];

export function FoundationsContent() {
  return (
    <>
      {/* ── Section 1 ── */}
      <GuideSection id="understanding-glazes" title="1. Understanding Ceramic Glazes">
        <p>
          Before layering, brushwork, or decorative techniques make sense, you
          need to understand what a glaze actually <em>is</em> — and why it
          behaves nothing like paint.
        </p>
      </GuideSection>

      <GuideSection id="what-a-glaze-is" title="1.1 What a Glaze Is" level={3}>
        <p>
          A ceramic glaze is a thin layer of glass permanently fused to a
          ceramic body through firing. Every glaze is built from three essential
          components:
        </p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <strong>Glass-former (silica / SiO₂)</strong> — the backbone. Pure
            silica melts at ~1713°C, far too high for practical pottery.
            <Cite id="1">Rhodes Ch.8-10</Cite>
          </li>
          <li>
            <strong>Flux</strong> — metal oxides that lower the melting point.
            Sodium and potassium work at low temperatures; calcium and magnesium
            at higher ones.
            <Cite id="2">IU Southeast Handbook p.3</Cite>
          </li>
          <li>
            <strong>Alumina (Al₂O₃)</strong> — the stiffening agent. Increases
            viscosity so glaze doesn&apos;t run off vertical surfaces.
            <Cite id="3">Mayco Ceramics 101 p.17</Cite>
          </li>
        </ul>
        <p>
          This triad can be expressed using the{" "}
          <strong>Seger unity formula</strong>, which normalizes all fluxes to
          total 1.00. This makes it possible to compare glazes chemically and
          diagnose problems like crazing, where high-expansion fluxes are
          usually the culprit.
          <Cite id="4">Rhodes pp.172-183</Cite>
        </p>
      </GuideSection>

      <GuideSection id="glazes-vs-paint" title="1.2 How Glazes Differ from Paint" level={3}>
        <p>
          Paint dries by evaporation and sits on the surface. Glaze undergoes a
          permanent chemical transformation: raw materials melt, flow, and fuse
          with the clay at 900–1300°C+, forming an intermediate layer where
          glaze and clay intermingle. Once cooled, the glaze is glass bonded to
          ceramic — it cannot be removed without breaking the object.
          <Cite id="1">Rhodes Ch.8</Cite>
          <Cite id="3">Mayco Ceramics 101 p.17</Cite>
        </p>
        <p>
          This matters practically: glaze application depends on the{" "}
          <em>porosity</em> of bisqueware to absorb water from the suspension
          and deposit an even layer of particles. Treating glaze like paint leads
          to poor results.
        </p>
      </GuideSection>

      <GuideSection id="bisque-firing" title="1.3 The Role of Bisque Firing" level={3}>
        <p>
          Bisque firing is the first firing of raw clay. It drives off moisture,
          burns out organic matter, and passes through quartz inversion
          (573°C), giving structural strength while retaining porosity. Standard
          range: <strong>cone 08–04 (~950–1060°C)</strong>. Cone 04 is the most
          common.
          <Cite id="5">Digitalfire &ldquo;bisque&rdquo;</Cite>
          <Cite id="3">Mayco Ceramics 101 p.12</Cite>
        </p>
        <p>
          A properly bisqued piece retains &gt;15% porosity — enough to absorb
          glaze quickly and deposit an even coating.
        </p>
        <p>
          <strong>Low-fire context:</strong> For cone 06 glaze, Mayco recommends
          bisque 1–2 cones <em>hotter</em> (e.g., bisque cone 04, glaze cone
          06) to ensure complete organic burnout. For mid/high-fire (cone 6+),
          bisque is typically <em>lower</em> than glaze temperature.
          <Cite id="3">Mayco Ceramics 101 p.12</Cite>
        </p>
      </GuideSection>

      <GuideSection id="cone-ranges" title="1.4 Cone Ranges" level={3}>
        <p>
          &ldquo;Cone&rdquo; measures <strong>heatwork</strong> (temperature ×
          time), not temperature alone. The same peak reached quickly produces
          different results than reached slowly.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="py-2 pr-4">Range</th>
                <th className="py-2 pr-4">Cones</th>
                <th className="py-2 pr-4">Temperature</th>
                <th className="py-2">Typical Use</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Low-fire</td>
                <td className="py-2 pr-4">06 – 02</td>
                <td className="py-2 pr-4">~999–1120°C</td>
                <td className="py-2">Earthenware, bright colors, most commercial brush-on glazes</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Mid-fire</td>
                <td className="py-2 pr-4">4 – 7</td>
                <td className="py-2 pr-4">~1162–1240°C</td>
                <td className="py-2">Stoneware, most studio pottery today</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">High-fire</td>
                <td className="py-2 pr-4">8 – 13</td>
                <td className="py-2 pr-4">~1263–1346°C</td>
                <td className="py-2">Stoneware and porcelain, limited color palette, very durable</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Cone 6 dominates American studio pottery — good durability, wide color
          range, efficient with electric kilns. Glazes must be fired to their
          labeled cone; underfired glazes appear cloudy and may not be food-safe.
          <Cite id="6">Orton Ceramic Foundation</Cite>
          <Cite id="3">Mayco p.13</Cite>
        </p>
      </GuideSection>

      {/* ── Section 2 ── */}
      <GuideSection id="consistency" title="2. Glaze Consistency & Measurement">
        <p>
          Consistent results require consistent glaze. Specific gravity is the
          single most important measurement for repeatable application.
        </p>
      </GuideSection>

      <GuideSection id="specific-gravity" title="2.1 Specific Gravity" level={3}>
        <p>
          Specific gravity (SG) is the ratio of glaze weight to an equal volume
          of water. Water = 1.0, so a glaze at SG 1.45 weighs 1.45× as much.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="py-2 pr-4">Method</th>
                <th className="py-2 pr-4">SG Range</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Dipping</td>
                <td className="py-2 pr-4">1.40–1.70</td>
                <td className="py-2">Most commonly 1.43–1.55. Mayco dry: 1.47–1.51.</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Pouring</td>
                <td className="py-2 pr-4">1.50–1.60</td>
                <td className="py-2" />
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Brushing</td>
                <td className="py-2 pr-4">~1.25–1.55</td>
                <td className="py-2">Gums/binders do the work. &ldquo;Latex paint&rdquo; consistency.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">Spraying</td>
                <td className="py-2 pr-4">~1.25–1.40</td>
                <td className="py-2">Thinnest. Constant agitation required.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The &ldquo;correct&rdquo; SG is always recipe-specific. AMACO
          DL-series glazes are recommended at SG 1.52–1.58 depending on formula.
          <Cite id="7">AMACO product pages</Cite>
          <Cite id="8">Digitalfire &ldquo;specific gravity&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="measuring-sg" title="2.2 Measuring Specific Gravity" level={3}>
        <p>
          <strong>Weight-per-volume (recommended):</strong> Fill a 100cc
          graduated cylinder with glaze and weigh it. If 100cc weighs 145g,
          SG = 1.45.
          <Cite id="9">Sue McLeod Ceramics</Cite>
        </p>
        <p>
          <strong>Hydrometer:</strong> Usable but limited — most glazes cluster
          around SG 1.4–1.5, so readings are compressed and hard to
          distinguish. Thick or thixotropic glazes can also prevent free
          floating. Weight-per-volume is more reliable for most potters.
          <Cite id="8">Digitalfire</Cite>
          <Cite id="10">The Studio Manager</Cite>
        </p>
        <p>
          <strong>Flow testing:</strong> SG alone doesn&apos;t fully describe
          behavior. Georgies recommends checking that mixed glaze keeps spinning
          ~5 seconds, or evacuates a drip cup in 15–25 seconds.
          <Cite id="11">Georgies PDF</Cite>
        </p>
        <GuideVideo
          pending
          title="Specific gravity walkthrough"
          channel="TBD — audit required"
          note="Looking for a 5–10 min demo of the graduated-cylinder + scale method on a studio glaze bucket. Ideally Sue McLeod Ceramics, John Britt, or an AMACO official video."
        />
      </GuideSection>

      <GuideSection id="deflocculants-flocculants" title="2.3 Deflocculants & Flocculants" level={3}>
        <p>
          <strong>Deflocculants</strong> disperse particles (reduce viscosity at
          same solids): Darvan 7 and 811 (sodium polyelectrolytes). Dosage:
          0.3–0.5% for porcelain. Powerful — over-deflocculation creates
          impenetrable hard pan.
          <Cite id="12">Vanderbilt Minerals TDS</Cite>
        </p>
        <p>
          <strong>Flocculants</strong> attract particles (create thixotropic
          gel): Epsom salts (most common — ½–3 tsp per 5 gallons), vinegar
          (temporary effect), calcium chloride.
          <Cite id="13">Arbuckle p.4</Cite>
          <Cite id="14">Digitalfire &ldquo;flocculation&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="thixotropy" title="2.4 Thixotropy" level={3}>
        <p>
          Thixotropy is time-dependent behavior where a suspension is fluid when
          stirred but gels on standing. Ideal for glazing — moves easily in the
          bucket, stays put on the pot. Controlled by proper flocculation.
          <Cite id="15">Hamer p.154</Cite>
        </p>
      </GuideSection>

      <GuideSection id="sieving" title="2.5 Sieving" level={3}>
        <p>
          Sieve glazes to remove lumps and contaminants. 80-mesh is standard
          for stoneware/earthenware (Mayco: &ldquo;80 mesh or finer&rdquo;).
          100–120 for finer work; 200+ for porcelain. Pass 2–3 times.
          <Cite id="3">Mayco p.18</Cite>
          <Cite id="16">Rhodes p.133</Cite>
        </p>
        <p>
          Rhodes notes that raw glaze materials are usually ground fine enough
          to pass 200-mesh — studio sieving is about breaking agglomerates and
          catching contaminants, not creating fineness from scratch.
        </p>
      </GuideSection>

      <GuideSection id="aging" title="2.6 Aging Glazes" level={3}>
        <p>
          Freshly mixed glazes benefit from sitting 24–48 hours minimum.
          Minerals hydrate, particles disperse, and the suspension equilibrates.
          Some potters age for weeks. Glazes with organic binders (CMC) can
          develop mold if aged too long — a drop of bleach prevents this.
          <Cite id="16">Rhodes Ch.24</Cite>
        </p>
      </GuideSection>

      {/* ── Section 3 ── */}
      <GuideSection id="surface-prep" title="3. Surface Preparation">
        <p>
          How you prepare the bisque surface directly affects glaze adhesion,
          thickness, and defect risk.
        </p>
      </GuideSection>

      <GuideSection id="bisque-porosity" title="3.1 Bisque Temperature & Porosity" level={3}>
        <p>
          Lower bisque = more porous = faster glaze absorption. Cone 08 (~950°C)
          is very porous but fragile. Cone 04 (~1060°C) is the sweet spot for
          most studios. Cone 02+ is &ldquo;hard bisque&rdquo; — may need
          dampening.
          <Cite id="9">Sue McLeod</Cite>
          <Cite id="5">Digitalfire</Cite>
        </p>
        <p>
          The clay body matters as much as cone number — a porcelain at cone 04
          will be much less porous than coarse stoneware at the same
          temperature.
          <Cite id="17">Digitalfire &ldquo;Zero4&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="cleaning" title="3.2 Cleaning Bisqueware" level={3}>
        <p>
          Wipe with a damp sponge to remove dust and skin oils — the most
          common cause of crawling. In shared studios, wash all bisqueware under
          running water.
          <Cite id="3">Mayco p.18</Cite>
        </p>
      </GuideSection>

      <GuideSection id="dampening" title="3.3 Dampening Before Application" level={3}>
        <p>
          Lightly misting very porous bisque slows absorption, giving more
          working time. Useful for brushing and large pieces.
        </p>
        <p>
          <strong>Warning:</strong> Over-wetting can move the raw glaze layer
          and increase crawling risk. This helps with porous low-fire bisque but
          may cause problems on dense bisque (cone 02+). Mist lightly — do not
          soak.
          <Cite id="13">Arbuckle pp.4-5</Cite>
        </p>
      </GuideSection>

      <GuideSection id="wax-resist" title="3.4 Wax Resist on the Foot" level={3}>
        <p>
          Wax the bottom of every pot before glazing to prevent kiln-shelf
          fusion. <strong>Cold liquid wax</strong> (e.g., Mayco AC-302) is the
          studio default — easy cleanup, burns away in firing.{" "}
          <strong>Hot wax</strong> (melted paraffin) gives sharper edges but
          poses fire risk.
          <Cite id="3">Mayco &ldquo;Wax Resist&rdquo;</Cite>
          <Cite id="18">Seattle Pottery Supply</Cite>
        </p>
        <p>
          Tip: place the pot on a banding wheel, spin it, and hold a
          wax-loaded brush against the foot for a clean, even line.
        </p>
        <GuideVideo
          pending
          title="Waxing the foot on a banding wheel"
          channel="TBD — audit required"
          note="Short demo of the banding-wheel + loaded brush technique for a clean resist line around the foot. 2–5 min. Ingleton Pottery, Old Forge Creations, or a Seattle Pottery Supply demo would all fit."
        />
      </GuideSection>

      {/* ── References ── */}
      <Bibliography>
        <Reference id="1">
          Daniel Rhodes, <em>Clay and Glazes for the Potter</em>, 3rd ed.,
          Krause Publications, 2000.
        </Reference>
        <Reference id="2">
          IU Southeast Ceramics Studio, <em>Clay and Glaze Materials Handbook</em>.
        </Reference>
        <Reference id="3">
          Mayco Colors, <em>Ceramics 101</em> technical booklet.
        </Reference>
        <Reference id="4">
          Rhodes, pp. 172-183 (Seger unity formula).
        </Reference>
        <Reference id="5">
          Tony Hansen, &ldquo;Bisque,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/bisque" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="6">
          Orton Ceramic Foundation, pyrometric cone chart (industry standard).
        </Reference>
        <Reference id="7">
          AMACO, DL-series product pages (SG 1.52–1.58 by formula).
        </Reference>
        <Reference id="8">
          Tony Hansen, &ldquo;Specific gravity,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/specific+gravity" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="9">
          Sue McLeod Ceramics,{" "}
          <a href="https://suemcleodceramics.com/how-to-measure-the-specific-gravity-of-your-glazes/" className="underline">
            &ldquo;How to Measure the Specific Gravity of Your Glazes&rdquo;
          </a>.
        </Reference>
        <Reference id="10">
          The Studio Manager,{" "}
          <a href="https://www.thestudiomanager.com/posts/how-to-test-specific-gravity-in-a-ceramic-glaze-and-why-its-important" className="underline">
            &ldquo;How to Test Specific Gravity&rdquo;
          </a>.
        </Reference>
        <Reference id="11">
          Georgies Ceramic &amp; Clay Co.,{" "}
          <a href="https://www.georgies.com/pdfs/Adjusting%20Glaze%20for%20Dipping.pdf" className="underline">
            &ldquo;Adjusting a Glaze for Dipping&rdquo;
          </a>{" "}(PDF).
        </Reference>
        <Reference id="12">
          Vanderbilt Minerals, &ldquo;DARVAN 7-N Dispersing Agent&rdquo;
          technical data sheet.
        </Reference>
        <Reference id="13">
          Linda Arbuckle, &ldquo;Five Great Ceramic Glazing Techniques,&rdquo;
          Ceramic Arts Network PDF, pp. 4-5.
        </Reference>
        <Reference id="14">
          Tony Hansen, &ldquo;Flocculation,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/flocculation" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="15">
          Frank &amp; Janet Hamer, <em>The Potter&apos;s Dictionary of
          Materials and Techniques</em>, 3rd ed., p. 154.
        </Reference>
        <Reference id="16">
          Rhodes, p. 133 (sieving) and Ch. 24 (glaze preparation / aging).
        </Reference>
        <Reference id="17">
          Tony Hansen, &ldquo;Zero4,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/zero4" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="18">
          Seattle Pottery Supply,{" "}
          <a href="https://seattlepotterysupply.com/pages/using-wax-resist-to-protect-the-foot-of-a-vessel" className="underline">
            &ldquo;Using Wax Resist to Protect the Foot&rdquo;
          </a>.
        </Reference>
      </Bibliography>
    </>
  );
}
