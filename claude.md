# Card Architect - Claude Guide

## Project Overview

**Card Architect** (internally called "card_doctor") is a modern, self-hostable character card editor for CCv2 (Character Card v2) and CCv3 (Character Card v3) formats. It's designed as a single-user application with always-saving drafts, version history, and accurate token estimation for AI character cards.

## Purpose

This tool helps creators build, edit, and maintain AI character cards with features like:
- Real-time token counting per field
- Lorebook (character book) editing with full CCv3 support
- Version control and snapshot management
- Import/Export in JSON and PNG formats (with embedded metadata)
- Advanced validation and linting
- Prompt simulation for different frontend profiles
- Redundancy detection and elimination
- Lore trigger testing

## Architecture

### Monorepo Structure

```
/apps/api              # Fastify backend (Node 20 + SQLite)
/apps/web              # React frontend (Vite + TypeScript + Tailwind)
/packages/schemas      # Shared TypeScript types + JSON schemas
/packages/tokenizers   # HuggingFace tokenizer adapters
/packages/charx        # CHARX support (stub)
/packages/plugins      # Plugin SDK (stub)
```

### Tech Stack

**Backend (apps/api):**
- **Fastify** - Fast, low-overhead web framework
- **SQLite** (better-sqlite3) - Local database for cards storage
- **Sharp** - Image processing (crop, resize, convert)
- **pngjs** - PNG tEXt chunk handling for embedded card metadata
- **Ajv** - JSON schema validation

**Frontend (apps/web):**
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **IndexedDB** (idb) - Local persistence with background sync
- **marked** - Markdown to HTML rendering
- **DOMPurify** - HTML sanitization for security

### API Architecture

**Base URL (dev):** `http://localhost:3456`

**Key Endpoints:**
```
GET    /cards                     # List all cards
GET    /cards/:id                 # Get single card
POST   /cards                     # Create card
PATCH  /cards/:id                 # Update card
DELETE /cards/:id                 # Delete card
GET    /cards/:id/export          # Export (json|png)

GET    /cards/:id/versions        # List versions
POST   /cards/:id/versions        # Create snapshot
POST   /cards/:id/versions/:ver/restore  # Restore version

GET    /tokenizers                # List available tokenizer models
POST   /tokenize                  # Tokenize fields

POST   /import                    # Import JSON/PNG
POST   /convert                   # Convert v2 ↔ v3

POST   /assets                    # Upload image
GET    /assets/:id                # Get asset
POST   /assets/:id/transform      # Crop/resize/convert

POST   /prompt-simulator/simulate # Simulate prompt assembly
POST   /redundancy/analyze        # Find cross-field redundancy
POST   /lore-trigger/test         # Test lorebook triggers

GET    /llm/settings              # Get LLM settings (API keys redacted)
POST   /llm/settings              # Update LLM settings
POST   /llm/test-connection       # Test provider connection
POST   /llm/invoke                # Direct LLM invocation (streaming/non-streaming)
POST   /llm/assist                # High-level AI assist with presets

GET    /rag/databases             # List RAG knowledge bases
POST   /rag/databases             # Create RAG database
GET    /rag/databases/:dbId       # Get database details
PATCH  /rag/databases/:dbId       # Update database metadata
DELETE /rag/databases/:dbId       # Delete database
POST   /rag/databases/:dbId/documents  # Upload & index document
DELETE /rag/databases/:dbId/documents/:sourceId  # Remove document
GET    /rag/search                # Search RAG database
GET    /rag/stats                 # Get RAG statistics
```

## Key Features & Implementation Status

### ✅ Completed Features

1. **LLM Integration** - AI-powered field editing with multiple providers
   - Backend: `apps/api/src/routes/llm.ts`, `apps/api/src/providers/`
   - Frontend: `apps/web/src/components/LLMAssistSidebar.tsx`
   - Providers: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude)
   - Features: streaming responses, custom instructions, preset operations
   - Presets: tighten, convert-structured, convert-prose, enforce-style, generate-alts, generate-lore
   - Secure API key storage with redaction pattern
   - Real-time diff viewer with token delta tracking
   - Connection testing before use

2. **RAG System** - Knowledge base integration for AI assistance
   - Backend: `apps/api/src/routes/rag.ts`, `apps/api/src/utils/rag-store.ts`
   - Frontend: Settings modal with Knowledge tab
   - File-based vector storage in `~/.card-architect/rag-index/`
   - Document types: PDF, JSON, Markdown, HTML, plain text
   - Intelligent chunking (1200 char chunks, 200 char overlap)
   - Semantic search with token-aware snippet retrieval
   - Multiple knowledge bases with tags and descriptions
   - Document management: upload, index, remove, view

3. **Settings System** - Secure configuration management
   - Backend: `apps/api/src/utils/settings.ts`
   - Frontend: `apps/web/src/components/SettingsModal.tsx`
   - Storage: `~/.card-architect/config.json` with 600 permissions
   - API key redaction in responses (never logged)
   - Smart merging preserves existing secrets
   - Provider configuration with connection testing
   - RAG database management interface

4. **Prompt Simulator** - Test how cards will be assembled by different frontends
   - Backend: `apps/api/src/services/prompt-simulator.ts`
   - Frontend: `apps/web/src/components/PromptSimulatorPanel.tsx`
   - Profiles: Generic CCv3, Strict CCv3, CCv2-compat
   - Token budget tracking with drop policies

5. **Redundancy Killer** - Cross-field duplicate detection
   - Backend: `apps/api/src/services/redundancy-killer.ts`
   - Frontend: `apps/web/src/components/RedundancyPanel.tsx`
   - Detects: exact duplicates, semantic overlap, repeated phrases
   - Shows token savings and confidence scores

6. **Lore Trigger Tester** - Test lorebook entry activation
   - Backend: `apps/api/src/services/lore-trigger-tester.ts`
   - Frontend: `apps/web/src/components/LoreTriggerPanel.tsx`
   - Supports: AND/NOT logic, regex patterns, case sensitivity
   - Real-time phrase testing with preview

7. **Full CCv2/CCv3 Support** - Complete spec compliance
8. **Token Counting** - Accurate per-field and total token counts
9. **Version History** - Manual snapshots with restore capability
10. **Import/Export** - JSON and PNG (with tEXt chunk embedding)
   - Backend: `apps/api/src/routes/import-export.ts`
   - Automatic normalization of non-standard spec values
   - Handles legacy numeric position fields in lorebook entries
   - Compatible with cards from CharacterHub, SillyTavern, and other editors
   - PNG tEXt chunk extraction with multiple key support
11. **Asset Management** - Image upload, crop, resize, convert
12. **Dark Mode** - Modern, accessible UI
13. **Markdown Rendering** - Enhanced markdown preview with extended syntax
   - Frontend: `apps/web/src/components/PreviewPanel.tsx`
   - Supports standard markdown (headings, lists, links, images, etc.)
   - Extended image sizing syntax: `![alt](url =widthxheight)`
   - Examples: `=100%x100%`, `=400x300`, `=50%`
   - HTML sanitization via DOMPurify for security

### 🚧 Planned Features

- User-defined LLM presets (save custom operations)
- Vector embeddings for RAG (currently uses keyword matching)
- Rate limiting and quota management for LLM usage
- Style Guard (format enforcement)
- Alt-Greeting Workbench (variant generation)
- Enhanced version timeline with field-aware diff
- PNG export verifier (import works, export needs completion)
- Command Palette (Ctrl/Cmd+K)
- Keyboard-first editing
- Health checks and backup system

See `IMPLEMENTATION_STATUS.md` for detailed status.

### ⚠️ Known Limitations

- **RAG Search**: Uses keyword matching instead of semantic embeddings (acceptable for MVP)
- **No Rate Limiting**: LLM usage not tracked; could burn through API credits
- **No Tests**: Test suite not yet implemented
- **Streaming Error Recovery**: Broken SSE streams not gracefully handled
- **Settings Validation**: No JSON schema validation on settings deserialization

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

# Lint all code
npm run lint

# Type check
npm run type-check

# Clean all build artifacts and dependencies
npm run clean
```

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

## Important Files & Directories

### Configuration
- `package.json` - Root workspace configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration
- `docker-compose.yml` - Docker service definitions
- `apps/api/.env` - API environment variables (create if needed)
- `~/.card-architect/config.json` - LLM settings and provider configs (600 permissions)
- `~/.card-architect/rag-index/` - RAG knowledge base storage directory

### Documentation
- `README.md` - User-facing documentation
- `IMPLEMENTATION_STATUS.md` - Feature status and roadmap
- `LLM_ASSIST_V2_DOCUMENTATION.md` - LLM integration docs
- `CONTRIBUTING.md` - Contribution guidelines

### Backend Services (apps/api/src/)
**Routes (apps/api/src/routes/):**
- `import-export.ts` - Card import/export with format normalization
- `llm.ts` - LLM provider invocation and settings management
- `rag.ts` - RAG knowledge base and document operations
- `prompt-simulator.ts` - Prompt assembly simulation routes
- `redundancy.ts` - Redundancy detection routes
- `lore-trigger.ts` - Lore trigger testing routes
- `cards.ts` - Card CRUD operations
- `tokenize.ts` - Token counting endpoints

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

**Providers (apps/api/src/providers/):**
- `openai.ts` - OpenAI Responses API and Chat Completions API
- `anthropic.ts` - Anthropic Messages API (Claude)

### Frontend Components (apps/web/src/components/)
- `CardEditor.tsx` - Main card editing interface
- `LorebookEditor.tsx` - Lorebook entry management
- `LLMAssistSidebar.tsx` - AI-powered field editing sidebar
- `SettingsModal.tsx` - Settings management UI (Providers + RAG)
- `PromptSimulatorPanel.tsx` - Prompt simulation UI
- `RedundancyPanel.tsx` - Redundancy detection UI
- `LoreTriggerPanel.tsx` - Lore trigger testing UI
- `DiffPanel.tsx` - Version history and diff view
- `DiffViewer.tsx` - Live diff visualization component
- `FocusedEditor.tsx` - Dedicated full-screen editor mode
- `EditPanel.tsx` - Field editing panel with AI integration
- `EditorTabs.tsx` - Tab navigation for editor panels

### Frontend State (apps/web/src/store/)
- `card-store.ts` - Card state, field edits, versions
- `llm-store.ts` - LLM settings, providers, RAG databases

### Shared Packages
- `packages/schemas/` - TypeScript types and JSON schemas for CCv2/CCv3
- `packages/tokenizers/` - Tokenizer adapters (GPT-2-like, LLaMA-like)

## Working with Character Cards

### Card Formats

**CCv2** - Character Card v2 specification
- Basic fields: name, description, personality, scenario, first_mes
- Extensions for lorebooks, alternate greetings

**CCv3** - Character Card v3 specification (superset of v2)
- All CCv2 fields plus enhanced lorebook
- Better structured character books with priority, position, logic

### Token Counting
- Uses approximate BPE/SentencePiece tokenizers
- Per-field token counts displayed as blue chips
- Total token count in header
- Useful for staying within model context limits

### Lorebook Structure
Each lorebook entry supports:
- **Keywords** - Primary trigger words (comma-separated)
- **Secondary Keywords** - For selective matching
- **Content** - The lorebook entry text
- **Priority** - Insertion priority (higher = inserted first)
- **Insertion Order** - Order among same-priority entries
- **Position** - Before or after character definition
- **Probability** - 0-100% chance of insertion
- **Selective Logic** - AND (all match) or NOT (none match)
- **Constant** - Always insert regardless of triggers
- **Case Sensitive** - Match keywords with exact case

## Validation System

The system performs two types of validation:

1. **Schema Validation** - Ensures structure matches CCv2/CCv3 specs
2. **Semantic Validation** - Checks for:
   - Empty required fields
   - Placeholder text ({{char}}, {{user}})
   - Redundant information across fields
   - Invalid lorebook entries
   - Size warnings (2MB JSON, 2-4MB PNG)

Validation errors appear inline with severity levels (error, warning, info).

## Using LLM Features

### Setting Up LLM Providers

1. **Open Settings Modal** - Click the ⚙️ icon in the header
2. **Add Provider** - In the Providers tab, click "Add Provider"
3. **Configure Provider:**
   - **Label**: Friendly name (e.g., "My GPT-4")
   - **Type**: `openai` or `anthropic`
   - **Model**: Model name (e.g., `gpt-4`, `claude-3-5-sonnet-20241022`)
   - **API Key**: Your API key from the provider
   - **Base URL**: Custom endpoint (optional, for proxies)
4. **Test Connection** - Click "Test" to verify configuration
5. **Save** - Settings are saved to `~/.card-architect/config.json`

**Security Note:** API keys are stored with 600 permissions (owner read/write only) and never logged.

### Using AI Assist

1. **Open Field Editor** - Edit any card field
2. **Click AI Button** - Opens LLM Assist sidebar
3. **Select Provider** - Choose configured provider
4. **Choose Operation:**
   - **Quick Presets**: tighten, convert-structured, convert-prose, enforce-style, generate-alts, generate-lore
   - **Custom Instruction**: Write your own editing instruction
5. **Optional: Enable RAG** - Select knowledge base for context
6. **Run** - Streams result with live diff viewer
7. **Apply** - Choose Replace or Append to apply changes

### Setting Up RAG Knowledge Bases

1. **Open Settings Modal** - ⚙️ icon → Knowledge tab
2. **Create Database** - Click "Create Knowledge Base"
   - **Label**: Name (e.g., "Character Writing Guide")
   - **Description**: What it contains
   - **Tags**: Searchable tags
3. **Upload Documents:**
   - Supports: PDF, JSON, Markdown, HTML, plain text
   - Documents are chunked (1200 chars, 200 overlap)
   - Indexed with token counting
4. **Use in AI Assist** - Select database when using LLM features
   - RAG searches for relevant snippets
   - Snippets added to LLM context automatically

**Storage Location:** `~/.card-architect/rag-index/`

## Common Tasks

### Adding a New API Endpoint
1. Create service in `apps/api/src/services/`
2. Create route in `apps/api/src/routes/`
3. Register route in `apps/api/src/index.ts`
4. Update TypeScript types if needed

### Adding a New Frontend Component
1. Create component in `apps/web/src/components/`
2. Import and use in parent component
3. Connect to Zustand store if state is needed
4. Add API calls using fetch with proper error handling

### Adding a New Validation Rule
1. Update schema in `packages/schemas/`
2. Add validation logic in `apps/api/src/services/validation.service.ts`
3. Update frontend to display new validation messages

### Adding a New LLM Preset
1. Define preset in `packages/schemas/src/types.ts` (`PresetOperation` type)
2. Add prompt template in `apps/api/src/utils/llm-prompts.ts` (`buildPrompt()`)
3. Add preset button in `apps/web/src/components/LLMAssistSidebar.tsx`
4. Update documentation

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

**Location:** `apps/web/src/components/PreviewPanel.tsx` (imageSizeExtension)

### Card Format Compatibility

The system is compatible with cards exported from:
- **CharacterHub**: Wrapped v2/v3 formats with various spec values
- **SillyTavern**: Legacy formats with numeric position fields
- **Agnai**: Standard wrapped formats
- **TavernAI**: Legacy unwrapped v2 format
- **Custom tools**: Most non-standard implementations

All formats are normalized during import to match CCv2/CCv3 specifications.

## Performance Considerations

- Frontend panels use debounced API calls (500ms) to reduce server load
- Token counting uses approximate tokenizers for speed
- Large cards (>10k tokens) may need optimization
- Consider caching redundancy analysis results for repeated scans

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

## Useful Context

### Character Card Use Case
Character cards are JSON documents that define AI chatbot personalities. They're used in applications like:
- SillyTavern
- Kobold AI
- Text Generation WebUI
- Oobabooga

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
