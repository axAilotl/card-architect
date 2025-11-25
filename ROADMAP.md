# Card Architect - Development Roadmap

## Phase 2: Code Quality & Infrastructure (Completed 2025-11-25)

### 2.1 Asset Storage Restructure
- [x] Move assets from flat storage to `./storage/{card_id}/*` structure
- [x] Update AssetRepository to use card-based paths
- [x] Add migration to move existing assets to new structure
- [x] Update all asset URL generation

### 2.2 Database Migration System
- [x] Create migrations table with version tracking
- [x] Convert existing ALTER TABLE try/catch to proper migrations
- [x] Add migration runner with transaction support
- [x] 5 migrations implemented:
  1. `initial_schema` - Core tables
  2. `add_indexes` - Performance indexes
  3. `add_original_image_column` - Avatar storage
  4. `add_card_assets_tags_column` - Asset tagging
  5. `restructure_asset_storage` - Card-based directories

### 2.3 TypeScript Improvements
- [x] Remove `as any` casts in `cards.ts`
- [x] Add proper type guards and type assertions
- [x] Fixed CardMeta partial type handling

### 2.4 Code Cleanup
- [x] Remove debug console.log statements from `card-store.ts`
- [x] Remove debug console.log statements from `png.ts`
- [x] Remove debug logging from `cards.ts` routes

### 2.5 Frontend Improvements
- [x] Add React Error Boundaries (`ErrorBoundary`, `PageErrorBoundary`)
- [x] Fix Vite dynamic import warnings (converted to static imports)

### 2.6 Test Fixes
- [x] Update test assertions for wrapped V2 format
- [x] Added `getCardName()` helper for format-agnostic name extraction
- [x] All 27 tests passing

---

## Phase 3: Feature Completion & UX (Next)

### 3.1 Re-enable Disabled Features
- [ ] Implement and enable RedundancyPanel.tsx
- [ ] Implement and enable LoreTriggerPanel.tsx
- [ ] Add UI toggles to access these panels

### 3.2 Guided Creation Mode (LLM Wizard)
- [ ] Design wizard flow for new card creation
- [ ] Step-by-step prompts for character details
- [ ] Auto-population of fields with LLM
- [ ] Improvement suggestions for existing cards
- [ ] Integration with existing LLM assist system

### 3.3 LLM Panel UI Improvements
- [ ] Wider sidebar layout option
- [ ] Collapsible/expandable panel
- [ ] Better preset organization
- [ ] Improved streaming diff display

### 3.4 Voxta Support Improvements
- [ ] Better emotion/expression mapping
- [ ] Voice sample handling
- [ ] Memory book improvements
- [ ] Multi-character package support

### 3.5 Saving & Snapshots
- [x] Auto-snapshot at configurable intervals (1, 5, 10, 15, 30 min)
- [x] Snapshot deletion with confirmation
- [ ] Snapshot diff preview (current: full JSON diff)
- [ ] Snapshot branching
- [ ] Export snapshots as separate files

---

## Ultimate Goal: Universal Format Bridge

**Vision**: Import any format, export to any format with full fidelity

### Supported Conversions
| From / To | JSON V2 | JSON V3 | PNG V2 | PNG V3 | CHARX | Voxta |
|-----------|---------|---------|--------|--------|-------|-------|
| JSON V2   | ✓       | ✓       | ✓      | ✓      | ✓     | ✓     |
| JSON V3   | ✓       | ✓       | ✓      | ✓      | ✓     | ✓     |
| PNG V2    | ✓       | ✓       | ✓      | ✓      | ✓     | ✓     |
| PNG V3    | ✓       | ✓       | ✓      | ✓      | ✓     | ✓     |
| CHARX     | ✓       | ✓       | ✓      | ✓      | ✓     | ✓     |
| Voxta     | ✓       | ✓       | ✓      | ✓      | ✓     | ✓     |

### Key Principles
1. **Lossless where possible** - Preserve all metadata in extensions
2. **Graceful degradation** - When features don't map, store in extensions
3. **Round-trip safety** - Import → Export → Import yields same data
4. **Asset handling** - Properly migrate assets between format conventions

---

## Changelog

### 2025-11-25 - Auto-Snapshot & Snapshot Deletion
- Added snapshot deletion (API endpoint + UI button in DiffPanel)
- Implemented auto-snapshot feature:
  - New `settings-store.ts` with Zustand + localStorage persistence
  - Configurable intervals (1, 5, 10, 15, or 30 minutes)
  - New "General" tab in Settings modal
  - `useAutoSnapshot` hook integrated in CardEditor
  - Auto-snapshots labeled with "[Auto]" prefix
- Fixed TypeScript errors in migrations.ts (unused imports)
- Fixed type handling in cards.ts route

### 2025-11-25 - Phase 2 Completed
- Implemented versioned database migration system (5 migrations)
- Restructured asset storage from flat to card-based directories
- Added React Error Boundaries for graceful error handling
- Fixed all TypeScript `any` casts with proper typing
- Removed all debug console.log statements
- Fixed Vite dynamic import warnings
- Fixed 3 failing tests (all 27 tests now pass)
- Build passes with no errors

### 2025-11-25 - Phase 2 Started
- Created roadmap document
- Identified code quality issues
- Planned asset storage restructure
