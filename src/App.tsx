import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon, ArrowLeft, Cloud, CloudOff, CloudAlert } from 'lucide-react';
import logo from './assets/logo.png';
import { CardStudio, type CardConfig } from './components/CardStudio';
import { DeckStudio } from './components/DeckStudio';
import { LoadingScreen } from './components/LoadingScreen';
import { DeckLibrary, type Deck } from './components/DeckLibrary';
import { SyncErrorDialog } from './components/SyncErrorDialog';
import { SyncPromptDialog } from './components/SyncPromptDialog';
import { driveService } from './services/googleDrive';

const APP_VERSION = '1.2.0-drive-sync';
const DECKS_STORAGE_KEY = 'velvet-sojourner-decks';
const THEME_STORAGE_KEY = 'velvet-sojourner-theme';
const SYNC_PROMPT_KEY = 'velvet-sojourner-sync-prompt-shown';
const SYNC_ENABLED_KEY = 'velvet-sojourner-sync-enabled';

export interface DeckStyle {
  cornerColor: string;
  titleColor: string;
  descriptionColor: string;
  cornerFont: string;
  titleFont: string;
  descriptionFont: string;
  backgroundImage: string | null;
}

const defaultDeckStyle: DeckStyle = {
  cornerColor: '#000000',
  titleColor: '#000000',
  descriptionColor: '#000000',
  cornerFont: 'serif',
  titleFont: 'sans-serif',
  descriptionFont: 'sans-serif',
  backgroundImage: null
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  // Init Drive Service & Session Check
  useEffect(() => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (CLIENT_ID) {
      driveService.init({ clientId: CLIENT_ID })
        .then(async () => {
          try {
            await driveService.trySilentSignIn();
            setIsAuthenticated(true);
          } catch (e) {
            setIsAuthenticated(false);

            // Check if user previously enabled sync
            const previouslyEnabled = localStorage.getItem(SYNC_ENABLED_KEY) === 'true';

            // Show prompt if:
            // 1. User previously enabled sync (needs re-auth)
            // 2. OR prompt hasn't been shown this session
            const promptShown = sessionStorage.getItem(SYNC_PROMPT_KEY);

            if (previouslyEnabled || !promptShown) {
              setIsPromptOpen(true);
              sessionStorage.setItem(SYNC_PROMPT_KEY, 'true');
            }
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSync = async () => {
    setSyncError(null);
    try {
      if (!driveService.isSignedIn) {
        await driveService.signIn();
        setIsAuthenticated(true);
      }

      setIsSyncing(true);

      // 1. Upload current decks
      // In a real robust sync, we'd merge changes. Here we just overwrite for simplicity given the constraints.
      // Or we can save each deck as a separate file.
      for (const deck of decks) {
        await driveService.saveFile(`deck-${deck.id}.json`, JSON.stringify(deck));
      }

      // 2. Download any decks we don't have? 
      // For now, let's just say "push" sync. 
      // To implement full sync, we'd list files, check timestamps, and merge.

      // Mark sync as enabled persistently
      localStorage.setItem(SYNC_ENABLED_KEY, 'true');

      // alert('Sync complete!'); // Sync successful
    } catch (error: any) {
      console.error('Sync failed', error);
      const message = error?.result?.error?.message || error?.message || "An unexpected error occurred during sync.";
      setSyncError(message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Loader Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Decks State
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem(DECKS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse decks", e);
      }
    }

    // Migration for legacy single-deck data
    const legacyCards = localStorage.getItem('velvet-sojourner-deck');
    if (legacyCards) {
      try {
        const style = localStorage.getItem('velvet-sojourner-style');
        return [{
          id: crypto.randomUUID(),
          name: localStorage.getItem('velvet-sojourner-deck-name') || "My First Deck",
          cards: JSON.parse(legacyCards),
          style: style ? JSON.parse(style) : defaultDeckStyle,
          updatedAt: Date.now()
        }];
      } catch (e) { console.error("Migration failed", e); }
    }
    return [];
  });

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'deck' | 'editor'>('library');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  const activeDeck = activeDeckId ? decks.find(d => d.id === activeDeckId) : null;

  // Deck Management Helpers
  const handleCreateDeck = () => {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: 'New Deck',
      cards: [],
      style: { ...defaultDeckStyle },
      updatedAt: Date.now()
    };
    setDecks(prev => [...prev, newDeck]);
    setActiveDeckId(newDeck.id);
    setView('deck');
  };

  const handleDeleteDeck = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    if (activeDeckId === id) {
      setActiveDeckId(null);
      setView('library');
    }
  };

  const handleSelectDeck = (id: string) => {
    setActiveDeckId(id);
    setView('deck');
  };

  const updateActiveDeck = (updates: Partial<Deck>) => {
    if (!activeDeckId) return;
    setDecks(prev => prev.map(d => d.id === activeDeckId ? { ...d, ...updates, updatedAt: Date.now() } : d));
  };

  // Card & Deck Studio Delegates
  const handleUpdateProjectName = (name: string) => updateActiveDeck({ name });
  const handleUpdateDeckStyle = (style: DeckStyle) => updateActiveDeck({ style });

  const handleAddCard = () => {
    setActiveCardIndex(null);
    setView('editor');
  };

  const handleEditCard = (index: number) => {
    setActiveCardIndex(index);
    setView('editor');
  };

  const handleDeleteCard = (index: number) => {
    if (!activeDeck) return;
    if (confirm('Are you sure you want to delete this card?')) {
      const newCards = activeDeck.cards.filter((_, i) => i !== index);
      updateActiveDeck({ cards: newCards });
    }
  };

  const handleDuplicateCard = (index: number) => {
    if (!activeDeck) return;
    const cardToDuplicate = activeDeck.cards[index];
    if (!cardToDuplicate) return;

    const duplicatedCard: CardConfig = {
      ...cardToDuplicate,
      id: crypto.randomUUID()
    };
    const newCards = [...activeDeck.cards];
    newCards.splice(index + 1, 0, duplicatedCard);
    updateActiveDeck({ cards: newCards });
  };

  const handleUpdateCardInDeck = (index: number, updates: Partial<CardConfig>) => {
    if (!activeDeck) return;
    const newCards = [...activeDeck.cards];
    newCards[index] = { ...newCards[index], ...updates };
    updateActiveDeck({ cards: newCards });
  };

  const handleSaveCard = (updatedCard: CardConfig) => {
    if (!activeDeck) return;

    const newCards = [...activeDeck.cards];
    if (activeCardIndex !== null) {
      // Update existing
      newCards[activeCardIndex] = updatedCard;
    } else {
      // Add new
      newCards.push(updatedCard);
    }

    updateActiveDeck({ cards: newCards });
    setView('deck');
    setActiveCardIndex(null);
  };

  const handleCancelEditor = () => {
    setView('deck');
    setActiveCardIndex(null);
  };

  const handleBackToLibrary = () => {
    setActiveDeckId(null);
    setView('library');
  };

  // Editor Key
  const editorKey = activeDeck && activeCardIndex !== null && activeDeck.cards[activeCardIndex]
    ? activeDeck.cards[activeCardIndex].id
    : 'new';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <AnimatePresence>
        {isLoading && <LoadingScreen version={APP_VERSION} />}
      </AnimatePresence>

      {/* Global Top Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-8 mx-auto max-w-7xl">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={handleBackToLibrary}
            title="Back to Library"
          >
            <img src={logo} alt="CardCraft Studio Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              CardCraft Studio
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Button */}
            <button
              onClick={() => {
                if (syncError) {
                  setIsErrorDialogOpen(true);
                } else if (!isAuthenticated) {
                  setIsPromptOpen(true);
                } else {
                  handleSync();
                }
              }}
              className={`flex items-center text-sm font-medium transition-colors ${syncError ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-indigo-600'
                }`}
              title={
                isSyncing ? 'Syncing...' :
                  syncError ? 'Sync Failed (Click for details)' :
                    isAuthenticated ? 'Sync with Google Drive' :
                      'Sync is offline'
              }
            >
              {isSyncing ? (
                <Cloud className="w-5 h-5 animate-pulse text-indigo-500" />
              ) : syncError ? (
                <CloudAlert className="w-5 h-5 text-red-500" />
              ) : isAuthenticated ? (
                <Cloud className="w-5 h-5 text-green-500" />
              ) : (
                <CloudOff className="w-5 h-5" />
              )}
            </button>

            {view !== 'library' && (
              <button
                onClick={handleBackToLibrary}
                className="hidden sm:flex items-center text-sm font-medium text-muted-foreground hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Library
              </button>
            )}

            <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>

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
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'library' && (
            <motion.div
              key="library-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DeckLibrary
                decks={decks}
                onCreateDeck={handleCreateDeck}
                onSelectDeck={handleSelectDeck}
                onDeleteDeck={handleDeleteDeck}
              />
              <SyncErrorDialog
                isOpen={isErrorDialogOpen}
                onClose={() => setIsErrorDialogOpen(false)}
                error={syncError}
                onRetry={() => {
                  setIsErrorDialogOpen(false);
                  handleSync();
                }}
              />
              <SyncPromptDialog
                isOpen={isPromptOpen}
                onClose={() => setIsPromptOpen(false)}
                onSync={handleSync}
              />
            </motion.div>
          )}

          {view === 'deck' && activeDeck && (
            <motion.div
              key="deck-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: 'circOut' }}
            >
              <DeckStudio
                deck={activeDeck.cards}
                projectName={activeDeck.name}
                deckStyle={activeDeck.style}
                onAddCard={handleAddCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onUpdateProjectName={handleUpdateProjectName}
                onUpdateCard={handleUpdateCardInDeck}
                onDuplicateCard={handleDuplicateCard}
                onUpdateDeckStyle={handleUpdateDeckStyle}
              />
            </motion.div>
          )}

          {view === 'editor' && activeDeck && (
            <motion.div
              key="editor-view"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
            >
              <CardStudio
                key={editorKey}
                initialCard={activeCardIndex !== null ? activeDeck.cards[activeCardIndex] : undefined}
                deckStyle={activeDeck.style}
                onSave={handleSaveCard}
                onCancel={handleCancelEditor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; 2026 Antonio 'GNUton' Aloisio. Released under GPL-3.0.
        </p>
      </footer>
    </div>
  );
}

export default App;
