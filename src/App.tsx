import { useState, useEffect } from 'react';
import { CardStudio, type CardConfig } from './components/CardStudio';
import { DeckStudio } from './components/DeckStudio';

type ViewMode = 'deck' | 'editor';

export interface DeckStyle {
  cornerColor: string;
  titleColor: string;
  descriptionColor: string;
  cornerFont: string;
  titleFont: string;
  descriptionFont: string;
  backgroundImage: string | null;
}

const STORAGE_KEY = 'velvet-sojourner-deck';
const STYLE_STORAGE_KEY = 'velvet-sojourner-style';

function App() {
  const [cards, setCards] = useState<CardConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [deckName, setDeckName] = useState(() => {
    return localStorage.getItem(STORAGE_KEY + '-name') || "My Game Deck";
  });

  const [deckStyle, setDeckStyle] = useState<DeckStyle>(() => {
    const saved = localStorage.getItem(STYLE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      cornerColor: '#000000',
      titleColor: '#000000',
      descriptionColor: '#000000',
      cornerFont: 'serif',
      titleFont: 'sans-serif',
      descriptionFont: 'sans-serif',
      backgroundImage: null
    };
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

  useEffect(() => {
    localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(deckStyle));
  }, [deckStyle]);

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
    <div className="min-h-screen">
      {view === 'deck' ? (
        <DeckStudio
          deck={cards}
          projectName={deckName}
          deckStyle={deckStyle}
          onAddCard={handleAddCard}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          onUpdateProjectName={setDeckName}
          onUpdateCard={handleUpdateCard}
          onUpdateDeckStyle={setDeckStyle}
        />
      ) : (
        <CardStudio
          key={editorKey}
          initialCard={activeCardIndex !== null ? cards[activeCardIndex] : undefined}
          deckStyle={deckStyle}
          onSave={handleSaveCard}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default App;
