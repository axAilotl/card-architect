/**
 * Voxta Package Format Type Definitions
 * Based on Voxta Package Format Specification v1.0
 */

export interface VoxtaPackage {
  $type: 'package';
  Id: string;
  Name: string;
  Version: string;
  Description?: string;
  Creator?: string;
  ExplicitContent?: boolean;
  EntryResource?: {
    Kind: number; // 1=Character, 3=Scenario
    Id: string;
  };
  ThumbnailResource?: {
    Kind: number;
    Id: string;
  };
  DateCreated?: string;
  DateModified?: string;
}

export interface VoxtaCharacter {
  $type: 'character';
  Id: string;
  Name: string;
  Version?: string;
  PackageId?: string;
  
  // Core Info
  Description?: string;  // Physical description
  Personality?: string;
  Profile?: string;      // Profile/Backstory
  Scenario?: string;
  FirstMessage?: string;
  MessageExamples?: string;

  // Metadata
  Creator?: string;
  CreatorNotes?: string;
  Tags?: string[];
  ExplicitContent?: boolean;
  Culture?: string; // e.g. "en-US"

  // References
  MemoryBooks?: string[];
  DefaultScenarios?: string[];

  // Text-to-Speech
  TextToSpeech?: VoxtaTtsConfig[];

  // AI Settings
  ChatStyle?: number;
  EnableThinkingSpeech?: boolean;
  NotifyUserAwayReturn?: boolean;
  TimeAware?: boolean;
  UseMemory?: boolean;
  MaxTokens?: number;
  MaxSentences?: number;
  SystemPromptOverrideType?: number;

  // Advanced
  Scripts?: VoxtaScript[];
  Augmentations?: any[];

  Thumbnail?: {
    RandomizedETag?: string;
    ContentType?: string;
  };

  DateCreated?: string;
  DateModified?: string;
}

export interface VoxtaTtsConfig {
  Voice: {
    parameters: {
      VoiceBackend?: string;
      VoiceId?: string;
      Gender?: string;
      Filename?: string;
      FinetuneVoice?: string;
      [key: string]: any;
    };
    label: string;
  };
  Service: {
    ServiceName: string;
    ServiceId: string;
  };
}

export interface VoxtaScenario {
  $type: 'scenario';
  Id: string;
  Name: string;
  Version?: string;
  ParentId?: string;
  PackageId?: string;
  Client?: string;
  
  Creator?: string;
  Description?: string;
  
  SharedScripts?: VoxtaScript[];
  Actions?: VoxtaAction[];
}

export interface VoxtaScript {
  Name: string;
  Content: string; // JS/TS code
}

export interface VoxtaAction {
  Name: string;
  Layer?: string;
  Arguments?: any[];
  FinalLayer?: boolean;
  Timing?: number;
  Description?: string;
  Disabled?: boolean;
  Once?: boolean;
  FlagsFilter?: string;
  Effect?: {
    SetFlags?: string[];
    MaxSentences?: number;
    MaxTokens?: number;
    [key: string]: any;
  };
}

export interface VoxtaBook {
  $type: 'book';
  Id: string;
  Name: string;
  Version?: string;
  PackageId?: string;
  Description?: string;
  ExplicitContent?: boolean;
  Creator?: string;
  Items: VoxtaBookItem[];
  
  DateCreated?: string;
  DateModified?: string;
}

export interface VoxtaBookItem {
  Id: string;
  Keywords: string[];
  Text: string;
  Weight?: number;
  Deleted?: boolean;
  CreatedAt?: string;
  LastUpdated?: string;
  DeletedAt?: string;
}

/**
 * Known V2/V3 Extensions
 * These are non-standard but commonly used extensions from various tools
 */

/**
 * SillyTavern depth_prompt extension
 * Used as "Character's Note" - injected at a specific depth in chat history
 */
export interface DepthPromptExtension {
  prompt: string;
  depth: number; // Default is 4
}

/**
 * Wyvern AI visual_description extension
 * Physical/visual description of the character
 */
export type VisualDescriptionExtension = string;

/**
 * Known extensions interface for type-safe access
 * Note: extensions is Record<string, unknown> so these are optional type hints
 */
export interface KnownExtensions {
  depth_prompt?: DepthPromptExtension;
  visual_description?: VisualDescriptionExtension;
  voxta?: VoxtaExtensionData;
  // Chub/other hosting metadata (preserved but not edited)
  chub?: Record<string, unknown>;
  risuai?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Structure for data stored in CCv3 `extensions.voxta`
 */
export interface VoxtaExtensionData {
  id: string;
  version?: string;
  packageId?: string;
  
  // Character specifics
  textToSpeech?: VoxtaTtsConfig[];
  appearance?: string; // Physical description
  chatSettings?: {
    chatStyle?: number;
    enableThinkingSpeech?: boolean;
    notifyUserAwayReturn?: boolean;
    timeAware?: boolean;
    useMemory?: boolean;
    maxTokens?: number;
    maxSentences?: number;
  };
  scripts?: VoxtaScript[];
  
  // Scenario specifics (if we treat scenario as main entity)
  scenario?: {
    actions?: VoxtaAction[];
    sharedScripts?: VoxtaScript[];
  };

  // Original raw references if needed
  original?: Partial<VoxtaCharacter>;
}
