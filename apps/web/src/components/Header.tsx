import { useState } from 'react';
import { useCardStore, extractCardData } from '../store/card-store';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  onBack: () => void;
}


export function Header({ onBack }: HeaderProps) {
  const { currentCard, isSaving, createNewCard } = useCardStore();
  const tokenCounts = useCardStore((state) => state.tokenCounts);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Calculate permanent tokens (name + description + personality + scenario)
  const getPermanentTokens = () => {
    if (!tokenCounts) return 0;
    const name = tokenCounts.name || 0;
    const description = tokenCounts.description || 0;
    const personality = tokenCounts.personality || 0;
    const scenario = tokenCounts.scenario || 0;
    return name + description + personality + scenario;
  };

  // Get character name from current card
  const getCharacterName = () => {
    if (!currentCard) return '';
    const data = extractCardData(currentCard);
    return data.name || 'Untitled';
  };

  // Get character avatar URL - use thumbnail endpoint for fast loading
  const getAvatarUrl = () => {
    if (!currentCard?.meta?.id) return null;
    const timestamp = currentCard.meta.updatedAt || '';
    return `/api/cards/${currentCard.meta.id}/thumbnail?size=96&t=${timestamp}`;
  };

  const hasAvatar = currentCard?.meta?.id;
  const avatarUrl = getAvatarUrl();

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.png,.charx';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await useCardStore.getState().importCard(file);
      }
    };
    input.click();
  };

  const handleExport = async (format: 'json' | 'png' | 'charx') => {
    setShowExportMenu(false);
    await useCardStore.getState().exportCard(format);
  };

  return (
    <header className="bg-dark-surface border-b border-dark-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="btn-secondary" title="Back to Cards">
          ← Back
        </button>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Card Architect" className="w-6 h-6" />
          <h1 className="text-lg font-semibold text-dark-muted">Card Architect</h1>
        </div>

        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={getCharacterName()}
            className="w-24 h-24 rounded-full object-cover border-2 border-dark-border bg-slate-700"
            onError={(e) => {
              // Hide on error - card might not have an image
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {currentCard && (
          <span className="text-2xl font-bold">
            {getCharacterName()} {isSaving && <span className="text-sm text-dark-muted">(saving...)</span>}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {tokenCounts && (
          <>
            <div className="chip chip-token" title="Permanent tokens: Name + Description + Personality + Scenario">
              Permanent: {getPermanentTokens()} tokens
            </div>
            <div className="chip chip-token">
              Total: {tokenCounts.total} tokens
            </div>
          </>
        )}

        <button onClick={() => setShowSettings(true)} className="btn-secondary" title="LLM Settings">
          ⚙️
        </button>

        <button onClick={createNewCard} className="btn-secondary">
          New
        </button>

        <button onClick={handleImport} className="btn-secondary">
          Import
        </button>

        {currentCard && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-secondary"
            >
              Export ▾
            </button>
            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1 bg-dark-surface border border-dark-border rounded shadow-lg z-50 min-w-[120px]">
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full px-4 py-2 text-left hover:bg-slate-700 rounded-t"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport('png')}
                    className="block w-full px-4 py-2 text-left hover:bg-slate-700"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => handleExport('charx')}
                    className="block w-full px-4 py-2 text-left hover:bg-slate-700 rounded-b"
                    title="Export as CHARX (with assets)"
                  >
                    CHARX
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  );
}
