# Glazing Guide Research — Multi-AI Collaboration

This directory contains research from three AI models (Claude, GPT, Grok) working in parallel to build the most comprehensive glazing guide on the internet. **Bodhi Swan** serves as arbiter and editor-in-chief.

---

## How This Works

1. All three models research the same topics independently
2. Each model writes findings to `[model]-research.md` in the relevant topic folder
3. Claude merges all research, flags conflicts, and produces a merged draft
4. Bodhi reviews and makes final calls on any disagreements
5. Claude implements the approved content as pages in the app

---

## Research Output Format

**Every model must use this format for each claim:**

```markdown
### [Topic / Claim Title]
**Statement:** [The factual claim being made]
**Source:** [Book + Author + Page # / URL / Museum accession #]
**Confidence:** High / Medium / Low
**Verification:** [How was this verified? Original source, or training data recall?]
**Notes:** [Caveats, context-dependency, or disagreement with other sources]
```

---

## Quality Criteria (ALL must be met)

1. **Verifiable** — every claim cites a specific source (book + page, URL, manufacturer doc)
2. **Practically valuable** — helps a potter make better decisions, not just trivia
3. **Explains the "why"** — never just "apply 3 coats" without explaining thickness and reasoning
4. **Context-aware** — note when advice varies by cone range, clay body, kiln type
5. **Culturally respectful** — proper terminology in original language, accurate attribution
6. **Tradition vs. technique** — distinguish historical methods from modern interpretations

---

## Arbitration Rules (when models disagree)

1. **Source wins over memory** — a specific book + page citation beats training data recall
2. **Multiple sources beat single** — 2 models citing different sources that agree > 1 model with 1 source
3. **Manufacturer data is authoritative** for their own products
4. **Academic/museum sources are authoritative** for historical traditions
5. **Practitioner sources are authoritative** for practical technique
6. **Genuine conflicts** go to `arbitration/conflicts.md` for Bodhi to decide

---

## Directory Structure

```
research/
├── README.md                  ← You are here
├── sources.json               ← Master reference database
├── foundations/               ← Part I: Glaze basics, consistency, surface prep
│   ├── claude-research.md
│   ├── gpt-research.md
│   └── grok-research.md
├── troubleshooting/           ← Part VI: Glaze defects (causes + fixes)
│   ├── claude-research.md
│   ├── gpt-research.md
│   └── grok-research.md
├── application/               ← Part II: Dipping, pouring, spraying, brushing
├── layering/                  ← Part III: Interaction theory, strategies, testing
├── decorative/                ← Part IV: Resist, sgraffito, mishima, underglaze
├── firing/                    ← Part V: Atmosphere, ramp, cooling, kiln types
├── traditions/                ← Part VII: International ceramic traditions
│   ├── east-asian/            ← Japanese, Chinese, Korean
│   ├── middle-eastern/        ← Lusterware, Iznik, Persian blue
│   ├── mediterranean/         ← Maiolica, azulejo, faience
│   ├── european/              ← Salt glaze, slipware, Leach, Scandinavian
│   ├── american/              ← Edgefield, Arts & Crafts, studio pottery
│   ├── african/               ← West African, North African, contemporary
│   └── latin-american/        ← Pre-Columbian, Talavera, contemporary
└── arbitration/
    └── conflicts.md           ← Where models disagree — Bodhi decides
```

---

## Phase Order

| Phase | Topics | Status |
|-------|--------|--------|
| **A** | Foundations + Troubleshooting | **ACTIVE** |
| B | Layering Theory + Application Methods | Pending |
| C | Decorative Techniques + Firing | Pending |
| D | International Traditions (all) | Pending |
| E | Hub page, navigation, SEO | Pending |

---

## Prompt Template for GPT / Grok

Copy-paste this into GPT or Grok, replacing the bracketed section with the current phase:

> I'm building a comprehensive, deeply-referenced guide to glazing pottery for my app Glaze Library. I'm using Claude, GPT, and Grok in parallel to research this.
>
> Your task: Research **Phase A: Foundations + Troubleshooting** and produce findings in this format:
>
> For each claim:
> - **Statement**: the factual claim
> - **Source**: book + author + page, URL, or museum accession
> - **Confidence**: High/Medium/Low
> - **Verification**: how you verified this (original source vs. training recall)
> - **Notes**: caveats, context-dependency
>
> **Sections to cover:**
>
> **Foundations:**
> 1. Understanding Ceramic Glazes — what a glaze is (glass-former + flux + alumina), how it differs from paint, the role of bisque firing, cone ranges (06 low-fire, 6 mid-fire, 10 high-fire)
> 2. Glaze Consistency & Measurement — specific gravity targets for different methods, hydrometer vs. weight-per-pint, deflocculants (Darvan) and flocculants (Epsom salts, vinegar), sieving, aging
> 3. Surface Preparation — bisque temp vs. porosity relationship, cleaning methods, wetting/dampening before application (when and why), sanding, wax resist on foot
>
> **Troubleshooting:**
> 18. Common Glaze Defects — for EACH defect provide causes AND fixes:
>     - Crawling, Pinholing/Bloating, Crazing, Shivering, Running/Dripping, Color inconsistency, Blistering, Dry/underfired glaze
>
> **Quality bar:**
> - Every claim must have a source
> - Explain the "why" not just the "how"
> - Note when advice varies by cone range, clay body, or kiln type
> - Focus especially on sources I might not find elsewhere — international textbooks, non-English sources, manufacturer technical bulletins, university research
> - Distinguish between well-established facts and practitioner opinions
