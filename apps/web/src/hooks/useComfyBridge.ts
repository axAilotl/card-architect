/**
 * useComfyBridge - Cross-origin communication hook for ComfyUI iframe
 *
 * Listens for postMessage events from the ComfyUI iframe when images are generated.
 * The ComfyUI instance must have the bridge extension installed to send these messages.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ComfyImagePayload {
  filename: string;
  subfolder: string;
  type: string;
}

export interface SavedComfyImage {
  filename: string;
  assetId: string;
  savedAt: Date;
}

interface ComfyBridgeMessage {
  type: 'COMFY_GENERATION_COMPLETE';
  payload: ComfyImagePayload;
}

function isComfyBridgeMessage(data: unknown): data is ComfyBridgeMessage {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === 'COMFY_GENERATION_COMPLETE' &&
    typeof msg.payload === 'object' &&
    msg.payload !== null &&
    typeof (msg.payload as Record<string, unknown>).filename === 'string'
  );
}

interface UseComfyBridgeOptions {
  /** Callback to auto-save images when received */
  onImageReceived?: (image: ComfyImagePayload) => Promise<string | null>;
}

/**
 * Hook that listens for image generation events from ComfyUI iframe
 *
 * @param trustedOrigin - The ComfyUI server URL to trust (validates message origin)
 * @param options - Optional configuration including auto-save callback
 * @returns pendingImage - The most recent generated image info, or null
 * @returns imageHistory - Array of all received images in this session
 * @returns savedImages - Array of successfully saved images
 * @returns clearPending - Function to clear the pending image
 * @returns clearHistory - Function to clear all history
 */
export function useComfyBridge(trustedOrigin: string | null, options?: UseComfyBridgeOptions) {
  const [pendingImage, setPendingImage] = useState<ComfyImagePayload | null>(null);
  const [imageHistory, setImageHistory] = useState<ComfyImagePayload[]>([]);
  const [savedImages, setSavedImages] = useState<SavedComfyImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const onImageReceivedRef = useRef(options?.onImageReceived);

  // Keep ref updated
  useEffect(() => {
    onImageReceivedRef.current = options?.onImageReceived;
  }, [options?.onImageReceived]);

  useEffect(() => {
    if (!trustedOrigin) return;

    const handler = async (event: MessageEvent) => {
      // Normalize origins for comparison (remove trailing slash, handle protocol)
      const cleanTrustedOrigin = trustedOrigin.replace(/\/$/, '');

      // Extract origin from trusted URL
      let expectedOrigin: string;
      try {
        expectedOrigin = new URL(cleanTrustedOrigin).origin;
      } catch {
        // If URL parsing fails, use the trusted origin as-is
        expectedOrigin = cleanTrustedOrigin;
      }

      // Security: Validate that the message comes from our configured ComfyUI instance
      if (event.origin !== expectedOrigin) {
        // Silently ignore messages from other origins
        return;
      }

      // Validate message structure
      if (!isComfyBridgeMessage(event.data)) {
        return;
      }

      const { payload } = event.data;
      console.log('[ComfyBridge] Received image:', payload.filename);

      // Update state
      setPendingImage(payload);
      setImageHistory((prev) => [payload, ...prev].slice(0, 50)); // Keep last 50

      // Auto-save if callback is provided
      if (onImageReceivedRef.current) {
        setIsSaving(true);
        try {
          const assetId = await onImageReceivedRef.current(payload);
          if (assetId) {
            setSavedImages((prev) => [
              { filename: payload.filename, assetId, savedAt: new Date() },
              ...prev,
            ].slice(0, 50));
            console.log('[ComfyBridge] Auto-saved image as asset:', assetId);
          }
        } catch (err) {
          console.error('[ComfyBridge] Failed to auto-save image:', err);
        } finally {
          setIsSaving(false);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [trustedOrigin]);

  const clearPending = useCallback(() => {
    setPendingImage(null);
  }, []);

  const clearHistory = useCallback(() => {
    setImageHistory([]);
  }, []);

  const clearSavedImages = useCallback(() => {
    setSavedImages([]);
  }, []);

  return {
    pendingImage,
    imageHistory,
    savedImages,
    isSaving,
    clearPending,
    clearHistory,
    clearSavedImages,
  };
}
