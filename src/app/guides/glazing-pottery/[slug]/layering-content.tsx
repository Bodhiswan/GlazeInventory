import { GuideSection } from "@/components/guide/guide-section";
import {
  Bibliography,
  Cite,
  Reference,
} from "@/components/guide/citation";
import type { TocItem } from "@/components/guide/guide-toc";

export const layeringToc: TocItem[] = [
  { id: "why-glazes-interact", label: "9. Why Glazes Interact When Layered", level: 2 },
  { id: "eutectic-melting", label: "9.1 Eutectic Melting", level: 3 },
  { id: "viscosity-and-flow", label: "9.2 Viscosity and Flow", level: 3 },
  { id: "opacity-vs-transparency", label: "9.3 Opacity vs. Transparency", level: 3 },
  { id: "phase-separation", label: "9.4 Phase Separation and Opalescence", level: 3 },
  { id: "surface-tension", label: "9.5 Surface Tension", level: 3 },
  { id: "chemical-interactions", label: "9.6 Chemical Interactions Between Colorants", level: 3 },
  { id: "interface-reactions", label: "9.7 Interface Reactions", level: 3 },
  { id: "thickness-affects-outcomes", label: "9.8 How Thickness Affects Outcomes", level: 3 },
  { id: "layering-strategies", label: "10. Layering Strategies", level: 2 },
  { id: "base-top-coat", label: "10.1 Base + Top Coat Methodology", level: 3 },
  { id: "thickness-control", label: "10.2 Thickness Control for Multiple Layers", level: 3 },
  { id: "wet-on-wet-vs-dry", label: "10.3 Wet-on-Wet vs. Dry Between Coats", level: 3 },
  { id: "three-plus-layers", label: "10.4 Three-Plus Layer Combinations", level: 3 },
  { id: "overlap-zones", label: "10.5 Overlap Zones and Gradients", level: 3 },
  { id: "gravity-effects", label: "10.6 Gravity Effects: Vertical vs. Horizontal", level: 3 },
  { id: "inside-vs-outside", label: "10.7 Inside vs. Outside Considerations", level: 3 },
  { id: "cone-range-layering", label: "10.8 How Cone Range Affects Layering", level: 3 },
  { id: "layering-order", label: "10.9 Layering Order Is Directional", level: 3 },
  { id: "commercial-systems", label: "10.10 Commercial Glaze Systems for Layering", level: 3 },
  { id: "testing-documentation", label: "11. Testing & Documentation", level: 2 },
  { id: "test-tile-design", label: "11.1 Test Tile Design", level: 3 },
  { id: "blend-line-testing", label: "11.2 Blend-Line Testing", level: 3 },
  { id: "triaxial-blends", label: "11.3 Triaxial Blends", level: 3 },
  { id: "grid-approach", label: "11.4 Grid Approach for Layering Combinations", level: 3 },
  { id: "photography-records", label: "11.5 Photography and Record-Keeping", level: 3 },
  { id: "reading-test-tiles", label: "11.6 Reading and Interpreting Test Tiles", level: 3 },
];

export function LayeringContent() {
  return (
    <>
      {/* ── Section 9 ── */}
      <GuideSection id="why-glazes-interact" title="9. Why Glazes Interact When Layered">
        <p>
          Layered glazes produce effects impossible with a single coat because
          the boundary between two different glaze compositions creates a reaction
          zone with its own chemistry. Understanding the mechanisms behind these
          interactions — eutectic melting, viscosity differences, surface tension,
          and colorant chemistry — is the key to controlling layered results rather
          than leaving them to chance.
        </p>
      </GuideSection>

      <GuideSection id="eutectic-melting" title="9.1 Eutectic Melting" level={3}>
        <p>
          Every glaze has a temperature range at which it softens and flows, but
          when two different glazes sit one atop the other, the contact zone
          between them can begin melting at a temperature lower than either glaze
          would melt on its own. The reason is eutectic behavior: certain oxide
          ratios melt at a single, sharply defined temperature that falls below
          the melting point of any component in the mixture. Pure silica melts at
          3110&nbsp;°F (1710&nbsp;°C) and pure alumina at 3722&nbsp;°F
          (2050&nbsp;°C), yet a mixture of roughly 10% alumina and 90% silica
          melts at only 2813&nbsp;°F (1545&nbsp;°C) — hundreds of degrees below
          either endpoint.
          <Cite id="1">Ceramics Monthly, &ldquo;Phase and Eutectics&rdquo;</Cite>
          <Cite id="2">Digitalfire Glossary, &ldquo;Eutectic&rdquo;</Cite>
        </p>
        <p>
          In practical layering, the interface between two glazes is where
          eutectic chemistry matters most. As oxides from the upper and lower
          layers inter-diffuse during firing, the boundary zone creates new oxide
          ratios that neither glaze contains on its own. If those ratios happen to
          approach a eutectic composition, the interface melts earlier and flows
          more than the surrounding single-glaze areas. This is why overlap zones
          so often run farther than the individual glazes beside them, and why
          kiln cookies or catch plates are non-negotiable when testing layered
          combinations.
          <Cite id="3">Ceramic Arts Network, &ldquo;Three Helpful Tips for Layering Glazes&rdquo;</Cite>
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="2">Digitalfire Glossary, &ldquo;Eutectic&rdquo;</Cite>
        </p>
        <p>
          The eutectic concept also explains certain visual effects. When a
          eutectic mixture cools, all its components remain molten together until
          they solidify simultaneously, forming a clear, transparent glass. If the
          melt also contains non-eutectic ingredients, those can solidify
          separately while the surrounding glass is still liquid, leaving tiny
          crystals suspended in the matrix. The result is opacity, opalescence, or
          crystalline texture — effects potters prize in reactive overlap zones.
          <Cite id="1">Ceramics Monthly, &ldquo;Phase and Eutectics&rdquo;</Cite>
        </p>
        <p>
          Digitalfire notes that eutectics have limited direct utility in everyday
          glaze formulation because commercial frits are already pre-melted
          glasses with broad softening ranges, but the concept remains critical
          for understanding why layered glazes interact the way they do. The
          effect is strongest when both glazes are already close to maturity at
          the target cone; in underfired systems where neither layer develops much
          melt, eutectic enhancement is less dramatic.
          <Cite id="2">Digitalfire Glossary, &ldquo;Eutectic&rdquo;</Cite>
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="viscosity-and-flow" title="9.2 Viscosity and Flow" level={3}>
        <p>
          Melt fluidity — the degree to which a glaze flows when molten — is
          governed by the ratio of fluxes (boron, lithium, sodium, potassium) to
          refractories (alumina, silica). High-flux glazes run; high-alumina,
          high-silica glazes stay put. But chemistry alone cannot predict
          behavior: fritted materials produce more fluid melts than raw minerals
          sourcing identical oxides, and finer particle sizes dissolve faster,
          increasing flow even at the same oxide ratio.
          <Cite id="5">Digitalfire Glossary, &ldquo;Melt Fluidity&rdquo;</Cite>
        </p>
        <p>
          When two glazes of different fluidities are layered, four broad
          scenarios arise:
        </p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <strong>Two fluid layers</strong> — the combination must be kept very
            thin or the overlap will run off vertical surfaces.
          </li>
          <li>
            <strong>Fluid base under a non-fluid overlay</strong> — the weight of
            the stiffer top coat can be pulled downward by the mobile layer
            beneath.
          </li>
          <li>
            <strong>Non-fluid base under a fluid overlay</strong> — the safest
            combination, because the stable base anchors the system while the
            fluid top melts into it, creating streaks, color gradients, and the
            &ldquo;icicle&rdquo; drip effects potters seek.
          </li>
          <li>
            <strong>Two non-fluid layers</strong> — largely defeats the purpose of
            layering, since the glazes will not interact enough to produce new
            visual effects.
          </li>
        </ul>
        <p>
          Scenario 3 — stiff base plus fluid top — is the workhorse strategy for
          decorative layering and underpins the design of several commercial
          systems. Coyote&apos;s Texas Two-Step line, for example, pairs
          non-fluid Step One Undercoats with fluid Step Two Overcoats
          specifically to produce oilspot, cascade, and mottled effects at cone
          5–6 without excessive running.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="6">Coyote Clay product documentation</Cite>
        </p>
        <p>
          Two standard bench tests reveal melt fluidity before a glaze goes on
          ware. The <strong>Melt Flow Runway Test</strong> (Digitalfire code GLFL)
          races two glazes down an inclined ceramic runway, showing comparative
          viscosity and surface tension at a glance. The <strong>Ball
          Test</strong> (GBMF) fires a 10-gram dried glaze sphere on porcelain,
          revealing flow distance, bubble behavior, surface tension
          characteristics, and transparency. Either test is invaluable for
          predicting how two glazes will behave when stacked.
          <Cite id="5">Digitalfire Glossary, &ldquo;Melt Fluidity&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="opacity-vs-transparency" title="9.3 Opacity vs. Transparency" level={3}>
        <p>
          Opacity in ceramic glazes arises from five distinct mechanisms:
        </p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            Dispersion of refractory micro-particles such as zircon or tin oxide
            that reflect and refract light.
          </li>
          <li>
            Crystallization of opaque phases during cooling, particularly from
            high-CaO melts.
          </li>
          <li>
            Matte surfaces whose non-flat topology scatters light.
          </li>
          <li>
            Phase separation — microscopic islands of differing glass composition
            within the melt.
          </li>
          <li>
            Suspended micro-bubbles that scatter light.
          </li>
        </ul>
        <p>
          The practical consequence for layering is that transparent and opaque
          glazes interact with light in fundamentally different ways. In a
          transparent glaze, light travels through the glass layer, reflects off
          the clay body or an underlying glaze, and returns to the eye colored by
          the colorants it passed through twice. Thickness controls intensity:
          thicker pools appear darker, thin edges appear lighter. When such a
          glaze is opacified, the light-scattering particles block the round-trip
          path, subduing color — &ldquo;a deep rich blue can turn into a dull
          pastel blue when the glaze is opacified.&rdquo; Ryan Coppage notes that
          an opaque glaze may need roughly five to ten times more metallic oxide
          colorant than a translucent glaze to reach the same apparent color
          intensity.
          <Cite id="7">Digitalfire Glossary, &ldquo;Opacity&rdquo;</Cite>
          <Cite id="8">Ryan Coppage, &ldquo;Opacity: Color and Cost,&rdquo; Ceramics Monthly</Cite>
        </p>
        <p>
          The choice of opacifier matters for layering chemistry. Tin oxide
          requires only about 7% for complete whiteness and produces bluer whites;
          zircon (Zircopax) requires 10–20% and tends toward yellower whites while
          also stiffening the melt and hardening the surface, potentially causing
          blistering or pinholing at higher concentrations. Critically,
          tin-opacified glazes are susceptible to chrome flashing (turning pink
          near chrome-bearing glazes in the kiln), while zircon-opacified glazes
          are immune to this reaction.
          <Cite id="7">Digitalfire Glossary, &ldquo;Opacity&rdquo;</Cite>
        </p>
        <p>
          Transparent overcoats are not automatically safe in complex surfaces.
          Digitalfire notes that transparent glazes applied too thickly often
          cloud and can obscure underglaze decoration, because excess thickness
          changes optical depth and can encourage micro-bubble retention that
          reduces clarity. A transparent top coat should usually be thinner and
          more carefully controlled than an opaque one.
          <Cite id="9">Digitalfire Glossary, &ldquo;Glaze Thickness&rdquo;</Cite>
          <Cite id="10">Digitalfire Glossary, &ldquo;Transparent Glazes&rdquo;</Cite>
        </p>
        <p>
          Partially opacified glazes — termed &ldquo;milky&rdquo; — occupy a
          middle ground and can produce striking depth effects in layered systems.
          The majolica tradition exploits this principle directly: an opaque white
          tin glaze provides a reflective canvas for transparent colored overglaze
          brushwork, where the translucent colors gain brilliance from the white
          backdrop beneath.
          <Cite id="7">Digitalfire Glossary, &ldquo;Opacity&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="phase-separation" title="9.4 Phase Separation and Opalescence" level={3}>
        <p>
          Phase separation occurs when a molten glaze separates at the
          microscopic scale into two or more glassy phases with different
          compositions. Certain oxide combinations lack full compatibility in
          silicate melts, and the resulting internal interfaces between phases
          scatter light, producing milkiness, haze, or opalescence even when no
          crystals are present. Colorants concentrate preferentially in one phase,
          creating soft mottling and color variation. Increased alumina helps
          suppress separation, while high boron promotes it.
          <Cite id="11">Digitalfire Glossary, &ldquo;Phase Separation&rdquo;</Cite>
        </p>
        <p>
          This mechanism is directly relevant to layered glazes because when two
          glazes create a new composition at their interface, phase separation may
          occur where it would not in either glaze alone. The sky-blue
          opalescence of Chinese Jun (Chun) ware, for example, is produced by
          liquid-liquid phase separation forming droplets 1–100 nm in diameter.
          These droplets create a short-range ordered structure that acts as an
          amorphous photonic crystal, producing structural color through coherent
          light scattering — the visual effect combines chemical color from iron
          ions with this structural color.
          <Cite id="12">ScienceDirect, &ldquo;Amorphous photonic crystals and structural colors in the phase separation glaze&rdquo;</Cite>
          <Cite id="13">ResearchGate, &ldquo;Study on the phase-separated opaque glaze in ancient China from Qionglai kiln&rdquo;</Cite>
        </p>
        <p>
          A related unwanted effect is &ldquo;boron blue.&rdquo; When boron
          levels are excessively high — especially alongside ample SiO₂ and
          Al₂O₃ — boron forms crystal phases that turn transparent glazes milky
          or cloudy blue. This can appear unexpectedly when two boron-rich glazes
          are layered together, concentrating boron at the interface beyond the
          threshold either glaze would reach alone.
          <Cite id="7">Digitalfire Glossary, &ldquo;Opacity&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="surface-tension" title="9.5 Surface Tension" level={3}>
        <p>
          Surface tension is the thermodynamic tendency of a liquid to minimize
          its surface area. In glazes, low surface tension promotes wetting and
          spreading across the clay body; high surface tension resists wetting and
          causes the melt to contract, contributing to edge pull-back, beading,
          crawling, and incomplete coverage. Surface tension and viscosity are
          distinct properties but interact: a glaze can have high surface tension
          yet level well if its viscosity is low enough.
          <Cite id="14">Digitalfire Glossary, &ldquo;Surface Tension&rdquo;</Cite>
        </p>
        <p>
          Specific oxides shift surface tension predictably:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="py-2 pr-4">Effect</th>
                <th className="py-2">Oxides</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Increase surface tension</td>
                <td className="py-2">MgO, Al₂O₃, ZrO₂, ZnO, CaO, SnO₂, BaO, SrO</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">Decrease surface tension</td>
                <td className="py-2">PbO, B₂O₃, K₂O, Na₂O, Li₂O</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          This matters in layering: a high-surface-tension glaze brushed over a
          low-surface-tension glaze may bead up or crawl rather than smoothly
          coating the layer beneath.
          <Cite id="14">Digitalfire Glossary, &ldquo;Surface Tension&rdquo;</Cite>
        </p>
        <p>
          Surface tension also governs bubble behavior. Low surface tension
          enhances bubble merging and rupture, while high surface tension
          strengthens bubble films, allowing them to persist or remain trapped — a
          key factor in blistering, pinholing, and the orange-peel texture that
          occurs when trapped bubbles shrink during cooling. In layered systems,
          bubble trapping is exacerbated when an early-melting top layer seals
          over a still-degassing bottom layer, a common source of pinholing in
          two-glaze combinations.
          <Cite id="14">Digitalfire Glossary, &ldquo;Surface Tension&rdquo;</Cite>
        </p>
        <p>
          Crawling — where molten glaze withdraws from the ceramic body, leaving
          bare patches — is driven by high surface tension combined with poor
          adhesion from thick application, dusty bisque surfaces, or excessive
          shrinkage during drying. In layered work, applying a high-shrinkage
          glaze over a non-gummed base coat dramatically increases crawling risk.
          Adding CMC gum (roughly 1%) to the base coat dramatically improves
          adhesion and crawling resistance.
          <Cite id="14">Digitalfire Glossary, &ldquo;Surface Tension&rdquo;</Cite>
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="chemical-interactions" title="9.6 Chemical Interactions Between Specific Colorants" level={3}>
        <p>
          <strong>Chrome-Tin Reactions:</strong> Chrome-bearing glazes can
          volatilize enough chromium oxide at peak temperature to turn nearby
          tin-opacified whites pink, even when the chrome and tin are not mixed in
          the same bucket. The mechanism is kiln atmosphere transport: chrome
          vapor leaves one glaze and deposits on another receptive, tin-bearing
          surface. This is as much a kiln-loading caveat as a layering one —
          simply placing a chrome green piece next to a tin white piece in the
          same kiln can produce unwanted pink flashing on the white. Adequate
          kiln ventilation helps but does not eliminate the risk; the safest
          approach is to keep chrome greens and tin whites apart. Zircon-opacified
          glazes are immune.
          <Cite id="15">Digitalfire, &ldquo;Chrome Flashing in Ceramic Glazes&rdquo;</Cite>
          <Cite id="16">Ceramic Arts Network, &ldquo;Cone 5-6 Glazes, 2nd Edition&rdquo;</Cite>
        </p>
        <p>
          For intentional chrome-tin pinks, only 0.1–0.5% chrome oxide with 5%
          tin oxide is needed, but the system is chemically demanding. Calcium
          (CaO) must be present in the receiving glaze or the pink color is
          completely absent. Zinc must be excluded or the color turns brown. The
          pink is stable in oxidation up to about 1250&nbsp;°C but fades severely
          in reduction or with overfiring. Chrome-tin reds do not work well above
          cone 8. Substituting calcium with a magnesium/strontium oxide blend
          makes the glaze chemistry hostile to chrome-tin pink formation — the
          documented Pfaltzgraff factory solution when they needed chrome-safe
          whites. Commercial chrome-tin stains are generally more reliable than
          raw chrome-plus-tin layering experiments.
          <Cite id="17">Digitalfire material note, &ldquo;Stain (pink/crimson)&rdquo;</Cite>
          <Cite id="15">Digitalfire, &ldquo;Chrome Flashing in Ceramic Glazes&rdquo;</Cite>
          <Cite id="18">Ceramic Arts Network, &ldquo;Technofile: Demystifying Chrome Oxide&rdquo;</Cite>
        </p>
        <p>
          Chrome oxide behavior varies dramatically by glaze chemistry beyond the
          tin interaction. In high boron/alkaline bases with under 1% chrome, it
          produces bright glossy transparent greens. In zinc-containing bases, it
          generates browns. In high calcium/strontium bases without zinc, it
          creates pinks through burgundy. Chrome is amphoteric — it plays an
          intermediate role between fluxes and silica, sometimes acting as a flux
          itself. This means the same chrome-bearing glaze can produce completely
          different colors depending on what glaze it is layered over or under.
          <Cite id="18">Ceramic Arts Network, &ldquo;Technofile: Demystifying Chrome Oxide&rdquo;</Cite>
        </p>
        <p>
          <strong>Copper Behavior:</strong> In oxidation firing, copper oxide
          normally produces green. In alkaline glazes (high Na₂O, K₂O), copper
          shifts toward turquoise blue, reminiscent of Egyptian faience and
          southwestern pottery. In reduction, copper in alkaline glazes containing
          tin oxide can produce copper reds, with the specific hue influenced by
          alumina, magnesium, and boron content. When layering a copper-bearing
          glaze over an alkaline base glaze, the copper at the interface may shift
          color due to the alkaline flux environment it encounters — an
          intentional layering strategy for achieving turquoise effects.
          <Cite id="19">Allan Chemical Corporation, &ldquo;How Metal Oxides Color Ceramic Glazes&rdquo;</Cite>
          <Cite id="20">The Ceramic School, &ldquo;Understanding Glaze Components Part 4: Colorants&rdquo;</Cite>
        </p>
        <p>
          <strong>Iron Oxide:</strong> Iron oxide produces amber, yellow, or brown
          in oxidation and celadon green or tenmoku black in reduction. Beyond its
          role as a colorant, iron also acts as a flux, increasing melt fluidity
          at higher concentrations. In alkaline glazes, iron produces warmer, more
          amber tones; in high-calcium glazes, more classic amber-to-brown
          progressions. Iron&apos;s dual role as colorant and flux makes it
          particularly interactive in layered systems: a high-iron glaze layered
          over a low-iron glaze will flux the interface, increasing flow and color
          blending at the overlap.
          <Cite id="20">The Ceramic School, &ldquo;Understanding Glaze Components Part 4: Colorants&rdquo;</Cite>
          <Cite id="19">Allan Chemical Corporation</Cite>
        </p>
      </GuideSection>

      <GuideSection id="interface-reactions" title="9.7 Interface Reactions" level={3}>
        <p>
          During firing, the liquid glaze melt attacks the clay body surface,
          penetrating into it and forming a buffer zone of intermediate
          compositions. This interfacial layer develops differently by clay type:
          porcelain develops highly bonded interfaces where glaze and body become
          nearly inseparable; earthenware produces minimal glass development and
          weaker adhesion; stoneware falls between. Temperature, soaking time,
          cooling rate, and material chemistry all affect interface development.
          <Cite id="21">Digitalfire Glossary, &ldquo;Body Glaze Interface&rdquo;</Cite>
          <Cite id="22">Ceramic Arts Network, &ldquo;Techno File: Clay-Glaze Interface&rdquo;</Cite>
        </p>
        <p>
          The same interfacial reaction occurs between two glaze layers. Metal
          oxides from each glaze migrate into the other at the boundary, modifying
          color development, viscosity, and surface texture in the contact zone.
          This exchange creates a gradient composition that produces visual
          effects impossible to achieve with either glaze alone — the &ldquo;third
          glaze&rdquo; effect that potters observe in overlap zones, and the
          primary reason most potters layer glazes in the first place.
          <Cite id="21">Digitalfire Glossary, &ldquo;Body Glaze Interface&rdquo;</Cite>
          <Cite id="23">Creamik.com, &ldquo;Creating unique ceramics with overlay glazing techniques&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="thickness-affects-outcomes" title="9.8 How Thickness Affects Outcomes" level={3}>
        <p>
          A credit-card thickness (roughly 0.75–1&nbsp;mm) is the general
          standard for a single glaze application, with stoneware glazes
          typically targeting about 0.5&nbsp;mm fired thickness. In layered
          systems, the combined thickness of both layers matters more than either
          individual layer&apos;s thickness, and the total should generally not
          exceed what would be appropriate for a single glaze unless the glazes
          are specifically formulated for heavy application.
          <Cite id="9">Digitalfire Glossary, &ldquo;Glaze Thickness&rdquo;</Cite>
        </p>
        <p>
          Transparent colored glazes demonstrate intentional color variation
          through thickness — darker where pooled thickly, lighter at thin edges.
          Reactive glazes that variegate or crystallize usually require a specific
          thickness range to develop their characteristic effects. Too-thin
          application results in washed-out color and incomplete coverage;
          too-thick application causes blistering, crawling, running, and drying
          cracks. In layered work, a thin under-layer allows the top glaze to
          dominate, while a thicker under-layer creates more dramatic interaction
          effects.
          <Cite id="9">Digitalfire Glossary, &ldquo;Glaze Thickness&rdquo;</Cite>
          <Cite id="23">Creamik.com overlay glazing article</Cite>
        </p>
        <p>
          Excessive combined thickness is the most common cause of glazes running
          off pieces in layered work. Thickly applied glazes assert their
          shrinkage during drying, compromising the bond with the body below; the
          cracks that appear become bare patches (crawling) after firing. This is
          especially problematic when the second coat rewets and adds shrinkage
          stress to the first. Adding CMC gum to the base coat and allowing
          complete drying before the second application are the primary solutions.
          <Cite id="9">Digitalfire Glossary, &ldquo;Glaze Thickness&rdquo;</Cite>
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
        </p>
      </GuideSection>

      {/* ── Section 10 ── */}
      <GuideSection id="layering-strategies" title="10. Layering Strategies">
        <p>
          With the science of glaze interaction established, this section turns to
          practical strategies for applying multiple glazes — from the
          foundational base-plus-top-coat method to advanced three-layer
          combinations, gravity management, and commercial systems designed for
          layering.
        </p>
      </GuideSection>

      <GuideSection id="base-top-coat" title="10.1 Base + Top Coat Methodology" level={3}>
        <p>
          The most reliable approach to layered glazing pairs a stable base coat
          with a more reactive or fluid top coat. The base anchors the system to
          the clay body while the top melts into and interacts with it, creating
          the color blending, mottling, and flow effects that make layering
          worthwhile.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="24">Tony Hansen, &ldquo;Concentrate on One Good Glaze,&rdquo; Digitalfire</Cite>
        </p>
        <p>
          For brushing — the primary application method for most commercial glaze
          users — the base coat should be built up in two to three even coats,
          alternating brush stroke direction with each pass (first horizontal,
          second diagonal, third vertical) to eliminate streak marks and even out
          thickness. Apply one coat, let the wet look disappear, then apply the
          next coat perpendicular to the previous.
          <Cite id="25">Seattle Pottery Supply, &ldquo;Pottery Glazing Techniques&rdquo;</Cite>
          <Cite id="26">Walker Ceramics, &ldquo;Glaze Application Techniques&rdquo;</Cite>
        </p>
        <p>
          Traditional dipping glazes (powdered minerals with 15–25% clay for
          suspension) develop fragile bonds with bisque ware that fail when a
          second coat is applied — the rewetting and shrinkage of the second coat
          pulls the first layer away from the body. Adding CMC gum (approximately
          1% as a starting point) creates functional base coats that tolerate
          overlapping applications, though it trades off slower drying and reduced
          thixotropic properties. Commercial brushing glazes already contain
          higher gum percentages, which is why they tolerate layering better than
          studio dipping glazes.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="27">Digitalfire Glossary, &ldquo;Brushing Glaze&rdquo;</Cite>
        </p>
        <p>
          Glazes intended for layering should also pass recipe sanity checks.
          Excessive clay content causes extreme shrinkage; high bentonite
          percentages (7%+) create excessive drying stress; high zinc oxide
          combined with heavy clay causes peeling. Many studio layering failures
          trace to poor raw glaze properties rather than fired chemistry
          incompatibility.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="thickness-control" title="10.2 Thickness Control for Multiple Layers" level={3}>
        <p>
          For subsequent layers beyond the first, use lower specific gravity
          slurry, submerge for shorter durations when dipping, or switch to
          brushing or spraying for thinner coats. Each subsequent coat takes
          longer to dry because the previous coat has saturated the
          bisqueware&apos;s porous surface, reducing its absorption rate.
          <Cite id="3">Ceramic Arts Network, &ldquo;Three Helpful Tips for Layering Glazes&rdquo;</Cite>
          <Cite id="25">Seattle Pottery Supply, &ldquo;Pottery Glazing Techniques&rdquo;</Cite>
        </p>
        <p>
          When testing a new layered combination for the first time, the Ceramic
          Arts Network advises limiting the second layer to the top one-third of
          the pot initially, to observe flow behavior before committing to full
          coverage. A hydrometer for checking specific gravity is especially
          useful when building three-layer surfaces, where slight differences in
          consistency compound across layers.
          <Cite id="3">Ceramic Arts Network, &ldquo;Three Helpful Tips for Layering Glazes&rdquo;</Cite>
          <Cite id="28">Ceramics Monthly, &ldquo;Triple Glazing: Acknowledging Inspiration and Chasing the Image&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="wet-on-wet-vs-dry" title="10.3 Wet-on-Wet vs. Dry Between Coats" level={3}>
        <p>
          The standard recommendation for brushing is to allow each glaze layer to
          dry to a chalky, matte appearance before applying the next coat.
          Digitalfire specifically advises allowing &ldquo;a whole day&rdquo; for
          complete drying. Wet-on-wet brushing results in uneven thickness, poor
          adhesion, and the second coat disturbing or lifting the first. Gum in
          the base coat expands options by giving the raw glaze more green
          strength and adhesion, but a wet, unbound layer is easily disturbed by
          the next brush pass.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="27">Digitalfire Glossary, &ldquo;Brushing Glaze&rdquo;</Cite>
          <Cite id="25">Seattle Pottery Supply</Cite>
        </p>
        <p>
          However, extended drying can also cause problems. If the first coat
          dries too long and becomes dusty, the second coat may not adhere well.
          Timing is a balance.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
        </p>
        <p>
          For dipping (less common for the commercial-glaze audience but sometimes
          used for base coats), the timing rules differ. When triple-glazing by
          dipping, the second and third glazes should be dipped as soon as the pot
          is dry enough to accept more glaze — not after extended drying. Long
          gaps between dips can cause adhesion problems. The technique involves
          progressively shorter immersion times: approximately 2 seconds for the
          first dip, 1 second for the second. The key distinction is that dipping
          deposits glaze quickly without brush friction to disturb the layer
          below.
          <Cite id="28">Ceramics Monthly, &ldquo;Triple Glazing&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="three-plus-layers" title="10.4 Three-Plus Layer Combinations" level={3}>
        <p>
          Triple glazing involves applying three distinct glaze layers
          sequentially, typically with graduated coverage: the first layer covers
          100% of the exterior, the second covers approximately 80%, and the third
          covers approximately 65%. This creates zones of single, double, and
          triple glaze interaction on the same piece, producing &ldquo;fluid,
          complex colors that would generously accentuate significantly altered
          forms.&rdquo; Thinner-than-usual glaze consistency is essential,
          monitored with a hydrometer for specific gravity.
          <Cite id="28">Ceramics Monthly, &ldquo;Triple Glazing&rdquo;</Cite>
        </p>
        <p>
          A documented successful three-layer combination: (1) entire pot in
          Odyssey White Gloss, (2) top third in Chun Celadon, (3) rim only in
          Strontium Crystal Magic. This demonstrates strategic placement —
          confining reactive glazes to the upper portion where gravity aids rather
          than hinders their interaction. The article advises confining third and
          fourth glazes to the top quarter or rim when first testing, to limit
          potential running.
          <Cite id="3">Ceramic Arts Network, &ldquo;Three Helpful Tips for Layering Glazes&rdquo;</Cite>
        </p>
        <p>
          For three or more layers, keep each layer thin to control flow. Overlap
          zones create new colors via mixing, and gravity causes fluid upper
          layers to pull downward on verticals. Always test on vertical test tiles
          before committing to ware.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="29">Mayco Ceramics 101 guide</Cite>
        </p>
      </GuideSection>

      <GuideSection id="overlap-zones" title="10.5 Overlap Zones and Gradients" level={3}>
        <p>
          Application patterns should generally be designed so that no part of the
          piece has more than two glaze thicknesses, unless specifically testing
          three-layer interactions. Overlap zones can be straight lines (from
          dipping), irregular shapes (from pouring, spraying, or brushing), or
          diagonal patterns (from dipping at an angle). Each creates different
          visual movement across the form.
          <Cite id="23">Creamik.com, &ldquo;Creating unique ceramics with overlay glazing techniques&rdquo;</Cite>
          <Cite id="3">Ceramic Arts Network, &ldquo;Three Helpful Tips for Layering Glazes&rdquo;</Cite>
          <Cite id="30">DiamondCore Tools, &ldquo;Pottery Glazing Techniques&rdquo;</Cite>
        </p>
        <p>
          One sophisticated gradient technique layers a dark (near-black) glaze as
          undercoat, then a colored glaze on top, then in selected areas a
          transparent high-fusibility glaze whose melting increases the fluidity
          of all lower layers, allowing the dark undercoat to bleed through and
          darken the color above. The transparent glaze acts as a localized flux,
          creating gradient effects that cannot be achieved any other way.
          <Cite id="23">Creamik.com, &ldquo;Creating unique ceramics with overlay glazing techniques&rdquo;</Cite>
        </p>
        <p>
          Wax resist is a practical tool for controlling overlap zones. Apply wax
          to any area where a second glaze should not go — rims, foot rings, or
          specific design boundaries. Wax burns away in the kiln but prevents
          glaze adhesion during application.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="gravity-effects" title="10.6 Gravity Effects: Vertical vs. Horizontal Surfaces" level={3}>
        <p>
          Vertical surfaces emphasize dripping &ldquo;icicles&rdquo; and downward
          flow, while horizontal surfaces form bubbly, frosting-like textures.
          Glazes formulated for vertical surfaces must be more viscous than tile
          glazes designed for horizontal application. Gravity creates much of the
          primary visual interest in layered glazes — the fluid top coat flows
          over and through the stiffer base, creating streaks, drips, and color
          gradients that follow the form&apos;s contours. Kari Radasch
          specifically watches &ldquo;how glazes move, melt and flow depending
          upon their mass, temperature and location on the pot.&rdquo;
          <Cite id="31">Ceramic Arts Network, &ldquo;Melty Goodness: Using Gravity and Layered Glazes&rdquo;</Cite>
          <Cite id="5">Digitalfire Glossary, &ldquo;Melt Fluidity&rdquo;</Cite>
        </p>
        <p>
          The safest strategy for vertical work is placing the most fluid glaze at
          the top of the form, where it has the least distance to travel before
          reaching the foot. If multiple layers all have high fluidity, each must
          be thin enough that the final combined thickness will not run
          excessively.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="3">Ceramic Arts Network, &ldquo;Three Helpful Tips for Layering Glazes&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="inside-vs-outside" title="10.7 Inside vs. Outside Considerations" level={3}>
        <p>
          When glazing vessels, the interior should be glazed first and allowed to
          dry completely before glazing the exterior. This maintains adequate
          bisque absorbency for the exterior coat — if the exterior is glazed
          first, moisture saturates the wall, reducing absorption capacity for the
          interior application.
          <Cite id="9">Digitalfire Glossary, &ldquo;Glaze Thickness&rdquo;</Cite>
        </p>
        <p>
          On interior surfaces, running glazes pool at the bottom of the vessel
          rather than dripping onto kiln shelves, making interiors more forgiving
          for fluid layered glazes. However, excessive pooling can create thick
          glass accumulations that crack during cooling from thermal expansion
          mismatch. On exterior surfaces, running fuses the piece to the kiln
          shelf, requiring kiln cookies and careful thickness control. A common
          strategy is to use more adventurous layering on interiors and more
          conservative combinations on exteriors.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
          <Cite id="9">Digitalfire Glossary, &ldquo;Glaze Thickness&rdquo;</Cite>
        </p>
        <p>
          Food safety requires special attention with layered glazes. Commercial
          glazes labeled food-safe are tested in isolation. When layered with
          other glazes, a glaze that resists acid attack on its own may be
          &ldquo;destabilized enough to leach metals.&rdquo; Bright-colored glazes
          containing copper, cobalt, manganese, or chrome are particularly risky
          on food-contact surfaces when combined with other glazes. The
          recommendation is to use non-colored glazes on functional ware food
          surfaces and understand the complete recipe chemistry. Hesselberth and
          Roy&apos;s <em>Mastering Cone 6 Glazes</em> (2002) remains the
          definitive reference on cone 6 durability and leaching.
          <Cite id="4">Digitalfire Glossary, &ldquo;Glaze Layering&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="cone-range-layering" title="10.8 How Cone Range Affects Layering" level={3}>
        <p>
          At low fire (cone 06 to cone 1), the glaze layer remains distinctly
          separate from the clay body with minimal interface development. Low-fire
          glazes offer the brightest and most varied color palette but can appear
          harsh. Layering at low fire produces more predictable results because
          lower temperatures allow less oxide migration between layers. Mayco
          Stroke &amp; Coat and AMACO LUG (Low-fire Underglaze) are designed
          specifically for low-fire layering, and majolica is the classic low-fire
          layering tradition.
          <Cite id="32">Soul Ceramics, &ldquo;Guide to Kiln Temperature Ranges for Pottery&rdquo;</Cite>
          <Cite id="2">Digitalfire</Cite>
        </p>
        <p>
          Mayco Stroke &amp; Coat demonstrates how coat count changes results at
          low fire: one coat creates a translucent finish, two to three coats
          produce full opacity, and when applied over a matte glaze, one coat
          fires matte while two to three coats fire glossy. Note that chrome-tin
          pigmented Stroke &amp; Coat colors (SC013 Grapel, SC033 Fruit of the
          Vine, SC085 Orkid) can develop a milky or cloudy haze when clear glazes
          are applied over them — a specific chemical incompatibility to watch
          for.
          <Cite id="33">Mayco Colors, Stroke &amp; Coat product page</Cite>
        </p>
        <p>
          Mid-fire (cone 4 to cone 6) is the most popular range for layering
          experimentation because commercial glaze systems are specifically
          designed with layering in mind. AMACO Potter&apos;s Choice and
          Potter&apos;s Choice Flux (PCF) glazes are formulated for layering at
          cone 5/6, with an online layering tool that lets potters select top and
          bottom glazes and view combination results. Coyote&apos;s Texas Two-Step
          system and Shino series are designed for cone 5–6 layering, pairing
          stable undercoats with fluid overcoats. Mayco&apos;s stoneware line
          also includes recommended layering combinations.
          <Cite id="32">Soul Ceramics</Cite>
          <Cite id="34">AMACO layering resources</Cite>
          <Cite id="6">Coyote Clay product documentation</Cite>
        </p>
        <p>
          At high fire (cone 8 to cone 12), a substantial body-glaze interfacial
          layer forms, and the body becomes dense and vitrified. The color palette
          narrows because extreme heat causes many colorants to burn out or shift
          dramatically — chrome-tin reds, for example, do not survive above cone
          8. However, high-fire layering produces the most integrated, complex
          surfaces because greater heat allows more thorough mixing of layered
          glazes. Iron, cobalt, and rutile remain reliable colorants at high fire.
          John Britt&apos;s <em>The Complete Guide to High-Fire Glazes</em>{" "}
          (2007) covers cone 10 layering extensively.
          <Cite id="32">Soul Ceramics</Cite>
          <Cite id="18">Ceramic Arts Network, &ldquo;Technofile: Demystifying Chrome Oxide&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="layering-order" title="10.9 Layering Order Is Directional" level={3}>
        <p>
          A grid of glaze combinations should treat A-over-B as different from
          B-over-A. The lower coat controls absorption and early melt contact with
          the clay body, while the upper coat controls the exposed surface
          chemistry and runoff path. In practice, a combination matrix should
          include both orders rather than assuming the result is reversible. This
          is especially important when the two glazes differ strongly in opacity,
          fluidity, or gum content.
          <Cite id="35">Glazy Help, &ldquo;Blending Tests for Glazes&rdquo;</Cite>
          <Cite id="36">Rhonda Willers, &ldquo;How to Keep Good Records When Testing Ceramic Glazes,&rdquo; Ceramic Arts Network</Cite>
        </p>
        <p>
          Commercial systems recognize this directionality. AMACO&apos;s online
          layering tool distinguishes between &ldquo;over&rdquo; and
          &ldquo;under&rdquo; for every Potter&apos;s Choice combination, because
          the results are visually different in each direction. Coyote&apos;s
          Texas Two-Step documentation specifies which glazes serve as Step One
          (under) and which as Step Two (over), explicitly acknowledging that the
          reverse order produces different — and sometimes undesirable — results.
          <Cite id="34">AMACO layering resources</Cite>
          <Cite id="6">Coyote Clay product documentation</Cite>
        </p>
      </GuideSection>

      <GuideSection id="commercial-systems" title="10.10 Commercial Glaze Systems for Layering" level={3}>
        <p>
          For brushing-focused studios, several commercial glaze lines are
          designed explicitly for layered application:
        </p>
        <p>
          <strong>AMACO Potter&apos;s Choice (Cone 5–6):</strong> A line of
          reactive glazes formulated for layering. AMACO provides an online
          layering tool showing photographic results for hundreds of two-glaze
          combinations in both application orders. Potter&apos;s Choice Flux (PCF)
          glazes are designed as fluid top coats over standard Potter&apos;s
          Choice bases.
          <Cite id="34">AMACO layering resources, amaco.com/resources/layering</Cite>
        </p>
        <p>
          <strong>Coyote Texas Two-Step (Cone 5–6):</strong> A system of non-fluid
          Step One Undercoats paired with fluid Step Two Overcoats, producing
          oilspot, cascade, and variegated effects. The system is designed so the
          base remains stable while the top coat creates the visual action. Coyote
          also offers a Shino series with layering recommendations.
          <Cite id="6">Coyote Clay, coyoteclay.com</Cite>
        </p>
        <p>
          <strong>Mayco Stroke &amp; Coat (Cone 06 to Cone 6):</strong> Versatile
          glazes that fire translucent in one coat and opaque in two to three
          coats. Designed for layering over underglazes and with each other. Mayco
          provides a Ceramics 101 guide with layering examples including antiquing
          and majolica-style overlaps.
          <Cite id="33">Mayco Colors, maycocolors.com</Cite>
          <Cite id="29">Mayco Ceramics 101 guide</Cite>
        </p>
        <p>
          <strong>Mayco Stoneware Glazes (Cone 5–6):</strong> Include recommended
          layering pairings in manufacturer documentation.
          <Cite id="33">Mayco Colors</Cite>
        </p>
        <p>
          These systems take much of the guesswork out of layering for studios
          that do not mix their own glazes, because the manufacturer has
          pre-tested combinations and provides guidance on application order and
          thickness.
        </p>
      </GuideSection>

      {/* ── Section 11 ── */}
      <GuideSection id="testing-documentation" title="11. Testing & Documentation">
        <p>
          Systematic testing separates potters who get lucky once from potters who
          get reliable results every time. This section covers tile design,
          blending methods, combination grids, and the record-keeping that makes
          test results actually useful.
        </p>
      </GuideSection>

      <GuideSection id="test-tile-design" title="11.1 Test Tile Design" level={3}>
        <p>
          Test tiles must be made from the same clay body as finished pieces,
          because glaze behavior — color, texture, fit, and interaction — changes
          significantly between bodies due to variations in iron content, thermal
          expansion, porosity, and flux content. If you work with multiple clay
          bodies, you need separate sets of test tiles for each.
          <Cite id="37">Humanities LibreTexts, &ldquo;Making and Using Glaze Test Tiles&rdquo;</Cite>
        </p>
        <p>
          Effective test tiles include both flat areas for color and texture
          observation and vertical sections to assess glaze flow. A glaze that
          looks fine on a flat tile may run excessively on a vertical surface, and
          this gap is amplified in layered glazes where eutectic effects increase
          fluidity. L-shaped test tiles provide vertical and horizontal surfaces
          in one piece; small cylinders or extruded forms work equally well. John
          Britt recommends making test tiles that mimic actual ware — thrown,
          extruded, or handbuilt shapes with both vertical and horizontal
          surfaces — because flat tiles alone can give dangerously misleading
          results.
          <Cite id="37">Humanities LibreTexts</Cite>
          <Cite id="38">Sue McLeod Ceramics, &ldquo;Different Styles of Test Tiles&rdquo;</Cite>
          <Cite id="39">John Britt, &ldquo;How to Make Glaze Test Tiles,&rdquo; Ceramic Arts Network</Cite>
        </p>
        <p>
          Surface texture matters too. Incorporate ridges, incised lines, or
          carved textures to observe how the glaze breaks over edges, pools in
          recesses, and changes color at different thicknesses. This is especially
          important for layering tests, where interactions may be most visible
          where glaze collects in carved details.
          <Cite id="37">Humanities LibreTexts</Cite>
        </p>
        <p>
          Produce multiple test tiles in advance — up to 100 or more for serious
          testing campaigns — in consistent size (typically around 2&nbsp;x&nbsp;2
          inches for flat tiles, 2–3 inches tall for vertical forms) and
          thickness. Making a batch of identical tiles in advance removes a
          barrier to spontaneous testing. Group similar tests in the same firing
          for easier comparison, and place tiles in different kiln areas to study
          temperature variation.
          <Cite id="36">Ceramic Arts Network, &ldquo;How to Keep Good Records&rdquo;</Cite>
          <Cite id="37">Humanities LibreTexts</Cite>
        </p>
        <p>
          Each test tile requires clear labeling for post-firing identification.
          Use oxide pencil, underglaze pencil, or iron-oxide wash to write
          directly on the back of tiles before bisque firing. For complex test
          series, create a numbering system with corresponding records in a
          notebook or spreadsheet. For layering tests specifically, label both the
          individual glazes and the layering order (which is over, which is
          under).
          <Cite id="37">Humanities LibreTexts</Cite>
          <Cite id="36">Ceramic Arts Network, &ldquo;How to Keep Good Records&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="blend-line-testing" title="11.2 Blend-Line Testing" level={3}>
        <p>
          Line blends test two different recipes mixed in varying proportions —
          for example, 0% to 10% additional red iron oxide in 1% increments,
          yielding 11 separate tests. The increment size should match the strength
          of the variable being tested: cobalt is so powerful that 0.1% increments
          are more informative than 1% increments. If the step size is too large
          for a potent colorant, the test skips the useful middle ground entirely.
          Glazy recommends keeping the 100% endpoints in every test because each
          firing can shift a glaze enough that fresh controls remain useful.
          <Cite id="35">Glazy Help, &ldquo;Blending Tests for Glazes&rdquo;</Cite>
        </p>
        <p>
          The volumetric syringe method keeps small line blends consistent and
          reproducible. The process: (1) mix equal weights of each glaze, (2) add
          water and sieve thoroughly, (3) add water until both glazes have equal
          volume, (4) use a syringe to blend in measured increments. For a 20 ml
          syringe with 10% increments, approximately 110 ml of each base recipe
          (220 ml total) is needed. This approach is more practical than weighing
          dry ingredients for each intermediate cup, and because it equalizes
          volumes first, it ensures you are testing chemistry rather than
          accidentally testing water content.
          <Cite id="35">Glazy Help, &ldquo;Blending Tests for Glazes&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="triaxial-blends" title="11.3 Triaxial Blends" level={3}>
        <p>
          Triaxial blends test three ingredients simultaneously on a triangular
          grid. Each corner represents 100% of one material; each side is a line
          blend of the two corner materials; interior points contain all three. The
          number of tests follows the triangular number sequence:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="py-2 pr-4">Rows</th>
                <th className="py-2">Tests</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">2 rows</td>
                <td className="py-2">3 tests</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">5 rows</td>
                <td className="py-2">15 tests</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">11 rows</td>
                <td className="py-2">66 tests</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Two range options serve different purposes. A 0%–100% range puts simple
          two-variable line blends on the outer edges, useful for comprehensive
          exploration. A 20%–100% range ensures every test includes all three
          variables, better for targeted development when you already know you
          want all three components present. A five-row triaxial gives far more
          useful three-way information than a four-row one.
          <Cite id="35">Glazy Help, &ldquo;Understanding Triaxial Blends&rdquo;</Cite>
          <Cite id="40">Digitalfire Glossary, &ldquo;Triaxial Glaze Blending&rdquo;</Cite>
        </p>
        <p>
          For layering theory, triaxial thinking is useful when testing base
          glaze, top glaze, and a third variable (opacifier, colorant, or flux)
          together rather than in isolated pairs. Robin Hopper&apos;s{" "}
          <em>The Ceramic Spectrum</em> (1984/2001) includes extensive use of flux
          variation triaxial tests and remains a foundational text for systematic
          color development.
          <Cite id="35">Glazy Help, &ldquo;Understanding Triaxial Blends&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="grid-approach" title="11.4 Grid Approach for Layering Combinations" level={3}>
        <p>
          For testing glaze layering combinations systematically, create a grid
          matrix where rows represent base glazes (underneath) and columns
          represent top glazes (over). Each cell represents one specific
          combination. For N glazes, the full grid requires N&nbsp;x&nbsp;N
          tests, including each glaze over itself as a thickness control. This is
          often called a &ldquo;combination tile board.&rdquo;
          <Cite id="41">Ceramic Arts Network, &ldquo;Tips and Tools: Test-Tile Board&rdquo;</Cite>
          <Cite id="34">AMACO layering resources</Cite>
        </p>
        <p>
          AMACO&apos;s online layering tool follows this grid principle, allowing
          potters to select top and bottom glazes and view photographic results.
          When building your own grid, start small (4–6 glazes = 16–36
          combinations) before attempting larger matrices, and keep the same clay
          body and firing schedule across the entire grid for valid comparisons.
          Use systematic grids for multi-variable testing (thickness x layers x
          overlap), and record bisque porosity as well as firing data.
          <Cite id="34">AMACO layering resources</Cite>
          <Cite id="39">John Britt, &ldquo;Understanding Glazes&rdquo;</Cite>
          <Cite id="42">Linda Levy, &ldquo;Testing... Testing... Test Tiles&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="photography-records" title="11.5 Photography and Record-Keeping" level={3}>
        <p>
          For each glaze test, document: materials used with clear labeling,
          application method and order of application, number of coats and
          thickness, kiln temperature and cone numbers, firing schedule (including
          ramp rates and holds), kiln position, specific gravity of the glaze, and
          final results including photographs. The main goal is &ldquo;to have
          enough information to be able to repeat, or avoid, the results you
          discovered.&rdquo; Write procedures down first to ensure
          follow-through, and record application sequence immediately — it is easy
          to forget which order glazes were applied.
          <Cite id="36">Ceramic Arts Network, &ldquo;How to Keep Good Records When Testing Ceramic Glazes&rdquo;</Cite>
        </p>
        <p>
          Take photos of both the glazing process (unfired glaze appearance
          contains useful information) and fired results. Two inexpensive LED
          lamps on either side with tracing paper or thin fabric as simple
          softboxes create diffused light that removes harsh reflections on glossy
          glazes. A tripod improves photos more than a new camera. Capture at
          least three views: front, angled (to show form), and close-up of glaze
          and texture detail. For test tile documentation, consistent lighting and
          camera angle across all tiles enables valid visual comparison. Include a
          gray card or color reference card in frame for color accuracy.
          <Cite id="43">Ceramic Arts Network, &ldquo;A Guide to Pottery Photography&rdquo;</Cite>
          <Cite id="44">Ceramics Field Guide, &ldquo;Shooting Images of Your Work&rdquo;</Cite>
        </p>
        <p>
          Glazy (glazy.org) provides a free online platform for recording glaze
          recipes, test results, and photographs with community sharing
          capabilities. It has become the de facto standard for digital glaze
          record-keeping. Spreadsheet programs also work well, enabling organized
          tracking with multiple worksheets for different test series.
          <Cite id="36">Ceramic Arts Network, &ldquo;How to Keep Good Records&rdquo;</Cite>
        </p>
        <p>
          Store physical test tiles in labeled boxes or on display boards, sorted
          by firing temperature, clay body, or glaze type. A mounted test-tile
          board arranged in grid matrix format (base glaze = rows, top glaze =
          columns) allows at-a-glance comparison and serves as a permanent studio
          reference.
          <Cite id="41">Ceramic Arts Network, &ldquo;Tips and Tools: Test-Tile Board&rdquo;</Cite>
          <Cite id="37">Humanities LibreTexts</Cite>
        </p>
      </GuideSection>

      <GuideSection id="reading-test-tiles" title="11.6 Reading and Interpreting Test Tiles" level={3}>
        <p>
          Examine each test tile for six qualities:
        </p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <strong>Color</strong> — intensity, richness, evenness, and how
            thickness or overlaps affect hue.
          </li>
          <li>
            <strong>Surface quality</strong> — smoothness, texture, glossiness,
            matteness.
          </li>
          <li>
            <strong>Flow and movement</strong> — pooling, breaking over edges,
            running on vertical surfaces.
          </li>
          <li>
            <strong>Defects</strong> — crazing (fine cracks indicating thermal
            expansion mismatch), shivering (glaze flaking off), pinholing (small
            holes from trapped gas), blistering (larger bubbles), crawling (bare
            patches from poor adhesion).
          </li>
          <li>
            <strong>Transparency and opacity</strong> — how well underlying clay
            or underglaze shows through.
          </li>
          <li>
            <strong>Functional quality</strong> — smoothness for lip contact on
            mugs, durability of surface.
          </li>
        </ul>
        <p>
          For layered glazes specifically, pay close attention to the overlap zone
          compared to single-glaze zones. The overlap reveals the interaction
          effects — the &ldquo;third glaze&rdquo; — and is the whole point of the
          test.
          <Cite id="37">Humanities LibreTexts, &ldquo;Making and Using Glaze Test Tiles&rdquo;</Cite>
          <Cite id="45">Number Analytics, &ldquo;Mastering Glaze Testing in Ceramics&rdquo;</Cite>
        </p>
        <p>
          A glaze fired flat can look very different from the same glaze on a
          vertical surface, with gravity creating pooling at the bottom and
          thinning at the top. Vertical test tiles reveal whether a combination
          will run, how far it flows, and where color breaks occur. This is
          essential for layering tests because layered glazes tend to be more
          fluid than single glazes due to eutectic effects. Always include a
          vertical element in layering test tiles.
          <Cite id="37">Humanities LibreTexts</Cite>
          <Cite id="38">Sue McLeod Ceramics</Cite>
        </p>
        <p>
          Arrange fired test tiles side by side for direct comparison under
          identical lighting, and photograph them together for the most useful
          archival records. After visual evaluation, test durability by scratching
          the glaze surface with a fingernail, coin, or steel knife. A functional
          food-safe glaze should resist scratching; soft, easily scratched
          surfaces indicate underfiring, excessive flux, or insufficient silica —
          all of which may be exacerbated in layered glazes where eutectic effects
          can over-flux the interface. For definitive leaching safety, the only
          reliable test is an actual acid leaching test (citric acid or acetic
          acid), as described in Hesselberth &amp; Roy&apos;s{" "}
          <em>Mastering Cone 6 Glazes</em> and in ASTM C738 standards.
          <Cite id="46">Hesselberth &amp; Roy, &ldquo;Mastering Cone 6 Glazes&rdquo;</Cite>
          <Cite id="37">Humanities LibreTexts</Cite>
          <Cite id="36">Ceramic Arts Network, &ldquo;How to Keep Good Records&rdquo;</Cite>
        </p>
      </GuideSection>

      {/* ── References ── */}
      <Bibliography>
        <Reference id="1">
          Ceramics Monthly, &ldquo;Phase and Eutectics.&rdquo;
        </Reference>
        <Reference id="2">
          Tony Hansen, &ldquo;Eutectic,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/eutectic" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="3">
          Ceramic Arts Network, &ldquo;Three Helpful Tips for Layering
          Glazes.&rdquo;
        </Reference>
        <Reference id="4">
          Tony Hansen, &ldquo;Glaze Layering,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/glaze+layering" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="5">
          Tony Hansen, &ldquo;Melt Fluidity,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/melt+fluidity" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="6">
          Coyote Clay, product documentation and Texas Two-Step system,{" "}
          <a href="https://coyoteclay.com" className="underline">
            coyoteclay.com
          </a>.
        </Reference>
        <Reference id="7">
          Tony Hansen, &ldquo;Opacity,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/opacity" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="8">
          Ryan Coppage, &ldquo;Opacity: Color and Cost,&rdquo;{" "}
          <em>Ceramics Monthly</em>.
        </Reference>
        <Reference id="9">
          Tony Hansen, &ldquo;Glaze Thickness,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/glaze+thickness" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="10">
          Tony Hansen, &ldquo;Transparent Glazes,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/transparent+glazes" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="11">
          Tony Hansen, &ldquo;Phase Separation,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/phase+separation" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="12">
          ScienceDirect, &ldquo;Amorphous photonic crystals and structural colors
          in the phase separation glaze.&rdquo;
        </Reference>
        <Reference id="13">
          ResearchGate, &ldquo;Study on the phase-separated opaque glaze in
          ancient China from Qionglai kiln.&rdquo;
        </Reference>
        <Reference id="14">
          Tony Hansen, &ldquo;Surface Tension,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/surface+tension" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="15">
          Tony Hansen, &ldquo;Chrome Flashing in Ceramic Glazes,&rdquo;
          Digitalfire.
        </Reference>
        <Reference id="16">
          Ceramic Arts Network, <em>Cone 5-6 Glazes</em>, 2nd Edition (sample
          excerpt).
        </Reference>
        <Reference id="17">
          Digitalfire material note, &ldquo;Stain (pink/crimson).&rdquo;
        </Reference>
        <Reference id="18">
          Ceramic Arts Network, &ldquo;Technofile: Demystifying Chrome
          Oxide.&rdquo;
        </Reference>
        <Reference id="19">
          Allan Chemical Corporation, &ldquo;How Metal Oxides Color Ceramic
          Glazes.&rdquo;
        </Reference>
        <Reference id="20">
          The Ceramic School, &ldquo;Understanding Glaze Components Part 4:
          Colorants.&rdquo;
        </Reference>
        <Reference id="21">
          Tony Hansen, &ldquo;Body Glaze Interface,&rdquo; Digitalfire
          Glossary,{" "}
          <a href="https://digitalfire.com/glossary/body+glaze+interface" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="22">
          Ceramic Arts Network, &ldquo;Techno File: Clay-Glaze Interface.&rdquo;
        </Reference>
        <Reference id="23">
          Creamik.com, &ldquo;Creating unique ceramics with overlay glazing
          techniques.&rdquo;
        </Reference>
        <Reference id="24">
          Tony Hansen, &ldquo;Concentrate on One Good Glaze,&rdquo;
          Digitalfire.
        </Reference>
        <Reference id="25">
          Seattle Pottery Supply, &ldquo;Pottery Glazing Techniques,&rdquo;{" "}
          <a href="https://seattlepotterysupply.com" className="underline">
            seattlepotterysupply.com
          </a>.
        </Reference>
        <Reference id="26">
          Walker Ceramics, &ldquo;Glaze Application Techniques.&rdquo;
        </Reference>
        <Reference id="27">
          Tony Hansen, &ldquo;Brushing Glaze,&rdquo; Digitalfire Glossary,{" "}
          <a href="https://digitalfire.com/glossary/brushing+glaze" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="28">
          <em>Ceramics Monthly</em>, &ldquo;Triple Glazing: Acknowledging
          Inspiration and Chasing the Image.&rdquo;
        </Reference>
        <Reference id="29">
          Mayco Colors, <em>Ceramics 101</em> technical booklet.
        </Reference>
        <Reference id="30">
          DiamondCore Tools, &ldquo;Pottery Glazing Techniques.&rdquo;
        </Reference>
        <Reference id="31">
          Ceramic Arts Network, &ldquo;Melty Goodness: Using Gravity and Layered
          Glazes to Add Depth to Pottery Surfaces.&rdquo;
        </Reference>
        <Reference id="32">
          Soul Ceramics, &ldquo;Guide to Kiln Temperature Ranges for
          Pottery.&rdquo;
        </Reference>
        <Reference id="33">
          Mayco Colors, Stroke &amp; Coat product page,{" "}
          <a href="https://maycocolors.com" className="underline">
            maycocolors.com
          </a>.
        </Reference>
        <Reference id="34">
          AMACO, layering resources and Potter&apos;s Choice online tool,{" "}
          <a href="https://amaco.com/resources/layering" className="underline">
            amaco.com/resources/layering
          </a>.
        </Reference>
        <Reference id="35">
          Glazy Help, &ldquo;Blending Tests for Glazes,&rdquo;{" "}
          <a href="https://glazy.org" className="underline">
            glazy.org
          </a>.
        </Reference>
        <Reference id="36">
          Rhonda Willers, &ldquo;How to Keep Good Records When Testing Ceramic
          Glazes,&rdquo; Ceramic Arts Network.
        </Reference>
        <Reference id="37">
          Humanities LibreTexts, &ldquo;Making and Using Glaze Test Tiles.&rdquo;
        </Reference>
        <Reference id="38">
          Sue McLeod Ceramics, &ldquo;Different Styles of Test Tiles.&rdquo;
        </Reference>
        <Reference id="39">
          John Britt, &ldquo;How to Make Glaze Test Tiles&rdquo; and{" "}
          <em>Understanding Glazes</em>, Ceramic Arts Network.
        </Reference>
        <Reference id="40">
          Tony Hansen, &ldquo;Triaxial Glaze Blending,&rdquo; Digitalfire
          Glossary,{" "}
          <a href="https://digitalfire.com/glossary/triaxial+glaze+blending" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="41">
          Ceramic Arts Network, &ldquo;Tips and Tools: Test-Tile Board.&rdquo;
        </Reference>
        <Reference id="42">
          Linda Levy, &ldquo;Testing... Testing... Test Tiles.&rdquo;
        </Reference>
        <Reference id="43">
          Ceramic Arts Network, &ldquo;A Guide to Pottery Photography.&rdquo;
        </Reference>
        <Reference id="44">
          Ceramics Field Guide, &ldquo;Shooting Images of Your Work.&rdquo;
        </Reference>
        <Reference id="45">
          Number Analytics, &ldquo;Mastering Glaze Testing in Ceramics.&rdquo;
        </Reference>
        <Reference id="46">
          Jeff Hesselberth &amp; Ron Roy, <em>Mastering Cone 6 Glazes</em>,
          2002; ASTM C738 standard test method for lead and cadmium extraction.
        </Reference>
      </Bibliography>
    </>
  );
}
