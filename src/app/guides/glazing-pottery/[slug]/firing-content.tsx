import { GuideSection } from "@/components/guide/guide-section";
import {
  Bibliography,
  Cite,
  Reference,
} from "@/components/guide/citation";
import type { TocItem } from "@/components/guide/guide-toc";

export const firingToc: TocItem[] = [
  { id: "atmosphere-kiln-type", label: "15. Atmosphere & Kiln Type", level: 2 },
  { id: "oxidation-reduction", label: "15.1 Oxidation vs. Reduction", level: 3 },
  { id: "electric-vs-fuel", label: "15.2 Electric vs. Fuel Kilns", level: 3 },
  { id: "atmospheric-deposition", label: "15.3 Wood, Soda & Salt Effects", level: 3 },
  { id: "heatwork-schedules", label: "16. Heatwork, Ramps & Cooling", level: 2 },
  { id: "cones-heatwork", label: "16.1 Cones Measure Heatwork", level: 3 },
  { id: "witness-cones", label: "16.2 Witness Cones vs. Controllers", level: 3 },
  { id: "ramp-rate-burnout", label: "16.3 Ramp Rate, Burnout & Venting", level: 3 },
  { id: "soaks-drop-hold", label: "16.4 Soaks, Drop-and-Hold & Defect Healing", level: 3 },
  { id: "cooling-rate", label: "16.5 Cooling Rate & Controlled Cooling", level: 3 },
  { id: "loading-refiring", label: "17. Loading, Refiring & Product-Specific Results", level: 2 },
  { id: "kiln-loading", label: "17.1 Kiln Loading & Placement", level: 3 },
  { id: "refiring", label: "17.2 Refiring", level: 3 },
  { id: "commercial-caveats", label: "17.3 Commercial Glaze Caveats", level: 3 },
];

export function FiringContent() {
  return (
    <>
      <GuideSection id="atmosphere-kiln-type" title="15. Atmosphere & Kiln Type">
        <p>
          Firing is where glaze chemistry stops being theoretical. The same glaze
          can change color, gloss, movement, and surface texture depending on
          atmosphere, kiln type, ramp rate, cooling curve, and even shelf
          position. For Glaze Library&apos;s audience, the most important baseline
          is that commercial brush-on glazes are usually developed and photographed
          in electric oxidation firings.
        </p>
      </GuideSection>

      <GuideSection id="oxidation-reduction" title="15.1 Oxidation vs. Reduction" level={3}>
        <p>
          <strong>Oxidation</strong> means the kiln atmosphere has enough oxygen
          for fuel and glaze materials to oxidize fully. <strong>Reduction</strong>
          means there is not enough oxygen, so burning fuel and hot gases pull
          oxygen from metallic oxides in the clay and glaze.
          <Cite id="1">Digitalfire oxidation firing</Cite>
          <Cite id="2">Ceramic Arts Network reduction article</Cite>
        </p>
        <p>
          That oxygen shift is why color changes so dramatically. Copper tends to
          stay green in oxidation but can move toward red in reduction. Iron stays
          more brown, tan, or amber in oxidation but can become celadon blue-green,
          tenmoku brown-black, or more fluid in reduction because reduced iron is
          also a stronger flux.
          <Cite id="2">Ceramic Arts Network reduction article</Cite>
          <Cite id="3">Techno File: Determining Glaze Color</Cite>
        </p>
        <p>
          For commercial users, the practical rule is simple: most manufacturer
          sample chips assume oxidation, so reduction immediately makes the label
          less predictive.
          <Cite id="4">Mayco stoneware guide</Cite>
          <Cite id="5">AMACO product pages</Cite>{" "}
          Reduction is not &ldquo;wrong,&rdquo; but it is a different test
          environment. If your glaze contains iron, copper, rutile, chrome, or a
          celadon-style chemistry, expect visible differences and test before you
          trust the jar photo.
        </p>
      </GuideSection>

      <GuideSection id="electric-vs-fuel" title="15.2 Electric vs. Fuel Kilns" level={3}>
        <p>
          Electric kilns are the most repeatable choice for commercial brush-on
          glazes because they naturally fire in oxidation and avoid ash, flame
          path, and fuel-air balancing variables.
          <Cite id="4">Mayco stoneware guide</Cite>
          <Cite id="6">Coyote cone 6 guidance</Cite>{" "}
          That is one reason most commercial glaze systems target electric users
          first.
        </p>
        <p>
          Gas kilns add more atmosphere variability and can move between oxidation
          and reduction during the same firing. That creates richer traditional
          stoneware surfaces, but it also makes commercial brush-on samples less
          reproducible.
          <Cite id="2">Ceramic Arts Network reduction article</Cite>
        </p>
        <p>
          Some commercial lines deliberately try to mimic reduction looks in
          oxidation. AMACO describes Potter&apos;s Choice as offering mid-range
          reduction looks in oxidation, and its self-reducing copper-red family is
          designed to create a reduction-like red effect inside the glaze itself.
          <Cite id="7">AMACO Potter's Choice Advantage</Cite>
          <Cite id="8">AMACO PC-70 Copper Red</Cite>{" "}
          These are powerful commercial tools, but they still depend heavily on
          thickness, cone, and clay body.
        </p>
      </GuideSection>

      <GuideSection id="atmospheric-deposition" title="15.3 Wood, Soda & Salt Effects" level={3}>
        <p>
          Wood, soda, and salt kilns do more than heat the glaze already on the
          pot. They also add surface material during the firing. Wood ash can
          flux the surface, while salt and soda vapors react with silica and
          alumina to create sodium-rich glaze effects directly on exposed clay and
          glaze surfaces.
          <Cite id="3">Techno File: Determining Glaze Color</Cite>
          <Cite id="9">Fuel-burning kilns article</Cite>
        </p>
        <p>
          This is why atmospheric firings can create orange-peel texture,
          flashing, darker gloss, or extra running even when the dipped or brushed
          glaze recipe was unchanged.
          <Cite id="3">Techno File: Determining Glaze Color</Cite>{" "}
          For the public guide, that matters mostly as a caution: commercial glaze
          labels are not meant to predict wood, soda, or salt results with high
          accuracy.
        </p>
      </GuideSection>

      <GuideSection id="heatwork-schedules" title="16. Heatwork, Ramps & Cooling">
        <p>
          Most firing mistakes happen because potters think only in peak
          temperature. Glazes do not mature at one number alone. They mature from
          the total combination of time, temperature, atmosphere, and cooling.
        </p>
      </GuideSection>

      <GuideSection id="cones-heatwork" title="16.1 Cones Measure Heatwork" level={3}>
        <p>
          A pyrometric cone measures <strong>heatwork</strong>, not just
          temperature. That means time matters. Orton&apos;s own data shows that
          cone 6 bends at different temperatures depending on heating rate:
          approximately 1185C at 15C/hr, 1222C at 60C/hr, and 1243C at 150C/hr.
          <Cite id="10">Orton cone 6 data</Cite>
          <Cite id="11">Orton cones FAQ</Cite>
        </p>
        <p>
          This explains one of the most confusing studio experiences: two firings
          can both say &ldquo;cone 6&rdquo; and still produce different glaze
          results. A faster firing often leaves glazes looking drier or less
          developed, while a longer firing can deepen color, increase gloss, or
          push a glaze into running.
          <Cite id="3">Techno File: Determining Glaze Color</Cite>
        </p>
      </GuideSection>

      <GuideSection id="witness-cones" title="16.2 Witness Cones vs. Controllers" level={3}>
        <p>
          Digital controllers are useful, but they do not replace witness cones.
          Controllers read thermocouples, and thermocouples drift over time.
          Orton explicitly warns that electronically controlled kilns still need
          cone verification because the controller only estimates what the ware
          experienced.
          <Cite id="12">Orton on witness cones</Cite>
        </p>
        <p>
          Manufacturers agree. Mayco tells users to always use witness cones, and
          AMACO product pages repeatedly note that their firing temperatures are
          based on normal medium-speed firings.
          <Cite id="4">Mayco stoneware guide</Cite>
          <Cite id="5">AMACO product pages</Cite>
        </p>
        <p>
          In practice, use cone packs on more than one shelf, especially when you
          are comparing test tiles, reactive glazes, or matte surfaces that are
          very sensitive to under- or over-fire. Orton considers a cone properly
          fired when its tip bends to roughly the 5-to-6-o&apos;clock position.
          <Cite id="11">Orton cones FAQ</Cite>
        </p>
      </GuideSection>

      <GuideSection id="ramp-rate-burnout" title="16.3 Ramp Rate, Burnout & Venting" level={3}>
        <p>
          Slow early firing is not just about being careful. It gives water,
          carbon, sulfur, and organic materials time to burn out before the glaze
          seals the body.
          <Cite id="13">Bisque firing schedule article</Cite>
          <Cite id="14">Skutt venting guide</Cite>
        </p>
        <p>
          Steve Davis identifies the 700-900C zone as especially important for
          carbon and sulfur burnout. If that oxidation is incomplete, the later
          glaze firing is far more likely to show black coring, bloating,
          pinholing, or blistering.
          <Cite id="13">Bisque firing schedule article</Cite>
        </p>
        <p>
          Venting matters for the same reason. Skutt ties poor kiln venting not
          only to room fumes but also to weak warm colors, cloudy surfaces,
          pinholes, blisters, and uneven firing. Its downdraft vent guidance also
          says improved circulation can cut top-to-bottom temperature differences
          to about half normal.
          <Cite id="14">Skutt venting guide</Cite>
        </p>
        <p>
          For commercial brush-on users, the practical firing takeaway is:
          low-fire clears, reactive cone-6 glazes, and thick application all
          benefit from clean burnout and good oxygen supply early in the firing.
        </p>
      </GuideSection>

      <GuideSection id="soaks-drop-hold" title="16.4 Soaks, Drop-and-Hold & Defect Healing" level={3}>
        <p>
          A short soak at maturity gives the glaze more time to smooth out and can
          help heal pinholes or small blisters. But there is an important
          difference between holding <em>at peak</em> and holding{" "}
          <em>after dropping</em> a little.
          <Cite id="15">Digitalfire drop-and-soak</Cite>
        </p>
        <p>
          Digitalfire&apos;s drop-and-soak logic is that a glaze often keeps
          percolating bubbles during a top-temperature soak. Dropping the
          temperature by roughly 100-200F and holding there can help bubbles burst
          and heal when the melt is slightly more viscous.
          <Cite id="15">Digitalfire drop-and-soak</Cite>
          <Cite id="16">Digitalfire PLC6DS schedule</Cite>
        </p>
        <p>
          This is especially useful in electric cone-6 firing for pinholing and
          blistering, but it is not a blanket rule. Long peak holds can also
          increase running, muddy layered overlaps, or over-mature a commercial
          glaze that was already close to its limit.
          <Cite id="16">Digitalfire PLC6DS schedule</Cite>
          <Cite id="3">Techno File: Determining Glaze Color</Cite>
        </p>
      </GuideSection>

      <GuideSection id="cooling-rate" title="16.5 Cooling Rate & Controlled Cooling" level={3}>
        <p>
          Cooling is part of firing, not something that happens after firing is
          &ldquo;done.&rdquo; Slow cooling gives crystals more time to grow, which
          is why it can improve rutile-blue response, reactive mattes, and some
          crystal-bearing commercial glazes.
          <Cite id="17">Digitalfire C6DHSC</Cite>
          <Cite id="18">Digitalfire rutile blue</Cite>
          <Cite id="19">Coyote firing instructions</Cite>
        </p>
        <p>
          Coyote publishes a concrete cone-5/6 slow-cool schedule as a starting
          point, and AMACO says its Cosmos line develops more crystal growth under
          controlled cooling.
          <Cite id="19">Coyote firing instructions</Cite>
          <Cite id="20">AMACO Cosmos</Cite>{" "}
          Those are good examples of when a special cooling curve is genuinely
          useful.
        </p>
        <p>
          But slow cooling is not always better. Digitalfire documents boron-rich
          clears that cloud during slow cooling but stay clearer when cooled
          faster.
          <Cite id="21">Digitalfire clouding</Cite>{" "}
          Some glazes also become too matte, too crystalline, or too runny if the
          kiln spends too long in their crystal-growth window. The safest public
          rule is: use controlled cooling when the glaze line or your testing
          shows a real benefit, not by default for every glaze.
        </p>
      </GuideSection>

      <GuideSection id="loading-refiring" title="17. Loading, Refiring & Product-Specific Results">
        <p>
          Even with the right cone and a good schedule, results still change if
          the kiln is loaded unevenly or if the glaze line itself is very
          schedule-sensitive. This is where practical kiln habits matter as much
          as chemistry.
        </p>
      </GuideSection>

      <GuideSection id="kiln-loading" title="17.1 Kiln Loading & Placement" level={3}>
        <p>
          Shelf position changes heatwork. Skutt notes that the center of the
          kiln is often hottest, while top and bottom shelves can underfire if
          packed too tightly. It also recommends about 5 inches below the lid for
          the top shelf, about 1 inch above the floor for the first shelf, and
          about 2 inches of clearance around the thermocouple tip.
          <Cite id="22">Skutt loading article</Cite>
          <Cite id="23">Skutt loading appendix</Cite>
        </p>
        <p>
          Dense or unbalanced loads can therefore create the illusion that a
          glaze is inconsistent when the real issue is shelf position. If one
          side, one level, or one dense load always looks different, check witness
          cones on multiple shelves before changing the glaze itself.
          <Cite id="22">Skutt loading article</Cite>
        </p>
      </GuideSection>

      <GuideSection id="refiring" title="17.2 Refiring" level={3}>
        <p>
          Refiring can fix some problems, but it is not a neutral reset. Once the
          pot has already matured once, the body is denser and the glaze may
          remelt differently on the second firing.
          <Cite id="24">Digitalfire refiring</Cite>
        </p>
        <p>
          Minor underfire, small pinholes, decals, lusters, and some overglaze
          work are reasonable refire situations. But reactive and highly fluid
          glazes are much riskier. Digitalfire notes that rutile-blue and
          blister-prone glazes can run or blister more on refire, and AMACO says
          that refiring will not rescue PC-70 Copper Red once its reduction
          materials have burned off.
          <Cite id="24">Digitalfire refiring</Cite>
          <Cite id="8">AMACO PC-70 Copper Red</Cite>
        </p>
        <p>
          The practical rule is cautious: refire only when you know what defect
          you are trying to fix, and test first if the glaze is known to be
          reactive, layered, or runny.
        </p>
      </GuideSection>

      <GuideSection id="commercial-caveats" title="17.3 Commercial Glaze Caveats" level={3}>
        <p>
          A glaze&apos;s printed cone range is a firing window, not a promise of
          one perfect appearance. Commercial glazes often have a range where they
          mature safely and a narrower zone where they look best.
        </p>
        <p>
          AMACO&apos;s PC-70 Copper Red is a good example: the company says it is
          at its most red at cone 5, while cone 6 produces a more purple-red
          effect and more running risk.
          <Cite id="8">AMACO PC-70 Copper Red</Cite>{" "}
          Mayco&apos;s SW-135 Wintergreen is another: it reads as a truer matte at
          cone 5 and becomes more satin by cone 6.
          <Cite id="25">Mayco SW-135 Wintergreen</Cite>
        </p>
        <p>
          The same goes for special schedules. Some product lines respond strongly
          to controlled cooling. Others do not require it. AMACO says Cosmos gains
          more crystal growth with controlled cooling, while Mayco says its
          Stoneware Crystal glazes do not require a special firing schedule for
          their basic crystal effects.
          <Cite id="20">AMACO Cosmos</Cite>
          <Cite id="26">Mayco Stoneware guidance</Cite>
        </p>
        <p>
          That is why the best commercial-glaze advice is not &ldquo;always fire
          cone 6&rdquo; or &ldquo;always slow cool.&rdquo; It is: use witness
          cones, test your actual kiln, and treat the manufacturer&apos;s firing
          notes as product-specific data rather than optional marketing copy.
        </p>
      </GuideSection>

      <Bibliography>
        <Reference id="1">
          Tony Hansen, &ldquo;Oxidation Firing,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/oxidation+firing" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="2">
          Ceramic Arts Network, &ldquo;Techno File: Reduction Misnomer.&rdquo;
        </Reference>
        <Reference id="3">
          Jeff Zamek, &ldquo;Techno File: Determining Glaze Color,&rdquo;{" "}
          <em>Ceramics Monthly</em>.
        </Reference>
        <Reference id="4">
          Mayco Colors, <em>Using Mayco Stoneware Glazes</em> (2023 PDF).
        </Reference>
        <Reference id="5">
          AMACO mid/high-fire product pages noting oxidation results and normal
          medium-speed firing assumptions.
        </Reference>
        <Reference id="6">
          Coyote Clay &amp; Color, cone-6 glaze guidance and electric-kiln notes,{" "}
          <a href="https://coyoteclay.com" className="underline">
            coyoteclay.com
          </a>.
        </Reference>
        <Reference id="7">
          AMACO, <em>Potter&apos;s Choice Advantage</em> (PDF).
        </Reference>
        <Reference id="8">
          AMACO, &ldquo;PC-70 Copper Red: Tips and Tricks,&rdquo;{" "}
          <a href="https://amaco.com/resources/blog/pc-70-copper-red-tips-and-tricks" className="underline">
            amaco.com
          </a>.
        </Reference>
        <Reference id="9">
          Ceramic Arts Network, &ldquo;An Introduction to Fuel-Burning Kilns.&rdquo;
        </Reference>
        <Reference id="10">
          Orton Ceramic, cone 6 self-supporting cone data,{" "}
          <a href="https://www.ortonceramic.com/product-page/6-self-supporting-25-box" className="underline">
            ortonceramic.com
          </a>.
        </Reference>
        <Reference id="11">
          Orton Ceramic, &ldquo;Pyrometric Cones FAQ,&rdquo;{" "}
          <a href="https://www.ortonceramic.com/pyrometric-cones-faq" className="underline">
            ortonceramic.com
          </a>.
        </Reference>
        <Reference id="12">
          Orton Ceramic, &ldquo;Are Pyrometric Cones Necessary in an Electronically Controlled Kiln?&rdquo;
        </Reference>
        <Reference id="13">
          Ceramic Arts Network, &ldquo;A Bisque Firing Schedule to Help Prevent Glaze Faults.&rdquo;
        </Reference>
        <Reference id="14">
          Skutt, <em>The Facts About Kiln Ventilation</em> (EnviroVent guide PDF).
        </Reference>
        <Reference id="15">
          Digitalfire, &ldquo;Drop-and-Soak Firing,&rdquo;{" "}
          <a href="https://digitalfire.com/glossary/drop-and-soak%20firing" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="16">
          Digitalfire, &ldquo;PLC6DS&rdquo; schedule,{" "}
          <a href="https://www.digitalfire.com/schedule/117" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="17">
          Digitalfire, &ldquo;C6DHSC&rdquo; schedule,{" "}
          <a href="https://digitalfire.com/schedule/c6dhsc" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="18">
          Digitalfire, &ldquo;Rutile Blue Glazes,&rdquo;{" "}
          <a href="https://digitalfire.com/glossary/rutile+blue+glazes" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="19">
          Coyote Clay &amp; Color, &ldquo;Glazing and Firing Instructions,&rdquo;{" "}
          <a href="https://www.coyoteclay.com/Instructions.html" className="underline">
            coyoteclay.com
          </a>.
        </Reference>
        <Reference id="20">
          AMACO, &ldquo;(CO) Cosmos,&rdquo; product page.
        </Reference>
        <Reference id="21">
          Digitalfire, &ldquo;Clouding in Ceramic Glazes,&rdquo;{" "}
          <a href="https://digitalfire.com/trouble/clouding%20in%20ceramic%20glazes" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="22">
          Skutt, &ldquo;Best Practices for Loading and Firing Your Skutt Kiln.&rdquo;
        </Reference>
        <Reference id="23">
          Skutt, <em>Appendix 4 - Loading Tips</em>.
        </Reference>
        <Reference id="24">
          Digitalfire, &ldquo;Refiring Ceramics,&rdquo;{" "}
          <a href="https://digitalfire.com/glossary/refiring%2Bceramics" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="25">
          Mayco, &ldquo;SW-135 Wintergreen,&rdquo; product page.
        </Reference>
        <Reference id="26">
          Mayco stoneware line guidance and crystal-glaze scheduling notes,{" "}
          <a href="https://www.maycocolors.com/color/fired/stoneware/" className="underline">
            maycocolors.com
          </a>.
        </Reference>
      </Bibliography>
    </>
  );
}
