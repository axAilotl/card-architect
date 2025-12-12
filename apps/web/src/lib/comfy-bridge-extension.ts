/**
 * ComfyUI Bridge Extension Code
 *
 * This is the JavaScript code that users need to install in their ComfyUI instance
 * to enable cross-origin communication with Character Architect.
 *
 * Installation: Create as a custom node at ComfyUI/custom_nodes/character-architect-bridge/
 */

export const COMFY_BRIDGE_EXTENSION_CODE = `// Character Architect Bridge Extension v3
// Sends ONLY final saved images to Character Architect via postMessage
// Ignores preview/temp images from intermediate nodes

import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
  name: "CharacterArchitect.Bridge",

  async setup() {
    api.addEventListener("executed", (event) => {
      const { detail } = event;

      if (!detail?.output?.images) return;

      // Filter to only "output" type images (from Save nodes)
      // Ignore "temp" type images (from Preview nodes)
      const savedImages = detail.output.images.filter(img => img.type === 'output');

      if (savedImages.length === 0) return;

      console.log('[CharacterArchitect] Saved images:', savedImages.length);

      for (const image of savedImages) {
        window.parent.postMessage({
          type: 'COMFY_GENERATION_COMPLETE',
          payload: {
            filename: image.filename,
            subfolder: image.subfolder || '',
            type: image.type
          }
        }, '*');
        console.log('[CharacterArchitect] Sent:', image.filename);
      }
    });

    console.log('[CharacterArchitect] Bridge v3 loaded - only saved images will be sent');
  }
});
`;

export const COMFY_BRIDGE_FILENAME = 'bridge.js';
export const COMFY_BRIDGE_PATH = 'ComfyUI/custom_nodes/character-architect-bridge/js/bridge.js';
