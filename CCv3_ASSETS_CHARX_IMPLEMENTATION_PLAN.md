# Card Architect: CCv3 Assets & CHARX Format Implementation Plan

## Executive Summary

Card Architect currently implements most of the CCv3 specification but lacks critical features for full compliance: the structured `assets` array system and CHARX format support. This plan outlines the implementation strategy to add these features while maintaining backward compatibility.

## Current State Analysis

### What We Have
✅ Full CCv2 support with import/export
✅ Partial CCv3 support (text fields, lorebook, basic import/export)
✅ Basic asset management (single image upload/transform via `/assets` endpoints)
✅ PNG tEXt chunk embedding for metadata
✅ JSON import/export with normalization
✅ Token counting and validation
✅ Version history system

### Critical Gaps for Full CCv3 Compliance
❌ **No `data.assets` array structure** - Currently using simple asset upload, not the CCv3 asset descriptor system
❌ **No CHARX format support** - Cannot read/write ZIP-based `.charx` files
❌ **No `embeded://` URI handling** - Missing the custom URI scheme (with typo)
❌ **No multi-asset type support** - No distinction between icon, background, user_icon, emotion assets
❌ **Missing CCv3 fields** - `nickname`, `creator_notes_multilingual`, `source`, `group_only_greetings`, `creation_date`, `modification_date`
❌ **No asset selection UI** - No way to manage multiple character portraits or backgrounds

## Asset System Requirements

### 1. Data Model Changes

#### Backend Schema Updates
```typescript
// packages/schemas/src/types.ts additions
interface AssetDescriptor {
  type: 'icon' | 'background' | 'user_icon' | 'emotion' | string; // x-prefixed for custom
  uri: string;  // embeded://, http://, https://, data:, ccdefault:
  name: string; // 'main' for primary, arbitrary for others
  ext: string;  // file extension without dot
}

interface CharacterCardV3Data {
  // Existing fields...

  // New CCv3 fields
  assets?: AssetDescriptor[];
  nickname?: string;
  creator_notes_multilingual?: Record<string, string>;
  source?: string[];
  group_only_greetings: string[];
  creation_date?: number;
  modification_date?: number;
}
```

#### Database Schema Extension
- New `card_assets` table to store asset metadata
- Link assets to cards via `card_id` foreign key
- Store binary data in `assets` table (existing) or filesystem
- Track asset type, name, and usage

### 2. URI Resolution System

Must support multiple URI schemes:
- `embeded://` - Assets within CHARX ZIP (note: keep typo for compatibility)
- `ccdefault:` - Default/fallback assets
- `https://` / `http://` - Remote assets
- `data:` - Base64 encoded inline assets
- `file://` - Local filesystem (optional, security considerations)

### 3. Asset Storage Strategy

**Hybrid Approach:**
- **Database**: Asset metadata, relationships, URIs
- **Filesystem**: Binary data in `~/.card-architect/assets/`
- **Memory Cache**: Frequently accessed assets
- **CDN Ready**: Structure for future cloud storage

## CHARX Format Implementation

### 1. Core Dependencies
- **node-zip** or **adm-zip**: For ZIP file manipulation
- **yauzl** / **yazl**: Alternative streaming ZIP libraries for large files
- Reuse existing **sharp** for image processing
- Reuse existing **pngjs** for PNG tEXt chunks

### 2. CHARX Importer Architecture

```
[.charx file] → [ZIP Parser] → [Validator] → [Asset Extractor] → [Card + Assets in DB]
```

**Key Components:**
1. **ZIP Handler** (`apps/api/src/utils/charx.ts`)
   - Open and validate ZIP structure
   - Check for required `card.json`
   - List all assets under `assets/**`

2. **Asset Resolver**
   - Parse `embeded://` URIs
   - Extract binary data from ZIP
   - Store in local asset system
   - Generate new internal URIs

3. **Metadata Processor**
   - Handle optional `x_meta/*.json`
   - Process `module.risum` (store but don't parse initially)
   - Preserve `extensions` namespaces

### 3. CHARX Exporter Architecture

```
[Card + Assets in DB] → [Asset Bundler] → [ZIP Creator] → [.charx file]
```

**Key Components:**
1. **Asset Collector**
   - Gather all assets for a card
   - Organize by type (icon/image, other/image, etc.)
   - Generate sequential numbering

2. **URI Transformer**
   - Convert internal URIs to `embeded://` format
   - Maintain asset paths convention

3. **ZIP Builder**
   - Create `card.json` with proper structure
   - Add assets in correct directories
   - Include optional metadata

### 4. Import/Export Endpoints

```typescript
// New endpoints
POST /import/charx        // Import CHARX file
GET  /cards/:id/export/charx  // Export as CHARX

// Modified endpoints
POST /import              // Add CHARX detection
GET  /cards/:id/export    // Add format=charx option
```

## UI/UX Design for Asset Management

### 1. Asset Gallery Component

**New Component: `AssetGallery.tsx`**
- Grid view of all character assets
- Categorized tabs: Portraits, Backgrounds, Emotions, User Icons
- Drag & drop upload zone
- Quick actions: Set as Main, Delete, Rename, Download

**Features:**
- Thumbnail previews with lazy loading
- Asset type badges (icon, bg, emotion)
- "Main" indicator for primary portrait
- Bulk operations support

### 2. Enhanced Card Editor UI

**Modifications to `CardEditor.tsx`:**

```
┌─────────────────────────────────────────┐
│ Character Portrait Section              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ Main    │ │ Alt 1   │ │ Alt 2   │   │
│ │ [IMG]   │ │ [IMG]   │ │ [IMG]   │   │
│ │ ★       │ │         │ │         │   │
│ └─────────┘ └─────────┘ └─────────┘   │
│ [+ Add Portrait] [Manage Assets...]     │
└─────────────────────────────────────────┘
```

**New UI Elements:**
- Portrait carousel/selector
- Background picker (if backgrounds exist)
- Emotion gallery (collapsible section)
- Asset counter badges

### 3. Asset Import Wizard

**Multi-step Modal:**
1. **Upload Step**: Drag & drop or browse
2. **Type Selection**: Categorize as icon/bg/emotion
3. **Naming**: Set display name
4. **Processing**: Crop, resize, format conversion
5. **Confirmation**: Preview and save

### 4. CHARX Format Indicators

**Visual Cues:**
- `.charx` badge on cards imported from CHARX
- Export dropdown: "Export as CHARX" option
- Asset count indicator: "📎 12 assets"
- Format compatibility warnings

### 5. Asset Manager Modal

**Dedicated Management Interface:**
```
┌──────────────────────────────────────────┐
│ Asset Manager                        [X] │
├──────────────────────────────────────────┤
│ [Portraits] [Backgrounds] [Emotions] [+] │
├──────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│ │IMG │ │IMG │ │IMG │ │IMG │           │
│ │main│ │alt1│ │alt2│ │alt3│           │
│ └────┘ └────┘ └────┘ └────┘           │
│                                          │
│ Selected: alt1.png                      │
│ Type: icon | Name: "Alternative Look"   │
│ Size: 512x512 | Format: PNG             │
│                                          │
│ [Set as Main] [Rename] [Delete] [Edit]  │
└──────────────────────────────────────────┘
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Extend data model and basic infrastructure

#### Backend Tasks:
1. **Update TypeScript schemas** (`packages/schemas/src/types.ts`)
   - Add `AssetDescriptor` interface
   - Add missing CCv3 fields
   - Update validation schemas

2. **Database migrations**
   - Create `card_assets` table
   - Add new columns to `cards` table
   - Migration script for existing data

3. **Asset service refactor** (`apps/api/src/services/asset.service.ts`)
   - Implement URI resolver
   - Support multiple URI schemes
   - Asset metadata management

#### Frontend Tasks:
1. **State management** (`apps/web/src/store/card-store.ts`)
   - Add assets array to card state
   - Asset CRUD operations
   - Selection state management

2. **Basic asset display**
   - Show main portrait from assets array
   - Fallback to current image system

### Phase 2: CHARX Import (Week 2-3)
**Goal:** Read and import CHARX files

#### Backend Tasks:
1. **ZIP handler** (`apps/api/src/utils/charx-handler.ts`)
   ```typescript
   - extractCharx(file: Buffer): Promise<CharxData>
   - validateCharxStructure(data: CharxData): ValidationResult
   - resolveAssetUris(assets: AssetDescriptor[]): Promise<ResolvedAssets>
   ```

2. **Import endpoint** (`apps/api/src/routes/import-export.ts`)
   - Detect CHARX format by extension/magic bytes
   - Parse ZIP and extract card.json
   - Store assets with proper relationships

3. **Asset extraction**
   - Extract binary data from ZIP
   - Store in filesystem with UUID names
   - Update database with metadata

#### Testing:
- Import sample CHARX from Risu
- Verify asset preservation
- Test URI resolution

### Phase 3: Asset Management UI (Week 3-4)
**Goal:** Full UI for managing multiple assets

#### Frontend Components:
1. **AssetGallery component** (`apps/web/src/components/AssetGallery.tsx`)
   - Grid view with categories
   - Drag-drop reordering
   - Set main portrait

2. **AssetUploader component** (`apps/web/src/components/AssetUploader.tsx`)
   - Multi-file upload
   - Type selection
   - Progress indicators

3. **CardEditor integration**
   - Portrait selector
   - Asset count badges
   - Quick asset actions

#### UX Enhancements:
- Lazy loading for thumbnails
- Image optimization
- Keyboard shortcuts

### Phase 4: CHARX Export (Week 4-5)
**Goal:** Generate valid CHARX files

#### Backend Tasks:
1. **ZIP builder** (`apps/api/src/utils/charx-builder.ts`)
   ```typescript
   - buildCharx(card: Card, assets: Asset[]): Promise<Buffer>
   - organizeAssetPaths(assets: Asset[]): AssetPathMap
   - generateCardJson(card: Card, assetPaths: AssetPathMap): object
   ```

2. **Export endpoint**
   - Gather card and all assets
   - Transform URIs to embeded://
   - Create ZIP with proper structure

3. **Optimization**
   - Image format conversion options
   - Compression settings
   - Size limits/warnings

### Phase 5: Advanced Features (Week 5-6)
**Goal:** Polish and advanced functionality

#### Features:
1. **Emotion system**
   - Emotion asset type support
   - Expression selector UI
   - Preview in chat simulation

2. **Background support**
   - Background asset management
   - Preview panel integration
   - CSS integration for display

3. **Multi-language support**
   - `creator_notes_multilingual` UI
   - Language selector
   - Proper RTL support

4. **Asset optimization**
   - Automatic image optimization
   - Format conversion suggestions
   - Batch processing

### Phase 6: Testing & Documentation (Week 6)
**Goal:** Ensure reliability and usability

#### Tasks:
1. **Test suite**
   - Unit tests for CHARX handlers
   - Integration tests for import/export
   - E2E tests for asset management

2. **Documentation**
   - Update README with CHARX support
   - Asset management guide
   - Migration guide for existing users

3. **Compatibility testing**
   - Test with Risu exports
   - Test with SillyTavern
   - Test with other CCv3 tools

## Risk Mitigation

### Technical Risks:
1. **Large file handling**
   - Solution: Streaming ZIP processing
   - File size limits with clear messaging
   - Background processing for large imports

2. **Asset storage scaling**
   - Solution: Filesystem with DB metadata
   - Future: S3/CDN integration ready
   - Cleanup jobs for orphaned assets

3. **Format compatibility**
   - Solution: Extensive normalization
   - Preserve unknown fields
   - Version detection and migration

### UX Risks:
1. **Complexity increase**
   - Solution: Progressive disclosure
   - Simple mode vs advanced mode
   - Sensible defaults

2. **Performance impact**
   - Solution: Lazy loading
   - Virtual scrolling for large galleries
   - Thumbnail caching

## Success Metrics

### Functional:
- ✅ Import any valid CHARX file
- ✅ Export CHARX that works in Risu/ST
- ✅ Support all CCv3 asset types
- ✅ Handle 50+ assets per card

### Performance:
- Import 10MB CHARX in <3 seconds
- Export with 20 assets in <2 seconds
- Gallery loads 100 assets smoothly

### Quality:
- Zero data loss on import/export cycle
- All existing features continue working
- Backward compatible with CCv2

## Priority Implementation Order

### Immediate (Must Have):
1. **Data model updates** - Add missing CCv3 fields and assets array
2. **CHARX import** - Basic ability to read .charx files
3. **Asset display** - Show portraits from assets array
4. **CHARX export** - Generate valid .charx files

### Important (Should Have):
1. **Asset management UI** - Gallery, upload, selection
2. **Multiple portraits** - Switch between character images
3. **Emotion support** - Basic emotion asset handling
4. **URI resolution** - Full embeded:// support

### Nice to Have (Could Have):
1. **Backgrounds** - Background asset integration
2. **User icons** - Persona replacement system
3. **Advanced optimization** - Image processing pipeline
4. **Module support** - Handle module.risum

## Technical Decisions Required

1. **ZIP Library Selection**
   - Recommend: `yauzl`/`yazl` for streaming support
   - Alternative: `adm-zip` for simpler API

2. **Asset Storage Location**
   - Recommend: `~/.card-architect/assets/{card_id}/`
   - Database: Metadata only, not binary data

3. **URI Scheme Handling**
   - Keep typo "embeded://" for compatibility
   - Internal URIs use standard format

4. **Migration Strategy**
   - New cards use assets array
   - Old cards migrate on save
   - Backward compatibility maintained

## File Structure Changes

```
apps/api/src/
├── utils/
│   ├── charx-handler.ts    [NEW]
│   ├── charx-builder.ts    [NEW]
│   ├── asset-resolver.ts   [NEW]
│   └── uri-utils.ts        [NEW]
├── services/
│   └── asset.service.ts    [MODIFY]
└── routes/
    └── import-export.ts     [MODIFY]

apps/web/src/
├── components/
│   ├── AssetGallery.tsx    [NEW]
│   ├── AssetUploader.tsx   [NEW]
│   ├── AssetManager.tsx    [NEW]
│   ├── PortraitSelector.tsx [NEW]
│   └── CardEditor.tsx      [MODIFY]
└── store/
    └── card-store.ts        [MODIFY]

packages/schemas/src/
└── types.ts                 [MODIFY]
```

## Backward Compatibility Strategy

1. **Import Handling:**
   - Detect format by magic bytes/structure
   - CCv2 → Add empty assets array
   - PNG with single image → Create icon asset
   - Existing JSON → Preserve as-is

2. **Export Options:**
   - Default to user's import format
   - Offer format selection dropdown
   - Warn about feature loss when downgrading

3. **Database Migration:**
   - Non-breaking additive changes
   - NULL defaults for new fields
   - Lazy migration on card save

## Testing Strategy

**Unit Tests:**
- CHARX parsing/building
- URI resolution
- Asset CRUD operations

**Integration Tests:**
- Full import/export cycle
- Format conversions
- Asset persistence

**Manual Testing:**
- Import from Risu, SillyTavern
- Export and reimport
- Cross-tool compatibility

## Documentation Updates

1. **User Guide:**
   - "Working with Assets" section
   - "CHARX Format" explanation
   - Migration guide from other tools

2. **API Documentation:**
   - New endpoints
   - Asset URI schemes
   - Format specifications

3. **Developer Guide:**
   - Architecture decisions
   - Extension points
   - Contribution guidelines

## Conclusion

This implementation plan provides a systematic approach to adding full CCv3 assets and CHARX format support to Card Architect. The phased approach ensures:

1. **Incremental delivery** - Working features at each phase
2. **Risk management** - Critical features first
3. **Quality maintenance** - Testing at each phase
4. **User experience** - Progressive complexity

The estimated timeline is 6 weeks for full implementation, but Phase 1-2 (2-3 weeks) will deliver the core functionality needed for CCv3 compliance.

**Recommended First Step:** Start with Phase 1 backend changes - updating the data model and schemas to support the assets array structure. This foundation will enable all subsequent features.
