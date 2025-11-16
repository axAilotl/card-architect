# Card Architect Project Context

## Project Overview
Card Architect is a comprehensive web-based tool for creating and editing AI character cards in both V2 and V3 formats. It provides advanced features for character development, including AI-assisted content generation, templates, lorebooks, and version control.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Fastify (Node.js)
- **Database**: Better-sqlite3
- **Editor**: Milkdown (WYSIWYG) + CodeMirror (raw markdown)
- **State Management**: Zustand
- **Styling**: Tailwind CSS (custom dark theme)
- **Testing**: Vitest

## Project Structure
```
card_doctor/
├── apps/
│   ├── api/                 # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── db/          # Database & repository
│   │   │   ├── utils/       # Utilities (PNG handling, prompts, RAG)
│   │   │   └── __tests__/   # Vitest tests
│   │   └── package.json
│   └── web/                 # React frontend
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── store/       # Zustand state
│       │   ├── lib/         # API client, IndexedDB
│       │   └── styles/      # CSS
│       └── package.json
└── packages/
    ├── schemas/             # Shared types & validation
    └── tokenizers/          # Token counting

```

## Key Features

### 1. Dual Format Support (V2/V3)
- **V2/V3 Mode Switcher**: Toggle between character card formats
- **Show V3 Fields**: Optional visibility control for V3-specific fields
- **Field Spec Markers**: Visual badges indicating field compatibility:
  - "Both" - Works in V2 and V3
  - "V2" - V2 format only
  - "V3" - V3 format (required in V3)
  - "V3 Only" - Only available in V3 spec
- **Auto-conversion**: Seamlessly converts data between formats
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
  - Side-by-side WYSIWYG and raw markdown views
  - Template & snippet support
  - AI assistant integration
- **Preview Mode**: Live markdown rendering
- **Diff Mode**: Version comparison and snapshot management

### 3. AI Assistant Integration
- **LLM-powered content generation**:
  - Expand/Summarize
  - Improve Writing
  - Change Tone
  - Custom prompts
- **Available in**:
  - Edit mode (all text fields)
  - Focused mode (all fields)
- **Actions**: Replace, Append, Insert
- **Configurable**: Model selection, temperature, max tokens

### 4. Templates & Snippets
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

### 5. Lorebook Editor
- **Two-column layout**:
  - Left: Entry list (300px sidebar)
  - Right: Entry form (selected entry)
- **Settings** (top section):
  - Scan Depth, Token Budget, Recursive Scanning
  - Name, Description
- **Entry Management**:
  - Keys (trigger words)
  - Content (lore text)
  - Position, Priority, Insertion Order
  - Probability, Depth, Case Sensitivity
  - Selective mode with secondary keys
  - Extensions support

### 6. Version Control (Snapshots)
- **Create snapshots** with optional messages
- **Compare versions** in Diff mode
- **Restore** from any previous version
- **Snapshot button** integrated into editor tabs row

### 7. Import/Export
- **Import**: JSON or PNG character cards
- **Export**:
  - JSON (spec-specific based on current mode)
  - PNG (embedded metadata)
- **Click-based dropdown** (not hover)

### 8. Character Avatar
- **Upload/replace** character images
- **Preview** in Basic Info tab (192x192px)
- **Automatic PNG conversion**
- **Stored** in database

### 9. Card Management
- **Grid view** with visual indicators:
  - Purple badge (💬) for alternate greetings
  - Green badge (📚) for lorebook entries
- **CRUD operations**: Create, read, update, delete
- **Auto-save** with debouncing
- **Draft recovery** via IndexedDB

### 10. Additional Tools
- **Tokenization**: Real-time token counting per field
- **Redundancy Detection**: (Disabled - available for future use)
- **Lore Trigger Tester**: (Disabled - available for future use)
- **Prompt Simulator**: Test character responses
- **RAG System**: Context-aware generation

## API Endpoints

### Cards
- `GET /api/cards` - List all cards
- `GET /api/cards/:id` - Get single card
- `POST /api/cards` - Create card
- `PATCH /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `GET /api/cards/:id/image` - Get card image
- `POST /api/cards/:id/image` - Update card image
- `GET /api/cards/:id/export` - Export card (JSON/PNG)

### Versions
- `GET /api/cards/:id/versions` - List versions
- `POST /api/cards/:id/versions` - Create snapshot
- `POST /api/cards/:id/versions/:versionId/restore` - Restore version

### Other
- `POST /api/import` - Import card from file
- `POST /api/tokenize` - Tokenize text/fields
- `POST /api/llm/*` - LLM generation endpoints
- `POST /api/rag/*` - RAG endpoints

## Database Schema

### Cards Table
```sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spec TEXT NOT NULL, -- 'v2' or 'v3'
  data TEXT NOT NULL, -- JSON
  tags TEXT, -- JSON array
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

## State Management (Zustand)

### CardStore
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

### LLM Store
- **provider**: Selected LLM provider
- **model**: Selected model
- **temperature**, **maxTokens**: Generation parameters
- **Actions**: setProvider, setModel, updateSettings

## Recent Implementation Details

### New Card Button Fix
- Made `createNewCard()` async
- Immediately saves to API to get real ID
- Prevents navigation to cards with empty IDs

### V2/V3 Mode Switcher
- Location: `apps/web/src/components/EditPanel.tsx:151-172`
- State: `apps/web/src/store/card-store.ts:25-26, 336-381`
- Features:
  - Toggle buttons in editor tab header
  - Automatic data conversion on switch
  - Field visibility control
  - Spec markers on all fields

### Snapshot Button Repositioning
- Moved from floating (`App.tsx`) to tabs row (`EditorTabs.tsx`)
- Right-aligned in tab navigation
- Popup positioned below button
- No longer blocks other UI elements

### Export Dropdown Fix
- Changed from hover-based to click-based
- State management for menu visibility
- Click-outside-to-close functionality
- Auto-close on option selection

### Template Button Additions
- Added to: system_prompt, post_history_instructions, creator_notes
- Updated FocusField type in schemas
- Template panel supports all major text fields

## Testing

### Test Suites
- `apps/api/src/__tests__/api-endpoints.test.ts` - API integration tests
- `apps/api/src/__tests__/card-validation.test.ts` - Schema validation tests

### Running Tests
```bash
cd apps/api
npm test           # Run once
npm run test:watch # Watch mode
npm run test:ui    # UI mode
```

### Test Coverage
- Card CRUD operations
- V2 and V3 validation
- Import/Export (JSON, PNG)
- Tokenization
- Lorebook validation
- Alternate greetings

## Development Commands

### Frontend
```bash
cd apps/web
npm run dev        # Start dev server (Vite)
npm run build      # Build for production
npm run preview    # Preview production build
```

### Backend
```bash
cd apps/api
npm run dev        # Start dev server (tsx watch)
npm run build      # Compile TypeScript
npm start          # Run production build
npm test           # Run tests
```

## File Locations Reference

### Key Components
- `apps/web/src/components/CardEditor.tsx` - Main editor container
- `apps/web/src/components/EditorTabs.tsx` - Tab navigation + snapshot
- `apps/web/src/components/EditPanel.tsx` - Standard edit mode
- `apps/web/src/components/FocusedEditor.tsx` - Focused mode
- `apps/web/src/components/LorebookEditor.tsx` - Lorebook management
- `apps/web/src/components/FieldEditor.tsx` - Reusable field component
- `apps/web/src/components/LLMAssistSidebar.tsx` - AI assistant
- `apps/web/src/components/TemplateSnippetPanel.tsx` - Templates/snippets
- `apps/web/src/components/Header.tsx` - Top navigation bar
- `apps/web/src/components/CardGrid.tsx` - Card list view

### Key Backend Files
- `apps/api/src/app.ts` - Fastify app builder
- `apps/api/src/index.ts` - Server entry point
- `apps/api/src/routes/cards.ts` - Card CRUD
- `apps/api/src/routes/import-export.ts` - Import/export + images
- `apps/api/src/db/repository.ts` - Database operations
- `apps/api/src/utils/png.ts` - PNG metadata handling

### Shared Packages
- `packages/schemas/src/types.ts` - TypeScript types
- `packages/schemas/src/schemas.ts` - JSON schemas
- `packages/schemas/src/validator.ts` - Validation logic

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

## Known Limitations
- Redundancy detection disabled (feature exists but not active)
- Lore trigger tester disabled (feature exists but not active)
- No multi-user support
- No cloud sync (local IndexedDB only)

## Future Considerations
- Re-enable redundancy detection panel
- Re-enable lore trigger tester panel
- Add collaboration features
- Cloud storage integration
- Mobile responsive improvements
- Batch operations on multiple cards
