import { useState, useEffect } from 'react';
import { useCardStore } from './store/card-store';
import { CardEditor } from './components/CardEditor';
import { CardGrid } from './components/CardGrid';
import { Header } from './components/Header';

type View = 'grid' | 'editor';

function App() {
  const [view, setView] = useState<View>('grid');
  const { currentCard, loadCard, setCurrentCard } = useCardStore();

  useEffect(() => {
    // Initialize IndexedDB
    import('./lib/db').then(({ localDB }) => localDB.init());
  }, []);

  const handleCardClick = async (cardId: string) => {
    await loadCard(cardId);
    setView('editor');
  };

  const handleBackToGrid = () => {
    setCurrentCard(null);
    setView('grid');
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      {view === 'editor' && <Header onBack={handleBackToGrid} />}

      <div className="flex-1 overflow-hidden">
        {view === 'grid' ? (
          <CardGrid onCardClick={handleCardClick} />
        ) : (
          <main className="h-full overflow-auto">
            {currentCard ? (
              <CardEditor />
            ) : (
              <div className="h-full flex items-center justify-center text-dark-muted">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">No card loaded</h2>
                  <p>Go back to select a card</p>
                  <button onClick={handleBackToGrid} className="btn-primary mt-4">
                    Back to Cards
                  </button>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
