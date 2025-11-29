# Card Doctor / Card Architect

Character card editor and format converter for AI roleplay platforms.

## Project Structure

```
card_doctor/
├── apps/
│   ├── api/          # Fastify backend API
│   └── web/          # React frontend
├── packages/
│   ├── schemas/      # Zod schemas, types, validation
│   ├── utils/        # Binary, base64, ZIP, URI utilities
│   ├── png/          # PNG tEXt/zTXt chunk reading/writing
│   ├── charx/        # CHARX format (ZIP-based CCv3)
│   └── voxta/        # Voxta .voxpkg format
└── testing/          # Test cards from various platforms
```

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

## URI Schemes

Asset URIs in CCv3 cards support these schemes:

| Scheme | Example | Description |
|--------|---------|-------------|
| `embeded://` | `embeded://assets/icon/0.png` | CHARX embedded asset |
| `ccdefault:` | `ccdefault:` | Use platform default |
| `https://` | `https://example.com/img.png` | Remote URL |
| `data:` | `data:image/png;base64,...` | Inline base64 |
| `__asset:` | `__asset:0` | PNG chunk reference |
| `asset:` | `asset:0` | PNG chunk reference (alt) |

## Packages

### @card-architect/schemas
Types and Zod validation for CCv2, CCv3, CHARX, Voxta formats.

### @card-architect/utils
Binary operations, base64, ZIP detection, URI parsing, macro conversion.

### @card-architect/png
PNG tEXt/zTXt chunk extraction and embedding.

### @card-architect/charx
CHARX (ZIP) format reading/writing with optional remote asset fetching.

### @card-architect/voxta
Voxta .voxpkg format reading/writing, CCv3 ↔ Voxta mapping.

## Build Commands

```bash
# Build all packages
npm run build -w packages/schemas
npm run build -w packages/utils
npm run build -w packages/png
npm run build -w packages/charx
npm run build -w packages/voxta

# Build apps
npm run build -w apps/api
npm run build -w apps/web

# Pack for distribution
cd packages/schemas && npm pack --pack-destination /home/vega/ai/package-hub
```

## Testing

Test cards are in `testing/` organized by platform:
- `testing/wyvern/` - Wyvern format cards
- `testing/chub/` - Chub.ai cards
- `testing/CharacterTavern/` - CharacterTavern V3 cards
