import { GuideSection } from "@/components/guide/guide-section";
import {
  Bibliography,
  Cite,
  Reference,
} from "@/components/guide/citation";
import type { TocItem } from "@/components/guide/guide-toc";

export const applicationToc: TocItem[] = [
  { id: "dipping", label: "4. Dipping", level: 2 },
  { id: "pouring", label: "5. Pouring", level: 2 },
  { id: "pouring-interior", label: "5.1 Interior Pouring", level: 3 },
  { id: "pouring-exterior", label: "5.2 Exterior Pouring", level: 3 },
  { id: "pouring-decorative", label: "5.3 Decorative Pouring", level: 3 },
  { id: "pouring-thickness", label: "5.4 Thickness Control", level: 3 },
  { id: "spraying", label: "6. Spraying", level: 2 },
  { id: "spray-equipment", label: "6.1 Equipment", level: 3 },
  { id: "spray-pressure", label: "6.2 Pressure & Distance", level: 3 },
  { id: "spray-prep", label: "6.3 Glaze Preparation", level: 3 },
  { id: "spray-technique", label: "6.4 Technique", level: 3 },
  { id: "spray-booth", label: "6.5 Spray Booth & Ventilation", level: 3 },
  { id: "spray-respiratory", label: "6.6 Respiratory Protection", level: 3 },
  { id: "spray-maintenance", label: "6.7 Gun Maintenance", level: 3 },
  { id: "brushing", label: "7. Brushing", level: 2 },
  { id: "brushing-vs-dipping", label: "7.1 Why Brushing Glazes Differ", level: 3 },
  { id: "brushing-converting", label: "7.2 Converting a Dipping Glaze", level: 3 },
  { id: "brushing-brush-types", label: "7.3 Brush Types", level: 3 },
  { id: "brushing-stroke", label: "7.4 Stroke Technique", level: 3 },
  { id: "brushing-coats", label: "7.5 Coat Count & Drying", level: 3 },
  { id: "brushing-greenware", label: "7.6 Greenware vs. Bisque", level: 3 },
  { id: "other-methods", label: "8. Other Methods", level: 2 },
  { id: "trailing", label: "8.1 Trailing", level: 3 },
  { id: "sponging", label: "8.2 Sponging", level: 3 },
  { id: "stamping", label: "8.3 Stamping", level: 3 },
  { id: "stippling", label: "8.4 Stippling", level: 3 },
  { id: "spattering", label: "8.5 Spattering", level: 3 },
  { id: "finger-wiping", label: "8.6 Finger-Wiping", level: 3 },
  { id: "cross-cutting", label: "Cross-Cutting Considerations", level: 2 },
  { id: "bisque-temp-effect", label: "Bisque Temperature Effects", level: 3 },
  { id: "target-thickness", label: "Target Dry Glaze Thickness", level: 3 },
  { id: "sg-summary", label: "Specific Gravity Summary", level: 3 },
];

export function ApplicationContent() {
  return (
    <>
      {/* ── Section 4: Dipping ── */}
      <GuideSection id="dipping" title="4. Dipping">
        <p>
          Dipping is the fastest way to glaze a piece: submerge it in a bucket of
          slurry, pull it out, and let it dry. Most commercial glaze users will
          never need to dip — brushing and spraying are the norm — but
          understanding the method is useful reference, especially when converting
          dipping-format glazes for brush use.
        </p>
        <p>
          A well-prepared dipping slurry sits at a specific gravity of roughly
          1.40&ndash;1.50, with 1.43&ndash;1.45 being a practical sweet spot for
          most recipes when the slurry has been gelled with a flocculant.
          <Cite id="1">Digitalfire &ldquo;Specific Gravity&rdquo; &amp; &ldquo;Dipping Glaze&rdquo;</Cite>{" "}
          Commercial dipping glazes ship across a wider range — Amaco
          Potters Choice at 1.38&ndash;1.50, Amaco Celadon at 1.41&ndash;1.43,
          and Walker Ceramics (Australia) at 1.50&ndash;1.75 with instructions to
          dilute to 1.40&ndash;1.50 before use.
          <Cite id="2">Walker Ceramics &ldquo;Glaze Application Techniques&rdquo;</Cite>
        </p>
        <p>
          The key to a well-behaved dipping slurry is <strong>thixotropy</strong>.
          Rather than simply adding water to thin the glaze, set the SG slightly
          low (around 1.43&ndash;1.45), then add a flocculant — a few drops of
          vinegar or dissolved Epsom salts (300&nbsp;g per liter of hot water,
          added drop by drop) — until the slurry gels back to a creamy
          consistency.
          <Cite id="3">Digitalfire &ldquo;Thixotropy&rdquo;</Cite>
          <Cite id="2">Walker Ceramics</Cite>{" "}
          A thixotropic slurry shear-thins when stirred but gels on the pot
          surface, reducing drips and settling. Over-flocculation makes the slurry
          lumpy; deflocculated slurries (with Darvan or sodium silicate) drip
          excessively and dry slowly, making them poor candidates for dipping.
          <Cite id="1">Digitalfire &ldquo;Dipping Glaze&rdquo;</Cite>
        </p>
        <p>
          <strong>Hold time</strong> in the bucket depends on SG, bisque porosity,
          and form size. Roger Graham gives a practical example: at SG 1.4, a mug
          needs about 1 second and a dinner plate about 2 seconds, because larger,
          flatter pieces accumulate thickness more quickly.
          <Cite id="4">Roger Graham, Digitalfire PDF</Cite>{" "}
          The usable range is roughly 1&ndash;5 seconds — higher SG or more
          porous bisque shortens the needed time, while lower SG or denser bisque
          extends it.
          <Cite id="5">Seattle Pottery Supply</Cite>
          <Cite id="1">Digitalfire</Cite>{" "}
          AMACO recommends testing at 3, 5, and 7 seconds to calibrate for a
          given glaze and body.
          <Cite id="6">AMACO Potters Choice Dry Dipping Glaze Instructions</Cite>
        </p>
        <p>
          Use <strong>glazing tongs</strong> to hold the piece and minimize finger
          marks. Submerge at a slight angle (roughly 30&ndash;45 degrees) to let
          air escape and prevent trapped bubbles, then extract vertically and give
          a gentle shake or twist to shed excess.
          <Cite id="7">Ceramic Arts Daily &ldquo;12 Pottery Glazing Tips&rdquo;</Cite>
          <Cite id="5">Seattle Pottery Supply</Cite>{" "}
          Hold inverted briefly so the final drip runs off the rim or foot rather
          than pooling. For double-dipping a second glaze over a first (without
          firing between), the base coat must contain roughly 1% CMC gum to harden
          the layer and prevent it from lifting when the second glaze goes on.
          <Cite id="1">Digitalfire &ldquo;Base-Coat Dipping Glaze&rdquo;</Cite>{" "}
          Wax resist creates clean boundaries between partial dips.
        </p>
        <p>
          After dipping, let drips dry fully before touching them up — wiping wet
          glaze smears it. Smooth dried drips with 400-grit wet-dry sandpaper or a
          sharp knife, and dab tong marks with a finger dipped in glaze.
          <Cite id="7">Ceramic Arts Daily</Cite>
          <Cite id="8">Linda Arbuckle &ldquo;Majolica Handout&rdquo;</Cite>
        </p>
      </GuideSection>

      {/* ── Section 5: Pouring ── */}
      <GuideSection id="pouring" title="5. Pouring">
        <p>
          Pouring is the method of choice for glazing vessel interiors, especially
          when the form is too large or too narrow-necked to dip. It also works
          well for exteriors when a full-immersion bucket is impractical. Pouring
          glaze should be slightly thinner than dipping consistency — roughly
          SG 1.35&ndash;1.40 — so it flows evenly over the surface before being
          absorbed.
          <Cite id="9">Robin Hopper, <em>The Ceramic Spectrum</em></Cite>
          <Cite id="10">Digitalfire &ldquo;Pour Glazing&rdquo;</Cite>
          <Cite id="11">Ceramic Arts Network &ldquo;8 Ways to Apply Glaze&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="pouring-interior" title="5.1 Interior Pouring (Fill, Swirl, Drain)" level={3}>
        <p>
          Pour glaze into the vessel to about one-third full. Swirl or rotate the
          piece so the glaze coats all interior surfaces. Invert and drain back
          into the bucket in a single smooth motion, rotating slowly so the drain
          line moves around the rim and prevents a thick buildup at one point. The
          entire pour-and-drain should take about 4&ndash;5 seconds of contact
          time for standard bisque porosity.
          <Cite id="10">Digitalfire &ldquo;Pour Glazing&rdquo;</Cite>
          <Cite id="12">DiamondCore Tools</Cite>{" "}
          Always glaze the interior first, then the exterior.
          <Cite id="10">Digitalfire</Cite>
        </p>
        <p>
          For narrow-necked pieces such as bottles and vases, Walker Ceramics
          recommends pouring thinned glaze in, rolling the piece to cover all
          internal surfaces, pouring out slowly while still rolling to coat the
          internal lip, then leaving the piece inverted for five minutes to drain.
          <Cite id="2">Walker Ceramics</Cite>{" "}
          Mayco advises using a continuous rolling motion and inverting the ware to
          drain, warning that excess glaze left inside can cause pitting or
          splitting during firing.
          <Cite id="13">Mayco Ceramics 101 pp.&nbsp;18, 23</Cite>
        </p>
      </GuideSection>

      <GuideSection id="pouring-exterior" title="5.2 Exterior Pouring" level={3}>
        <p>
          Place the pot upside-down on a glazing rack over a catch basin, then
          pour glaze over the piece while rotating it for full coverage.
          Alternatively, hold the pot by its foot or previously glazed interior
          with one hand and pour with the other, rotating continuously.
          <Cite id="10">Digitalfire &ldquo;Pour Glazing&rdquo;</Cite>
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          This approach is common for large stoneware pieces where maintaining a
          full dipping bucket is impractical.
        </p>
      </GuideSection>

      <GuideSection id="pouring-decorative" title="5.3 Decorative Pouring" level={3}>
        <p>
          Ladle pouring — scooping glaze with a ladle or cup and pouring it in
          controlled streams over the piece — creates overlapping glaze areas and
          decorative drip patterns. This is effective for layering glazes of
          different characters, such as matte over gloss or contrasting colors.
          Work quickly so the first layer does not dry out completely before the
          second is applied.
          <Cite id="11">Ceramic Arts Network (Robin Hopper)</Cite>
        </p>
      </GuideSection>

      <GuideSection id="pouring-thickness" title="5.4 Thickness Control" level={3}>
        <p>
          Thickness depends on five interacting factors: SG of the slurry, bisque
          porosity, speed of pour (faster = thinner), number of passes
          (overlapping areas get thicker), and thixotropy of the glaze.
          <Cite id="14">Digitalfire &ldquo;Glaze Thickness&rdquo;</Cite>
          <Cite id="15">BigCeramicStore &ldquo;Choosing a Bisque Temperature&rdquo;</Cite>{" "}
          When a surface includes less-absorbent underlayers such as terra
          sigillata, the poured glaze may not build to the same thickness there;
          compensate by brushing a light extra coat over those areas.
          <Cite id="16">Alan Willoughby, Ceramic Arts Network</Cite>
        </p>
      </GuideSection>

      {/* ── Section 6: Spraying ── */}
      <GuideSection id="spraying" title="6. Spraying">
        <p>
          Spraying produces the most even glaze coat of any application method. It
          is the standard approach for large forms, flat tiles, and any situation
          where uniform thickness matters more than speed. The trade-off is
          equipment cost, setup time, and the absolute requirement for respiratory
          protection.
        </p>
      </GuideSection>

      <GuideSection id="spray-equipment" title="6.1 Equipment" level={3}>
        <p>
          <strong>Spray guns.</strong> Three categories are common in ceramic
          studios:
        </p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <strong>Gravity-feed spray guns</strong> with an external compressor
            are the most popular studio setup — glaze feeds from a top-mounted cup
            through a large nozzle, and gravity handles the dense, high-solids
            slurry better than siphon systems. Budget options include the TCP
            G6600 with a 1.5&nbsp;mm fluid tip (~$30); professional models
            include the Binks 2100 (~$385) and DeVilbiss FLG (~$206).
            <Cite id="17">The Studio Manager &ldquo;Spray Gun Buyer&apos;s Guide&rdquo;</Cite>
            <Cite id="18">Marian Williams, Ceramics Monthly</Cite>
          </li>
          <li>
            <strong>HVLP turbine units</strong> are self-contained systems with a
            built-in fan (e.g., Wagner Control QX2, ~$90); they run at lower
            pressures than compressor-fed guns.
            <Cite id="17">The Studio Manager</Cite>
          </li>
          <li>
            <strong>Siphon-style guns</strong> are simpler but produce only a
            cone-shaped spray pattern (e.g., K-Grip, ~$45&ndash;50).
            <Cite id="17">The Studio Manager</Cite>{" "}
            Airbrushes are useful for fine detail but impractical for full
            coverage.
          </li>
        </ul>
        <p>
          <strong>Nozzle size.</strong> Fluid nozzles for ceramic glazes come in
          1.5, 1.7, 2.0, and 2.5&nbsp;mm. A 2.0&nbsp;mm nozzle is the
          recommended starting point — larger nozzles handle thicker, grittier
          glazes, while smaller ones give finer control but clog more easily.
          <Cite id="19">Ceramic Arts Daily forum &ldquo;What spray nozzle size do you like&rdquo;</Cite>
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          Carbide spray tips are recommended over standard stainless steel because
          abrasive glaze particles cause rapid wear.
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          Screen glaze through an 80-mesh sieve before each session to prevent
          clogging.
          <Cite id="17">The Studio Manager</Cite>
        </p>
        <p>
          <strong>Compressor.</strong> A small oil-free compressor is sufficient —
          even a 1-gallon, 0.6&nbsp;HP unit works for studio production.
          <Cite id="17">The Studio Manager</Cite>{" "}
          Ceramics Monthly recommends a 3-gallon, 1/3-HP oil-free compressor for
          a basic booth setup.
          <Cite id="18">Marian Williams, Ceramics Monthly</Cite>{" "}
          Oil-free is important because oil contamination in the air line causes
          fish-eyes and crawling. The California Air Tools 1-gallon compressor
          (56&nbsp;dB, ~$165) is commonly recommended for quiet operation.
          <Cite id="17">The Studio Manager</Cite>
        </p>
      </GuideSection>

      <GuideSection id="spray-pressure" title="6.2 Pressure & Distance" level={3}>
        <p>
          Operating pressure at the gun typically falls in the
          30&ndash;60&nbsp;PSI range, though there is no single correct setting.
          <Cite id="18">Marian Williams, Ceramics Monthly</Cite>
          <Cite id="4">Roger Graham, Digitalfire PDF</Cite>{" "}
          Start at around 30&ndash;40&nbsp;PSI and adjust until the spray pattern
          looks even. Nozzle size, glaze viscosity, hose length, spray width, and
          workpiece size all shift the ideal pressure — small-detail spraying can
          run lower, while wider fan patterns and denser slurries may need more
          air. Use an in-line regulator to set pressure precisely.
          <Cite id="17">The Studio Manager</Cite>
          <Cite id="20">Glazy wiki</Cite>
        </p>
        <p>
          Spray distance should change with form geometry. For flat tiles and
          platters, Graham recommends 150&ndash;200&nbsp;mm (roughly
          6&ndash;8&nbsp;inches) with a spray width around 75&nbsp;mm. For rims
          and narrow interiors, move as close as 50&nbsp;mm (~2&nbsp;inches) to
          concentrate the stream before overspray bounces off surrounding walls.
          <Cite id="4">Roger Graham, Digitalfire PDF</Cite>{" "}
          Broader open surfaces benefit from a wider, softer fan, while tight
          areas need a more focused pass. A turntable or banding wheel is
          essential for even application on round forms.
          <Cite id="20">Glazy wiki</Cite>
          <Cite id="11">Ceramic Arts Network</Cite>
        </p>
      </GuideSection>

      <GuideSection id="spray-prep" title="6.3 Glaze Preparation for Spraying" level={3}>
        <p>
          Thin the glaze to roughly SG 1.25&ndash;1.35 — noticeably thinner than
          dipping consistency.
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          Adding roughly 1% sodium silicate solution as a deflocculant reduces
          total water content while maintaining flowability, which prevents
          excessive shrinkage and cracking of the sprayed layer.
          <Cite id="11">Ceramic Arts Network (Robin Hopper)</Cite>{" "}
          Some potters spray at dipping consistency (SG 1.40&ndash;1.45) with a
          larger nozzle; others prefer very thin application (SG 1.25&ndash;1.30)
          with many passes.
          <Cite id="1">Digitalfire &ldquo;Brushing Glaze&rdquo;</Cite>{" "}
          Thinner slurry is less likely to clog the gun.
        </p>
      </GuideSection>

      <GuideSection id="spray-technique" title="6.4 Technique" level={3}>
        <p>
          Move the gun in smooth, overlapping horizontal passes while rotating the
          piece on a turntable. Each pass should overlap the previous by about 50%
          to prevent striping.
          <Cite id="20">Glazy wiki</Cite>
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          Apply several thin coats rather than one thick coat, building up
          thickness gradually to the target paper-clip thickness
          (~1&ndash;1.5&nbsp;mm dry). The number of passes varies with equipment
          and SG — the goal is total thickness, not a fixed pass count. Test on a
          scrap piece first to calibrate your spray pattern.
        </p>
      </GuideSection>

      <GuideSection id="spray-booth" title="6.5 Spray Booth & Ventilation" level={3}>
        <p>
          A spray booth with exhaust ventilation is required for safe indoor
          spraying. The industry-standard airflow velocity is 100 feet per minute
          (FPM) at the booth face for cross-draft booths (50&ndash;100&nbsp;FPM
          for downdraft). Calculate required CFM as booth face area (sq&nbsp;ft)
          multiplied by 100&nbsp;FPM — for example, a 2&nbsp;ft &times;
          3&nbsp;ft opening needs at least 600&nbsp;CFM.
          <Cite id="21">WoodWeb &ldquo;Fan Choice and Air Speed Calculations&rdquo;</Cite>
          <Cite id="22">ACGIH Industrial Ventilation Manual</Cite>{" "}
          The booth must be able to draw in replacement (makeup) air equal to what
          is exhausted, or negative pressure reduces effective airflow. Booth
          filters should be MERV-16 or better to trap overspray particles.
          <Cite id="23">OSHA guidance</Cite>
        </p>
        <p>
          If a permanent booth is unavailable, Marian Williams suggests a portable
          outdoor backdrop or a cut plastic drum as low-cost containment.
          <Cite id="18">Ceramics Monthly</Cite>{" "}
          Roger Graham describes drawing overspray inward and downward through
          filters.
          <Cite id="4">Roger Graham, Digitalfire PDF</Cite>{" "}
          Indoor spraying without any capture system is the weakest option and
          should be avoided.
        </p>
      </GuideSection>

      <GuideSection id="spray-respiratory" title="6.6 Respiratory Protection" level={3}>
        <p>
          Glaze spraying is a respirable particulate exposure. OSHA&apos;s
          permissible exposure limit for respirable crystalline silica is
          50&nbsp;micrograms per cubic meter as an 8-hour TWA (29 CFR 1910.1053).
          <Cite id="23">OSHA silica standard</Cite>{" "}
          A properly fitted half-facepiece respirator with NIOSH-approved P100
          particulate filters is the minimum recommended protection — P100 filters
          capture 99.97% of airborne particles at the most-penetrating particle
          size.
          <Cite id="23">OSHA</Cite>
          <Cite id="24">CDC/NIOSH</Cite>
        </p>
        <p>
          N95 disposable masks (95% filtration) are acceptable only for occasional
          light spraying, not regular production work.
          <Cite id="17">The Studio Manager &ldquo;Best Masks for Silica Dust&rdquo;</Cite>{" "}
          Common recommended models include the 3M 6300 half-facepiece
          (~$14&ndash;21) and 3M 7500 series (anti-fog valve for glasses
          wearers). P100 round particulate filters (~$14&ndash;20/box) are
          sufficient for glaze spraying; cartridge-type filters (which also
          capture gases/vapors) are unnecessary unless spraying solvent-based
          materials.
          <Cite id="17">The Studio Manager</Cite>{" "}
          Safety glasses should also be worn, and facial hair compromises the
          respirator seal.
        </p>
      </GuideSection>

      <GuideSection id="spray-maintenance" title="6.7 Gun Maintenance" level={3}>
        <p>
          Clean the spray gun immediately after each use and between different
          glazes by flushing with water. Disassemble and thoroughly clean all
          passages after each glazing session. Keep a bucket of water adjacent to
          the booth for quick rinsing. Glaze left to dry inside the gun clogs
          passages and damages seals. Expect to replace nozzles, needles, and
          seals more frequently than with automotive spray equipment because
          ceramic glazes are far more abrasive than paint.
          <Cite id="20">Glazy wiki</Cite>
        </p>
      </GuideSection>

      {/* ── Section 7: Brushing ── */}
      <GuideSection id="brushing" title="7. Brushing">
        <p>
          Brushing is the dominant application method for commercial glaze users.
          It requires no special equipment beyond brushes, works at any scale from
          a single mug to a full kiln load, and gives the potter direct control
          over thickness, layering, and decorative effects. The trade-off is
          speed — brushing takes longer than dipping — and the risk of streaking
          if technique or glaze consistency is not right.
        </p>
      </GuideSection>

      <GuideSection id="brushing-vs-dipping" title="7.1 Why Brushing Glazes Differ from Dipping Glazes" level={3}>
        <p>
          A standard dipping glaze dries almost instantly on contact with porous
          bisque, making it impossible to brush evenly. Commercial brushing glazes
          solve this by adding <strong>CMC gum</strong> (carboxymethyl cellulose)
          at approximately 1&ndash;1.5% of the dry powder weight, and sometimes
          bentonite (1&ndash;2%), to slow drying, improve flow, and prevent the
          glaze from being sucked off the brush.
          <Cite id="1">Digitalfire &ldquo;Brushing Glaze&rdquo;</Cite>
          <Cite id="25">AMACO &ldquo;Adding Gum Solution to Glaze&rdquo;</Cite>{" "}
          The result is a glaze with consistency and drying behavior
          &ldquo;not unlike latex paint.&rdquo;
          <Cite id="1">Digitalfire</Cite>
        </p>
        <p>
          <strong>Veegum CER</strong> — a 50:50 blend of Veegum T and CMC gum —
          at roughly 1.5% of powder weight is a convenient single-additive option
          that provides both gelling and binding.
          <Cite id="1">Digitalfire &ldquo;Brushing Glaze&rdquo;</Cite>
        </p>
        <p>
          CMC dramatically slows drying time. That is the trade-off for
          brushability: expect 15 or more minutes between coats. Dipping glazes
          need 15&ndash;25% clay content (kaolin, ball clay) for suspension, but
          brushing glazes can work with lower clay content because the gum
          provides suspension.
          <Cite id="1">Digitalfire</Cite>
        </p>
      </GuideSection>

      <GuideSection id="brushing-converting" title="7.2 Converting a Dipping Glaze to Brushable" level={3}>
        <p>
          To convert a bucket of dipping glaze to brushable consistency, add CMC
          gum at roughly 0.6% of the total batch weight (water plus dry
          ingredients).
          <Cite id="26">Mayco &ldquo;Mixing and Using Mayco Dry Glaze&rdquo; PDF</Cite>{" "}
          Expressed differently, this is approximately 1% of the dry powder
          weight.
          <Cite id="1">Digitalfire &ldquo;Brushing Glaze&rdquo;</Cite>{" "}
          Mix with a high-speed blender for at least 30 seconds to prevent lumps,
          and allow the gum to fully hydrate — several hours or overnight — for
          best results.
          <Cite id="1">Digitalfire</Cite>
          <Cite id="26">Mayco</Cite>
        </p>
        <p>
          The resulting specific gravity for brushing should be higher than for
          dipping: SG 1.5&ndash;1.6 yields fewer coats, while SG 1.3&ndash;1.35
          requires more coats but gives better thickness control.
          <Cite id="1">Digitalfire &ldquo;Brushing Glaze&rdquo;</Cite>{" "}
          AMACO recommends adding gum solution when a glaze is too thick to brush
          or is cracking as it dries, using no more than 1/4 cup of distilled
          water to each tablespoon of their Gum Solution.
          <Cite id="25">AMACO &ldquo;Adding Gum Solution to Glaze&rdquo;</Cite>{" "}
          Distilled water extends shelf life; too much gum makes glaze draggy,
          slow-drying, and harder to re-suspend.
          <Cite id="25">AMACO</Cite>
        </p>
      </GuideSection>

      <GuideSection id="brushing-brush-types" title="7.3 Brush Types" level={3}>
        <p>
          Choosing the right brush is the single biggest factor in reducing
          streaking. The general principle: use the largest, softest brush
          practical for the area being glazed. A &ldquo;floppy brush that holds a
          lot of glaze&rdquo; allows long, even strokes that minimize marks.
          <Cite id="27">Sue McLeod Ceramics</Cite>
        </p>
        <ul className="ml-4 list-disc space-y-2">
          <li>
            <strong>Hake brushes</strong> — wide, flat brushes made of goat hair
            on a long wooden handle. They hold large volumes of glaze and are the
            preferred brush for applying base coats over large surfaces. Available
            1&ndash;6 inches wide. Multi-stem Japanese hakes — multiple bamboo
            shafts joined together — reduce streaking by distributing glaze more
            evenly than single-stem brushes.
            <Cite id="28">Dick Blick &ldquo;Ceramic and Glazing Brushes&rdquo;</Cite>
            <Cite id="11">Ceramic Arts Network</Cite>
            <Cite id="29">Pottery Crafters &ldquo;Best Glaze Brushes&rdquo;</Cite>
          </li>
          <li>
            <strong>Fan brushes</strong> — fanned bristles for blending,
            feathering, and soft-textured effects. AMACO specifically markets
            fitch fan brushes for glaze and underglaze application.
            <Cite id="25">AMACO</Cite>
            <Cite id="30">Paul Lewing, Ceramic Arts Network PDF</Cite>
          </li>
          <li>
            <strong>Mop brushes</strong> — oval, full-bodied brushes that carry
            and release liquid gradually for smooth, flowing coverage and blending.
            Mayco recommends oval mop or flat glaze brushes for their commercial
            glazes.
            <Cite id="13">Mayco Ceramics 101 pp.&nbsp;17&ndash;18, 20</Cite>
          </li>
          <li>
            <strong>Filbert brushes</strong> — an oval tip that combines the
            coverage of a flat with the blending ability of a round. Good for
            petals and organic shapes.
            <Cite id="11">Ceramic Arts Network</Cite>
          </li>
          <li>
            <strong>Liner brushes</strong> — thin and pointed for fine detail
            lines, signatures, and outlining.
            <Cite id="11">Ceramic Arts Network</Cite>
            <Cite id="30">Lewing PDF</Cite>
          </li>
          <li>
            <strong>Foam brushes</strong> — inexpensive, leave no brush strokes,
            and are suitable for even application of thin coats, but they hold
            less glaze than bristle brushes.
            <Cite id="11">Ceramic Arts Network</Cite>
          </li>
          <li>
            <strong>Rollers</strong> — cellulose sponge rollers or lambswool
            rollers produce less streaking than bristle brushes on large flat
            areas.
            <Cite id="28">Dick Blick</Cite>
          </li>
        </ul>
        <p>
          Avoid stiff or stained brushes. Stiff bristles drag through the glaze
          layer rather than depositing it, and residual color from previous glazes
          can contaminate the current application.
          <Cite id="13">Mayco Ceramics 101</Cite>
        </p>
      </GuideSection>

      <GuideSection id="brushing-stroke" title="7.4 Stroke Technique" level={3}>
        <p>
          Apply at least <strong>three coats</strong>, alternating brush direction
          with each coat. A common pattern is first coat horizontal, second coat
          diagonal, third coat vertical — this cross-hatching compensates for the
          inherent unevenness of brushed application.
          <Cite id="27">Sue McLeod Ceramics</Cite>
          <Cite id="31">The Clay Hole &ldquo;Glaze Brushing Techniques&rdquo;</Cite>
          <Cite id="32">Pottery Crafters &ldquo;How to Brush Glaze Pottery&rdquo;</Cite>{" "}
          Mayco recommends applying coats &ldquo;at right angles&rdquo; to each
          other, flowing the glaze in 3&ndash;4 long strokes per pass.
          <Cite id="13">Mayco Ceramics 101 pp.&nbsp;17, 20, 22</Cite>
        </p>
        <p>
          Each stroke should be long and smooth with a fully loaded brush. Reload
          often — short, repeated strokes cause streaking. Avoid going back over
          partially dried areas, which lifts the glaze rather than smoothing it.
          <Cite id="27">Sue McLeod Ceramics</Cite>{" "}
          Flow the glaze in a single direction without scrubbing.
          <Cite id="13">Mayco Ceramics 101</Cite>
        </p>
        <p>
          If the bisque is pulling water from the brush too aggressively, lightly
          dampen the piece before glazing. Linda Arbuckle notes that dampening
          pieces lightly can aid even brushability.
          <Cite id="8">Linda Arbuckle, Ceramic Arts Network PDF</Cite>{" "}
          &ldquo;Lightly&rdquo; matters — if the pot is actually wet, the raw
          glaze can slide, crawl, or refuse to build.
          <Cite id="8">Arbuckle</Cite>
        </p>
      </GuideSection>

      <GuideSection id="brushing-coats" title="7.5 Coat Count & Drying" level={3}>
        <p>
          Three brush coats of a properly formulated commercial brushing glaze are
          approximately equivalent to a 1&ndash;2 second dip in the same glaze at
          dipping consistency.
          <Cite id="26">Mayco &ldquo;Mixing and Using Mayco Dry Glaze&rdquo; PDF</Cite>{" "}
          Some opaque glazes and reds may need four coats for full color
          development.
          <Cite id="13">Mayco Ceramics 101</Cite>{" "}
          Two coats are often sufficient for clear or transparent glazes.
          <Cite id="13">Mayco</Cite>{" "}
          The goal is not a fixed number of coats but rather total dry thickness
          of approximately 1&ndash;1.5&nbsp;mm (paper-clip thickness) —
          under-application is the single most common brushing error.
          <Cite id="14">Digitalfire &ldquo;Glaze Thickness&rdquo;</Cite>
        </p>
        <p>
          Allow approximately <strong>15 minutes</strong> of drying time between
          coats. For faster workflow, the piece can be warmed to roughly
          200&nbsp;degrees&nbsp;F between coats to accelerate drying.
          <Cite id="1">Digitalfire &ldquo;Brushing Glaze&rdquo;</Cite>{" "}
          High-SG brushing glazes (1.5&ndash;1.6) deposit more material per coat
          and require fewer passes; low-SG versions (1.3&ndash;1.35) require more
          coats but give better thickness control.
          <Cite id="1">Digitalfire</Cite>
        </p>
      </GuideSection>

      <GuideSection id="brushing-greenware" title="7.6 Brushing on Greenware vs. Bisque" level={3}>
        <p>
          Brushing glaze on unfired greenware is less likely to cause streaking
          because greenware does not absorb water as aggressively as porous
          bisque, giving the wet coat more working time.
          <Cite id="11">Ceramic Arts Network (Robin Hopper)</Cite>{" "}
          However, single-fire glazing (glaze on greenware) is a distinct practice
          with adjusted recipes and careful technique to avoid saturating the
          clay. Most studio potters brush onto bisqueware.
        </p>
      </GuideSection>

      {/* ── Section 8: Other Methods ── */}
      <GuideSection id="other-methods" title="8. Other Methods">
        <p>
          Beyond the primary methods of dipping, pouring, spraying, and brushing,
          a range of decorative techniques allow potters to create texture,
          pattern, and visual depth on glazed surfaces. These methods work across
          cone ranges but should always be tested for interaction with the specific
          glaze being used.
        </p>
      </GuideSection>

      <GuideSection id="trailing" title="8.1 Trailing" level={3}>
        <p>
          Glaze trailing uses a squeeze bottle or slip trailer — a small,
          squeezable bottle with a fine-aperture tip — to draw raised lines, dots,
          and patterns on the surface. The glaze must be thicker and more viscous
          than a normal covering glaze so the extruded line holds its profile
          until drying and early firing.
          <Cite id="8">Linda Arbuckle, Ceramic Arts Network PDF</Cite>{" "}
          Fired relief still softens and spreads somewhat, especially at mid- and
          high-fire temperatures; low-fire majolica and underglaze trailing
          usually preserve sharper edges than fluid cone-6 or cone-10 glazes.
          <Cite id="8">Arbuckle</Cite>
        </p>
        <p>
          Squeeze bottles with precision metal tips in various gauge sizes give
          the finest control. Consistent hand pressure is key — practice on test
          tiles before working on finished pieces.
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          Trail onto bisque or unfired surfaces; trailing over an existing glaze
          layer is fragile and prone to flaking before firing.
          <Cite id="11">Ceramic Arts Network</Cite>
        </p>
      </GuideSection>

      <GuideSection id="sponging" title="8.2 Sponging" level={3}>
        <p>
          Sponging involves dipping a natural or synthetic sponge into glaze and
          dabbing it onto the surface to create soft, mottled, textured effects.
          Fine-grained sponges (silk sponges) produce delicate, even patterns,
          while coarse natural sponges (sea wool) create bolder textures.
          <Cite id="11">Ceramic Arts Network</Cite>
          <Cite id="12">DiamondCore Tools</Cite>{" "}
          Synthetic sponges can be cut or burned into specific shapes for repeat
          patterns in production work.
        </p>
        <p>
          Sponging builds thickness more slowly than brushing — Mayco notes that
          4&ndash;5 sponge applications are equivalent to roughly 3 brushed
          coats.
          <Cite id="13">Mayco Ceramics 101 p.&nbsp;18</Cite>{" "}
          Layering sponge marks in multiple colors builds visual depth. A sponge
          loaded with wax resist can also be used to create wax patterns before
          glazing.
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          Sponging works best on textured ware where the technique enhances
          surface variation.
        </p>
      </GuideSection>

      <GuideSection id="stamping" title="8.3 Stamping" level={3}>
        <p>
          Stamps made from bisque-fired clay, plaster, commercial rubber, or
          carved foam can be loaded with glaze or underglaze and pressed onto the
          ceramic surface to transfer a pattern. Load the stamp evenly and press
          firmly for clean transfer. Bisque stamps absorb moisture from the glaze,
          which helps release the stamp cleanly; rubber and foam stamps work
          better with underglaze than with glaze, as glaze tends to stick to
          non-porous surfaces.
          <Cite id="11">Ceramic Arts Network</Cite>{" "}
          Overlaying stamped marks in multiple colors develops complexity and
          visual depth.
        </p>
      </GuideSection>

      <GuideSection id="stippling" title="8.4 Stippling" level={3}>
        <p>
          Stippling uses the edge or tip of a stiff-bristled brush (or sponge)
          held vertically and pounced onto the surface to produce a broken, dotted
          texture rather than a smooth coating. House-painting brushes or
          artist&apos;s bristle brushes work well. Do not overcharge the brush
          with glaze, as excess causes runoff and pooling.
          <Cite id="11">Ceramic Arts Network (Robin Hopper)</Cite>{" "}
          Stippling is particularly effective for applying glaze over carved,
          stamped, or incised surfaces where brush strokes would skip over
          recesses.
        </p>
      </GuideSection>

      <GuideSection id="spattering" title="8.5 Spattering" level={3}>
        <p>
          Spattering creates a speckled, broken texture by loading a
          stiff-bristled brush (toothbrush, stencil brush) with glaze and drawing
          a knife blade or fingertip across the bristles to release an uneven
          spray of droplets. Distance from the surface and bristle stiffness
          control droplet size and density. Mask areas that should not receive
          spatter using wax resist, tape, or paper. Multiple colors can be
          spattered in layers for complex effects.
          <Cite id="11">Ceramic Arts Network</Cite>
        </p>
      </GuideSection>

      <GuideSection id="finger-wiping" title="8.6 Finger-Wiping (Wax Resist Reveal)" level={3}>
        <p>
          Finger-wiping involves applying a glaze coat over the entire surface,
          then using a finger, sponge, or rubber rib to wipe glaze away from
          raised surfaces — ridges, texture, stamps — while it remains in the
          recesses. This is the ceramic equivalent of an antiquing or wash
          technique. The wiped areas can be left bare (showing the clay body) or a
          second contrasting glaze can be applied over them. Wax resist is often
          applied to the wiped areas before re-glazing to prevent the second glaze
          from filling in.
          <Cite id="33">Ceramic Arts Network &ldquo;Wax Resist, Slip Inlay, and Glaze&rdquo;</Cite>
          <Cite id="34">Glendale Community College Ceramics &ldquo;Wax Resist&rdquo;</Cite>
        </p>
        <p>
          Timing is critical: wipe while the glaze is leather-hard (damp but not
          wet). If too wet, wiping smears; if too dry, the glaze resists removal
          and creates dust.
          <Cite id="33">Ceramic Arts Network</Cite>
        </p>
      </GuideSection>

      {/* ── Cross-Cutting Considerations ── */}
      <GuideSection id="cross-cutting" title="Cross-Cutting Considerations">
        <p>
          Several factors cut across all application methods and are worth
          understanding as standalone topics.
        </p>
      </GuideSection>

      <GuideSection id="bisque-temp-effect" title="Bisque Temperature & Its Effect on All Methods" level={3}>
        <p>
          Bisque firing temperature directly controls the porosity of the ware and
          thus how quickly and thickly any method deposits glaze. Cone 06 bisque
          (~1000&nbsp;degrees&nbsp;C / 1830&nbsp;degrees&nbsp;F) is more porous
          and fragile — it absorbs glaze rapidly and can build overly thick layers
          if dip times are not shortened or SG is not reduced. Cone 04 bisque
          (~1060&nbsp;degrees&nbsp;C / 1945&nbsp;degrees&nbsp;F) is stronger and
          less porous, requiring longer hold times or higher-SG glaze for
          equivalent coverage.
          <Cite id="15">BigCeramicStore &ldquo;Choosing a Bisque Temperature&rdquo;</Cite>
          <Cite id="27">Sue McLeod Ceramics</Cite>{" "}
          Most studio potters bisque at cone 06 for low-fire work and cone 06 or
          cone 04 for mid- and high-fire work.
        </p>
      </GuideSection>

      <GuideSection id="target-thickness" title="Target Dry Glaze Thickness" level={3}>
        <p>
          The target dry glaze thickness for most functional stoneware glazes is
          approximately the thickness of a standard steel paper clip wire —
          roughly 1&ndash;1.5&nbsp;mm (approximately 1/16&nbsp;inch). Transparent
          glazes should be thinner; heavily opacified or matte glazes may need to
          be slightly thicker. Some sources describe this as approximately
          &ldquo;dime thickness&rdquo; or &ldquo;postcard thickness.&rdquo;
          <Cite id="13">Mayco Ceramics 101</Cite>{" "}
          Some specialty glazes (crystalline, ash, crawl) require deliberately
          thick or thin application. Always test on tiles before committing to
          production pieces.
          <Cite id="14">Digitalfire &ldquo;Glaze Thickness&rdquo;</Cite>
        </p>
      </GuideSection>

      <GuideSection id="sg-summary" title="Specific Gravity Summary" level={3}>
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
                <td className="py-2 pr-4">1.40&ndash;1.50</td>
                <td className="py-2">Thixotropic, gelled with flocculant; 1.43&ndash;1.45 ideal for most recipes</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Pouring</td>
                <td className="py-2 pr-4">1.35&ndash;1.40</td>
                <td className="py-2">Slightly thinner than dipping for even flow</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Spraying</td>
                <td className="py-2 pr-4">1.25&ndash;1.35</td>
                <td className="py-2">Thin enough to atomize; add ~1% sodium silicate as deflocculant</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4 font-medium text-foreground">Brushing</td>
                <td className="py-2 pr-4">1.30&ndash;1.60</td>
                <td className="py-2">With CMC gum; higher SG = fewer coats needed</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">Majolica base (Arbuckle)</td>
                <td className="py-2 pr-4">1.62</td>
                <td className="py-2">Very thick for opacity</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Sources: Tony Hansen, Digitalfire, &ldquo;Specific Gravity&rdquo;;
          Glazy.org, &ldquo;Specific Gravity&rdquo;; Linda Arbuckle,
          &ldquo;Majolica Handout.&rdquo; These are starting points — every glaze
          recipe, clay body, bisque temperature, and kiln behaves differently.
          Document your working SG for each glaze once dialed in.
        </p>
      </GuideSection>

      {/* ── References ── */}
      <Bibliography>
        <Reference id="1">
          Tony Hansen, &ldquo;Brushing Glaze,&rdquo; &ldquo;Dipping Glaze,&rdquo;
          &ldquo;Specific Gravity,&rdquo; &amp; &ldquo;Base-Coat Dipping
          Glaze,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="2">
          Walker Ceramics, &ldquo;Glaze Application Techniques&rdquo; fact sheet.
        </Reference>
        <Reference id="3">
          Tony Hansen, &ldquo;Thixotropy,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/thixotropy" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="4">
          Roger Graham, &ldquo;Glaze Spraying for the Craft Potter,&rdquo;
          Digitalfire PDF.
        </Reference>
        <Reference id="5">
          Seattle Pottery Supply, &ldquo;How to Dip Glaze Pottery.&rdquo;
        </Reference>
        <Reference id="6">
          AMACO, <em>Potters Choice Dry Dipping Glaze Instructions</em> (PDF).
        </Reference>
        <Reference id="7">
          Ceramic Arts Daily, &ldquo;12 Pottery Glazing Tips.&rdquo;
        </Reference>
        <Reference id="8">
          Linda Arbuckle, &ldquo;Five Great Ceramic Glazing Techniques&rdquo;
          &amp; &ldquo;Majolica Handout,&rdquo; Ceramic Arts Network PDF.
        </Reference>
        <Reference id="9">
          Robin Hopper, <em>The Ceramic Spectrum</em>, 2nd ed.
        </Reference>
        <Reference id="10">
          Tony Hansen, &ldquo;Pour Glazing,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/pour+glazing" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="11">
          Ceramic Arts Network, &ldquo;8 Ways to Apply Glaze&rdquo; (Robin
          Hopper).
        </Reference>
        <Reference id="12">
          DiamondCore Tools, &ldquo;Pottery Glazing Techniques.&rdquo;
        </Reference>
        <Reference id="13">
          Mayco Colors, <em>Ceramics 101</em> technical booklet, pp.&nbsp;17&ndash;23.
        </Reference>
        <Reference id="14">
          Tony Hansen, &ldquo;Glaze Thickness,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/glaze+thickness" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="15">
          BigCeramicStore, &ldquo;Choosing a Bisque Temperature.&rdquo;
        </Reference>
        <Reference id="16">
          Alan Willoughby, &ldquo;Munn&apos;s Tenmoku,&rdquo; Ceramic Arts
          Network recipe note.
        </Reference>
        <Reference id="17">
          The Studio Manager, &ldquo;Spray Gun Buyer&apos;s Guide&rdquo; &amp;
          &ldquo;Best Masks for Silica Dust.&rdquo;
        </Reference>
        <Reference id="18">
          Marian Williams, &ldquo;Tips and Tools: Spray Gun Selection,&rdquo;{" "}
          <em>Ceramics Monthly</em>.
        </Reference>
        <Reference id="19">
          Ceramic Arts Daily community forum, &ldquo;What spray nozzle size do
          you like.&rdquo;
        </Reference>
        <Reference id="20">
          Glazy wiki,{" "}
          <a href="https://glazy.org" className="underline">
            glazy.org
          </a>.
        </Reference>
        <Reference id="21">
          WoodWeb, &ldquo;Fan Choice and Air Speed Calculations for a Spray
          Booth.&rdquo;
        </Reference>
        <Reference id="22">
          ACGIH, <em>Industrial Ventilation: A Manual of Recommended Practice</em>.
        </Reference>
        <Reference id="23">
          OSHA, Respirable Crystalline Silica Standard (29 CFR 1910.1053) &amp;
          spray booth guidance.
        </Reference>
        <Reference id="24">
          CDC/NIOSH, respirator filtration ratings (P100: 99.97% efficiency).
        </Reference>
        <Reference id="25">
          AMACO, &ldquo;Adding Gum Solution to Glaze&rdquo; &amp; product
          descriptions.
        </Reference>
        <Reference id="26">
          Mayco, &ldquo;Mixing and Using Mayco Dry Glaze&rdquo; (PDF).
        </Reference>
        <Reference id="27">
          Sue McLeod Ceramics,{" "}
          <a href="https://suemcleodceramics.com" className="underline">
            suemcleodceramics.com
          </a>.
        </Reference>
        <Reference id="28">
          Dick Blick, &ldquo;Ceramic and Glazing Brushes.&rdquo;
        </Reference>
        <Reference id="29">
          Pottery Crafters, &ldquo;Best Glaze Brushes.&rdquo;
        </Reference>
        <Reference id="30">
          Paul Lewing, &ldquo;Brushes for China Painting,&rdquo; Ceramic Arts
          Network PDF.
        </Reference>
        <Reference id="31">
          The Clay Hole, &ldquo;Glaze Brushing Techniques.&rdquo;
        </Reference>
        <Reference id="32">
          Pottery Crafters, &ldquo;How to Brush Glaze Pottery.&rdquo;
        </Reference>
        <Reference id="33">
          Ceramic Arts Network, &ldquo;How to Create Surface Patterns with Wax
          Resist, Slip Inlay, and Glaze.&rdquo;
        </Reference>
        <Reference id="34">
          Glendale Community College Ceramics, &ldquo;Wax Resist.&rdquo;
        </Reference>
      </Bibliography>
    </>
  );
}
