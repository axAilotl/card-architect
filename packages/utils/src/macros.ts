/**
 * Macro Converter Utility
 *
 * Converts between Voxta-style macros (with spaces) and standard macros (without spaces).
 *
 * Voxta uses: {{ user }}, {{ char }}, {{ User }}, {{ Char }}
 * Standard (SillyTavern, etc.) uses: {{user}}, {{char}}, {{User}}, {{Char}}
 */

/**
 * Convert Voxta-style macros to standard format (no spaces)
 * {{ user }} -> {{user}}
 * {{ char }} -> {{char}}
 */
export function voxtaToStandard(text: string): string {
  if (!text) return text;

  let result = text;

  // Replace {{ user }} variants with {{user}}
  result = result.replace(/\{\{\s*user\s*\}\}/gi, (match) => {
    // Preserve case of first letter
    const isUpperCase = match.includes('User') || match.includes('USER');
    return isUpperCase ? '{{User}}' : '{{user}}';
  });

  // Replace {{ char }} variants with {{char}}
  result = result.replace(/\{\{\s*char\s*\}\}/gi, (match) => {
    const isUpperCase = match.includes('Char') || match.includes('CHAR');
    return isUpperCase ? '{{Char}}' : '{{char}}';
  });

  return result;
}

/**
 * Convert standard macros to Voxta-style format (with spaces)
 * {{user}} -> {{ user }}
 * {{char}} -> {{ char }}
 */
export function standardToVoxta(text: string): string {
  if (!text) return text;

  let result = text;

  // Replace {{user}} variants with {{ user }}
  result = result.replace(/\{\{user\}\}/gi, (match) => {
    const isUpperCase = match.includes('User') || match.includes('USER');
    return isUpperCase ? '{{ User }}' : '{{ user }}';
  });

  // Replace {{char}} variants with {{ char }}
  result = result.replace(/\{\{char\}\}/gi, (match) => {
    const isUpperCase = match.includes('Char') || match.includes('CHAR');
    return isUpperCase ? '{{ Char }}' : '{{ char }}';
  });

  return result;
}

/**
 * Check if a card has Voxta extension data
 */
export function isVoxtaCard(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  // Check for V3 wrapped format
  const v3Data = data as { data?: { extensions?: { voxta?: unknown } } };
  if (v3Data.data?.extensions?.voxta) return true;

  // Check for unwrapped format with extensions
  const unwrapped = data as { extensions?: { voxta?: unknown } };
  if (unwrapped.extensions?.voxta) return true;

  return false;
}

/**
 * Fields that contain text content with potential macros
 */
const TEXT_FIELDS = [
  'description',
  'personality',
  'scenario',
  'first_mes',
  'mes_example',
  'system_prompt',
  'post_history_instructions',
  'creator_notes',
];

const ARRAY_FIELDS = [
  'alternate_greetings',
  'group_only_greetings',
];

/**
 * Apply macro conversion to all text fields in card data
 */
export function convertCardMacros(
  data: Record<string, unknown>,
  converter: (text: string) => string
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(data)); // Deep clone

  // Handle V3 wrapped format
  if (result.spec === 'chara_card_v3' && result.data) {
    convertFieldsInObject(result.data, converter);

    // Also convert lorebook entries if present
    if (result.data.character_book?.entries) {
      for (const entry of result.data.character_book.entries) {
        if (entry.content) {
          entry.content = converter(entry.content);
        }
      }
    }

    // Convert Voxta appearance if present
    if (result.data.extensions?.voxta?.appearance) {
      result.data.extensions.voxta.appearance = converter(result.data.extensions.voxta.appearance);
    }
  }
  // Handle V2 wrapped format
  else if (result.spec === 'chara_card_v2' && result.data) {
    convertFieldsInObject(result.data, converter);

    if (result.data.character_book?.entries) {
      for (const entry of result.data.character_book.entries) {
        if (entry.content) {
          entry.content = converter(entry.content);
        }
      }
    }
  }
  // Handle unwrapped format
  else {
    convertFieldsInObject(result, converter);

    if (result.character_book?.entries) {
      for (const entry of (result.character_book as { entries: Array<{ content?: string }> }).entries) {
        if (entry.content) {
          entry.content = converter(entry.content);
        }
      }
    }
  }

  return result;
}

function convertFieldsInObject(obj: Record<string, unknown>, converter: (text: string) => string): void {
  for (const field of TEXT_FIELDS) {
    if (typeof obj[field] === 'string') {
      obj[field] = converter(obj[field] as string);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (Array.isArray(obj[field])) {
      obj[field] = (obj[field] as string[]).map(item =>
        typeof item === 'string' ? converter(item) : item
      );
    }
  }
}
