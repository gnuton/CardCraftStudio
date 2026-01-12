import { useState, useEffect } from 'react';
import { CardStudio, type CardConfig } from './components/CardStudio';
import { DeckStudio } from './components/DeckStudio';

type ViewMode = 'deck' | 'editor';

const STORAGE_KEY = 'velvet-sojourner-deck';

function App() {
  const [cards, setCards] = useState<CardConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [deckName, setDeckName] = useState(() => {
    return localStorage.getItem(STORAGE_KEY + '-name') || "My Game Deck";
  });

  const [view, setView] = useState<ViewMode>('deck');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '-name', deckName);
  }, [deckName]);

  const handleAddCard = () => {
    setActiveCardIndex(null);
    setView('editor');
  };

  const handleEditCard = (index: number) => {
    setActiveCardIndex(index);
    setView('editor');
  };

  const handleDeleteCard = (index: number) => {
    if (confirm('Are you sure you want to delete this card?')) {
      setCards(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveCard = (updatedCard: CardConfig) => {
    setCards(prev => {
      if (activeCardIndex !== null) {
        // Update existing
        const newCards = [...prev];
        newCards[activeCardIndex] = updatedCard;
        return newCards;
      } else {
        // Add new
        return [...prev, updatedCard];
      }
    });
    setView('deck');
    setActiveCardIndex(null);
  };

  const handleCancel = () => {
    setView('deck');
    setActiveCardIndex(null);
  };

  // Determine key for editor to reset state when adding new
  const editorKey = activeCardIndex !== null && cards[activeCardIndex] ? cards[activeCardIndex].id : 'new';

  const handleUpdateCard = (index: number, updates: Partial<CardConfig>) => {
    setCards(prev => {
      const newCards = [...prev];
      newCards[index] = { ...newCards[index], ...updates };
      return newCards;
    });
  };

  return (
    <>
      {view === 'deck' ? (
        <DeckStudio
          deck={cards}
          projectName={deckName}
          onAddCard={handleAddCard}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          onUpdateProjectName={setDeckName}
          onUpdateCard={handleUpdateCard}
        />
      ) : (
        <CardStudio
          key={editorKey}
          initialCard={activeCardIndex !== null ? cards[activeCardIndex] : undefined}
          onSave={handleSaveCard}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

export default App;
