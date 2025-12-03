/**
 * CHARX Optimizer Settings Panel
 *
 * Configure image optimization settings for CHARX and Voxta exports.
 * Controls WebP conversion, quality, maximum resolution, and metadata stripping.
 */

import { useState, useEffect } from 'react';

interface CharxExportSettings {
  convertToWebp: boolean;
  webpQuality: number;
  maxMegapixels: number;
  stripMetadata: boolean;
}

const DEFAULT_SETTINGS: CharxExportSettings = {
  convertToWebp: true,
  webpQuality: 85,
  maxMegapixels: 4,
  stripMetadata: true,
};

export function CharxOptimizerSettings() {
  const [settings, setSettings] = useState<CharxExportSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/charx-optimizer/settings');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch {
      setStatus('Failed to load CHARX Optimizer settings');
      setSettings(DEFAULT_SETTINGS);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      const response = await fetch('/api/charx-optimizer/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const err = await response.json();
        setStatus(err.error || 'Failed to save settings');
        return;
      }

      setStatus('Settings saved successfully.');
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus('Failed to save settings');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">CHARX Export Optimizer</h3>
        <p className="text-dark-muted">
          Optimize images when exporting to CHARX or Voxta formats. Reduces file sizes while maintaining quality.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-dark-muted">Loading...</div>
      ) : (
        <>
          {status && (
            <div
              className={`p-3 rounded ${
                status.includes('Failed') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
              }`}
            >
              {status}
            </div>
          )}

          {settings && (
            <div className="border border-dark-border rounded-lg p-6 space-y-6">
              <h4 className="font-semibold">Image Optimization</h4>
              <p className="text-sm text-dark-muted">
                These settings apply when exporting cards to CHARX (.charx) or Voxta (.voxpkg) formats.
                PNG images in the card will be optimized based on these settings.
              </p>

              {/* WebP Conversion */}
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.convertToWebp}
                    onChange={(e) =>
                      setSettings({ ...settings, convertToWebp: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-medium">Convert PNG to WebP</span>
                    <p className="text-xs text-dark-muted">
                      WebP provides better compression than PNG, typically 25-35% smaller files.
                    </p>
                  </div>
                </label>

                {/* WebP Quality */}
                <div className={settings.convertToWebp ? '' : 'opacity-50'}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">WebP Quality</label>
                    <span className="text-sm text-dark-muted">{settings.webpQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={settings.webpQuality}
                    onChange={(e) =>
                      setSettings({ ...settings, webpQuality: parseInt(e.target.value) })
                    }
                    disabled={!settings.convertToWebp}
                    className="w-full h-2 bg-dark-card rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-xs text-dark-muted mt-1">
                    <span>Smaller files</span>
                    <span>Higher quality</span>
                  </div>
                </div>
              </div>

              {/* Max Resolution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Maximum Resolution</label>
                  <span className="text-sm text-dark-muted">{settings.maxMegapixels} MP</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="0.5"
                  value={settings.maxMegapixels}
                  onChange={(e) =>
                    setSettings({ ...settings, maxMegapixels: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-dark-card rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-xs text-dark-muted">
                  <span>1 MP (~1000x1000)</span>
                  <span>16 MP (~4000x4000)</span>
                </div>
                <p className="text-xs text-dark-muted">
                  Images larger than this will be downscaled proportionally. Set to 16 MP to keep original sizes.
                </p>
              </div>

              {/* Strip Metadata */}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.stripMetadata}
                  onChange={(e) =>
                    setSettings({ ...settings, stripMetadata: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <div>
                  <span className="font-medium">Strip Metadata</span>
                  <p className="text-xs text-dark-muted">
                    Remove EXIF data and other metadata from images. Reduces file size and removes potentially sensitive information.
                  </p>
                </div>
              </label>

              {/* Info box */}
              <div className="bg-dark-card/50 rounded-lg p-4 mt-4">
                <h5 className="font-medium text-sm mb-2">How it works</h5>
                <ul className="text-xs text-dark-muted space-y-1">
                  <li>• PNG images are converted to WebP format (if enabled)</li>
                  <li>• Large images are downscaled to fit the max resolution</li>
                  <li>• GIF images are preserved (animation support)</li>
                  <li>• JPEG images are re-compressed with the quality setting</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t border-dark-border">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-dark-muted hover:text-white transition-colors"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
