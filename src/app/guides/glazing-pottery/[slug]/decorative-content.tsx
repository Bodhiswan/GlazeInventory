import { GuideSection } from "@/components/guide/guide-section";
import {
  Bibliography,
  Cite,
  Reference,
} from "@/components/guide/citation";
import type { TocItem } from "@/components/guide/guide-toc";

export const decorativeToc: TocItem[] = [
  { id: "resist-masking", label: "12. Resist & Masking", level: 2 },
  { id: "wax-resist", label: "12.1 Wax Resist", level: 3 },
  { id: "tape-shellac", label: "12.2 Tape, Paper & Shellac Masks", level: 3 },
  { id: "resist-layering", label: "12.3 Resist in Layered Decoration", level: 3 },
  { id: "incised-inlaid", label: "13. Sgraffito, Mishima & Raised Decoration", level: 2 },
  { id: "sgraffito", label: "13.1 Sgraffito Timing", level: 3 },
  { id: "mishima", label: "13.2 Mishima & Inlay", level: 3 },
  { id: "slip-trailing", label: "13.3 Slip Trailing & Relief", level: 3 },
  { id: "underglaze-majolica", label: "14. Underglaze, Majolica & Washes", level: 2 },
  { id: "underglaze-clear", label: "14.1 Underglaze Under Clear", level: 3 },
  { id: "majolica", label: "14.2 Majolica", level: 3 },
  { id: "washes", label: "14.3 Oxide & Stain Washes", level: 3 },
  { id: "overglaze", label: "14.4 Overglaze, Metallics & Lusters", level: 3 },
];

export function DecorativeContent() {
  return (
    <>
      <GuideSection id="resist-masking" title="12. Resist & Masking">
        <p>
          Resist techniques are less about adding glaze than about controlling
          where glaze, underglaze, or slip can and cannot bond. For most
          commercial glaze users, that means wax, tape, paper masks, and
          shellac-based methods are design-control tools rather than specialty
          effects.
        </p>
      </GuideSection>

      <GuideSection id="wax-resist" title="12.1 Wax Resist" level={3}>
        <p>
          Wax resist works because it blocks water from soaking into porous clay
          or bisque. Since slips, underglazes, and glazes are water-based, they
          cannot wet and adhere properly where a wax film is present.
          <Cite id="1">Ceramic Arts Network</Cite>
          <Cite id="2">Mayco AC-302</Cite>{" "}
          That makes wax most useful on greenware, leather-hard clay, and
          bisque, not on already sealed or vitrified surfaces.
        </p>
        <p>
          For most studio and commercial brush-on workflows,{" "}
          <strong>cold water-based wax emulsions</strong> are the practical
          default. Greenwich House notes that older paraffin systems were
          smelly and toxic compared with modern water-based wax products, while
          latex can be useful when the mask needs to be removed before firing
          rather than burned away.
          <Cite id="3">Greenwich House p.42</Cite>{" "}
          Mayco and AMACO both position their wax-resist products as brushable,
          room-temperature barriers for bisque and greenware.
          <Cite id="2">Mayco AC-302</Cite>
          <Cite id="4">AMACO Wax Resist</Cite>
        </p>
        <p>
          Wax helps when you need clean foot rings, protected negative space, or
          controlled decorative boundaries. It becomes risky when applied over
          dusty bisque, over-thickly, or over weak raw glaze layers. Linda
          Arbuckle notes that curling wax usually means the piece was dusty
          and/or the wax was too thick, and suggests thinning with water and
          softening the curl with a hair dryer.
          <Cite id="5">Arbuckle p.9</Cite>{" "}
          AMACO also warns that wax resist can peel gum-free raw glaze off the
          ware.
          <Cite id="4">AMACO Wax Resist</Cite>
        </p>
        <p>
          There is also a fired-surface consequence: Digitalfire documents wax
          residue contributing to micro-pinholing under a low-fire transparent
          glaze over underglaze.
          <Cite id="6">Digitalfire wax pinholes</Cite>{" "}
          In other words, wax is not harmless decoration residue. On clear-glaze
          surfaces especially, use it deliberately and clean decorated ware well
          before glazing.
        </p>
      </GuideSection>

      <GuideSection id="tape-shellac" title="12.2 Tape, Paper & Shellac Masks" level={3}>
        <p>
          Hard masks often give cleaner edges than brushed wax. Greenwich House
          explicitly includes tape, paper, crayon, and other barriers in its
          resist overview.
          <Cite id="3">Greenwich House p.42</Cite>{" "}
          These methods are especially useful for geometric divisions and
          repeatable patterns that would be hard to freehand.
        </p>
        <p>
          Shellac resist is one of the better-documented masking systems. AMACO
          applies underglaze to bone-dry ware, paints shellac over the areas to
          keep, removes the exposed underglaze with a wet sponge, then stresses
          cleaning the bisque thoroughly before the clear glaze step.
          <Cite id="7">AMACO water etching</Cite>{" "}
          That sequence matters because shellac residue, like wax residue, can
          interfere with the fired glaze surface if left behind.
        </p>
        <p>
          Tape over raw glaze can work, but it is less forgiving. If the glaze
          is still wet, semi-dry, or weakly bound, the tape can lift the glaze
          with it. For public guidance, the safer rule is: use tape mainly on
          bare bisque, underglaze, paper masks, or very well-dried gummed
          surfaces, and test before relying on it for finished pieces.
        </p>
      </GuideSection>

      <GuideSection id="resist-layering" title="12.3 Resist in Layered Decoration" level={3}>
        <p>
          Resist is also a layering-control tool. Wax or shellac can preserve an
          earlier color area while a second color, wash, or glaze is added over
          or around it. That is especially useful in multi-color low-fire
          decoration, Mishima-style cleanup, and graphic majolica workflows.
          <Cite id="8">AMACO Mishima</Cite>
          <Cite id="5">Arbuckle</Cite>
        </p>
        <p>
          The downside is interface instability. Thick wax films, contaminated
          surfaces, or too many heavy coats across masked boundaries can produce
          crawling, peeling, or ridge buildup at the resist line. Resist should
          be treated as a precision tool, not as a substitute for good glaze
          thickness control.
        </p>
      </GuideSection>

      <GuideSection id="incised-inlaid" title="13. Sgraffito, Mishima & Raised Decoration">
        <p>
          These techniques all depend on timing and clay moisture. The same
          surface that is perfect for one method can be too wet, too dry, or too
          dusty for another.
        </p>
      </GuideSection>

      <GuideSection id="sgraffito" title="13.1 Sgraffito Timing" level={3}>
        <p>
          Sgraffito works best when the clay is still leather hard and the slip
          or underglaze has dried to the touch. AMACO&apos;s tutorials use that
          exact window because it allows a clean cut without smearing wet color
          or chattering through overly dry clay.
          <Cite id="9">AMACO Velvet surface guide</Cite>
          <Cite id="10">AMACO Amphora lesson</Cite>
        </p>
        <p>
          Greenwich House defines sgraffito simply as scratching through slip to
          reveal the clay body beneath.
          <Cite id="3">Greenwich House p.42</Cite>{" "}
          The practical takeaway is that moisture state controls line quality:
          too wet and the edge smears, too dry and the line crumbles. Leather
          hard is the balance point.
        </p>
      </GuideSection>

      <GuideSection id="mishima" title="13.2 Mishima & Inlay" level={3}>
        <p>
          Mishima-style inlay is usually done at leather hard by incising the
          surface, forcing contrasting slip or underglaze into the lines, then
          scraping the excess back once the fill has set.
          <Cite id="8">AMACO Mishima</Cite>
          <Cite id="3">Greenwich House p.42</Cite>
        </p>
        <p>
          Both fit and cleanup matter. Slip often has an advantage over
          commercial underglaze because it can be tuned to match the body&apos;s
          drying and firing behavior more closely. Digitalfire&apos;s broader
          warning about engobes applies here directly: if the layer does not fit
          the clay body in shrinkage, thermal expansion, and firing maturity, it
          can crack, flake, or blur under the final glaze.
          <Cite id="11">Digitalfire leaching article</Cite>
        </p>
        <p>
          AMACO&apos;s multi-color Mishima approach also uses wax resist between
          color stages so later underglaze applications do not contaminate
          earlier inlay zones.
          <Cite id="8">AMACO Mishima</Cite>{" "}
          That is a good example of resist acting as a registration tool rather
          than only a foot-waxing step.
        </p>
      </GuideSection>

      <GuideSection id="slip-trailing" title="13.3 Slip Trailing & Relief" level={3}>
        <p>
          Slip trailing and raised decoration need a thicker, more stable mix
          than normal brushing. The line has to stand up after extrusion instead
          of flattening immediately.
          <Cite id="12">AMACO slip decoration</Cite>{" "}
          If the mix is too fluid, relief collapses; if it is too stiff or too
          mismatched from the body, it can crack during drying or firing.
        </p>
        <p>
          Raised decoration also rounds over somewhat in the kiln because molten
          surfaces seek to reduce sharp edges. That means low-fire and
          underglaze/slip relief usually preserve crisper lines than highly
          fluid cone-6 or cone-10 glaze-trailing systems.
        </p>
      </GuideSection>

      <GuideSection id="underglaze-majolica" title="14. Underglaze, Majolica & Washes">
        <p>
          Most decorative ceramic workflows used by commercial glaze users fall
          into four families: underglaze under clear, majolica on an opaque white
          base, oxide or stain washes in texture, and separate low-temperature
          overglaze systems like lusters and china paint.
        </p>
      </GuideSection>

      <GuideSection id="underglaze-clear" title="14.1 Underglaze Under Clear" level={3}>
        <p>
          Commercial underglazes often fire matte or velvety when left bare, but
          intensify under clear glaze because the clear changes the way light
          enters and exits the colored layer.
          <Cite id="13">AMACO Velvet</Cite>
          <Cite id="14">Mayco Fundamentals</Cite>
        </p>
        <p>
          The clear layer is not neutral, though. Digitalfire shows that some
          underglazes bleed, some lose opacity, and some sensitive colors,
          especially chrome-tin pink systems, need a compatible clear with no
          zinc and carefully balanced chemistry.
          <Cite id="15">Digitalfire underglaze</Cite>{" "}
          That is why zinc-free clears appear so often in underglaze
          documentation.
          <Cite id="7">AMACO water etching</Cite>
        </p>
        <p>
          Thickness matters too. Heavy clear coats can blur edges and trap gases,
          while under-applied clear can leave the result underdeveloped or less
          glossy than intended. Mayco recommends a 15-minute hold in low-fire
          co-fired clear-over-underglaze work to help gases burn out more
          cleanly.
          <Cite id="14">Mayco Fundamentals</Cite>
        </p>
      </GuideSection>

      <GuideSection id="majolica" title="14.2 Majolica" level={3}>
        <p>
          Majolica is not just &ldquo;painting on white glaze.&rdquo; It is a
          distinct low-fire decorative system built on an opaque white base that
          is viscous enough to hold brushwork through the firing. Arbuckle points
          out that this restricted flow is exactly what preserves line quality
          and allows watercolor-like decoration to sit visibly in the glaze
          field.
          <Cite id="5">Arbuckle</Cite>
        </p>
        <p>
          Historically, majolica used tin-opacified white glaze, but many modern
          systems use zircon because it is cheaper and more available.
          <Cite id="16">Digitalfire majolica</Cite>{" "}
          That substitution is practical, but not chemically identical: heavy
          zircon loading can increase viscosity and defect risk.
        </p>
        <p>
          Majolica is also notoriously sensitive to application and body
          conditions. Dusty bisque, over-thick glaze, body gases, and aggressive
          opacification can all contribute to crawling, pinholing, blistering,
          or a disrupted white surface.
          <Cite id="5">Arbuckle</Cite>
          <Cite id="16">Digitalfire majolica</Cite>
          <Cite id="17">Ceramic Arts Network majolica</Cite>{" "}
          For the public guide, the key message should be that majolica rewards
          careful prep and even application more than brute-force coat count.
        </p>
      </GuideSection>

      <GuideSection id="washes" title="14.3 Oxide & Stain Washes" level={3}>
        <p>
          Oxide and stain washes work by settling color into recesses and then
          being wiped back from higher surfaces. Greenwich House describes them
          as watercolor-like colorants that leave residue in texture after the
          surface is cleaned back.
          <Cite id="18">Greenwich House p.38</Cite>
        </p>
        <p>
          The important dividing line is whether the wash is fluxed. Fluxed
          washes that include borate or frit melt in and integrate more securely
          in the firing, while unfluxed washes can stay dry-looking, unstable, or
          easier to abrade.
          <Cite id="18">Greenwich House p.38</Cite>
          <Cite id="19">Ceramic Stains & Glazes</Cite>
        </p>
        <p>
          Decorative success is not the same thing as durability. Digitalfire is
          explicit that copper-rich and manganese-rich surfaces can be leaching
          risks and recommends proven liner glazes for food-contact interiors
          rather than relying on decorative chemistry.
          <Cite id="11">Digitalfire leaching article</Cite>
        </p>
      </GuideSection>

      <GuideSection id="overglaze" title="14.4 Overglaze, Metallics & Lusters" level={3}>
        <p>
          Overglazes, metallics, and lusters are separate low-temperature
          decorative systems applied after the main glaze firing. They are not
          just another version of underglaze-under-clear.
        </p>
        <p>
          Mayco&apos;s overglaze guide places china paint around cone 018,
          metallics around cone 019-018, and mother-of-pearl and gold lusters
          around cone 020-018.
          <Cite id="20">Mayco overglaze guide</Cite>{" "}
          These narrow ranges matter because underfiring and overfiring fail in
          different ways: underfired gold can rub off, overfired gold turns
          pale, mother-of-pearl can go matte, and overfired china paint can
          blister or stain the glaze surface.
          <Cite id="20">Mayco overglaze guide</Cite>
        </p>
      </GuideSection>

      <Bibliography>
        <Reference id="1">
          Ceramic Arts Network, &ldquo;A Cooler Alternative to Hot Wax Resist&rdquo;
          and related resist-technique articles.
        </Reference>
        <Reference id="2">
          Mayco, AC-302 Wax Resist product page,{" "}
          <a href="https://www.maycocolors.com/product/ac-302-wax-resist/" className="underline">
            maycocolors.com
          </a>.
        </Reference>
        <Reference id="3">
          Greenwich House Pottery, <em>Glazes and Clay Handbook</em>, p.&nbsp;42.
        </Reference>
        <Reference id="4">
          AMACO, Wax Resist product page and usage notes,{" "}
          <a href="https://shop.amaco.com/glazes-underglazes/underglaze/glaze-additives-and-aids/wax-resist/" className="underline">
            shop.amaco.com
          </a>.
        </Reference>
        <Reference id="5">
          Linda Arbuckle, <em>Majolica and Lowfire Handout</em>, especially pp.&nbsp;1-9.
        </Reference>
        <Reference id="6">
          Digitalfire, &ldquo;Wax resist inducing surface pinholes on a low fire transparent over an underglaze,&rdquo;{" "}
          <a href="https://digitalfire.com/picture/2847" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="7">
          AMACO, &ldquo;Water Etching with Velvet Underglaze,&rdquo;{" "}
          <a href="https://amaco.com/resources/tutorials/water-etching-with-velvet-underglaze" className="underline">
            amaco.com
          </a>.
        </Reference>
        <Reference id="8">
          AMACO, &ldquo;More Colorful Mishima,&rdquo; tutorial resources.
        </Reference>
        <Reference id="9">
          AMACO, &ldquo;Enhancing Surface with Velvet Underglazes,&rdquo; tutorial resources.
        </Reference>
        <Reference id="10">
          AMACO, &ldquo;Amphora Project: Heroes and Handbuilding,&rdquo; lesson plan.
        </Reference>
        <Reference id="11">
          Digitalfire, &ldquo;Are Your Glazes Food Safe or are They Leachable?&rdquo;{" "}
          <a href="https://digitalfire.com/article/12" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="12">
          AMACO, &ldquo;Slip Decorating Mug with White Slip,&rdquo; tutorial resources.
        </Reference>
        <Reference id="13">
          AMACO, Velvet Underglaze product page,{" "}
          <a href="https://shop.amaco.com/glazes-underglazes/underglazes/v-velvet-underglaze/" className="underline">
            shop.amaco.com
          </a>.
        </Reference>
        <Reference id="14">
          Mayco, <em>Fundamentals Underglazes</em> guide PDF.
        </Reference>
        <Reference id="15">
          Digitalfire, &ldquo;Underglaze,&rdquo; glossary entry,{" "}
          <a href="https://www.digitalfire.com/glossary/underglaze/1000" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="16">
          Digitalfire, &ldquo;Majolica,&rdquo; glossary entry,{" "}
          <a href="https://digitalfire.com/glossary/majolica" className="underline">
            digitalfire.com
          </a>.
        </Reference>
        <Reference id="17">
          Ceramic Arts Network, &ldquo;Decorating Techniques and Troubleshooting Tips for Majolica&rdquo;
          and related majolica resources.
        </Reference>
        <Reference id="18">
          Greenwich House Pottery, <em>Glazes and Clay Handbook</em>, p.&nbsp;38.
        </Reference>
        <Reference id="19">
          Ceramic Stains &amp; Glazes, &ldquo;How to Use Overglaze and Underglaze Ceramic Stains.&rdquo;
        </Reference>
        <Reference id="20">
          Mayco, <em>Guide to Overglazes</em> PDF.
        </Reference>
      </Bibliography>
    </>
  );
}
