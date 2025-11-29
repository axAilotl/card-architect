/**
 * Voxta <-> CCv3 Mapping
 *
 * Conversion utilities between Voxta format and CCv3 format.
 */

import type {
  CCv3Data,
  VoxtaCharacter,
  VoxtaExtensionData,
  VoxtaBook,
  LorebookEntry,
  KnownExtensions,
} from '@card-architect/schemas';
import { voxtaToStandard, standardToVoxta } from '@card-architect/utils';

/**
 * Convert a Voxta character to CCv3 format
 */
export function voxtaToCCv3(character: VoxtaCharacter, books?: VoxtaBook[]): CCv3Data {
  // Build voxta extension data to preserve Voxta-specific fields
  const voxtaExt: VoxtaExtensionData = {
    id: character.Id,
    packageId: character.PackageId,
    appearance: character.Description, // Voxta Description = physical appearance
    textToSpeech: character.TextToSpeech,
    chatSettings: {
      chatStyle: character.ChatStyle,
      enableThinkingSpeech: character.EnableThinkingSpeech,
      notifyUserAwayReturn: character.NotifyUserAwayReturn,
      timeAware: character.TimeAware,
      useMemory: character.UseMemory,
      maxTokens: character.MaxTokens,
      maxSentences: character.MaxSentences,
    },
    scripts: character.Scripts,
    original: {
      DateCreated: character.DateCreated,
      DateModified: character.DateModified,
    },
  };

  // Convert lorebook from VoxtaBooks
  let characterBook: CCv3Data['data']['character_book'] | undefined;

  if (books && books.length > 0) {
    const entries: LorebookEntry[] = [];

    for (const book of books) {
      if (book.Items) {
        for (let i = 0; i < book.Items.length; i++) {
          const item = book.Items[i];
          entries.push({
            keys: item.Keywords || [],
            content: item.Text || '',
            enabled: item.Deleted !== true,
            insertion_order: i,
            name: item.Id || '',
            priority: item.Weight || 10,
            id: i,
            comment: '',
            selective: false,
            secondary_keys: [],
            constant: false,
            position: 'before_char',
          });
        }
      }
    }

    if (entries.length > 0) {
      characterBook = {
        entries,
        name: books[0].Name || 'Imported Lorebook',
      };
    }
  }

  // Build CCv3 card
  const card: CCv3Data = {
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: character.Name || 'Unknown',
      description: voxtaToStandard(character.Profile || ''), // Profile = backstory/description
      personality: voxtaToStandard(character.Personality || ''),
      scenario: voxtaToStandard(character.Scenario || ''),
      first_mes: voxtaToStandard(character.FirstMessage || ''),
      mes_example: voxtaToStandard(character.MessageExamples || ''),
      creator_notes: character.CreatorNotes || '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      group_only_greetings: [],
      tags: character.Tags || [],
      creator: character.Creator || '',
      character_version: character.Version || '1.0',
      character_book: characterBook,
      extensions: {
        voxta: voxtaExt,
        // Also export visual_description for Wyvern AI compatibility
        visual_description: character.Description || undefined,
      },
    },
  };

  return card;
}

/**
 * Convert CCv3 card to Voxta character format
 */
export function ccv3ToVoxta(card: CCv3Data): VoxtaCharacter {
  const cardData = card.data;
  const extensions = cardData.extensions as KnownExtensions | undefined;
  const voxtaExt = extensions?.voxta;
  const dateNow = new Date().toISOString();

  // Get appearance from voxta extension, or fall back to visual_description (Wyvern AI)
  const appearance = voxtaExt?.appearance || extensions?.visual_description || '';

  const character: VoxtaCharacter = {
    $type: 'character',
    Id: voxtaExt?.id || generateSimpleUUID(),
    PackageId: voxtaExt?.packageId || generateSimpleUUID(),
    Name: cardData.name,
    Version: cardData.character_version,

    // Core Info - apply macro conversion
    Description: appearance,
    Personality: standardToVoxta(cardData.personality),
    Profile: standardToVoxta(cardData.description),
    Scenario: standardToVoxta(cardData.scenario),
    FirstMessage: standardToVoxta(cardData.first_mes),
    MessageExamples: standardToVoxta(cardData.mes_example || ''),

    // Metadata
    Creator: cardData.creator,
    CreatorNotes: cardData.creator_notes,
    Tags: cardData.tags,

    // Voxta-specific from extension
    TextToSpeech: voxtaExt?.textToSpeech,
    ChatStyle: voxtaExt?.chatSettings?.chatStyle,
    EnableThinkingSpeech: voxtaExt?.chatSettings?.enableThinkingSpeech,
    NotifyUserAwayReturn: voxtaExt?.chatSettings?.notifyUserAwayReturn,
    TimeAware: voxtaExt?.chatSettings?.timeAware,
    UseMemory: voxtaExt?.chatSettings?.useMemory,
    MaxTokens: voxtaExt?.chatSettings?.maxTokens,
    MaxSentences: voxtaExt?.chatSettings?.maxSentences,
    Scripts: voxtaExt?.scripts,

    DateCreated: voxtaExt?.original?.DateCreated || dateNow,
    DateModified: dateNow,
  };

  return character;
}

/**
 * Convert CCv3 lorebook to Voxta book format
 */
export function ccv3LorebookToVoxtaBook(card: CCv3Data): VoxtaBook | null {
  const characterBook = card.data.character_book;
  if (!characterBook?.entries || characterBook.entries.length === 0) {
    return null;
  }

  const book: VoxtaBook = {
    $type: 'book',
    Id: generateSimpleUUID(),
    Name: characterBook.name || `${card.data.name}'s Lorebook`,
    Items: characterBook.entries.map((entry) => ({
      Id: generateSimpleUUID(),
      Keywords: entry.keys || [],
      Text: standardToVoxta(entry.content || ''),
      Weight: entry.priority || 10,
      Deleted: entry.enabled === false,
    })),
  };

  return book;
}

/**
 * Simple UUID generator (no external dependency)
 */
function generateSimpleUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
