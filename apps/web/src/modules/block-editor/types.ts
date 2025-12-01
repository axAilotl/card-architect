/**
 * Block Editor Types
 *
 * Type definitions for the block-based character card editor.
 * Based on the Beast Box system from the standalone editor.
 */

/**
 * Content block types that can be nested within blocks
 */
export type BabyType = 'text' | 'flat' | 'flat-nested' | 'nested';

/**
 * Split item format for header/body separation
 */
export interface SplitItem {
  header: string;
  body: string;
  bold: boolean;
  split: true;
}

/**
 * List item can be a string or a split item
 */
export type ListItem = string | SplitItem;

/**
 * Text baby - simple text content
 */
export interface TextBaby {
  id: string;
  type: 'text';
  content: string;
}

/**
 * Flat list baby - simple bulleted list
 */
export interface FlatListBaby {
  id: string;
  type: 'flat';
  items: ListItem[];
}

/**
 * Flat-nested list baby - flat list with nested groups
 */
export interface FlatNestedListBaby {
  id: string;
  type: 'flat-nested';
  items: ListItem[];
  groups: ListItem[][];
}

/**
 * Nested list baby - pure nested list
 */
export interface NestedListBaby {
  id: string;
  type: 'nested';
  groups: ListItem[][];
}

/**
 * Union of all baby types
 */
export type Baby = TextBaby | FlatListBaby | FlatNestedListBaby | NestedListBaby;

/**
 * Target field for block content mapping
 */
export type TargetField =
  | 'description'
  | 'personality'
  | 'scenario'
  | 'first_mes'
  | 'mes_example'
  | 'creator_notes'
  | 'system_prompt'
  | 'post_history_instructions'
  | 'alternate_greetings'
  | 'character_book'
  | 'tags'
  | 'creator'
  | 'character_version'
  | 'extensions'
  | 'appearance'
  | 'character_note';

/**
 * Field definition for dropdown
 */
export interface FieldDefinition {
  value: TargetField;
  label: string;
}

/**
 * V2 character card fields
 */
export const V2_FIELDS: FieldDefinition[] = [
  { value: 'description', label: 'Description' },
  { value: 'personality', label: 'Personality' },
  { value: 'scenario', label: 'Scenario' },
  { value: 'first_mes', label: 'First Message' },
  { value: 'mes_example', label: 'Message Examples' },
  { value: 'creator_notes', label: 'Creator Notes' },
  { value: 'system_prompt', label: 'System Prompt' },
  { value: 'post_history_instructions', label: 'Post History Instructions' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'character_note', label: 'Character Note' },
];

/**
 * V3 character card fields (includes all V2 + additional)
 */
export const V3_FIELDS: FieldDefinition[] = [
  ...V2_FIELDS,
  { value: 'alternate_greetings', label: 'Alternate Greetings' },
  { value: 'character_book', label: 'Character Book' },
  { value: 'tags', label: 'Tags' },
  { value: 'creator', label: 'Creator' },
  { value: 'character_version', label: 'Character Version' },
  { value: 'extensions', label: 'Extensions' },
];

/**
 * Block (Beast Box) - a hierarchical content container
 */
export interface Block {
  id: string;
  label: string;
  targetField: TargetField;
  collapsed: boolean;
  babies: Baby[];
  children: Block[];
  level: number;
}

/**
 * Block template for saving/loading structures
 */
export interface BlockTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
}

/**
 * Block editor state
 */
export interface BlockEditorState {
  blocks: Block[];
  templates: BlockTemplate[];
  specVersion: 'v2' | 'v3';
}
