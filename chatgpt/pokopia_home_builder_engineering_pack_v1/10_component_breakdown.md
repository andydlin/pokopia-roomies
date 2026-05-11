# React Component Breakdown

## HomeBuilderPage
Orchestrates the builder shell.

Children:
- BuilderLayout
- StickyHomePanel
- BrowserPanel
- ExpandedHomeDrawer
- SavedHomesDrawer or Popover

## StickyHomePanel
Subcomponents:
- HomeHeader
- HomePokemonSection
- HomeHabitatSection
- HomeItemsSection
- HomeQuickSummary
- ExpandHomeButton

## BrowserPanel
Subcomponents:
- BrowseSurfaceHeader
- BrowseModeTabs
- SearchBar
- ActiveFilterChips
- ContextSummaryBar
- SuggestionRail
- PokemonBrowserView | ItemsBrowserView | HabitatsBrowserView

## ItemsBrowserView
Subcomponents:
- ItemsBrowseModeToggle
- ItemGeneralCategoryFilter
- ItemComfortCategoryFilter
- ItemsSectionList
- ItemCard

## ExpandedHomeDrawer
Subcomponents:
- ExpandedHomeOverview
- ExpandedPokemonList
- ExpandedHabitatCard
- ExpandedItemsList
- HomeJumpActions

## SavedHomes
Subcomponents:
- SavedHomesDrawer
- SavedHomeCard
- SavedHomeActions

## Mobile layout
- bottom sticky mini-home bar
- expandable builder sheet
- same inner content models as desktop
