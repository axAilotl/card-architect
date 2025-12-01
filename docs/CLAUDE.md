# Card Architect - Complete Project Guide

## Project Overview

**Card Architect** (internally called "card_doctor") is a modern, self-hostable character card editor for CCv2 (Character Card v2) and CCv3 (Character Card v3) formats. It's designed as a single-user application with always-saving drafts, version history, and accurate token estimation for AI character cards.

This tool helps creators build, edit, and maintain AI character cards with advanced features for character development, including AI-assisted content generation, templates, lorebooks, and version control.

## Tech Stack

**Backend (apps/api):**
- **Fastify** - Fast, low-overhead web framework
- **SQLite** (better-sqlite3) - Local database for cards storage
- **Sharp** - Image processing (crop, resize, convert)
- **pngjs** - PNG tEXt chunk handling for embedded card metadata
- **Ajv** - JSON schema validation

**Frontend (apps/web):**
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling (custom dark theme)
- **Zustand** - Lightweight state management
- **IndexedDB** (idb) - Local persistence with background sync
- **Milkdown** - WYSIWYG markdown editor
- **CodeMirror** - Raw markdown editing
- **marked** - Markdown to HTML rendering
- **DOMPurify** - HTML sanitization for security

**Testing:**
- **Vitest** - Test framework (27 tests passing)

## Architecture

### Monorepo Structure

```
card_doctor/
├── apps/
│   ├── api/                 # Fastify backend (Node 20 + SQLite)
│   │   └── src/
│   │       ├── routes/      # API endpoints (15 route files)
│   │       ├── services/    # Business logic
│   │       ├── providers/   # LLM provider integrations
│   │       ├── db/          # Database & repository
│   │       ├── utils/       # Utilities (PNG, prompts, RAG, settings)
│   │       └── __tests__/   # Vitest tests
│   └── web/                 # React frontend (Vite + TypeScript + Tailwind)
│       └── src/
│           ├── features/    # Core features (dashboard, editor)
│           │   └── editor/
│           │       ├── tabs.ts          # Core tab registration
│           │       ├── CardEditor.tsx   # Dynamic tab rendering
│           │       └── components/      # Editor panels
│           ├── modules/     # Optional modules (lazy-loaded)
│           │   ├── block-editor/        # Visual block-based card builder
│           │   ├── wwwyzzerdd/          # AI character wizard
│           │   └── comfyui/             # Image generation
│           ├── components/  # React components (shared, ui)
│           ├── store/       # Zustand state
│           ├── hooks/       # React hooks
│           ├── lib/         # API client, IndexedDB, registry
│           │   └── registry/            # Plugin registry system
│           │       ├── types.ts         # Type definitions
│           │       ├── index.ts         # Registry singleton
│           │       └── hooks.ts         # React hooks
│           └── styles/      # CSS
├── packages/
│   ├── schemas/             # Shared types & Zod validation (CCv2, CCv3, CHARX, Voxta)
│   ├── utils/               # Binary, base64, ZIP, URI utilities
│   ├── png/                 # PNG tEXt/zTXt chunk reading/writing
│   ├── charx/               # CHARX format (ZIP-based CCv3)
│   ├── voxta/               # Voxta .voxpkg format
│   ├── tokenizers/          # Token counting
│   └── plugins/             # Plugin SDK (stub)
├── docs/                    # Documentation
│   ├── CLAUDE.md            # This file - technical context
│   ├── plugins_plan.md      # Plugin architecture implementation plan
│   └── ROADMAP.md           # Development roadmap
└── testing/                 # Test cards from various platforms
    ├── wyvern/
    ├── chub/
    └── CharacterTavern/
```

### Plugin Architecture

The frontend uses a dynamic plugin-based architecture for editor tabs. This allows:
- **Dynamic Registration**: Tabs can be registered at runtime
- **Lazy Loading**: Optional modules load on-demand
- **Feature Flags**: Modules conditionally enabled based on settings
- **Consistent API**: Core and plugin tabs use the same registration mechanism

**Key Components:**

| File | Purpose |
|------|---------|
| `lib/registry/types.ts` | Type definitions (EditorTabDefinition, PluginManifest) |
| `lib/registry/index.ts` | Registry singleton with CRUD operations |
| `lib/registry/hooks.ts` | React hooks (useEditorTabs, useSettingsPanels) |
| `lib/modules.ts` | Module loader for async initialization |
| `features/editor/tabs.ts` | Core tab registration |
| `modules/*/index.ts` | Optional module registration |

**Tab Registration Example:**
```typescript
import { registry } from '@/lib/registry';

registry.registerTab({
  id: 'my-tab',
  label: 'My Tab',
  component: lazy(() => import('./MyComponent')),
  order: 50,
  contexts: ['card'],
  condition: () => settingsStore.getState().features.myFeature,
});
```

**Application Bootstrap:**
```typescript
// main.tsx
async function bootstrap() {
  await initializeModules(); // Registers all tabs
  ReactDOM.createRoot(...).render(<App />);
}
```

### Code Metrics

- **Total Lines**: ~37,626 TypeScript
- **File Count**: 192 TypeScript files
- **API Endpoints**: 90+
- **Test Coverage**: 27/27 tests passing

## Character Card Formats

### Supported Specs

| Spec | Version | Description |
|------|---------|-------------|
| CCv2 | `chara_card_v2` | TavernCardV2 - most common format |
| CCv3 | `chara_card_v3` | Extended spec with assets, timestamps |
| CHARX | ZIP-based | CCv3 + embedded assets in ZIP archive |
| Voxta | `.voxpkg` | Voxta AI companion format |

### PNG Chunk Keys

Cards can be embedded in PNG files using these tEXt chunk keywords:

| Chunk Key | Format | Used By |
|-----------|--------|---------|
| `chara` | Base64 JSON | Universal (V1/V2/V3) |
| `ccv3` | Base64 JSON | CCv3 spec |
| `chara_card_v3` | Base64 JSON | CCv3 alternate |

CharacterTavern exports BOTH `chara` and `ccv3` chunks with identical content.

### URI Schemes

Asset URIs in CCv3 cards support these schemes:

| Scheme | Example | Description |
|--------|---------|-------------|
| `embeded://` | `embeded://assets/icon/0.png` | CHARX embedded asset |
| `ccdefault:` | `ccdefault:` | Use platform default |
| `https://` | `https://example.com/img.png` | Remote URL |
| `data:` | `data:image/png;base64,...` | Inline base64 |
| `__asset:` | `__asset:0` | PNG chunk reference |
| `asset:` | `asset:0` | PNG chunk reference (alt) |

### CCv2 (Character Card v2)

- Basic fields: name, description, personality, scenario, first_mes
- Extensions for lorebooks, alternate greetings
- Spec value: `chara_card_v2`

### CCv3 (Character Card v3)

- All CCv2 fields plus enhanced lorebook
- Better structured character books with priority, position, logic
- Required fields: creator, character_version, tags
- Spec value: `chara_card_v3`

### Lorebook Entry Structure

- **Keywords** - Primary trigger words (comma-separated)
- **Secondary Keywords** - For selective matching
- **Content** - The lorebook entry text
- **Priority** - Insertion priority (higher = inserted first)
- **Insertion Order** - Order among same-priority entries
- **Position** - before_char | after_char
- **Probability** - 0-100% chance of insertion
- **Selective Logic** - AND (all match) or NOT (none match)
- **Constant** - Always insert regardless of triggers
- **Case Sensitive** - Match keywords with exact case
- **Depth** - Scan depth override
- **Extensions** - Custom metadata

## Platform-Specific Formats

### Wyvern (wyvern.chat)

**Structure**: Hybrid V2 with full field duplication

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "name": "...",           // DUPLICATED at root
  "description": "...",    // DUPLICATED at root
  "data": {
    "name": "...",         // Canonical location
    "description": "..."
  }
}
```

**Extensions**:
- `depth_prompt` - SillyTavern Character Note injection
  ```json
  { "prompt": "...", "depth": 4 }
  ```
- `visual_description` - Physical appearance (maps to Voxta appearance)

**Import Handling**: Strip root-level duplicates, use `data` object.

### Chub (chub.ai)

**Structure**: Clean V2, spec-compliant

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "avatar": "https://avatars.charhub.io/...",  // Chub-specific
    "extensions": {
      "chub": {
        "id": 4792687,
        "full_path": "creator/card-slug",
        "related_lorebooks": []
      },
      "depth_prompt": { "role": "system", "depth": 4, "prompt": "..." }
    }
  }
}
```

**Import Handling**: No special handling needed, preserves extensions.

### CharacterTavern

**Structure**: Clean V3

```json
{
  "spec": "chara_card_v3",
  "spec_version": "3.0",
  "data": {
    "creation_date": 1764064064277,     // BUG: milliseconds not seconds
    "modification_date": 1764064064277,
    "group_only_greetings": []
  }
}
```

**Import Handling**: Convert timestamps from milliseconds to seconds if > 10000000000.

### ChubAI Legacy

**Structure**: Hybrid V2 (spec at root, fields at root, no data wrapper)

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "name": "...",
  "description": "..."
  // No "data" object!
}
```

**Import Handling**: Wrap fields into `data` object.

## Known Extensions

### Standard Extensions (preserve during import/export)

| Extension | Description | Platforms |
|-----------|-------------|-----------|
| `depth_prompt` | Character Note injection | SillyTavern, Wyvern, Chub |
| `visual_description` | Physical appearance | Wyvern |
| `chub` | Platform metadata | Chub |
| `risuai` | RisuAI metadata | RisuAI |
| `voxta` | Voxta character settings | Voxta exports |
| `tagline` | Short character tagline | Card Architect |

### depth_prompt Structure
```json
{
  "depth_prompt": {
    "prompt": "Character note content",
    "depth": 4,
    "role": "system"  // Optional, Chub adds this
  }
}
```

### visual_description
```json
{
  "visual_description": "Physical description text"
}
```

Maps bidirectionally with Voxta `Description` (appearance) field.

### voxta Extension
```json
{
  "voxta": {
    "id": "uuid",
    "packageId": "uuid",
    "appearance": "Physical description",
    "textToSpeech": [...],
    "chatSettings": {
      "chatStyle": 0,
      "enableThinkingSpeech": false,
      "maxTokens": 200
    },
    "scripts": [...]
  }
}
```

## Import Normalization

The `normalizeCardData()` function in `apps/api/src/routes/import-export.ts` handles:

1. **Wyvern duplication**: Strips root-level duplicate fields
2. **ChubAI hybrid**: Wraps root fields into `data` object
3. **CharacterTavern timestamps**: Converts milliseconds to seconds
4. **Missing V3 fields**: Adds defaults for `group_only_greetings`, `creator`, etc.
5. **character_book cleanup**: Removes null values, normalizes entries
6. **Spec normalization**: `spec: "v2"` → `spec: "chara_card_v2"`
7. **Position fields**: Numeric → string (`0` → `'before_char'`, `1+` → `'after_char'`)

## Key Features

### 1. Dual Format Support (V2/V3)
- **V2/V3 Mode Switcher**: Toggle between character card formats (EditPanel.tsx:151-172)
- **Show V3 Fields**: Optional visibility control for V3-specific fields
- **Field Spec Markers**: Visual badges indicating field compatibility:
  - "Both" - Works in V2 and V3
  - "V2" - V2 format only
  - "V3" - V3 format (required in V3)
  - "V3 Only" - Only available in V3 spec
- **Auto-conversion**: Seamlessly converts data between formats (card-store.ts:336-381)
- **V3-specific fields**:
  - Creator (required)
  - Character Version (required)
  - Tags (required, array)
  - Group Only Greetings (array)

### 2. Editor Modes
- **Edit Mode**: Standard tabbed editing interface
  - Basic Info: Name, description, personality, scenario, avatar
  - Greetings: First message, alternate greetings, group greetings
  - Advanced: System prompt, post-history, examples, creator notes
  - Lorebook: Two-column layout with entry management
- **Focused Mode**: Distraction-free WYSIWYG + raw markdown editing
  - Field selector for all major fields
  - Side-by-side WYSIWYG (Milkdown) and raw markdown (CodeMirror) views
  - Template & snippet support
  - AI assistant integration
- **Preview Mode**: Live markdown rendering with extended syntax
  - Supports: `![alt](url =widthxheight)` sizing syntax
  - Examples: `=100%x100%`, `=400x300`, `=50%`
  - DOMPurify HTML sanitization for XSS protection
- **Diff Mode**: Version comparison and snapshot management

### 3. AI Assistant Integration (LLM)
- **Providers**: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude)
- **Features**:
  - Streaming responses with live diff viewer
  - Token delta tracking
  - Custom instructions
  - Connection testing
  - Stop button for canceling requests
- **Built-in Preset Operations** (8 total):
  - Tighten (reduce wordiness)
  - Convert-structured / convert-prose
  - Enforce-style
  - Generate-alts (alternate greetings)
  - Generate-lore (lorebook entries)
  - Expand / Simplify
- **User-Defined Presets**:
  - Create custom AI operations with name, description, instruction
  - Organized by category: rewrite, format, generate, custom
  - Import/export for sharing
  - Built-in presets are read-only (protected from modification/deletion)
- **Available in**: Edit mode (all text fields), Focused mode
- **Actions**: Replace, Append, Insert
- **Security**: API keys stored in `~/.card-architect/config.json` with 600 permissions, redacted in all responses

### 4. RAG System (Knowledge Bases)
- **Vector embeddings**: Semantic search powered by FastEmbed (BAAI/bge-small-en-v1.5)
- **File-based vector storage**: `~/.card-architect/rag-index/`
- **Document types**:
  - **File uploads**: PDF, JSON, Markdown, HTML, plain text
  - **Free text entry**: Direct text input for notes and documentation
  - **Lorebook import**: Import character lorebooks as searchable knowledge
- **Intelligent chunking**: 1200 char chunks, 200 char overlap
- **Semantic search**: Cosine similarity with 384-dimensional embeddings
- **Multiple knowledge bases**: Tags, descriptions, document management
- **Integration**: Automatically provides context to LLM operations

### 5. Templates & Snippets
- **Templates**: Full field content or multi-field templates
  - Apply modes: Replace, Append, Prepend
  - Field-specific or apply to all fields
- **Snippets**: Small reusable text fragments
  - Quick insertion into any field
- **Supported Fields**:
  - Description, Personality, Scenario
  - First Message, Example Messages
  - System Prompt, Post History Instructions
  - Creator Notes

### 6. Lorebook Editor
- **Two-column layout**:
  - Left: Entry list (300px sidebar)
  - Right: Entry form (selected entry)
- **Settings** (top section):
  - Scan Depth, Token Budget, Recursive Scanning
  - Name, Description
- **Entry Management**:
  - Keys (trigger words)
  - Content (lore text)
  - Position (before_char/after_char), Priority, Insertion Order
  - Probability (0-100%), Depth, Case Sensitivity
  - Selective mode with secondary keys (AND/NOT logic)
  - Constant (always insert)
  - Extensions support

### 7. Version Control (Snapshots)
- **Create snapshots** with optional messages
- **Compare versions** in Diff mode
- **Restore** from any previous version
- **Delete snapshots** with confirmation dialog
- **Snapshot button** integrated into editor tabs row (EditorTabs.tsx)
- **Auto-Snapshot**:
  - Configurable automatic snapshots at intervals (1, 5, 10, 15, or 30 minutes)
  - Settings in General tab of Settings modal
  - Only creates snapshots when card has unsaved changes
  - Auto-snapshots labeled with "[Auto]" prefix
  - Persisted settings via Zustand + localStorage

### 8. Import/Export
- **Import**: JSON, PNG, or CHARX character cards
  - **From File**: Upload from local filesystem (JSON, PNG, CHARX)
  - **From URL**: Import directly from web URLs (PNG, JSON, CHARX)
    - Supports HTTP/HTTPS URLs
    - Auto-detects file type from Content-Type header or file extension
    - Works with direct file links from hosting services
  - Automatic normalization of non-standard spec values
  - Handles legacy numeric position fields
  - Compatible with: CharacterHub, SillyTavern, Agnai, TavernAI, Wyvern, Chub
  - PNG tEXt chunk extraction with multiple key support
- **Export**:
  - JSON (spec-specific based on current mode)
  - PNG (embedded metadata in tEXt chunks)
    - **Critical PNG Fix**: Removes old tEXt chunks before embedding new data
    - Prevents duplicate/stale data when re-exporting edited cards
    - Ensures exports always contain latest edits
  - CHARX (with assets)
  - Voxta (.voxpkg)
- **SillyTavern Push Integration**:
  - Push button in header to send PNG directly to SillyTavern
  - Settings modal for configuring SillyTavern URL and session cookie
  - Auto-save before push to ensure latest edits included
  - Generates PNG on-the-fly (no manual export needed)
- **Click-based dropdown menus** (not hover)

### 9. Character Avatar
- **Upload/replace** character images
- **Preview** in Basic Info tab (192x192px)
- **Automatic PNG conversion**
- **Stored** in database as BLOB

### 10. Card Management
- **Grid view** with visual indicators:
  - Purple badge for alternate greetings
  - Green badge for lorebook entries
- **Bulk operations**: Bulk select and delete (toggle button)
- **CRUD operations**: Create, read, update, delete
- **Auto-save** with debouncing (500ms)
- **Draft recovery** via IndexedDB

### 11. Additional Tools
- **Tokenization**: Real-time token counting per field
  - Approximate BPE/SentencePiece tokenizers
  - Per-field token counts (blue chips)
  - Total token count in header
- **Prompt Simulator**: Test how cards will be assembled by different frontends
  - Profiles: Generic CCv3, Strict CCv3, CCv2-compat
  - Token budget tracking with drop policies
- **Redundancy Killer**: Cross-field duplicate detection (UI disabled, backend available)
- **Lore Trigger Tester**: Test lorebook entry activation (UI disabled, backend available)

## Feature Flags

Optional features that can be enabled in Settings > General:

| Feature | Description |
|---------|-------------|
| Block Editor | Visual block-based character card builder (enabled by default) |
| wwwyzzerdd Mode | AI-assisted character creation wizard |
| ComfyUI Integration | Image generation scaffolding (not connected) |

## wwwyzzerdd - AI Character Wizard

Two-column layout for AI-assisted character creation.

### Features
- **Left Column**: Editable character form (Name, Description, Scenario, First Message, Appearance, Personality)
- **Right Column**: AI chat with JSON output parsing
- **JED Formatting**: Default description format with structured sections
- **Card Type Selection**: CC (personality in description) vs Voxta (personality field used)
- **Image Gen Selection**: Booru tags vs natural language for Appearance field
- **Apply to Card**: Parse JSON from AI responses and populate fields
- **Persistent Chat**: Chat state maintained across tab switches

### Field Notes
- **Personality**: Deprecated for CC cards, only used for Voxta
- **Appearance**: Stored in `extensions.voxta.appearance` or `extensions.visual_description`

### Configuration
Settings > wwwyzzerdd tab:
- Prompt set management (character prompt, lore prompt, personality)
- Import/export prompt sets

### API Endpoints
```
GET    /api/wwwyzzerdd/prompts           # List prompt sets
POST   /api/wwwyzzerdd/prompts           # Create prompt set
PATCH  /api/wwwyzzerdd/prompts/:id       # Update prompt set
DELETE /api/wwwyzzerdd/prompts/:id       # Delete prompt set
GET    /api/wwwyzzerdd/prompts/export/all # Export all prompts
POST   /api/wwwyzzerdd/prompts/import    # Import prompts
POST   /api/wwwyzzerdd/prompts/reset     # Reset to defaults
```

## Block Editor - Visual Card Builder

Block-based visual editor for character card content, inspired by the BeastBox standalone editor.

### Features
- **Hierarchical Blocks**: Unlimited nesting levels with visual indicators
  - Level 1: Blue border
  - Level 2: Purple border
  - Level 3: Pink border
  - Level 4: Amber border
- **Content Babies**: Content blocks within each block
  - **Text Baby**: Free-form text content
  - **Flat List Baby**: Bulleted list items
  - **Flat-Nested List Baby**: Lists with nested sub-lists
- **Drag & Drop**: Reorder blocks and babies via @dnd-kit
- **Field Mapping**: Each block targets a character card field
- **Split Items**: List items can have header/body format with bold toggle
- **Promote/Demote**: Move items between flat and nested lists
- **Templates**: Save and load block structures

### Block Structure
```typescript
interface Block {
  id: string;
  label: string;
  targetField: TargetField;  // description, personality, etc.
  collapsed: boolean;
  babies: Baby[];           // Content blocks
  children: Block[];        // Nested blocks
  level: number;           // Hierarchy depth
}
```

### Toolbar Actions
- **Add Block**: Create new top-level block
- **V2/V3 Toggle**: Switch field options between specs
- **Templates**: Save/load block structures
- **Apply to Card**: Export blocks as markdown to card fields
- **Clear All**: Remove all blocks

### Apply to Card Output
Blocks are converted to markdown when applied:
- Block labels become headings (`#`, `##`, etc. based on depth)
- Text babies become paragraphs
- List items become bullet points (`-`)
- Nested items are indented (`  -`)
- Split items format as `**Header**: Body` when bold

### Implementation
- **Location**: `apps/web/src/modules/block-editor/`
- **Components**:
  - `BlockEditorPanel.tsx` - Main panel with toolbar
  - `BlockComponent.tsx` - Individual block with babies
  - `SortableBaby.tsx` - Sortable baby wrapper
  - `SortableListItem.tsx` - Sortable list item
- **Store**: `store.ts` - Zustand store with full CRUD
- **Types**: `types.ts` - Block, Baby, ListItem definitions

### Feature Flag
Enable in Settings > General > Block Editor

## ELARA VOSS - Name Replacement

Tool for replacing placeholder character names throughout a card.

### Usage
1. Enter the "offending" first/last name to replace
2. Select gender (male, female, femboy, futa)
3. Click "WHO IS ELARA VOSS?" to generate a random name
4. Click "REPLACE" to auto-snapshot and replace all occurrences

### Fields Replaced
- name, description, personality, scenario, first_mes, mes_example
- system_prompt, post_history_instructions, creator_notes
- alternate_greetings array
- character_book entries (content and keys)

### Implementation
- Location: `apps/web/src/features/editor/components/ElaraVossPanel.tsx`
- Name database: `elara_voss.json` (~100 names per gender)

## AI Generation Buttons

Quick AI generation for Tags and Tagline fields in Edit > Basic Info.

### Tags
- Generates 5-10 single-word slugs from description
- Hyphens for compound words (e.g., "sci-fi")
- Merges with existing tags (no duplicates)

### Tagline
- Generates catchy text up to 500 characters
- Stored in `extensions.tagline`

### Configuration
Settings > LLM Presets tab:
- Tags Generation prompt
- Tagline Generation prompt

## API Endpoints

**Base URL (dev):** `http://localhost:3456`

### Cards
```
GET    /api/cards                     # List all cards
GET    /api/cards/:id                 # Get single card
POST   /api/cards                     # Create card
PATCH  /api/cards/:id                 # Update card
DELETE /api/cards/:id                 # Delete card
GET    /api/cards/:id/image           # Get card image
POST   /api/cards/:id/image           # Update card image
GET    /api/cards/:id/thumbnail       # Get 96x96 thumbnail
GET    /api/cards/:id/export          # Export card (json|png|charx|voxta)
GET    /api/cards/:id/assets          # List card assets
PATCH  /api/cards/:id/assets/:assetId/main  # Set main asset
DELETE /api/cards/:id/assets/:assetId       # Delete asset
```

### Versions
```
GET    /api/cards/:id/versions        # List versions
POST   /api/cards/:id/versions        # Create snapshot
POST   /api/cards/:id/versions/:versionId/restore  # Restore version
DELETE /api/cards/:id/versions/:versionId          # Delete snapshot
```

### Import/Export & Tokenization
```
POST   /api/import                    # Import JSON/PNG/CHARX from file upload
POST   /api/import-url                # Import JSON/PNG/CHARX from URL
POST   /api/import-voxta              # Import Voxta package
POST   /api/import-multiple           # Import multiple files at once
POST   /api/convert                   # Convert v2 <-> v3
GET    /api/tokenizers                # List available tokenizer models
POST   /api/tokenize                  # Tokenize fields
```

### SillyTavern Integration
```
GET    /api/settings/sillytavern              # Get SillyTavern settings
PATCH  /api/settings/sillytavern              # Update SillyTavern settings
POST   /api/cards/:id/push-to-sillytavern     # Push PNG to SillyTavern
```

### Templates & Snippets
```
GET    /api/templates                 # List templates
POST   /api/templates                 # Create template
PATCH  /api/templates/:id             # Update template
DELETE /api/templates/:id             # Delete template
GET    /api/templates/export/all      # Export all templates
POST   /api/templates/import          # Import templates
POST   /api/templates/reset           # Reset to defaults
GET    /api/snippets                  # List snippets
POST   /api/snippets                  # Create snippet
PATCH  /api/snippets/:id              # Update snippet
DELETE /api/snippets/:id              # Delete snippet
GET    /api/snippets/export/all       # Export snippets
POST   /api/snippets/import           # Import snippets
POST   /api/snippets/reset            # Reset snippets
```

### Assets
```
POST   /api/assets                    # Upload image
GET    /api/assets/:id                # Get asset
POST   /api/assets/:id/transform      # Crop/resize/convert
```

### LLM Integration
```
GET    /api/llm/settings              # Get LLM settings (API keys redacted)
POST   /api/llm/settings              # Update LLM settings
POST   /api/llm/test-connection       # Test provider connection
POST   /api/llm/invoke                # Direct LLM invocation (streaming/non-streaming)
POST   /api/llm/assist                # High-level AI assist with presets
```

### Presets
```
GET    /api/presets                   # List all presets (built-in + user)
GET    /api/presets/visible           # List visible presets (filtered)
GET    /api/presets/:id               # Get single preset
POST   /api/presets                   # Create user preset
PATCH  /api/presets/:id               # Update user preset
DELETE /api/presets/:id               # Delete user preset (built-in protected)
POST   /api/presets/:id/copy          # Duplicate preset
POST   /api/presets/:id/toggle-hidden # Toggle visibility
GET    /api/presets/export/all        # Export all presets as JSON
POST   /api/presets/import            # Import presets from JSON
```

### RAG (Knowledge Bases)
```
GET    /api/rag/databases             # List RAG knowledge bases
POST   /api/rag/databases             # Create RAG database
GET    /api/rag/databases/:dbId       # Get database details
PATCH  /api/rag/databases/:dbId       # Update database metadata
DELETE /api/rag/databases/:dbId       # Delete database
POST   /api/rag/databases/:dbId/documents      # Upload & index document (file)
POST   /api/rag/databases/:dbId/text           # Add free text entry
POST   /api/rag/databases/:dbId/lorebook       # Import lorebook as knowledge
DELETE /api/rag/databases/:dbId/documents/:sourceId  # Remove document
GET    /api/rag/search                # Search RAG database (semantic)
GET    /api/rag/stats                 # Get RAG statistics
```

### Tools & Utilities
```
POST   /api/prompt-simulator/simulate # Simulate prompt assembly
GET    /api/prompt-simulator/profiles # List simulation profiles
POST   /api/redundancy/analyze        # Find cross-field redundancy
POST   /api/lore-trigger/test         # Test lorebook triggers
```

### ComfyUI (Scaffolding)
```
GET    /api/comfyui/prompts           # List prompts
POST   /api/comfyui/prompts           # Create prompt
PATCH  /api/comfyui/prompts/:id       # Update prompt
DELETE /api/comfyui/prompts/:id       # Delete prompt
GET    /api/comfyui/prompts/export/all # Export prompts
POST   /api/comfyui/prompts/import    # Import prompts
GET    /api/comfyui/workflows         # List workflows
POST   /api/comfyui/workflows         # Create workflow
PATCH  /api/comfyui/workflows/:id     # Update workflow
DELETE /api/comfyui/workflows/:id     # Delete workflow
POST   /api/comfyui/reset             # Reset to defaults
```

### Health Check
```
GET    /health                        # Server status
```

## Database Schema

### Cards Table
```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spec TEXT NOT NULL,        -- 'v2' or 'v3'
  data TEXT NOT NULL,        -- JSON
  tags TEXT,                 -- JSON array
  original_image BLOB,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Versions Table
```sql
CREATE TABLE card_versions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  data TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (card_id) REFERENCES cards(id)
);
```

### LLM Presets Table
```sql
CREATE TABLE llm_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  instruction TEXT NOT NULL,
  category TEXT NOT NULL,      -- 'rewrite', 'format', 'generate', 'custom'
  is_built_in INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**Built-in Presets** (seeded on first run):
- `tighten` - Rewrite text to be more concise
- `convert-structured` - Convert prose to structured bullet points
- `convert-prose` - Convert structured text to flowing prose
- `enforce-style` - Make text match a specific style guide
- `generate-alts` - Generate alternate greetings
- `generate-lore` - Generate lorebook entries
- `expand` - Expand and elaborate on text
- `simplify` - Simplify complex language

**Protection:** Built-in presets have `is_built_in = 1` and return 403 errors on modification/deletion attempts.

## State Management (Zustand)

### CardStore (apps/web/src/store/card-store.ts)
- **currentCard**: Active card being edited
- **isDirty**: Unsaved changes flag
- **isSaving**: Save operation in progress
- **activeTab**: Current editor tab
- **specMode**: 'v2' | 'v3' - Current spec for editing/export
- **showV3Fields**: Toggle V3-specific field visibility
- **tokenCounts**: Per-field token counts
- **Actions**:
  - setCurrentCard, updateCardData, updateCardMeta
  - saveCard, loadCard, createNewCard
  - importCard, exportCard
  - createSnapshot, updateTokenCounts
  - setSpecMode, toggleV3Fields

### LLM Store (apps/web/src/store/llm-store.ts)
- **provider**: Selected LLM provider
- **model**: Selected model
- **temperature**, **maxTokens**: Generation parameters
- **ragDatabases**: Available RAG knowledge bases
- **Actions**: setProvider, setModel, updateSettings, loadRAGDatabases

### Settings Store (apps/web/src/store/settings-store.ts)
- **autoSnapshot.enabled**: Auto-snapshot toggle
- **autoSnapshot.intervalMinutes**: Interval (1, 5, 10, 15, 30)
- **featureFlags**: wwwyzzerdd, comfyui enabled states
- Persisted to localStorage as `card-architect-settings`

### UI Store (apps/web/src/store/ui-store.ts)
- **activeTab**: Current editor tab
- **modals**: Modal visibility states
- Ephemeral UI state management

## File Locations Reference

### Key Frontend Components (apps/web/src/)

**Features:**
- `features/dashboard/CardGrid.tsx` - Card list view with bulk operations
- `features/editor/CardEditor.tsx` - Main editor container
- `features/editor/components/` - Editor sub-components:
  - `EditPanel.tsx`, `FocusedEditor.tsx`
  - `PreviewPanel.tsx`, `DiffPanel.tsx`
  - `LorebookEditor.tsx`, `AssetsPanel.tsx`
  - `EditorTabs.tsx`, `FieldEditor.tsx`
  - `LLMAssistSidebar.tsx`, `TemplateSnippetPanel.tsx`
  - `ElaraVossPanel.tsx`, `TagInput.tsx`
  - `TemplateEditor.tsx`, `SnippetEditor.tsx`
- `features/wwwyzzerdd/WwwyzzerddTab.tsx` - AI character wizard
- `features/comfyui/ComfyUITab.tsx` - ComfyUI integration (scaffolding)

**Shared Components:**
- `components/shared/Header.tsx` - Top navigation bar
- `components/shared/SettingsModal.tsx` - Settings UI (General, Providers, RAG, wwwyzzerdd, etc.)
- `components/shared/Sidebar.tsx` - Navigation sidebar
- `components/ui/` - Reusable UI elements:
  - `SearchableSelect.tsx`, `SnapshotButton.tsx`
  - `DiffViewer.tsx`, `SideBySideDiffViewer.tsx`
  - `ErrorBoundary.tsx`, `JsonPanel.tsx`

**Hooks:**
- `hooks/useAutoSnapshot.ts` - Auto-snapshot timer hook

**Stores:**
- `store/card-store.ts` - Card data and CRUD operations
- `store/ui-store.ts` - UI state (tabs, visibility)
- `store/settings-store.ts` - App settings (auto-snapshot, feature flags)
- `store/llm-store.ts` - LLM provider settings
- `store/token-store.ts` - Token counting
- `store/template-store.ts` - Templates and snippets

**Core:**
- `App.tsx` - Main application container with Routes
- `lib/api.ts` - API client

### Key Backend Files (apps/api/src/)

**Core:**
- `app.ts` - Fastify app builder
- `index.ts` - Server entry point

**Routes (apps/api/src/routes/):**
- `cards.ts` - Card CRUD operations
- `import-export.ts` - Card import/export with format normalization
- `tokenize.ts` - Token counting endpoints
- `llm.ts` - LLM provider invocation and settings management
- `presets.ts` - User preset CRUD operations with built-in protection
- `rag.ts` - RAG knowledge base and document operations
- `templates.ts` - Template and snippet management
- `wwwyzzerdd.ts` - AI character wizard prompts
- `comfyui.ts` - ComfyUI workflows and prompts (scaffolding)
- `prompt-simulator.ts` - Prompt assembly simulation routes
- `redundancy.ts` - Redundancy detection routes
- `lore-trigger.ts` - Lore trigger testing routes
- `sillytavern.ts` - SillyTavern push integration
- `settings.ts` - Settings persistence
- `assets.ts` - Asset management

**Services (apps/api/src/services/):**
- `prompt-simulator.ts` - Prompt assembly simulation logic
- `redundancy-killer.ts` - Cross-field duplicate detection
- `lore-trigger-tester.ts` - Lorebook trigger testing

**Utilities (apps/api/src/utils/):**
- `settings.ts` - Secure settings storage and retrieval
- `rag-store.ts` - File-based RAG vector storage
- `llm-prompts.ts` - LLM prompt construction and presets
- `tokenizer.ts` - Token counting utilities
- `diff.ts` - Text diff computation
- `png.ts` - PNG tEXt chunk extraction and embedding

**Database (apps/api/src/db/):**
- `repository.ts` - Database operations (cards, versions, presets, assets)
- `schema.ts` - SQLite table definitions
- `migrations.ts` - Versioned database migrations

**Providers (apps/api/src/providers/):**
- `openai.ts` - OpenAI Responses API and Chat Completions API
- `anthropic.ts` - Anthropic Messages API (Claude)

### Shared Packages
- `packages/schemas/src/` - TypeScript types and Zod validation
- `packages/utils/src/` - Binary, base64, ZIP utilities
- `packages/png/src/` - PNG chunk operations
- `packages/charx/src/` - CHARX format handler
- `packages/voxta/src/` - Voxta format handler
- `packages/tokenizers/` - Tokenizer adapters (GPT-2-like, LLaMA-like)

## Design System

### Colors (Tailwind)
- `dark-bg`: #0f172a (slate-900)
- `dark-surface`: #1e293b (slate-800)
- `dark-border`: #334155 (slate-700)
- `dark-text`: #f1f5f9 (slate-100)
- `dark-muted`: #94a3b8 (slate-400)

### Component Classes
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.input-group` - Form field container
- `.label` - Form label
- `.chip` - Small badge/tag
- `.card` - Card container

## Development Workflow

### Local Development Setup

```bash
# Prerequisites: Node.js 20+, npm 10+

# Install dependencies
npm install

# Start both API and web servers concurrently
npm run dev

# Or run separately:
npm run dev:api    # API on http://localhost:3456
npm run dev:web    # Web UI on http://localhost:5173
```

### Build Commands

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:api
npm run build:web
npm run build:schemas

# Build packages individually
npm run build -w packages/schemas
npm run build -w packages/utils
npm run build -w packages/png
npm run build -w packages/charx
npm run build -w packages/voxta

# Lint all code
npm run lint

# Type check
npm run type-check

# Clean all build artifacts and dependencies
npm run clean
```

### Testing

```bash
cd apps/api

# Run tests
npm test           # Run once
npm run test:watch # Watch mode
npm run test:ui    # UI mode
```

**Test Coverage:**
- Card CRUD operations
- V2 and V3 validation
- Import/Export (JSON, PNG)
- Tokenization
- Lorebook validation
- Alternate greetings

**Test Files:**
- `apps/api/src/__tests__/api-endpoints.test.ts` - API integration tests
- `apps/api/src/__tests__/card-validation.test.ts` - Schema validation tests

### Docker Deployment

```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Access:
# Web UI: http://localhost:8765
# API: http://localhost:3456

# Standalone container
docker build -f docker/standalone.Dockerfile -t card-architect .
docker run -p 3456:3456 -p 8765:8765 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/storage:/app/storage \
  card-architect
```

## Configuration Files

### Configuration
- `package.json` - Root workspace configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration
- `docker-compose.yml` - Docker service definitions
- `apps/api/.env` - API environment variables (create if needed)
- `~/.card-architect/config.json` - LLM settings and provider configs (600 permissions)
- `~/.card-architect/rag-index/` - RAG knowledge base storage directory
- `apps/api/data/settings/presets/wwwyzzerdd.json` - Default wwwyzzerdd prompt sets

### Documentation
- `docs/CLAUDE.md` - This file - technical context
- `docs/ROADMAP.md` - Development roadmap
- `README.md` - User-facing documentation
- `CONTRIBUTING.md` - Contribution guidelines

## Troubleshooting & Common Issues

### PNG Import Failures

**Problem:** Cards imported from other tools fail validation with errors like:
- "must be equal to one of the allowed values" for position fields
- "must have required property" errors for wrapped formats

**Solution:** The import system now automatically normalizes:
- Non-standard spec values (`spec: "v2"` → `spec: "chara_card_v2"`)
- Numeric position fields in lorebook entries (0 → 'before_char', 1+ → 'after_char')
- Missing `extensions` fields in lorebook entries
- Null character_book values
- Platform-specific duplicates (Wyvern, ChubAI)
- Timestamp formats (CharacterTavern milliseconds)

**Location:** `apps/api/src/routes/import-export.ts` (normalizeLorebookEntries function)

### Markdown Images Not Displaying

**Problem:** Extended markdown syntax like `![alt](url =100%x100%)` doesn't render images

**Solution:** The preview panel now includes a custom marked extension supporting:
- Standard syntax: `![alt](url)`
- Sized syntax: `![alt](url =widthxheight)`
- Examples: `=100%x100%`, `=400x300`, `=50%`
- Also supports angled brackets: `![alt](<url> =100%x100%)`

**Alternative:** Use direct HTML in markdown fields:
```html
<img src="url" width="100%" height="100%">
```

**Location:** `apps/web/src/features/editor/components/PreviewPanel.tsx` (imageSizeExtension)

### Card Format Compatibility

The system is compatible with cards exported from:
- **CharacterHub**: Wrapped v2/v3 formats with various spec values
- **SillyTavern**: Legacy formats with numeric position fields
- **Agnai**: Standard wrapped formats
- **TavernAI**: Legacy unwrapped v2 format
- **Wyvern**: Hybrid format with field duplication
- **Chub.ai**: Standard V2 with platform extensions
- **CharacterTavern**: V3 with millisecond timestamps
- **Custom tools**: Most non-standard implementations

All formats are normalized during import to match CCv2/CCv3 specifications.

## Security Notes

### Current Implementation

- **API Key Security**: Stored with 600 permissions (owner read/write only) in `~/.card-architect/config.json`
- **Key Redaction**: API keys redacted as `***REDACTED***` in all API responses
- **No Logging**: API keys never logged to console or files
- **Smart Merging**: Settings updates preserve existing secrets when redacted values sent
- **HTML Sanitization**: DOMPurify for markdown preview (XSS protection)
- **Input Validation**: Backend validates all user inputs before processing

### Recommendations for Production

- Implement HTTPS enforcement
- Add CSRF token validation
- Rate limiting per IP address (especially for LLM endpoints)
- Audit logging for provider/settings changes
- Add session timeouts
- Consider API key rotation mechanism
- Add Content Security Policy headers
- Add request/response size limits
- Implement token usage tracking and quota management

## Performance Considerations

- Frontend panels use debounced API calls (500ms) to reduce server load
- Token counting uses approximate tokenizers for speed
- Large cards (>10k tokens) may need optimization
- Consider caching redundancy analysis results for repeated scans
- IndexedDB for local draft storage reduces API calls
- Thumbnail endpoint (96x96) for efficient avatar display in grid view

## Known Limitations

### Features Disabled in UI
- **Redundancy Detection**: Backend implemented, UI disabled (available for future use)
- **Lore Trigger Tester**: Backend implemented, UI disabled (available for future use)

### Incomplete Features
- **ComfyUI Integration**: Scaffolding only, not connected to actual ComfyUI server

### Technical Limitations
- **No Rate Limiting**: LLM usage not tracked; could burn through API credits
- **Streaming Error Recovery**: Broken SSE streams not gracefully handled
- **Settings Validation**: No JSON schema validation on settings deserialization
- **No Multi-user Support**: Single-user application design
- **No Cloud Sync**: Local IndexedDB and SQLite only

## Useful Context

### Character Card Use Case
Character cards are JSON documents that define AI chatbot personalities. They're used in applications like:
- SillyTavern
- Kobold AI
- Text Generation WebUI
- Oobabooga
- Voxta

Cards can be embedded in PNG images as metadata (tEXt chunks), making them shareable as images while carrying the full character definition.

### Why This Tool Exists
- Most character card editors are basic text editors
- Token counting is often inaccurate or missing
- No tools for detecting redundancy across fields
- Limited validation and linting
- No version control for iterative development
- Difficult to test how cards will behave in different frontends

Card Architect solves these problems with professional tooling for character card creation.

## References

- CCv2 Spec: https://github.com/malfoyslastname/character-card-spec-v2
- CCv3 Spec: https://github.com/kwaroran/character-card-spec-v3

## License

MIT License - See README.md for full text
