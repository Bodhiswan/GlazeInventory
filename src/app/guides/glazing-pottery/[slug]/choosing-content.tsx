import Link from "next/link";

import { GuideSection } from "@/components/guide/guide-section";
import { Bibliography, Cite, Reference } from "@/components/guide/citation";
import type { TocItem } from "@/components/guide/guide-toc";

export const choosingToc: TocItem[] = [
  { id: "short-answer", label: "The short answer", level: 2 },
  { id: "what-cone", label: "What cone do I need?", level: 2 },
  { id: "cone-6-vs-06", label: "Cone 6 vs. cone 06", level: 3 },
  { id: "gloss-or-matte", label: "Glossy, satin or matte?", level: 2 },
  { id: "food-safe", label: "Is this glaze food safe?", level: 2 },
  { id: "food-safe-labels", label: "What the label terms mean", level: 3 },
  { id: "liner-glaze", label: "Using a liner glaze", level: 3 },
  { id: "will-it-run", label: "Will it run?", level: 2 },
  { id: "trust-the-photo", label: "Will it look like the photo?", level: 2 },
  { id: "how-many-coats", label: "How many coats?", level: 3 },
  { id: "clay-body", label: "Will it suit my clay?", level: 2 },
  { id: "clear-and-underglaze", label: "Clear glaze & underglaze", level: 2 },
  { id: "layering", label: "Choosing glazes to layer", level: 2 },
  { id: "checklist", label: "A checklist before you buy", level: 2 },
];

const linkClass = "underline hover:text-foreground";

export function ChoosingContent() {
  return (
    <>
      <GuideSection id="short-answer" title="The short answer">
        <p>
          Choose a commercial glaze in this order: <strong>cone</strong> first,
          then <strong>what the piece is for</strong>, then{" "}
          <strong>surface</strong>, then <strong>colour</strong>. Colour is the
          fun part, but it is the last filter, not the first. A glaze in the
          wrong cone range will not work on your clay at all, and a beautiful
          runny matte is the wrong choice for the inside of a cereal bowl.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Match the cone on the jar to your clay body and your kiln.
          </li>
          <li>
            For anything that touches food, read the maker&apos;s food-contact
            guidance for that exact glaze, and treat layered glazes as
            untested.
          </li>
          <li>
            Check whether the maker calls the glaze stable or fluid before you
            put it near the foot of a pot.
          </li>
          <li>
            Treat the photo on the jar as one result on one clay. Fire a test
            tile on yours.
          </li>
        </ul>
        <p>
          The rest of this page explains each step and where the advice comes
          from. If you already know what you want, you can go straight to{" "}
          <Link href="/cone-6-glazes" className={linkClass}>
            Cone 6 glazes by colour, finish, type and brand
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="what-cone" title="What cone do I need?">
        <p>
          The cone is the first thing to check because it decides whether the
          glaze can work at all. Your clay body is made to be fired to a
          particular cone, and the glaze has to melt properly at that same
          firing. Mayco&apos;s own guidance is to follow the firing
          recommendations of your clay body.
          <Cite id="3">Mayco dinnerware suitability</Cite>
        </p>
        <p>
          If you fire at a community studio, ask what cone the glaze kiln goes
          to and buy for that. If you have your own kiln, the cone printed on
          your bag of clay is your answer. This site is built around{" "}
          <Link href="/glazes" className={linkClass}>
            cone 5–6 (midfire) glazes
          </Link>
          , so everything in the library is filtered to that range.
        </p>
      </GuideSection>

      <GuideSection id="cone-6-vs-06" title="Cone 6 vs. cone 06" level={3}>
        <p>
          These are not the same thing, and mixing them up is the most common
          buying mistake. The zero matters: cone 06 is a low-fire
          (earthenware) temperature and cone 6 is midfire, more than 200°C
          hotter. Orton, who make the cones, give these end points for
          self-supporting cones heated at 60°C (108°F) per hour over the last
          100°C (180°F) of the firing:
          <Cite id="1">Orton cone chart</Cite>
          <Cite id="2">Orton, When is a Cone 6 a Cone 6?</Cite>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-foreground">
                <th className="py-2 pr-4 font-medium">Cone</th>
                <th className="py-2 pr-4 font-medium">Range</th>
                <th className="py-2 pr-4 font-medium">°C</th>
                <th className="py-2 font-medium">°F</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Cone 06</td>
                <td className="py-2 pr-4">Low fire</td>
                <td className="py-2 pr-4">998</td>
                <td className="py-2">1828</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4">Cone 6</td>
                <td className="py-2 pr-4">Midfire</td>
                <td className="py-2 pr-4">1222</td>
                <td className="py-2">2232</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Cone 10</td>
                <td className="py-2 pr-4">High fire</td>
                <td className="py-2 pr-4">1285</td>
                <td className="py-2">2345</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The cone 10 Celsius figure is the one Mayco publishes alongside
          Orton&apos;s Fahrenheit value.
          <Cite id="4">Mayco stoneware guide</Cite> A cone measures heatwork,
          so these temperatures shift with how fast the kiln climbs; see{" "}
          <Link href="/guides/glazing-pottery/firing#cones-heatwork" className={linkClass}>
            Cones measure heatwork
          </Link>
          .
        </p>
        <p>
          Some glazes are rated for more than one range. Mayco&apos;s Stoneware
          line, for example, is sold for both cone 6 and cone 10, and the
          maker shows a separate fired chip for each.
          <Cite id="15">Mayco Stoneware product page</Cite> When a jar lists
          two cones, look for the photo that matches yours.
        </p>
      </GuideSection>

      <GuideSection id="gloss-or-matte" title="Glossy, satin or matte?">
        <p>
          Surface is a practical choice as much as a visual one. A glossy
          glaze is smooth glass: it wipes clean and shows colour at full
          strength. A matte surface is less smooth, and metal cutlery can leave
          grey marks on it. Digitalfire notes that cutlery marking usually
          happens when the surface is not smooth, mattes being the usual
          case.
          <Cite id="5">Digitalfire, Cutlery Marking</Cite>
        </p>
        <p>
          That does not make matte glazes a bad choice. It means they suit
          some jobs better than others:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Plates and bowls you eat from with cutlery:</strong> a{" "}
            <Link href="/cone-6-glazes/glossy" className={linkClass}>
              glossy glaze
            </Link>{" "}
            on the eating surface is the low-risk option.
          </li>
          <li>
            <strong>Mug exteriors, vases, planters, sculpture:</strong>{" "}
            <Link href="/cone-6-glazes/matte" className={linkClass}>
              matte
            </Link>{" "}
            and{" "}
            <Link href="/cone-6-glazes/satin" className={linkClass}>
              satin
            </Link>{" "}
            glazes are at their best where nothing scrapes across them.
          </li>
          <li>
            <strong>Carved or textured work:</strong> translucent glazes such
            as{" "}
            <Link href="/cone-6-glazes/celadon" className={linkClass}>
              celadons
            </Link>{" "}
            pool in the low spots and show the texture off.
          </li>
        </ul>
      </GuideSection>

      <GuideSection id="food-safe" title="Is this glaze food safe?">
        <p>
          There is no single yes-or-no answer printed on a jar that covers
          every pot you make with it. The safety of a finished piece depends
          on the glaze, how it was applied, how it was fired, and what was
          layered with it. Mayco puts the responsibility plainly: people who
          produce finished ware for sale are responsible for food-contact
          testing of that ware.
          <Cite id="3">Mayco dinnerware suitability</Cite>
        </p>
        <p>
          In the United States the legal concern is leachable lead and
          cadmium. The FDA has long-standing compliance policies for both in
          ceramic foodware, because these metals can be extracted from a
          glaze surface by acidic food.
          <Cite id="6">FDA CPG 545.450 (lead)</Cite>
          <Cite id="7">FDA CPG 545.400 (cadmium)</Cite>
        </p>
      </GuideSection>

      <GuideSection id="food-safe-labels" title="What the label terms mean" level={3}>
        <p>
          Makers use several terms, and they do not all mean the same thing:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Food safe.</strong> AMACO uses this to mean that a
            finished, fired piece does not release lead or cadmium above the
            legal limits.
            <Cite id="8">AMACO product updates</Cite>
          </li>
          <li>
            <strong>Dinnerware safe.</strong> AMACO treats this as a separate
            question about durability in use, and says customers need to test
            that in their own studio, because small differences in how a kiln
            fires change how tough and sealed the surface becomes.
            <Cite id="8">AMACO product updates</Cite>
          </li>
          <li>
            <strong>Suitable for dinnerware.</strong> Mayco has moved to this
            wording on its website in place of &ldquo;food safe&rdquo; and
            &ldquo;dinnerware safe&rdquo;.
            <Cite id="3">Mayco dinnerware suitability</Cite>
          </li>
          <li>
            <strong>AP Non-Toxic seal.</strong> This is an art-materials
            certification from ACMI: the product in the jar contains nothing
            in quantities toxic or injurious to people using it.
            <Cite id="9">ACMI</Cite> It is about handling the material, not
            about eating off the fired result. Digitalfire is explicit that
            the labelling standard behind it does not establish that a fired
            glaze is food safe or resistant to leaching.
            <Cite id="10">Digitalfire, Food Safe</Cite>
          </li>
        </ul>
        <p>
          All of these describe one glaze, used on its own, fired as the
          maker directs. Once you layer two glazes the result is a new,
          untested surface. Mayco says it cannot test every possible glaze
          combination and so cannot certify combinations as food safe.
          <Cite id="4">Mayco stoneware guide</Cite>
        </p>
      </GuideSection>

      <GuideSection id="liner-glaze" title="Using a liner glaze" level={3}>
        <p>
          The simplest way to have an adventurous outside and a dependable
          inside is a liner: one stable, plain glaze on the food surface and
          whatever you like on the exterior. Digitalfire recommends a stable
          transparent or white liner glaze for functional ware.
          <Cite id="11">Digitalfire, Liner Glaze</Cite>
        </p>
        <p>
          In practice that means pouring a{" "}
          <Link href="/cone-6-glazes/glossy-white" className={linkClass}>
            glossy white
          </Link>{" "}
          or{" "}
          <Link href="/cone-6-glazes/clear" className={linkClass}>
            clear
          </Link>{" "}
          inside the mug, and keeping the layered, reactive combination on
          the outside below the lip.
        </p>
      </GuideSection>

      <GuideSection id="will-it-run" title="Will it run?">
        <p>
          Some glazes stay where you put them. Others are made to move, and
          the movement is what creates the breaking and pooling people buy
          them for. Makers tell you which is which:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Mayco rates each Stoneware glaze as <strong>Stable</strong> or{" "}
            <strong>Fluid</strong>, and notes that fluid glazes often flow on
            vertical surfaces.
            <Cite id="4">Mayco stoneware guide</Cite>
          </li>
          <li>
            AMACO warns that some Potter&apos;s Choice glazes, Blue Rutile
            among them, can be very fluid if applied too heavily, and advises
            feathering certain glazes thinner toward the bottom of a piece.
            <Cite id="12">AMACO Potter&apos;s Choice application notes</Cite>
          </li>
          <li>
            Coyote&apos;s advice is to always leave enough room for the glaze
            to flow without sticking to the kiln shelf.
            <Cite id="13">Coyote glazing and firing tips</Cite>
          </li>
        </ul>
        <p>
          So for a first glaze, or for a piece with a narrow foot, a stable
          glaze is the forgiving choice. If you want a fluid one, keep it
          away from the bottom third, apply it thinner there, and expect more
          movement when you layer it. The{" "}
          <Link href="/cone-6-glazes/reactive" className={linkClass}>
            reactive and flowing glazes
          </Link>{" "}
          page lists the lines built for this.
        </p>
      </GuideSection>

      <GuideSection id="trust-the-photo" title="Will it look like the photo?">
        <p>
          The picture on the jar is a real result, but it is one result under
          one set of conditions. Knowing the conditions tells you how far to
          trust it:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Mayco Stoneware</strong> sample tiles are white stoneware,
            slip cast, fired flat to cone 6 in oxidation.
            <Cite id="4">Mayco stoneware guide</Cite>
          </li>
          <li>
            <strong>AMACO Potter&apos;s Choice</strong> tiles are AMACO 46-M
            buff stoneware fired to cone 5.
            <Cite id="14">AMACO Potter&apos;s Choice brochure</Cite>
          </li>
        </ul>
        <p>
          If your clay is darker, speckled or redder than the maker&apos;s
          tile, expect the glaze to read differently. A tile fired flat also
          cannot show how a fluid glaze behaves on a vertical wall. And
          Mayco&apos;s chips are oxidation results; a reduction firing is a
          different test altogether (see{" "}
          <Link href="/guides/glazing-pottery/firing#oxidation-reduction" className={linkClass}>
            Oxidation vs. reduction
          </Link>
          ).
        </p>
        <p>
          This is why every maker says the same thing in the end: test first.
          Mayco recommends testing before applying a glaze to artwork, and
          testing to see how a glaze responds to different clay bodies.
          <Cite id="4">Mayco stoneware guide</Cite>
          <Cite id="15">Mayco Stoneware product page</Cite>
        </p>
      </GuideSection>

      <GuideSection id="how-many-coats" title="How many coats?" level={3}>
        <p>
          Thickness changes colour, so the number of coats is part of
          matching the photo. The makers&apos; own starting points for
          brushing:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>AMACO Potter&apos;s Choice:</strong> three coats unless
            the label says otherwise.
            <Cite id="12">AMACO Potter&apos;s Choice application notes</Cite>
          </li>
          <li>
            <strong>Mayco Stoneware:</strong> two to four coats depending on
            how heavily you load the brush. To resemble Mayco&apos;s tiles,
            two coats on slip-cast ware and three on handbuilt or
            wheel-thrown ware.
            <Cite id="4">Mayco stoneware guide</Cite>
          </li>
          <li>
            <strong>Coyote:</strong> most glazes need two to three brushed
            coats.
            <Cite id="13">Coyote glazing and firing tips</Cite>
          </li>
        </ul>
        <p>
          For technique, see{" "}
          <Link href="/guides/glazing-pottery/application" className={linkClass}>
            Application Methods
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="clay-body" title="Will it suit my clay?">
        <p>
          A glaze and a clay body shrink by different amounts as they cool.
          When the mismatch is large enough the glaze cracks into a fine
          network called crazing; Digitalfire describes crazing as a mismatch
          of thermal expansion between body and glaze.
          <Cite id="16">Digitalfire, Glaze Crazing</Cite> The same glaze can
          fit one clay and craze on another, which is why you cannot read fit
          off the label.
        </p>
        <p>
          Both Mayco and Coyote recommend testing a glaze on the clay you
          actually use.
          <Cite id="15">Mayco Stoneware product page</Cite>
          <Cite id="17">Coyote brushing, drying and firing guide</Cite> If a
          tile crazes, see{" "}
          <Link href="/guides/glazing-pottery/troubleshooting" className={linkClass}>
            Troubleshooting
          </Link>{" "}
          for causes and fixes.
        </p>
      </GuideSection>

      <GuideSection id="clear-and-underglaze" title="Clear glaze & underglaze">
        <p>
          An underglaze is heavily pigmented colour, normally brushed onto
          leather-hard clay or greenware and then covered with a transparent
          glaze.
          <Cite id="18">Digitalfire, Underglaze</Cite> For functional ware
          the covering glaze matters: AMACO describes its Velvet underglazes
          as usable with or without glaze, and food safe with a proper glaze
          over them.
          <Cite id="19">AMACO Velvet Underglaze</Cite>
        </p>
        <p>
          When you pick the{" "}
          <Link href="/cone-6-glazes/clear" className={linkClass}>
            clear glaze
          </Link>{" "}
          to go over it, thin and even matters more than the brand. AMACO
          recommends one to two even coats of clear to prevent milky spots,
          <Cite id="20">AMACO, Choosing a Clear Glaze</Cite> and Coyote
          warns that its clear can go milky if applied too thickly.
          <Cite id="13">Coyote glazing and firing tips</Cite> Check that the
          clear and the{" "}
          <Link href="/cone-6-glazes/underglaze" className={linkClass}>
            underglaze
          </Link>{" "}
          are both rated for your cone.
        </p>
      </GuideSection>

      <GuideSection id="layering" title="Choosing glazes to layer">
        <p>
          Layering is where commercial glazes get interesting, and where
          guessing gets expensive. Two things make it predictable. First,
          start from combinations someone has already fired: the{" "}
          <Link href="/combinations" className={linkClass}>
            combinations library
          </Link>{" "}
          collects manufacturer test tiles and potters&apos; own results, and{" "}
          <Link href="/cone-6-glazes/best-for-layering" className={linkClass}>
            the most-layered glazes
          </Link>{" "}
          shows which glazes appear in the most of them. Second, remember
          that layering adds thickness, and makers warn that their fluid
          glazes run when applied too heavily.
          <Cite id="12">AMACO Potter&apos;s Choice application notes</Cite>
        </p>
        <p>
          Keep the food-contact caveat in mind: a layered surface has not
          been tested by the maker.
          <Cite id="4">Mayco stoneware guide</Cite> For why glazes interact
          the way they do, see{" "}
          <Link href="/guides/glazing-pottery/layering" className={linkClass}>
            Layering Theory &amp; Practice
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="checklist" title="A checklist before you buy">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Cone.</strong> Does the jar&apos;s cone match my clay and
            my kiln? (Cone 6 is not cone 06.)
          </li>
          <li>
            <strong>Use.</strong> Will food or drink touch this surface? If
            so, what does the maker say about this glaze, and am I layering
            it?
          </li>
          <li>
            <strong>Surface.</strong> Glossy, satin or matte, and will
            cutlery scrape across it?
          </li>
          <li>
            <strong>Movement.</strong> Is it stable or fluid, and does the
            form have room for it to run?
          </li>
          <li>
            <strong>Photo.</strong> What clay, cone and number of coats made
            the picture I am looking at?
          </li>
          <li>
            <strong>Test.</strong> Do I have a tile of my own clay to fire
            before the real piece?
          </li>
        </ol>
        <p>
          Then pick the colour.{" "}
          <Link href="/cone-6-glazes" className={linkClass}>
            Browse Cone 6 glazes by colour, finish, type and brand
          </Link>
          .
        </p>
      </GuideSection>

      <Bibliography>
        <Reference id="1">
          Orton Ceramic Foundation, <em>Temperature Equivalents for Orton
          Pyrometric Cones (°F)</em> (2016), self-supporting cones at 108°F/hr,{" "}
          <a href="https://www.theceramicshop.com/technical_info/Cones/Orton-Cone-Chart-F-022-14.pdf" className="underline">
            chart PDF (hosted by The Ceramic Shop)
          </a>.
        </Reference>
        <Reference id="2">
          Orton Ceramic Foundation, &ldquo;When is a Cone 6 a Cone 6?&rdquo;{" "}
          <a href="https://www.ortonceramic.com/post/when-is-a-cone-6-a-cone-6" className="underline">
            ortonceramic.com
          </a>.
        </Reference>
        <Reference id="3">
          Mayco Colors, &ldquo;Dinnerware Suitability and ACMI
          Information,&rdquo;{" "}
          <a href="https://www.maycocolors.com/resources/dinnerware-food-safety/" className="underline">
            maycocolors.com
          </a>.
        </Reference>
        <Reference id="4">
          Mayco Colors, <em>Mayco Stoneware Glazes + Engobes User Guide</em>{" "}
          (2026 PDF),{" "}
          <a href="https://www.maycocolors.com/wp-content/uploads/2025/04/UsingMaycoStonewareGlazes.pdf" className="underline">
            maycocolors.com
          </a>.
        </Reference>
        <Reference id="5">
          Tony Hansen, &ldquo;Cutlery Marking,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/cutlery+marking" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="6">
          U.S. Food and Drug Administration, &ldquo;CPG Sec 545.450 Pottery
          (Ceramics); Import and Domestic - Lead Contamination,&rdquo;{" "}
          <a href="https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cpg-sec-545450-pottery-ceramics-import-and-domestic-lead-contamination" className="underline">
            fda.gov
          </a>.
        </Reference>
        <Reference id="7">
          U.S. Food and Drug Administration, &ldquo;CPG Sec 545.400 Pottery
          (Ceramics); Import and Domestic - Cadmium Contamination,&rdquo;{" "}
          <a href="https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cpg-sec-545400-pottery-ceramics-import-and-domestic-cadmium-contamination" className="underline">
            fda.gov
          </a>.
        </Reference>
        <Reference id="8">
          AMACO, &ldquo;AMACO Brent Product Updates&rdquo; (food safe and
          dinnerware safe definitions),{" "}
          <a href="https://amaco.com/amaco-brent-updates" className="underline">
            amaco.com
          </a>.
        </Reference>
        <Reference id="9">
          Art and Creative Materials Institute, &ldquo;Classroom Art
          Materials Safety,&rdquo;{" "}
          <a href="https://www.acmiart.org/classroom-art-materials-safety" className="underline">
            acmiart.org
          </a>.
        </Reference>
        <Reference id="10">
          Tony Hansen, &ldquo;Food Safe,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/food+safe" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="11">
          Tony Hansen, &ldquo;Liner Glaze,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/liner+glaze" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="12">
          American Art Clay Co., <em>Potter&apos;s Choice Glaze Application
          Notes</em> (rev. 6/13),{" "}
          <a href="https://cdn.shopify.com/s/files/1/1015/2867/files/pc-glaze-application-brochure-web.pdf" className="underline">
            PDF (retailer-hosted)
          </a>.
        </Reference>
        <Reference id="13">
          Coyote Clay &amp; Color, <em>Glazing and Firing Tips</em>,{" "}
          <a href="https://www.theceramicshop.com/downloads/Coyote%20glazing%20tips.pdf" className="underline">
            PDF (hosted by The Ceramic Shop)
          </a>.
        </Reference>
        <Reference id="14">
          AMACO, <em>Potter&apos;s Choice</em> brochure (tile clay and cone),{" "}
          <a href="https://amaco.com/asset/68caa3be24963" className="underline">
            amaco.com
          </a>.
        </Reference>
        <Reference id="15">
          Mayco Colors, Stoneware fired-colour page and FAQ,{" "}
          <a href="https://www.maycocolors.com/color/fired/stoneware/" className="underline">
            maycocolors.com
          </a>.
        </Reference>
        <Reference id="16">
          Tony Hansen, &ldquo;Glaze Crazing,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/glaze+crazing" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="17">
          Coyote Clay &amp; Color, brushing, drying and firing guidance as
          reproduced by Sounding Stone,{" "}
          <a href="https://soundingstone.com/pages/coyote-glazes-brushing-drying-firing-guide" className="underline">
            soundingstone.com
          </a>.
        </Reference>
        <Reference id="18">
          Tony Hansen, &ldquo;Underglaze,&rdquo; Digitalfire,{" "}
          <a href="https://digitalfire.com/glossary/underglaze" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="19">
          AMACO, &ldquo;(V) Velvet Underglaze,&rdquo;{" "}
          <a href="https://shop.amaco.com/glazes-underglazes/underglazes/v-velvet-underglaze" className="underline">
            shop.amaco.com
          </a>.
        </Reference>
        <Reference id="20">
          AMACO, &ldquo;Choosing A Clear Glaze,&rdquo;{" "}
          <a href="https://www.amaco.com/resources/blog/choosing-a-clear-glaze" className="underline">
            amaco.com
          </a>.
        </Reference>
      </Bibliography>
    </>
  );
}
