import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { UserPreset, CreatePresetRequest, UpdatePresetRequest } from '@card-architect/schemas';

export class PresetRepository {
  constructor(private db: Database.Database) {}

  /**
   * Initialize built-in presets if they don't exist
   */
  initializeBuiltInPresets(): void {
    const builtInPresets: Omit<UserPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Tighten (200 tokens)',
        description: 'Reduce text to approximately 200 tokens while preserving meaning',
        instruction: 'Rewrite to approximately 200 tokens. Preserve meaning, voice, and key details. Remove redundancy and filler. Keep formatting rules intact. Output only the rewritten text.',
        category: 'rewrite',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Tighten (150 tokens)',
        description: 'Reduce text to approximately 150 tokens while preserving meaning',
        instruction: 'Rewrite to approximately 150 tokens. Preserve meaning, voice, and key details. Remove redundancy and filler. Keep formatting rules intact. Output only the rewritten text.',
        category: 'rewrite',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Convert to Structured',
        description: 'Reformat into structured style with labeled sections and bullets',
        instruction: 'Reformat into structured style with labeled sections and nested bullets. Do not invent new facts. Keep {{char}}/{{user}} placeholders. Output only the reformatted text.',
        category: 'format',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Convert to Prose',
        description: 'Convert to flowing prose with natural paragraphs',
        instruction: 'Convert to flowing prose style with natural paragraphs. Maintain all information but make it read smoothly. Output only the prose version.',
        category: 'format',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Convert to Hybrid',
        description: 'Mix prose paragraphs with bulleted key facts',
        instruction: 'Convert to hybrid style: prose paragraphs for narrative, bullets for key facts. Balance readability with information density. Output only the hybrid format.',
        category: 'format',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Enforce Style Rules',
        description: 'Fix formatting: quoted dialogue, italic actions, consistent tense',
        instruction: 'Enforce consistent formatting:\n- Dialogue: "quoted speech"\n- Actions: *italic actions*\n- Present tense for descriptions\n- Proper {{char}}/{{user}} placeholder usage\nOutput only the corrected text.',
        category: 'format',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Format to JED',
        description: 'Reformat character card content to JED template structure',
        instruction: `Reformat the provided character content into the JED (JSON Enhanced Definition) template format. Use these section headers and structure:

# Setting
- Time Period:
- World Details:
- Main Characters: {{user}}, {{char}}

## Lore
[Worldbuilding information]

# {{char}}

## Overview
[Brief character concept]

## Appearance Details
- Race:
- Height:
- Age:
- Hair:
- Eyes:
- Body:
- Face:
- Features:

## Starting Outfit
[Clothing items as bullet list]

## Personality
- Archetype:
- Tags:
- Likes:
- Dislikes:
- Details:
- With {{user}}:

## Behaviour and Habits
[Bullet list of behaviors]

## Speech
- Style:
- Quirks:
- Ticks:

Extract and organize the existing content into these sections. Do not invent new facts. Keep {{char}}/{{user}} placeholders. Output only the reformatted text.`,
        category: 'format',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Format to JED+',
        description: 'Reformat character card content to comprehensive JED+ template with Q&A sections',
        instruction: `Reformat the provided character content into the JED+ (Extended JSON Enhanced Definition) template format with Q&A sections. Use this structure:

# [SETTING]
- Time/Period:
- World Details:
- Main Characters: {{user}}, {{char}}

## LORE
[Worldbuilding]

## SCENARIO OVERVIEW
[Main scenario description]

<{{char}}>

# [{{char}}]

## CHARACTER OVERVIEW
[Brief concept]

## [APPEARANCE]

### APPEARANCE DETAILS
- Full Name, Alias:
- Race:
- Sex/Gender:
- Height:
- Age:
- Hair:
- Eyes:
- Body:
- Face:
- Features:

- Appearance Trait:
  ↳ Details:
  ↳ Effect:

### STARTING OUTFIT
[Detailed outfit as nested list]

## [BASIC_INFO]

### ORIGIN (BACKSTORY)
[Character history]

### ABILITIES
- Ability:
  ↳ Details:

## [PERSONALITY_AND_TRAITS]

### PERSONALITY
- Archetype:
  ↳ Archetype Details:
  ↳ Reasoning:

- Personality Tags:

<Q&A>
Q: How {{char}} behaves with {{user}}? What is their relationship?
A: [Answer based on content]

Q: What is {{char}}'s most favorite thing?
A: [Answer based on content]
</Q&A>

## [BEHAVIOR_NOTES]
[Bullet list]

## [SPEECH]

### GENERAL SPEECH INFO
- Style:
- Quirks:
- Ticks:

</{{char}}>

Extract and organize the existing content into these sections. Add Q&A entries where information is available. Do not invent new facts. Keep {{char}}/{{user}} placeholders. Output only the reformatted text.`,
        category: 'format',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Generate Alternate Greetings (3)',
        description: 'Create 3 alternate opening messages',
        instruction: 'Create 3 alternate greetings, each a complete opening in the card\'s format. Vary mood, setting, and hook. Keep voice consistent. Return as a JSON array of strings, each greeting on one element. Format: ["greeting 1 text", "greeting 2 text", "greeting 3 text"]',
        category: 'generate',
        isBuiltIn: true,
        isHidden: false,
      },
      {
        name: 'Generate Lorebook Entry',
        description: 'Propose a lorebook entry for this content',
        instruction: 'Propose a lorebook entry for this content. Return as JSON:\n{\n  "keys": ["key1", "key2"],\n  "secondaryKeys": [],\n  "content": "entry content",\n  "priority": 10,\n  "insertionOrder": 100,\n  "position": "after_char"\n}',
        category: 'generate',
        isBuiltIn: true,
        isHidden: false,
      },
    ];

    const now = new Date().toISOString();

    // First, ensure is_hidden column exists (migration)
    try {
      this.db.exec('ALTER TABLE llm_presets ADD COLUMN is_hidden INTEGER DEFAULT 0');
    } catch {
      // Column already exists
    }

    for (const preset of builtInPresets) {
      // Check if preset with this name already exists
      const existing = this.db
        .prepare('SELECT id FROM llm_presets WHERE name = ? AND is_built_in = 1')
        .get(preset.name);

      if (!existing) {
        const id = randomUUID();
        this.db
          .prepare(
            `INSERT INTO llm_presets (id, name, description, instruction, category, is_built_in, is_hidden, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            id,
            preset.name,
            preset.description || null,
            preset.instruction,
            preset.category || null,
            preset.isBuiltIn ? 1 : 0,
            preset.isHidden ? 1 : 0,
            now,
            now
          );
      }
    }
  }

  /**
   * Get all presets (built-in + user-defined)
   */
  getAll(): UserPreset[] {
    const rows = this.db
      .prepare('SELECT * FROM llm_presets ORDER BY is_built_in DESC, category, name')
      .all() as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      instruction: row.instruction,
      category: row.category,
      isBuiltIn: row.is_built_in === 1,
      isHidden: row.is_hidden === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get visible presets only (excludes hidden)
   */
  getVisible(): UserPreset[] {
    const rows = this.db
      .prepare('SELECT * FROM llm_presets WHERE is_hidden = 0 ORDER BY is_built_in DESC, category, name')
      .all() as any[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      instruction: row.instruction,
      category: row.category,
      isBuiltIn: row.is_built_in === 1,
      isHidden: false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get preset by ID
   */
  getById(id: string): UserPreset | null {
    const row = this.db.prepare('SELECT * FROM llm_presets WHERE id = ?').get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      instruction: row.instruction,
      category: row.category,
      isBuiltIn: row.is_built_in === 1,
      isHidden: row.is_hidden === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Toggle hidden state for a preset
   */
  toggleHidden(id: string): UserPreset | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const newHidden = existing.isHidden ? 0 : 1;
    const now = new Date().toISOString();

    this.db.prepare('UPDATE llm_presets SET is_hidden = ?, updated_at = ? WHERE id = ?').run(newHidden, now, id);

    return this.getById(id);
  }

  /**
   * Copy a preset (including built-in) as a new user preset
   */
  copy(id: string, newName?: string): UserPreset | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const newId = randomUUID();
    const name = newName || `${existing.name} (Copy)`;

    this.db
      .prepare(
        `INSERT INTO llm_presets (id, name, description, instruction, category, is_built_in, is_hidden, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`
      )
      .run(
        newId,
        name,
        existing.description,
        existing.instruction,
        existing.category,
        now,
        now
      );

    return this.getById(newId);
  }

  /**
   * Create new user preset
   */
  create(data: CreatePresetRequest): UserPreset {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO llm_presets (id, name, description, instruction, category, is_built_in, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
      )
      .run(
        id,
        data.name,
        data.description || null,
        data.instruction,
        data.category || null,
        now,
        now
      );

    return this.getById(id)!;
  }

  /**
   * Update user preset (cannot update built-in presets)
   */
  update(data: UpdatePresetRequest): UserPreset | null {
    const existing = this.getById(data.id);
    if (!existing) return null;
    if (existing.isBuiltIn) {
      throw new Error('Cannot modify built-in presets');
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description || null);
    }
    if (data.instruction !== undefined) {
      updates.push('instruction = ?');
      values.push(data.instruction);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      values.push(data.category || null);
    }

    updates.push('updated_at = ?');
    values.push(now);

    values.push(data.id);

    this.db.prepare(`UPDATE llm_presets SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.getById(data.id);
  }

  /**
   * Delete user preset (cannot delete built-in presets)
   */
  delete(id: string): boolean {
    const existing = this.getById(id);
    if (!existing) return false;
    if (existing.isBuiltIn) {
      throw new Error('Cannot delete built-in presets');
    }

    const result = this.db.prepare('DELETE FROM llm_presets WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
