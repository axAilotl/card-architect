/**
 * ComfyUI Tab - Iframe-based ComfyUI integration
 *
 * Embeds ComfyUI in an iframe and captures generated images via postMessage bridge.
 * Users work directly in ComfyUI's native interface.
 * Images are automatically saved to card assets with 'comfyui' tag.
 */

import { useState, useRef, useCallback } from 'react';
import { useCardStore } from '../../store/card-store';
import { useSettingsStore } from '../../store/settings-store';
import { useComfyBridge, type ComfyImagePayload, type SavedComfyImage } from '../../hooks/useComfyBridge';
import { getDeploymentConfig } from '../../config/deployment';

/**
 * Setup instructions shown when no ComfyUI URL is configured
 */
function SetupInstructions() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="text-6xl mb-6">&#127912;</div>
        <h2 className="text-2xl font-semibold mb-4">Connect to ComfyUI</h2>
        <p className="text-dark-muted mb-6">
          Configure your ComfyUI server URL in Settings &gt; ComfyUI to enable image generation.
        </p>
        <div className="text-left bg-dark-surface border border-dark-border rounded-lg p-6 space-y-4">
          <h3 className="font-medium">Quick Setup:</h3>
          <ol className="list-decimal list-inside space-y-2 text-dark-muted text-sm">
            <li>Go to <strong className="text-dark-text">Settings &gt; ComfyUI</strong></li>
            <li>Enter your ComfyUI server URL (e.g., <code className="bg-dark-bg px-1 rounded">http://127.0.0.1:8188</code>)</li>
            <li>Install the bridge extension (code provided in settings)</li>
            <li>Launch ComfyUI with CORS enabled: <code className="bg-dark-bg px-1 rounded">--enable-cors-header *</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/**
 * Saved images panel - shows auto-saved images from ComfyUI
 */
interface SavedImagesPanelProps {
  savedImages: SavedComfyImage[];
  isSaving: boolean;
  onClear: () => void;
}

function SavedImagesPanel({ savedImages, isSaving, onClear }: SavedImagesPanelProps) {
  if (savedImages.length === 0 && !isSaving) return null;

  return (
    <div className="absolute bottom-4 left-4 z-40 bg-dark-surface/95 border border-dark-border rounded-lg p-3 max-w-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-green-400">
            {isSaving ? 'Saving...' : `${savedImages.length} saved to assets`}
          </span>
          {isSaving && (
            <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        {savedImages.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-dark-muted hover:text-dark-text"
          >
            Clear
          </button>
        )}
      </div>
      {savedImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {savedImages.slice(0, 10).map((img, idx) => (
            <div key={`${img.assetId}-${idx}`} className="relative flex-shrink-0">
              <div className="w-16 h-16 bg-dark-bg rounded overflow-hidden border-2 border-green-500/50">
                <img
                  src={`/api/assets/${img.assetId}/thumbnail?size=128`}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-dark-muted mt-2">
        Go to Assets tab to manage or bulk delete
      </p>
    </div>
  );
}

/**
 * Main ComfyUI Tab component
 */
export function ComfyUITab() {
  const { currentCard } = useCardStore();
  const comfyUrl = useSettingsStore((state) => state.comfyUI.serverUrl);
  const quietMode = useSettingsStore((state) => state.comfyUI.quietMode);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeError, setIframeError] = useState(false);

  // Auto-save callback - saves images to assets automatically
  const handleImageReceived = useCallback(async (image: ComfyImagePayload): Promise<string | null> => {
    if (!currentCard || !comfyUrl) return null;

    try {
      // Fetch the image through our proxy
      const imageUrl = `/api/comfyui/image?serverUrl=${encodeURIComponent(comfyUrl)}&filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder)}&type=${encodeURIComponent(image.type)}`;
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error('[ComfyUI] Failed to fetch image from proxy:', response.status);
        return null;
      }
      const blob = await response.blob();

      // Upload to card assets with 'comfyui' tag
      const uploadUrl = `/api/cards/${currentCard.meta.id}/assets/upload?type=custom&name=${encodeURIComponent(image.filename)}&tags=comfyui`;
      const formData = new FormData();
      formData.append('file', blob, image.filename);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        console.error('[ComfyUI] Failed to upload asset:', await uploadResponse.text());
        return null;
      }

      const result = await uploadResponse.json();
      return result.asset?.asset?.id || result.asset?.assetId || null;
    } catch (error) {
      console.error('[ComfyUI] Error auto-saving image:', error);
      return null;
    }
  }, [currentCard, comfyUrl]);

  const { savedImages, isSaving, clearSavedImages } = useComfyBridge(comfyUrl, {
    onImageReceived: handleImageReceived,
  });

  // Check deployment mode
  const config = getDeploymentConfig();
  if (config.mode === 'light' || config.mode === 'static') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-dark-muted max-w-md">
          <h2 className="text-xl font-semibold mb-2">ComfyUI Integration</h2>
          <p className="mb-4">
            ComfyUI integration requires running Character Architect locally with a backend server.
          </p>
          <p className="text-sm">
            This feature connects to your ComfyUI instance to generate images for your character cards.
          </p>
        </div>
      </div>
    );
  }

  // No card loaded
  if (!currentCard) {
    return (
      <div className="h-full flex items-center justify-center text-dark-muted">
        <div className="text-center">
          <div className="text-6xl mb-4">&#127912;</div>
          <h2 className="text-xl font-semibold mb-2">No Card Loaded</h2>
          <p>Create or load a character card to use ComfyUI integration.</p>
        </div>
      </div>
    );
  }

  // No URL configured
  if (!comfyUrl) {
    return <SetupInstructions />;
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Connection status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-dark-surface border-b border-dark-border">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              iframeError ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
          <span className="text-sm text-dark-muted truncate max-w-md" title={comfyUrl}>
            {comfyUrl}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!quietMode && savedImages.length > 0 && (
            <span className="text-xs text-green-400">
              {savedImages.length} saved
            </span>
          )}
          {!quietMode && isSaving && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <div className="w-2 h-2 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          )}
          <button
            onClick={() => iframeRef.current?.contentWindow?.location.reload()}
            className="px-2 py-1 text-xs bg-dark-border rounded hover:bg-dark-muted/30"
            title="Reload ComfyUI"
          >
            Reload
          </button>
        </div>
      </div>

      {/* ComfyUI iframe */}
      <div className="flex-1 relative">
        {iframeError ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-dark-muted max-w-md p-8">
              <div className="text-4xl mb-4">&#9888;</div>
              <h3 className="text-lg font-medium mb-2">Connection Failed</h3>
              <p className="text-sm mb-4">
                Could not load ComfyUI from <code className="bg-dark-bg px-1 rounded">{comfyUrl}</code>
              </p>
              <ul className="text-sm text-left space-y-2">
                <li>&#8226; Make sure ComfyUI is running</li>
                <li>&#8226; Check if the URL is correct</li>
                <li>&#8226; Ensure CORS is enabled: <code className="bg-dark-bg px-1 rounded">--enable-cors-header *</code></li>
              </ul>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={comfyUrl}
            className="w-full h-full border-0"
            allow="clipboard-write; clipboard-read"
            onError={() => setIframeError(true)}
            title="ComfyUI"
          />
        )}

        {/* Saved images panel - shows auto-saved images (hidden in quiet mode) */}
        {!quietMode && (
          <SavedImagesPanel
            savedImages={savedImages}
            isSaving={isSaving}
            onClear={clearSavedImages}
          />
        )}
      </div>
    </div>
  );
}
