# Work In Progress - Current Status

## Recent Fixes (2024-12-07)

### 1. Defaults Package Consolidation - FIXED
All shared default data now lives in `@card-architect/defaults`:
- `packages/defaults/assets/templates.json` - Character card templates
- `packages/defaults/assets/snippets.json` - Reusable text snippets
- `packages/defaults/assets/presets.json` - LLM assist presets
- `packages/defaults/assets/wwwyzzerdd-prompts.json` - AI wizard prompts (NEW)

**Web app files now import from defaults:**
- `default-presets.ts` - imports from `@card-architect/defaults`
- `default-wwwyzzerdd.ts` - imports from `@card-architect/defaults`
- `default-templates.ts` - already was importing correctly

### 2. Deployment Mode Fixes - FIXED
**Web Import disabled in LITE/static modes:**
- `deployment.ts` LIGHT_CONFIG: `webImport: false`, `webimport: false`
- `deployment.ts` STATIC_CONFIG: already had it disabled

**Deployment modes:**
- **Full**: All features, self-hosted with API backend
- **Light**: Minimal server, client-side processing, Web Import DISABLED
- **Static**: No server (Cloudflare/GitHub Pages), Web Import DISABLED

### 3. Asset Storage in LITE Mode - FIXED
Assets from CHARX/Voxta imports were not being saved to IndexedDB.

**Fixed locations:**
- `client-import.ts`: Voxta imports now extract assets (was just showing warning)
- `card-store.ts` `importVoxtaPackage`: Now saves assets to IndexedDB
- `card-store.ts` `importCardFromURL`: Now saves assets to IndexedDB
- `card-store.ts` `importCard`: Already was saving assets (confirmed working)

---

## Federation WIP - What Still Needs To Be Done

### Current State

Federation is partially implemented:
- Server endpoints exist at `/api/federation/*`
- Client adapters exist for ST, AR, HUB
- LocalEditorAdapter works in both light/full modes
- Badges show sync state on cards
- Push to ST works (federation-first, fallback to direct)

### What's Working

- [x] Federation API endpoints on Card Architect server
- [x] LocalEditorAdapter dual-mode (IndexedDB vs API)
- [x] recordManualSync for manual pushes
- [x] pollPlatformSyncState to refresh sync states
- [x] ST/AR/HUB badges on cards
- [x] Federation-first push to SillyTavern

### What's NOT Working / Needs Implementation

#### Critical

1. **Pull from Platforms**
   - Currently only PUSH is implemented
   - Need UI buttons to pull cards FROM ST/AR/HUB
   - Need to handle incoming cards (create local, merge, etc.)
   - File: `Header.tsx` or new PullPanel component

2. **Bi-directional Sync**
   - SyncEngine from @character-foundry/federation is imported but NOT USED
   - Need to actually wire up SyncEngine for proper bi-directional sync
   - File: `federation-store.ts`

3. **Push to AR/HUB**
   - Header only has ST push button
   - Need push buttons for Archive and CardsHub
   - Or a unified "Sync" dropdown

4. **Conflict Resolution**
   - What happens when same card edited on multiple platforms?
   - Currently no conflict detection or resolution
   - Need UI for user to choose which version to keep

#### Important

5. **Periodic Polling**
   - Currently only polls on CardGrid mount
   - Should poll periodically (every 30s? 1min?)
   - Or use WebSocket for real-time updates

6. **Asset Sync**
   - Assets endpoint exists but not wired up
   - Need to sync character images, expression packs, etc.
   - File: `adapters.ts`, `federation-store.ts`

7. **Delete Propagation**
   - When card deleted locally, should notify federated platforms
   - When card deleted on platform, should update local state
   - Currently neither works

8. **Error Handling**
   - Network failures need retry logic
   - Need user-visible error messages
   - Need offline queue for pending syncs

#### Nice to Have

9. **Sync History** - Show when each card was last synced
10. **Selective Sync** - Let user choose which cards to sync
11. **Sync Status Indicator** - Show overall sync status in header
12. **Federation Settings UI** - Full settings UI with connection tests

---

## Known Issues

### Templates/Snippets/Presets
- [x] FIXED: Now all import from `@card-architect/defaults` package
- [x] FIXED: Parity between LITE and FULL modes

### Asset Display
- [x] FIXED: CHARX assets are extracted and stored
- [x] FIXED: Voxta assets are now extracted and stored
- [ ] TODO: Verify CCv3 cards with `data.assets` array display in Assets tab

### Settings Modal
- [ ] TODO: Consider breaking 2289-line SettingsModal into smaller components
- The modal works but is quite large

---

## Files Changed Today

| File | Change |
|------|--------|
| `apps/web/src/config/deployment.ts` | Disabled webimport in LIGHT_CONFIG |
| `packages/defaults/src/index.ts` | Added WwwyzzerddPromptSet type and export |
| `packages/defaults/assets/wwwyzzerdd-prompts.json` | NEW - wizard prompts |
| `apps/web/src/lib/default-presets.ts` | Now imports from defaults |
| `apps/web/src/lib/default-wwwyzzerdd.ts` | Now imports from defaults |
| `apps/web/src/lib/client-import.ts` | Fixed Voxta asset extraction |
| `apps/web/src/store/card-store.ts` | Fixed asset saving in all import paths |
| `AGENTS.md` | Updated with defaults package info |
| `docs/internal/CLAUDE.md` | Updated architecture section |
