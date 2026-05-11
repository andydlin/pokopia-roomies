# Test Matrix

## Domain logic tests
- category strength derivation
- share type thresholds
- coverage state derivation
- habitat conflict detection
- suggestion generation priorities
- item contextual scoring
- item bucket classification
- item section grouping

## Selector tests
- memoized selectors return expected view models
- query/filter state changes affect only relevant browser outputs
- loading saved home updates derived selectors correctly

## Persistence tests
- local payload save/load
- versioned payload migration if supported
- save current home
- duplicate/delete saved home

## Restore code tests
- export payload shape
- import payload application
- confirm before overwrite local data
- invalid code error handling
- expired code handling

## Routing/navigation tests
- tab preserved in URL
- search/filter params preserved
- detail open/close back navigation
- loading saved home preserves route

## UI tests
- sticky builder visible on desktop
- bottom builder bar/sheet on mobile
- contextual item sections visible when home exists
- neutral items still visible
- suggestions remain optional
