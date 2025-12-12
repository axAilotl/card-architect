/**
 * ComfyUI Settings Panel
 *
 * Configure ComfyUI server URL and view bridge extension installation instructions.
 */

import { useState } from 'react';
import { useSettingsStore } from '../../../store/settings-store';
import { COMFY_BRIDGE_EXTENSION_CODE } from '../../../lib/comfy-bridge-extension';

export function ComfyUISettings() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const comfyUrl = useSettingsStore((state) => state.comfyUI.serverUrl);
  const setComfyUrl = useSettingsStore((state) => state.setComfyUIServerUrl);
  const quietMode = useSettingsStore((state) => state.comfyUI.quietMode);
  const setQuietMode = useSettingsStore((state) => state.setComfyUIQuietMode);

  const testConnection = async () => {
    if (!comfyUrl) {
      setTestResult({ success: false, message: 'Please enter a URL first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Try to fetch system stats from ComfyUI
      const response = await fetch(`${comfyUrl}/system_stats`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        const os = data.system?.os || 'Unknown';
        const devices = data.devices?.length || 0;
        setTestResult({
          success: true,
          message: `Connected! OS: ${os}, Devices: ${devices}`,
        });
      } else {
        setTestResult({
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      setTestResult({
        success: false,
        message: message.includes('timeout') ? 'Connection timed out' : message,
      });
    } finally {
      setTesting(false);
    }
  };

  const copyExtensionCode = async () => {
    try {
      await navigator.clipboard.writeText(COMFY_BRIDGE_EXTENSION_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = COMFY_BRIDGE_EXTENSION_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">ComfyUI Configuration</h3>
        <p className="text-dark-muted text-sm">
          Connect to your ComfyUI instance to generate images directly in the app.
        </p>
      </div>

      {/* Server URL */}
      <div className="border border-dark-border rounded-lg p-6 space-y-4">
        <h4 className="font-medium">Server Connection</h4>

        <div className="space-y-2">
          <label className="block text-sm font-medium">ComfyUI Server URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={comfyUrl}
              onChange={(e) => setComfyUrl(e.target.value)}
              placeholder="http://127.0.0.1:8188"
              className="flex-1 bg-dark-card border border-dark-border rounded px-3 py-2"
            />
            <button
              onClick={testConnection}
              disabled={testing || !comfyUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test'}
            </button>
          </div>
          <p className="text-xs text-dark-muted">
            The address of your ComfyUI server (e.g., http://127.0.0.1:8188 or https://comfy.example.com)
          </p>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded text-sm ${
              testResult.success
                ? 'bg-green-900/20 border border-green-700 text-green-100'
                : 'bg-red-900/20 border border-red-700 text-red-100'
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Quiet Mode */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="comfy-quiet-mode"
            checked={quietMode}
            onChange={(e) => setQuietMode(e.target.checked)}
            className="w-4 h-4 rounded border-dark-border bg-dark-card"
          />
          <label htmlFor="comfy-quiet-mode" className="text-sm">
            <span className="font-medium">Quiet Mode</span>
            <span className="text-dark-muted ml-2">
              - Save images silently without showing confirmation panel
            </span>
          </label>
        </div>
      </div>

      {/* CORS Instructions */}
      <div className="border border-dark-border rounded-lg p-6 space-y-4">
        <h4 className="font-medium">CORS Configuration</h4>
        <p className="text-sm text-dark-muted">
          For the iframe to load properly, you need to launch ComfyUI with CORS headers enabled:
        </p>
        <div className="bg-dark-bg border border-dark-border rounded p-3">
          <code className="text-sm text-green-400">
            python main.py --enable-cors-header *
          </code>
        </div>
        <p className="text-xs text-dark-muted">
          Or specify your app's domain for more security: <code className="bg-dark-bg px-1 rounded">--enable-cors-header https://ca.axailotl.ai</code>
        </p>
      </div>

      {/* Bridge Extension */}
      <div className="border border-dark-border rounded-lg p-6 space-y-4">
        <h4 className="font-medium">Bridge Extension (Custom Node)</h4>
        <p className="text-sm text-dark-muted">
          To capture generated images, install the bridge as a ComfyUI custom node:
        </p>

        <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
          <p className="text-sm text-blue-100">
            <strong>Installation Steps:</strong>
          </p>
          <ol className="text-sm text-blue-200 mt-2 space-y-1 list-decimal list-inside">
            <li>Create folder: <code className="bg-dark-bg px-1 rounded">ComfyUI/custom_nodes/character-architect-bridge/</code></li>
            <li>Create subfolder: <code className="bg-dark-bg px-1 rounded">js/</code> inside it</li>
            <li>Create <code className="bg-dark-bg px-1 rounded">__init__.py</code> with the Python code below</li>
            <li>Create <code className="bg-dark-bg px-1 rounded">js/bridge.js</code> with the JavaScript code below</li>
            <li>Restart ComfyUI</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium">__init__.py:</span>
            <pre className="bg-dark-bg border border-dark-border rounded p-3 text-xs mt-1 text-dark-muted">
{`WEB_DIRECTORY = "./js"
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]`}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">js/bridge.js:</span>
              <button
                onClick={copyExtensionCode}
                className="px-2 py-1 bg-dark-border text-dark-text text-xs rounded hover:bg-dark-muted/30"
              >
                {copied ? 'Copied!' : 'Copy JS'}
              </button>
            </div>
            <pre className="bg-dark-bg border border-dark-border rounded p-3 text-xs mt-1 overflow-auto max-h-48 text-dark-muted">
              {COMFY_BRIDGE_EXTENSION_CODE}
            </pre>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="border border-dark-border rounded-lg p-6 space-y-4">
        <h4 className="font-medium">How It Works</h4>
        <div className="text-sm text-dark-muted space-y-2">
          <p>
            <strong className="text-dark-text">1. ComfyUI in Iframe:</strong> The ComfyUI tab embeds your ComfyUI instance in an iframe. You work directly in ComfyUI's native interface.
          </p>
          <p>
            <strong className="text-dark-text">2. Bridge Extension:</strong> When you generate an image, the bridge extension sends the filename to Character Architect via postMessage.
          </p>
          <p>
            <strong className="text-dark-text">3. Image Capture:</strong> Character Architect receives the image info and shows a "Save" button, letting you add the image as a card asset.
          </p>
        </div>
      </div>
    </div>
  );
}
