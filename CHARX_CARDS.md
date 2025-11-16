````markdown
# RisuAI `.charx` Format – Unofficial Working Spec

Status: **Reverse-engineered from a real Risu export + CCv3 behavior.**  
Goal: enough detail for a dev or LLM to **read, validate, and emit** `.charx` that works with Risu, Ginger, SillyTavern, etc.

---

## 1. High-Level Overview

A `.charx` file is:

- A **ZIP archive** containing:
  - `card.json` – Character Card V3 (CCv3) JSON with Risu extensions. **Required.**
  - `assets/**` – Binary assets (images, audio, etc.). **Required.**
  - `module.risum` – Risu module data. **Optional.**
  - `x_meta/*.json` – Per-asset metadata. **Optional.**

The CCD/LLM contract is basically:

> “Treat `card.json` as the canonical CCv3 card.  
> All resources referenced in `data.assets[*].uri` live inside the same ZIP, under `assets/**` (or other known prefixes), using an `embeded://` URI scheme.”

---

## 2. Container Structure

### 2.1 File Extension & MIME

- Extension: **`.charx`**
- Suggested MIME: `application/zip`

### 2.2 ZIP Layout

Inside the ZIP:

- **Required**
  - `card.json`
  - One or more files under `assets/**`

- **Optional**
  - `module.risum`
  - `x_meta/*.json`

Example real layout:

```text
card.json
module.risum
x_meta/1.json
assets/icon/image/1.png
x_meta/2.json
assets/other/image/2.webp
...
x_meta/85.json
assets/icon/image/85.png
````

---

## 3. `card.json` Specification

### 3.1 Top Level

`card.json` MUST be UTF-8 encoded JSON object with:

```jsonc
{
  "spec": "chara_card_v3",
  "spec_version": "3.0",
  "data": { ... }
}
```

* `spec`

  * MUST be `"chara_card_v3"` (case-sensitive) for CCv3.
* `spec_version`

  * String, e.g. `"3.0"`.
* `data`

  * Main payload, see below.

### 3.2 `data` Object

Minimum fields seen in a real Risu export (CCv3 + Risu extensions):

```jsonc
"data": {
  "name": "Character Name",
  "description": "Long description...",
  "personality": "Personality text...",
  "scenario": "Default scenario...",
  "first_mes": "First message from the character.",
  "mes_example": "Example dialogues...",
  "creator_notes": "Notes for creators / users.",

  "system_prompt": "System-level instructions for the LLM.",
  "post_history_instructions": "Prompt appended after history.",

  "alternate_greetings": ["Alt greeting 1", "Alt greeting 2"],
  "group_only_greetings": [],

  "character_book": {
    "scan_depth": 5,
    "token_budget": 10000,
    "recursive_scanning": false,
    "extensions": {
      "risu_fullWordMatching": false
    },
    "entries": [
      {
        "keys": ["keyword1", "키워드2", "tag"],
        "content": "Associated lore text...",
        "enabled": true,
        "insertion_order": 0
        // CCv3 allows other optional fields here (weight, priority, etc.)
      }
    ]
  },

  "tags": [],
  "creator": "Author name",
  "character_version": "",
  "nickname": "Short nickname",
  "source": "Source/platform string",
  "creation_date": "2024-01-01T00:00:00Z",
  "modification_date": "2024-01-02T00:00:00Z",

  "assets": [ /* see Section 4 */ ],

  "extensions": { /* see Section 5 */ }
}
```

Notes:

* ALL standard CCv3 text fields are supported; only a subset is shown here.
* `character_book` is structured CCv3 lorebook with Risu-specific `extensions`.

---

## 4. Assets: `data.assets` + `assets/**`

### 4.1 Asset Entry Schema

`data.assets` is an array of asset descriptors.
In the real Risu export:

```jsonc
"assets": [
  {
    "type": "icon",
    "uri": "embeded://assets/icon/image/1.png",
    "name": "iconx",
    "ext": "png"
  },
  {
    "type": "x-risu-asset",
    "uri": "embeded://assets/other/image/2.webp",
    "name": "SomeExpression.webp",
    "ext": "webp"
  },
  ...
  {
    "type": "icon",
    "uri": "embeded://assets/icon/image/85.png",
    "name": "main",
    "ext": "png"
  }
]
```

Fields:

* `type` (string)

  * `"icon"` – avatar image(s).
  * `"x-risu-asset"` – Risu-specific images, bg, BGM, etc.
  * Other types MAY exist; consumers should be permissive.

* `uri` (string) – **required**

  * Usually: `"embeded://assets/..."`
  * See URI semantics below.

* `name` (string)

  * Arbitrary tag for the asset.
  * Convention:

    * `"main"` reserved for the primary avatar icon.
    * Other names are free-form labels (`"iconx"`, `"miyu_shocked"`, etc.).

* `ext` (string)

  * File extension without dot, e.g. `"png"`, `"webp"`, `"mp3"`.

### 4.2 URI Semantics

Risu uses a custom scheme with a typo:

```text
embeded://<internal-path>
```

Rules:

* If `uri` starts with `embeded://`:

  * Strip the prefix and treat the rest as a path inside the ZIP.

    ```text
    embeded://assets/icon/image/85.png
    → assets/icon/image/85.png
    ```

* Consumers SHOULD also accept plain relative paths as a possible variant (some tools do this), e.g.:

  ```text
  assets/icon/image/85.png
  ```

#### Reference Implementation (Importer)

```python
def resolve_asset(zip_file, uri: str) -> bytes:
    prefix = "embeded://"
    if uri.startswith(prefix):
        internal_path = uri[len(prefix):]
    else:
        internal_path = uri  # assume relative path in zip
    return zip_file.read(internal_path)
```

### 4.3 Main Portrait Selection

Recommended logic:

1. Try to find an asset where:

   ```jsonc
   { "type": "icon", "name": "main", ... }
   ```

2. If no such entry, fallback to the first asset with `type == "icon"`.

Reference:

```python
def pick_main_icon(asset_list):
    main = next(
        (a for a in asset_list
         if a.get("type") == "icon" and a.get("name") == "main"),
        None
    )
    if main is not None:
        return main
    return next((a for a in asset_list if a.get("type") == "icon"), None)
```

### 4.4 Asset Paths in ZIP

In the observed Risu `.charx`:

* Icons live at:

  ```text
  assets/icon/image/<n>.png
  ```

* Other images live at:

  ```text
  assets/other/image/<n>.webp
  ```

* Example layout chunk:

  ```text
  x_meta/1.json
  assets/icon/image/1.png
  x_meta/2.json
  assets/other/image/2.webp
  ...
  x_meta/85.json
  assets/icon/image/85.png
  ```

**Important:** Tools MUST NOT rely on exact subfolder names; they SHOULD:

* Treat **any path** under `assets/**` as valid.
* Use `data.assets[*].uri` as the truth for where a resource is.

---

## 5. `data.extensions` Namespaces

`data.extensions` is a free-form namespace bag. Consumers should **preserve** contents, but only interpret what they understand.

Example from a real Risu `.charx`:

```jsonc
"extensions": {
  "risuai": {
    "bias": [],
    "viewScreen": "none",
    "utilityBot": false,
    "sdData": [
      ["always", "solo, 1girl"],
      ["negative", ""],
      ["|character's appearance", ""],
      ["current situation", ""],
      ["$character's pose", ""],
      ["$character's emotion", ""],
      ["current location", ""]
    ],
    "backgroundHTML": "<div ...>...</div>",
    "prebuiltAssetCommand": "",
    "prebuiltAssetExclude": [],
    "prebuiltAssetStyle": ""
  },
  "depth_prompt": {
    "depth": 0,
    "prompt": ""
  }
}
```

Known namespaces:

* `"risuai"` – Risu-specific runtime/UI config:

  * `bias`: list of bias rules (structure can vary).
  * `viewScreen`, `utilityBot`: boolean / mode flags.
  * `sdData`: Stable Diffusion prompt templates keyed by symbolic labels.
  * `backgroundHTML`: literal HTML injected into Risu’s UI.
  * `prebuiltAsset*`: controls for prebuilt asset behaviour.

* `"depth_prompt"` – external feature; currently simple `{depth, prompt}`.

Specification:

* `extensions` MAY contain any number of namespaces.
* Unknown namespaces MUST be preserved unmodified on round-trip.

---

## 6. `x_meta` Directory

`x_meta` is **optional tooling metadata**.

In the observed Risu file:

```text
x_meta/1.json  → {"type": "WEBP"}
x_meta/2.json  → {"type": "WEBP"}
...
x_meta/85.json → {"type": "WEBP"}
```

Characteristics:

* File naming:

  * Files named `N.json` where `N` is a 1-based integer.

* Structure:

  * Minimal structure is:

    ```json
    { "type": "WEBP" }
    ```

  * `type` denotes original external format (`"WEBP"`, `"PNG"`, `"JPEG"`, `"Unknown"`, etc.).

* Mapping:

  * Conventionally, each `x_meta/N.json` corresponds to the N-th asset in a tool-specific ordering.
  * Exact mapping is **not** enforced by the `.charx` format itself.

Importer rules:

* MUST NOT rely on `x_meta` for correctness of basic card loading.
* MAY ignore `x_meta` entirely.
* MAY use it to preserve original asset format hints.

Exporter rules:

* MAY omit `x_meta` completely.
* MAY create `x_meta/N.json` metadata entries for nicer UX in tools that expect them.

---

## 7. `module.risum`

`module.risum` is **optional** and Risu-specific.

* In the sample, it is binary (not plain text).
* It is used by some tools to define “modules” (extra behaviours, extra assets).
* Other ecosystems (e.g. fount) map `module.risum` assets to additional `embeded://` URIs like:

  ```text
  embeded://__module_asset__/name.ext
  ```

Importer rules:

* If you do not implement Risu’s module system:

  * Treat `module.risum` as opaque.
  * You can completely ignore it without breaking core card functionality.

* If you **do** implement Risu modules:

  * Parse `module.risum` with Risu’s module spec (not covered here).
  * Expose any assets it defines as additional entries in `data.assets` with `embeded://__module_asset__/...` URIs or equivalent.

Exporter rules:

* MAY omit `module.risum` for simple character cards.
* SHOULD include it unchanged when round-tripping existing `.charx` files.

---

## 8. Importer Checklist (For Devs / LLMs)

To validate or load a `.charx`:

1. **Open as ZIP.**
2. Ensure `card.json` exists at root; parse as UTF-8 JSON.
3. Check:

   * `spec == "chara_card_v3"`
   * `spec_version` is a string (e.g. `"3.0"`).
   * `data` is present and an object.
4. Optionally sanity-check core fields in `data`:

   * `name`, `description`, `first_mes`, `assets` etc.
5. Check that `data.assets` is an array.
6. For each entry in `data.assets`:

   * Confirm `uri` is a string.
   * Try to resolve it:

     * Strip `embeded://` if present.
     * Ensure that path exists in the ZIP.
7. Determine main icon:

   * Prefer `type == "icon" && name == "main"`.
   * Else, first `type == "icon"`.
8. Ignore or pass through:

   * `x_meta/**`
   * `module.risum`
   * Unknown `extensions.*` namespaces

If those steps pass, the `.charx` is structurally “good enough” for most consumers.

---

## 9. Exporter Checklist

When generating a `.charx`:

1. Create a ZIP archive.

2. Add `card.json` with:

   ```jsonc
   {
     "spec": "chara_card_v3",
     "spec_version": "3.0",
     "data": { ... }
   }
   ```

   * `data` should follow CCv3 plus any Risu extensions you care about.

3. For each asset you want to include:

   * Store the file under some path beneath `assets/` (e.g. `assets/icon/image/1.png`).
   * Append to `data.assets`:

     ```jsonc
     {
       "type": "icon" | "x-risu-asset" | ...,
       "uri": "embeded://assets/icon/image/1.png",
       "name": "main" | "iconx" | "whatever",
       "ext": "png"  // extension without dot
     }
     ```

4. Make sure you have **at least one** `type: "icon"` asset.

   * For maximum compatibility, include one with `name: "main"`.

5. Optionally:

   * Add `x_meta/N.json` for each asset, e.g.:

     ```json
     { "type": "WEBP" }
     ```

   * Include a `module.risum` blob if you’re supporting Risu modules.

6. Zip everything up and name it `whatever.charx`.

If you follow this spec, your `.charx` should be consumable by Risu, Ginger, and other CCv3-aware frontends that support CharX.

---
