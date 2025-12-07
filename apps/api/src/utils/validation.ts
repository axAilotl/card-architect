/**
 * Card Validation Utilities
 *
 * Simple validation functions for CCv2 and CCv3 card data.
 */


/**
 * Validation error with severity
 */
export interface ValidationError {
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface CardValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Helper to create an error
 */
function err(message: string, severity: 'error' | 'warning' = 'error'): ValidationError {
  return { message, severity };
}

/**
 * Validate CCv2 card data
 * Handles both wrapped format {spec, spec_version, data} and unwrapped format (direct fields)
 */
export function validateV2(data: unknown): CardValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [err('Data must be an object')] };
  }

  const card = data as Record<string, unknown>;

  // Determine if wrapped or unwrapped
  // Wrapped: has 'spec' and 'data' object
  // Unwrapped: has 'name' field directly
  let cardData: Record<string, unknown>;
  if ('data' in card && typeof card.data === 'object' && card.data) {
    // Wrapped format - validate the inner data object
    cardData = card.data as Record<string, unknown>;
  } else if ('name' in card) {
    // Unwrapped/legacy format - validate at root level
    cardData = card;
  } else {
    return { valid: false, errors: [err('Card must have either a "data" object (wrapped) or "name" field (unwrapped)')] };
  }

  // Required fields for V2
  const requiredFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];

  for (const field of requiredFields) {
    if (!(field in cardData)) {
      errors.push(err(`Missing required field: ${field}`));
    } else if (typeof cardData[field] !== 'string') {
      errors.push(err(`Field '${field}' must be a string`));
    }
  }

  // Optional string fields
  const optionalStringFields = ['creator', 'character_version', 'creator_notes', 'system_prompt', 'post_history_instructions'];
  for (const field of optionalStringFields) {
    if (field in cardData && cardData[field] !== undefined && typeof cardData[field] !== 'string') {
      errors.push(err(`Field '${field}' must be a string if present`, 'warning'));
    }
  }

  // Tags should be an array of strings
  if ('tags' in cardData && cardData.tags !== undefined) {
    if (!Array.isArray(cardData.tags)) {
      errors.push(err('Field \'tags\' must be an array', 'warning'));
    } else if (!cardData.tags.every((t: unknown) => typeof t === 'string')) {
      errors.push(err('All tags must be strings', 'warning'));
    }
  }

  // Alternate greetings should be an array of strings
  if ('alternate_greetings' in cardData && cardData.alternate_greetings !== undefined) {
    if (!Array.isArray(cardData.alternate_greetings)) {
      errors.push(err('Field \'alternate_greetings\' must be an array', 'warning'));
    } else if (!cardData.alternate_greetings.every((g: unknown) => typeof g === 'string')) {
      errors.push(err('All alternate_greetings must be strings', 'warning'));
    }
  }

  // Character book validation (basic)
  if ('character_book' in cardData && cardData.character_book !== undefined) {
    if (typeof cardData.character_book !== 'object' || cardData.character_book === null) {
      errors.push(err('Field \'character_book\' must be an object', 'warning'));
    } else {
      const book = cardData.character_book as Record<string, unknown>;
      if ('entries' in book && !Array.isArray(book.entries)) {
        errors.push(err('character_book.entries must be an array', 'warning'));
      }
    }
  }

  const hasErrors = errors.some(e => e.severity === 'error');
  return { valid: !hasErrors, errors };
}

/**
 * Validate CCv3 card data
 */
export function validateV3(data: unknown): CardValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [err('Data must be an object')] };
  }

  const card = data as Record<string, unknown>;

  // Check spec
  if (card.spec !== 'chara_card_v3') {
    errors.push(err('Field \'spec\' must be \'chara_card_v3\''));
  }

  // Check spec_version
  if (!card.spec_version || typeof card.spec_version !== 'string') {
    errors.push(err('Field \'spec_version\' is required and must be a string'));
  }

  // Check data object
  if (!card.data || typeof card.data !== 'object') {
    return { valid: false, errors: [...errors, err('Field \'data\' is required and must be an object')] };
  }

  const innerData = card.data as Record<string, unknown>;

  // Required inner data fields
  const requiredFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creator', 'character_version'];

  for (const field of requiredFields) {
    if (!(field in innerData)) {
      errors.push(err(`Missing required field: data.${field}`));
    } else if (typeof innerData[field] !== 'string') {
      errors.push(err(`Field 'data.${field}' must be a string`));
    }
  }

  // Tags is required and must be an array
  if (!('tags' in innerData)) {
    errors.push(err('Missing required field: data.tags'));
  } else if (!Array.isArray(innerData.tags)) {
    errors.push(err('Field \'data.tags\' must be an array'));
  }

  // group_only_greetings is required in V3
  if (!('group_only_greetings' in innerData)) {
    errors.push(err('Missing required field: data.group_only_greetings'));
  } else if (!Array.isArray(innerData.group_only_greetings)) {
    errors.push(err('Field \'data.group_only_greetings\' must be an array'));
  }

  // Optional string fields
  const optionalStringFields = ['creator_notes', 'system_prompt', 'post_history_instructions'];
  for (const field of optionalStringFields) {
    if (field in innerData && innerData[field] !== undefined && typeof innerData[field] !== 'string') {
      errors.push(err(`Field 'data.${field}' must be a string if present`, 'warning'));
    }
  }

  // Alternate greetings
  if ('alternate_greetings' in innerData && innerData.alternate_greetings !== undefined) {
    if (!Array.isArray(innerData.alternate_greetings)) {
      errors.push(err('Field \'data.alternate_greetings\' must be an array', 'warning'));
    }
  }

  // Character book validation (basic)
  if ('character_book' in innerData && innerData.character_book !== undefined) {
    if (typeof innerData.character_book !== 'object' || innerData.character_book === null) {
      errors.push(err('Field \'data.character_book\' must be an object', 'warning'));
    } else {
      const book = innerData.character_book as Record<string, unknown>;
      if ('entries' in book && !Array.isArray(book.entries)) {
        errors.push(err('data.character_book.entries must be an array', 'warning'));
      }
    }
  }

  const hasErrors = errors.some(e => e.severity === 'error');
  return { valid: !hasErrors, errors };
}
