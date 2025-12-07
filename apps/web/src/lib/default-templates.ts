import type { Template, Snippet } from './types';

export const defaultTemplates: Template[] = [
  {
    id: 'tpl-jed-plus',
    name: 'JED+ (Extended)',
    description: 'Comprehensive character template with detailed Q&A sections for appearance, personality, sexuality, and speech patterns',
    category: 'character',
    targetFields: 'all',
    content: {
      description: `# [SETTING]
- Time/Period:
- World Details:
- Main Characters: {{user}}, {{char}}

## LORE


## SCENARIO OVERVIEW


- - -

<{{char}}>

# [{{char}}]

## CHARACTER OVERVIEW


- - -

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
- Privates:

- Appearance Trait:
  ↳ Details:
  ↳ Effect:

### STARTING OUTFIT
- Head:
- Accessories:
- Makeup:
- Neck:
- Top:
- Bottom:
- Legs:
- Shoes:
- Underwear:

<Q&A>
Q: How does {{char}} rate their own attractiveness?
A:
</Q&A>

- - -

## [BASIC_INFO]

### ORIGIN (BACKSTORY)


### RESIDENCE


### CONNECTIONS


### SECRET


### INVENTORY
- Item:
  ↳ Details:

### ABILITIES
- Ability:
  ↳ Details:

- - -

## [PERSONALITY_AND_TRAITS]

### PERSONALITY
- Archetype:
  ↳ Archetype Details:
  ↳ Reasoning:

- Alignment:
  ↳ Alignment Details:
  ↳ Ideals:

- Personality Tags:

- Main Aspiration:
  ↳ Aspiration Details:
  ↳ Aspiration Goals:

- Unique Trait:
  ↳ Effects:

<Q&A>
Q: What does {{char}} do first? Think or act/talk?
A:

Q: What does {{char}} do in free time?
A:

Q: What is {{char}}'s most favorite thing?
A:

Q: What is {{char}}'s most hated thing?
A:

Q: What is {{char}} incredibly good with?
A:

Q: What is {{char}} awfully bad with?
A:

Q: How {{char}} behaves with {{user}}? What is their relationship?
A:

Q: Is {{char}} a likable character? What reputation {{char}} has?
A:

Q: Can {{char}} harm {{user}} and others throughout the story?
A:
</Q&A>

- - -

## [BEHAVIOR_NOTES]
-
-

- - -

## [SEXUALITY]

[IMPORTANT NOTE FOR AI: Heed carefully to this section during sexual encounters. Make sure {{char}} sticks to their sexual role and orientation during the story.]

### GENERAL SEXUAL INFO
- Sexual Orientation:
  ↳ Explanation:
- Role during sex:
  ↳ Explanation:

<Q&A>
Q: Is {{char}} a virgin?
A:

Q: What does {{char}} think about sex in general?
A:

Q: Does {{char}} talk dirty and swear?
A:

Q: Is {{char}} loyal to their partner?
A:
</Q&A>

- - -

## [SPEECH]

### GENERAL SPEECH INFO
- Style:
- Quirks:
- Ticks:

## Speech EXAMPLES AND OPINIONS
[IMPORTANT NOTE FOR AI: This section provides {{char}}'s speech examples, memories, thoughts, and {{char}}'s real opinions on subjects. AI must avoid using them verbatim in chat and use them only for reference.]

<speech_examples>
- ""
- ""
</speech_examples>

- - -

## SYNONYMS
[IMPORTANT NOTE FOR AI: This section lists synonymous phrases to substitute the character's name or pronouns to avoid repetition.]
-

- - -

## PREMADE STORY PLAN
- Milestone 1:
  ↳ Details:

- Milestone 2:
  ↳ Details:

</{{char}}>

- - -

## [PRESCENARIO]

## PREVIOUSLY


## NOTES
-
', targetFields: 'all', scenario: '', first_mes: '', mes_example: '' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true }, { id: 'tpl-jed', name: 'JED (Standard)', description: 'Clean character template with essential sections for appearance, personality, speech, and sexuality', category: 'character', targetFields: 'all', content: { description: `# Setting
- Time Period:
- World Details:
- Main Characters: {{user}}, {{char}}

## Lore


<{{char}}>

# {{char}}

## Overview


## Appearance Details
- Race:
- Height:
- Age:
- Hair:
- Eyes:
- Body:
- Face:
- Features:
- Privates:

## Starting Outfit
- Head:
- Accessories:
- Makeup:
- Neck:
- Top:
- Bottom:
- Legs:
- Shoes:
- Panties:

## Inventory
-
-

## Abilities
-
-

## Origin


## Residence


## Connections


## Goal


## Secret


## Personality
- Archetype:
- Tags:
- Likes:
- Dislikes:
- Deep-Rooted Fears:
- Details:
- When Safe:
- When Alone:
- When Cornered:
- With {{user}}:

## Behaviour and Habits
-
-

## Sexuality
- Sex/Gender:
- Sexual Orientation:
- Kinks/Preferences:

## Sexual Quirks and Habits
-
-

## Speech
- Style:
- Quirks:
- Ticks:

## Speech Examples and Opinions
[Important: This section provides {{char}}'s speech examples, memories, thoughts, and {{char}}'s real opinions on subjects. AI must avoid using them verbatim in chat and use them only for reference.]

Greeting Example:
""

Embarrassed over something:
""

A memory about something:
""

## {{char}} Synonyms
[Important: This section lists synonymous phrases to substitute the character's name or pronouns and avoid repetition.]
-
-

## Notes
-
-

</{{char}}>`, scenario: '', first_mes: '', mes_example: '' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true }, { id: 'tpl-anime-character', name: 'Anime Character', description: 'Full card template for anime-style characters with expressive personality', category: 'character', targetFields: 'all', content: { description: '**Appearance:**
[Physical description - hair, eyes, height, build, distinguishing features]

**Background:**
[Character history and origin]

**Occupation:**
[Role or job]', scenario: '{{user}} encounters {{char}} at [location]. [Current situation or conflict].', first_mes: '*[Action or expression]* 

"[Dialogue introducing themselves]"', mes_example: '<START>
{{user}}: [Example user message]
{{char}}: *[Action]* "[Response showing personality]"

<START>
{{user}}: [Another example]
{{char}}: "[Response with catchphrase or quirk]"' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true }, ];

export const defaultSnippets: Snippet[] = [
  {
    id: 'snip-jed-setting',
    name: 'JED: Setting',
    description: 'JED+ Setting section with time, world, and characters',
    category: 'jed',
    content: '# [SETTING]
- Time/Period:
- World Details:
- Main Characters: {{user}}, {{char}}

## LORE


## SCENARIO OVERVIEW

', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-jed-appearance',
    name: 'JED: Appearance',
    description: 'JED+ Appearance section with details and outfit',
    category: 'jed',
    content: '## [APPEARANCE]

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
- Privates:

- Appearance Trait:
  ↳ Details:
  ↳ Effect:

### STARTING OUTFIT
- Head:
- Accessories:
- Makeup:
- Neck:
- Top:
- Bottom:
- Legs:
- Shoes:
- Underwear:

<Q&A>
Q: How does {{char}} rate their own attractiveness?
A:
</Q&A>
', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-jed-basic-info',
    name: 'JED: Basic Info',
    description: 'JED+ Basic info with backstory, residence, inventory, abilities',
    category: 'jed',
    content: '## [BASIC_INFO]

### ORIGIN (BACKSTORY)


### RESIDENCE


### CONNECTIONS


### SECRET


### INVENTORY
- Item:
  ↳ Details:

### ABILITIES
- Ability:
  ↳ Details:
', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-jed-personality',
    name: 'JED: Personality',
    description: 'JED+ Personality section with archetype, alignment, and Q&A',
    category: 'jed',
    content: '## [PERSONALITY_AND_TRAITS]

### PERSONALITY
- Archetype:
  ↳ Archetype Details:
  ↳ Reasoning:

- Alignment:
  ↳ Alignment Details:
  ↳ Ideals:

- Personality Tags:

- Main Aspiration:
  ↳ Aspiration Details:
  ↳ Aspiration Goals:

- Unique Trait:
  ↳ Effects:

<Q&A>
Q: What does {{char}} do first? Think or act/talk?
A:

Q: What does {{char}} do in free time?
A:

Q: What is {{char}}\'s most favorite thing?
A:

Q: What is {{char}}\'s most hated thing?
A:

Q: What is {{char}} incredibly good with?
A:

Q: What is {{char}} awfully bad with?
A:

Q: How {{char}} behaves with {{user}}? What is their relationship?
A:

Q: Is {{char}} a likable character? What reputation {{char}} has?
A:

Q: Can {{char}} harm {{user}} and others throughout the story?
A:
</Q&A>

## [BEHAVIOR_NOTES]
-
-
', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-jed-sexuality',
    name: 'JED: Sexuality',
    description: 'JED+ Sexuality section with orientation and Q&A',
    category: 'jed',
    content: '## [SEXUALITY]

[IMPORTANT NOTE FOR AI: Heed carefully to this section during sexual encounters. Make sure {{char}} sticks to their sexual role and orientation during the story.]

### GENERAL SEXUAL INFO
- Sexual Orientation:
  ↳ Explanation:
- Role during sex:
  ↳ Explanation:

<Q&A>
Q: Is {{char}} a virgin?
A:

Q: What does {{char}} think about sex in general?
A:

Q: Does {{char}} talk dirty and swear?
A:

Q: Is {{char}} loyal to their partner?
A:
</Q&A>
', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-jed-speech',
    name: 'JED: Speech',
    description: 'JED+ Speech section with style, quirks, and examples',
    category: 'jed',
    content: '## [SPEECH]

### GENERAL SPEECH INFO
- Style:
- Quirks:
- Ticks:

## Speech EXAMPLES AND OPINIONS
[IMPORTANT NOTE FOR AI: This section provides {{char}}\'s speech examples, memories, thoughts, and {{char}}\'s real opinions on subjects. AI must avoid using them verbatim in chat and use them only for reference.]

<speech_examples>
- ""
- ""
</speech_examples>

## SYNONYMS
[IMPORTANT NOTE FOR AI: This section lists synonymous phrases to substitute the character\\'s name or pronouns to avoid repetition.]
-
', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-jed-story-plan',
    name: 'JED: Story Plan',
    description: 'JED+ Story milestones and pre-scenario',
    category: 'jed',
    content: '## PREMADE STORY PLAN
- Milestone 1:
  ↳ Details:

- Milestone 2:
  ↳ Details:

- - -

## [PRESCENARIO]

## PREVIOUSLY


## NOTES
-
', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-ooc-instruction',
    name: 'OOC Instruction',
    description: 'Out of character instruction format',
    category: 'instruction',
    content: '[OOC: {{char}} will never break character or acknowledge being an AI]', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-char-behavior',
    name: 'Character Behavior Rule',
    description: 'Specify how {{char}} should behave',
    category: 'instruction',
    content: '{{char}} will always [specific behavior or rule]', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-divider',
    name: 'Section Divider',
    description: 'Visual separator for sections',
    category: 'format',
    content: '\n- - -\n', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-qa-block',
    name: 'Q&A Block',
    description: 'JED-style question and answer block',
    category: 'jed',
    content: '<Q&A>
Q: [Question about {{char}}?]
A:
</Q&A>', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-speech-example',
    name: 'Speech Example Block',
    description: 'JED-style speech examples section',
    category: 'jed',
    content: '<speech_examples>
- ""
- ""
</speech_examples>', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
  {
    id: 'snip-char-tags',
    name: 'Character XML Tags',
    description: 'Opening and closing character tags',
    category: 'format',
    content: '<{{char}}>

</{{char}}>', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDefault: true },
];