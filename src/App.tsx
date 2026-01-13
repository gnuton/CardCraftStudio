import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import logo from './assets/logo.png';
import { CardStudio, type CardConfig } from './components/CardStudio';
import { DeckStudio } from './components/DeckStudio';
import { LoadingScreen } from './components/LoadingScreen';

const APP_VERSION = '1.0.0-30ce4c6';

type ViewMode = 'deck' | 'editor';
type Theme = 'light' | 'dark';

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
const THEME_STORAGE_KEY = 'velvet-sojourner-theme';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const [cards, setCards] = useState<CardConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'light';
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

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

  const handleDuplicateCard = (index: number) => {
    setCards(prev => {
      const cardToDuplicate = prev[index];
      if (!cardToDuplicate) return prev;

      const duplicatedCard: CardConfig = {
        ...cardToDuplicate,
        id: crypto.randomUUID()
      };

      // Insert the duplicate right after the original
      const newCards = [...prev];
      newCards.splice(index + 1, 0, duplicatedCard);
      return newCards;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <AnimatePresence>
        {isLoading && <LoadingScreen version={APP_VERSION} />}
      </AnimatePresence>

      {/* Global Top Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-8 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CardCraft Studio Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              CardCraft Studio
            </span>
          </div>

          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-700 hover:text-indigo-600" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'deck' ? (
            <motion.div
              key="deck-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
            >
              <DeckStudio
                deck={cards}
                projectName={deckName}
                deckStyle={deckStyle}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onUpdateProjectName={setDeckName}
                onUpdateCard={handleUpdateCard}
                onDuplicateCard={handleDuplicateCard}
                onUpdateDeckStyle={setDeckStyle}
              />
            </motion.div>
          ) : (
            <motion.div
              key="editor-view"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
            >
              <CardStudio
                key={editorKey}
                initialCard={activeCardIndex !== null ? cards[activeCardIndex] : undefined}
                deckStyle={deckStyle}
                onSave={handleSaveCard}
                onCancel={handleCancel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
