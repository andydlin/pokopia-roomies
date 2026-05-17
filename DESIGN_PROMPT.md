You are a world-class product designer creating a brand-new mobile-first web app from scratch.
Your output should be a set of HTML files — one per screen or major state — with embedded CSS.
Do NOT look up, reference, or recreate any existing UI from real apps (Pokémon Home, any Pokémon app, any existing planning tool).
Design from first principles using only the product brief below.

---

# Product Brief: Pokopia Lab

## What is it?

Pokopia Lab is a home-planning app for the mobile game Pokopia. Players place Pokémon into decorated "homes" (rooms with items and a habitat). The app helps players:
- Pick which Pokémon to put in a home together
- Discover which items best satisfy those Pokémon's preferences
- Track the materials needed to craft each item
- Save, share, and compare multiple home builds

The experience is part planning tool, part discovery layer. Pokémon have "favorites" (aesthetic preferences), items provide comfort in those favorite categories, and the app scores compatibility between Pokémon and items so the user can build a thematically coherent, well-loved home.

## Target user
Casual-to-moderate mobile gamers, 14–35 years old. They care about the game, enjoy decoration/curation, and want to be efficient without feeling like they're doing spreadsheet work. Visual design and "good vibes" matter as much as utility.

---

## Domain: Core Entities

### Pokémon
A Pokémon living in a home. Properties relevant to the UI:
- **Name** and **sprite image** (the main visual identity)
- **Pokédex number** (#001, #025, etc.)
- **Favorite categories** — a list of 4–8 aesthetic preferences (e.g., "Lots of nature", "Soft stuff", "Cute stuff", "Group activities", "Water themes", "Sweet flavor"). This is the core data that drives everything.
- **Ideal habitat** — one preferred environment type (can be null)
- **Compatible habitats** — broader list of habitats the Pokémon can live in

### Items
Furniture and decorations placed in a home. Properties:
- **Name** and **image**
- **General category** — high-level type (decoration, furniture, food item, etc.)
- **Comfort categories** — which favorite categories this item satisfies (e.g., a potted plant might provide "Lots of nature" and "Outdoor vibes"). An item can have 0–4 comfort categories. Items with zero comfort categories are aesthetic-only.
- **Craftable** — boolean. If true, the item requires materials to build.
- **Materials** — list of required crafting materials, each with a name and quantity (e.g., "Paper × 3", "Wood × 2")
- **Sources** — how to obtain it (craft, shop, field, event)

### Habitats
Environmental templates — a preset "theme" for the home. Properties:
- **Name** and **image**
- **Required items** — specific items that must be placed to establish this habitat (e.g., "Tall Grass × 4")
- **Related comfort categories** — inferred from the habitat's required items' comfort categories

### Favorite Categories
The shared language between Pokémon and items. Examples:
- "Lots of nature" — plants, outdoor decor
- "Soft stuff" — cushions, plushies, cozy items
- "Cute stuff" — kawaii aesthetics
- "Outdoor vibes" — nature, open-air themes
- "Group activities" — social/communal items
- "Water themes" — aquatic items
- "Sweet flavor" — dessert/food items (a food-specific subcategory)
- "Blocky stuff" — geometric / minimalist furniture

There are approximately 12–16 of these categories total. Every favorite category can have multiple items that provide it, and most Pokémon have 4–8 favorites.

### Materials
Raw crafting components required to build items. Not "items" themselves — they're collected in the world (Paper, Wood, Soft clay, Dried flowers, etc.). Users track how many they've gathered.

---

## The Ranking System

When a user selects Pokémon for a home, every unselected Pokémon and every item gets a compatibility score. The scores map to four tiers:

### Pokémon Tiers (shown in the browse panel when selecting roommates)
- **Best Match** — strongly overlaps with the home's existing favorite categories; adds 90%+ coverage
- **Good Match** — solid overlap, 60–89% alignment
- **Some Overlap** — at least one shared favorite
- **No Overlap** — no shared favorites with current group

Scoring weights: categories liked by ALL current Pokémon score highest, then categories liked by most, then categories liked by a single Pokémon. Habitat compatibility adds a bonus.

### Item Tiers (shown in the item browser)
- **Best Match** — fills missing favorite categories or strongly supports existing ones (score ≥ 100)
- **Supporting Match** — some overlap (score > 0 but < 100)
- **Neutral** — no comfort category overlap; aesthetic-only (score = 0)

Scoring weights: items that fill categories wanted by ALL Pokémon score 100× per category; "most" = 70×; "some" = 35×; "one" = 10×. A bonus is added for filling a "missing" category.

### Category Coverage States (used in material tracking / build summary)
- **Missing** — no items provide this favorite (but Pokémon in the home want it)
- **Partial** — some items provide it, but fewer than the Pokémon who want it
- **Covered** — sufficient items for all Pokémon who like this category
- **Overcovered** — too many items providing it (>1.5× demand)

---

## Screens & Content

Design every screen listed below. Use realistic placeholder data (real Pokémon names and item concepts are fine as placeholders). Every screen must be designed for mobile (375px viewport) AND desktop (1280px viewport) — mobile layout first, desktop as an enhancement.

---

### Screen 1: Home Builder — Pokémon Tab
**Purpose:** User picks which Pokémon to put in their home.

**Content to show:**
- Page header with home/build name (editable) and a Save button
- Tab bar: "Pokémon | Comfort Items | Other Items | Build Plan" (4 tabs, currently on Pokémon)
- Left panel (sidebar on desktop, hidden/bottom-sheet on mobile): Shows the currently selected Pokémon as cards. Each selected Pokémon card shows: image, name, remove (×) button. Below that: shared favorite categories between all selected Pokémon (shown as chips). Below that: shared habitats.
- Main area: search + sort controls, then a list/grid of candidate Pokémon grouped by match tier. Each group is collapsible and has a header like "Best Matches (4)" followed by Pokémon cards.
- Each Pokémon card in the browse area shows: sprite image, Pokédex number, name, favorite category chips, match reason snippet ("Shares: Lots of nature, Soft stuff"), add button.
- "See all / Show less" toggle per group when more than 6 cards exist.
- Mobile: a sticky bottom bar showing selected Pokémon avatar icons (up to 5) and a "View Group" button.

**Interactions to communicate:**
- Tap a Pokémon card → detail overlay (full favorites list, habitat, "Add to Home" / "Remove" button)
- Sort toggle: "Best Match" vs "A–Z"
- Search field filters results in real time
- Adding a Pokémon updates the sidebar immediately and re-ranks other candidates

---

### Screen 2: Home Builder — Comfort Items Tab
**Purpose:** User picks comfort items ranked by how well they satisfy the selected Pokémon.

**Content to show:**
- Same header and tab bar as Screen 1 (tab 2 active)
- Left sidebar: same selected Pokémon panel + shared favorites + "Items in build: 7" counter
- Main area: search + sort + filter controls. Filters include: "Only show items that help [Pokémon name]" (one toggle per selected Pokémon), and filter by favorite category.
- Results grouped by match tier (Best Match, Supporting, Neutral). Each item card shows: item image, name, source badge (Craftable / Shop / Field), comfort category chips, "Helps: Pikachu, Bulbasaur" mini-avatar row.
- Added items should look visually "claimed" (e.g., checkmark, muted) but still removable.

**Interactions to communicate:**
- Tap item → add to build (or remove if already added)
- Long press or detail button → item detail overlay (full material list, all categories, all Pokémon it helps)
- Filter chip toggles filter active state
- Favorite category filter chips narrow results

---

### Screen 3: Home Builder — Other Items Tab
**Purpose:** Non-comfort items (purely aesthetic or functional items with no comfort categories).

**Content to show:**
- Same layout as Screen 2, but no "Helps:" row on cards (these items don't satisfy Pokémon favorites directly)
- Match tier grouping still applies (most of these will be "Neutral")
- Source badges more prominent (where to get it)

---

### Screen 4: Home Builder — Build Plan Tab
**Purpose:** Review the full build: items placed, materials needed, coverage check.

**Content to show:**
- Summary bar: "5 Pokémon · 12 items · 8 materials · 73% complete"
- Sub-tabs or sections: "Items" / "Materials" / "Coverage"

**Items section:** List of all added items with quantity controls (− qty +). Item name, image thumbnail, category.

**Materials section:**
- Overall progress bar (e.g., "18 / 47 materials collected")
- Per-material rows: material name, "12/20 owned · 8 remaining" with + / − collect buttons, and a mini progress bar.
- Tap material → expand to show which items require it.

**Coverage section:**
- Per-Pokémon breakdown: show each selected Pokémon, their favorite categories, and a checkmark/gap indicator per category (Covered ✓ / Partial ~ / Missing ✗).
- "Suggested picks" for uncovered categories: 2–3 item recommendations.

---

### Screen 5: Saved Homes
**Purpose:** Browse, load, compare, and manage all saved builds.

**Content to show:**
- Page title "Saved Homes" + "New Build" button
- Grid of build cards (2 columns desktop, 1 column mobile). Each card: build name (editable inline), creation date, stat chips (5 Pokémon · 12 items · 73% complete), action buttons: Open, Duplicate, Share, Delete.
- Multi-select checkboxes for comparison mode.
- When 2+ builds selected: a comparison strip or panel appears comparing material counts and highlighting the "Most efficient" build.

---

### Screen 6: Build View (Read-Only)
**Purpose:** A shareable, read-only summary of a saved build.

**Content to show:**
- Build name + "Created by [username]" + "Edit" link (if owner) or "Copy to My Builds" (if viewer)
- Summary stats: Pokémon count, items, materials, completion
- Pokémon roster: avatars + names, shared favorites, shared habitats
- Items list: grouped by category, with quantity and material requirements
- Material summary: full material list with quantities
- Coverage grid: per-Pokémon favorite satisfaction

---

### Screen 7: Pokedex — Pokémon Browse
**Purpose:** Reference browser — explore all Pokémon without builder context.

**Content to show:**
- Search input
- Responsive card grid: each card shows sprite, name, Pokédex number, 3–4 favorite category chips
- Tap → modal with full Pokémon details + "Add to Home" button

---

### Screen 8: Pokedex — Items Browse
**Purpose:** Reference browser for all items.

**Content to show:**
- Search input + category filter chips
- Card grid: item image, name, comfort category badges, source badge
- Tap → item detail page (see Screen 9)

---

### Screen 9: Item Detail
**Purpose:** Full information about a single item.

**Content to show:**
- Item name, large image, source/craftable badge
- Comfort categories provided (chips)
- Materials required (list with quantities)
- "Which Pokémon does this help?" — list of compatible Pokémon with their matched favorites
- "Add to Home" button

---

### Screen 10: Pokedex — Habitats Browse
**Purpose:** Reference browser for habitats.

**Content to show:**
- Card grid: habitat image, name, related comfort category chips
- Tap → habitat detail modal: required items list, which Pokémon prefer it, "Set as Habitat" button

---

### Screen 11: Auth Screens
**Purpose:** Sign in, sign up, and username setup.

Design as a modal or bottom sheet (not a full page navigation). States to design:
- **Sign In**: email + password inputs, Sign in button, "Continue with Google", link to Sign up
- **Sign Up**: benefits list (3 bullets), email + password + confirm inputs, Create Account button, Continue with Google
- **Check Email**: icon + "We sent a confirmation to [email]. Click it to activate." + Got it button
- **Choose Username**: "It will appear as 'created by [name]' on shared builds", username input, Save button
- **Upsell (guest trying to save/share)**: headline "Sign up to save your build", short benefit text, Create Account + Sign In buttons, "Maybe later" link

---

### Screen 12: Onboarding / Welcome
**Purpose:** First-time experience for a new user.

**Content to show:**
A single welcome overlay or screen (not a multi-step tutorial). Features to highlight:
1. Pick Pokémon, get ranked comfort item suggestions
2. Track materials needed to build items
3. Save and share builds

CTA: "Start building"

---

## Navigation Structure

- **Persistent top bar (header)**: App name/logo, nav links (Home Builder / Saved Homes / Pokedex), user account menu (or Sign In button). On mobile: hamburger → full-screen drawer.
- **Builder tab bar**: Shown only inside the builder. 4 tabs: Pokémon | Comfort Items | Other Items | Build Plan.
- **Mobile bottom bar (builder only)**: Sticky strip showing selected Pokémon avatars + "View group" button.

---

## Key UX Principles to Embody

1. **Explain the ranking, don't just show it.** When an item or Pokémon is ranked "Best Match", show why — which favorite categories it shares.
2. **Support status is the primary lens.** "Is each Pokémon well-served?" comes before "what is my overall score."
3. **Items are visual.** Item images are important. Cards should feel like inventory/collector cards, not rows in a table.
4. **Mobile-first, thumb-friendly.** All primary actions reachable with the thumb. Bottom-anchored CTAs on mobile. No tiny tap targets.
5. **Immediate feedback.** Adding a Pokémon or item should feel instant — animate the change.
6. **Material tracking is a chore — make it satisfying.** Progress bars, clear counts, satisfying "complete" states.

---

## Design Requirements

- **Mobile-first HTML/CSS**: Start with a 375px viewport. All layouts should work up to 1280px.
- **One HTML file per screen or major state** (e.g., `builder-pokemon-tab.html`, `saved-homes.html`).
- **Embedded CSS** — no external stylesheets or CDN frameworks required.
- **Realistic placeholder data** — use real Pokémon names (Pikachu, Bulbasaur, Eevee, Snorlax, etc.) and plausible item names (Tiny Cactus Pot, Fluffy Rug, Wooden Bench, Paper Lantern, Acrylic Poster, etc.).
- **All 4 match tier states** must be visible on at least one screen (Best / Good / Some / None or Best / Supporting / Neutral).
- **Color scheme**: Design from scratch — do NOT use Pokémon-game color palettes or Nintendo-style red/yellow. Create something fresh that fits a cozy, craft-forward, mobile-app aesthetic.
- **Typography**: Choose clean, legible fonts appropriate for a mobile planning tool. Prioritize readability over personality.
- **Interactive states**: Show hover, selected, and disabled states inline (e.g., an item card that is "added" should look different from one that is not).
