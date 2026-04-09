Read `data/guides/research/README.md` first for the project rules, workflow, and exact Research Output Format.

You are Grok, collaborating with GPT/Codex on a deeply referenced glazing guide for Glaze Library.

Context:
- Foundations, Troubleshooting, Application Methods, Layering Theory, and Decorative Techniques are already researched and partly implemented.
- This guide is for a commercial glaze community first. That means brush-on low-fire and cone-5/6 commercial glaze workflows matter more than production dipping or obscure studio-only tricks.
- Your job is not to repeat generic firing advice. Your job is to add what GPT is likely to miss: stronger sources, page-specific citations, manufacturer firing guidance, kiln-program caveats, and real chemistry/physics explanations.

Your task:
Research the next section: `Firing Considerations` and write your findings directly into:

`data/guides/research/firing/grok-research.md`

Before writing:
1. Read `data/guides/research/README.md`
2. Read any existing GPT / Claude / Grok research in `data/guides/research/firing/` if present
3. Read `data/guides/research/arbitration/conflicts.md`
4. Add any genuine disagreements or corrections to `data/guides/research/arbitration/conflicts.md`

Use the exact output format from the README for every claim:

### [Topic / Claim Title]
**Statement:** [The factual claim]
**Source:** [Book + Author + Page # / URL]
**Confidence:** High / Medium / Low
**Verification:** [Direct source knowledge, web search, or training recall?]
**Notes:** [Caveats, conflicts with other sources, cone-range variations]

Sections to research for Firing Considerations:

- Oxidation vs reduction
  - how atmosphere changes color response
  - which commercial glazes assume oxidation
  - why reduction changes iron, copper, chrome, rutile, and celadon behavior
  - when commercial glaze labels stop being predictive in reduction

- Electric vs gas vs wood vs soda/salt kilns
  - what changes in surface response and repeatability
  - why electric kilns are more stable for commercial glaze users
  - atmospheric deposition effects in soda/salt/wood

- Cone, heatwork, and witness cones
  - cone as heatwork, not just temperature
  - why sitter/controller readings can disagree with cones
  - manufacturer guidance on cone targets for commercial glazes

- Ramp rate and holds
  - why slower bisque or glaze ramps reduce some defects
  - when holds help burn off gases or heal pinholes
  - when holds increase blurring, bleeding, or overmaturity
  - include specific hold examples when you have real sources

- Cooling rate
  - fast cooling vs slow cooling
  - crystal growth, matte development, variegation, rutile blue behavior
  - when slow cooling improves cone-6 commercial glaze results
  - when it causes extra running or muddying

- Soak / drop-and-hold / controlled cooling schedules
  - especially for cone 5-6 commercial glazes
  - manufacturer schedules if available from AMACO, Mayco, Coyote, Spectrum, etc.

- Kiln loading and placement
  - top/bottom hot spots
  - edge vs center differences
  - shelf shadowing
  - relation to color inconsistency and glaze maturity

- Venting and burnout
  - why early venting matters
  - bisque burnout and glaze defect reduction
  - low-fire commercial clear glaze pinhole/blister prevention

- Refiring
  - when refiring can heal defects
  - when it worsens running, devitrification, color loss, or fit problems

- Commercial glaze caveats
  - difference between label cone, actual maturity, and preferred look
  - why "cone 6" glazes may look better at cone 5, cone 6, or cone 6 with slow cool depending on product line
  - specific manufacturer caveats are especially valuable

Bonus if you have strong sources:
- Crystalline schedules
- Luster/overglaze firings
- Cone packs and digital controller calibration
- Reduction cooling vs oxidation cooling effects

Quality bar:
- Every claim needs a source
- Explain the "why," not just the firing step
- Include numbers when available: ramp rates, holds, cone offsets, cooling segments
- Be explicit about cone range, kiln type, and atmosphere caveats
- Prefer manufacturer bulletins, classic books, and technical ceramics sources over blogs
- If you rely on training recall for a classic citation, say so honestly

High-value sources to prioritize:
- Rhodes
- Hamer & Hamer
- Robin Hopper
- John Britt
- Digitalfire
- Manufacturer firing guides and technical PDFs
- University ceramics handbooks
- Academic / engineering papers where they clarify mechanism

What is most valuable:
- Exact firing schedules from manufacturers
- Real cone / heatwork clarification
- Strong cautions about when holds help and when they hurt
- Cooling-rate effects that matter to brush-on commercial glazes
- Anything commonly repeated in pottery circles that is oversimplified or wrong

Write directly into the repo. Do not return a chat summary instead of doing the work.
