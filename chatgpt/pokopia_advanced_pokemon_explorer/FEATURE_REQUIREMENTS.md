# Feature Requirements

## 1. Search
Free-text search input.

Should match against:
- `name`
- `number`
- `idealHabitat`
- `specialties`
- `favorites`
- `favoriteItemCategories`
- `tags`

## 2. Filters
### Favorites
- Multi-select
- Show option counts if possible

### Ideal Habitat
- Multi-select

### Specialties
- Multi-select

### Evolution Family
- Optional, only if present in data

## 3. Active Filters
- Render chips for each active filter
- Chips should be removable individually
- Include “Clear all” action

## 4. Sorting
Required options:
- Pokédex number ascending
- Name A–Z
- Name Z–A
- Specialty count descending
- Favorites count descending
- Compatibility potential descending

## 5. Results Area
Each result card should show:
- sprite or placeholder image
- name
- number
- ideal habitat
- specialties
- favorite summary
- compatibility potential badge or small score

## 6. Detail View
Can be modal, drawer, or route-based detail page.

Must show:
- name and number
- image
- ideal habitat
- specialties
- favorites
- favorite item categories
- notes
- related Pokémon

## 7. Related Pokémon Logic
Basic v1 logic:
- score other Pokémon by shared favorites
- add bonus for same ideal habitat
- add small bonus for shared specialty
- show top related Pokémon

## 8. Empty State
If no results:
- show a helpful message
- suggest clearing filters
- keep controls visible

## 9. Accessibility
- keyboard-navigable filters
- sufficient contrast
- visible focus states
- semantic labels

## 10. Performance
- data should load instantly with local JSON
- filtering should feel immediate
- memoize derived lists if needed
