# Pokopia Lab V3 – Production Prompt Pack

This pack is designed to be dropped into Codex as a serious build brief for a production-quality MVP.

## What’s included
- Full master build prompt
- Product + technical spec
- Information architecture
- Exact data model
- Compatibility scoring spec
- Seed dataset
- Utility scaffolding
- Suggested folder structure
- UI notes
- Acceptance criteria
- Incremental prompts if you want to build feature-by-feature

## Recommended Codex flow
1. Start a new repo with Next.js + TypeScript + Tailwind.
2. Paste `01_master_build_prompt.md` into Codex.
3. If needed, follow with:
   - `02_product_spec.md`
   - `04_data_model.md`
   - `05_scoring_spec.md`
4. Ask Codex to implement one milestone at a time using `10_incremental_prompts.md`.

## Product framing
Pokopia Lab is not a wiki clone. It is a planning toolkit layered on top of static Pokopia data:
- find best items for a group
- discover compatible Pokémon
- reverse-search by item / favorite / habitat / specialty
- save and compare teams

## MVP
- Item Optimizer
- Reverse Lookup
- Compatibility Explorer
- Saved Teams + Compare
- Local JSON data + localStorage persistence

## Future-ready
The architecture should allow later upgrades:
- import pipeline from source data
- database / Supabase
- user accounts
- shareable teams
- recommendation engine
