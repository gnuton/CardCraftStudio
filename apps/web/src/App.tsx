import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon, Cloud, CloudOff, CloudAlert } from 'lucide-react';
import logo from './assets/logo.png';
import { CardStudio, type CardConfig } from './components/CardStudio';
import { DeckStudio } from './components/DeckStudio';
import { LoadingScreen } from './components/LoadingScreen';
import { DeckLibrary, type Deck } from './components/DeckLibrary';
import { SyncErrorDialog } from './components/SyncErrorDialog';
import { SyncPromptDialog } from './components/SyncPromptDialog';
import { SyncConflictDialog } from './components/SyncConflictDialog';
import { NewDeckDialog } from './components/NewDeckDialog';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { ToastContainer, type ToastType } from './components/Toast';
import { driveService } from './services/googleDrive';
import { calculateHash } from './utils/hash';
import { imageService } from './services/imageService';
import { GlobalStyleEditor } from './components/GlobalStyleEditor';
import { Navigation } from './components/Navigation';
import { importDeckFromZip } from './utils/deckIO';


const APP_VERSION = '1.2.0-drive-sync';

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}
const DECKS_STORAGE_KEY = 'cardcraftstudio-decks';
const THEME_STORAGE_KEY = 'cardcraftstudio-theme';
const SYNC_PROMPT_KEY = 'cardcraftstudio-sync-prompt-shown';
const SYNC_ENABLED_KEY = 'cardcraftstudio-sync-enabled';

import type { DeckStyle } from './types/deck';

const defaultDeckStyle: DeckStyle = {
  id: 'simple',
  borderColor: '#e2e8f0',
  borderWidth: 2,
  backgroundColor: '#ffffff',
  backgroundImage: '/templates/simple.svg',
  cardBackBackgroundColor: '#312e81',
  cardBackImage: null,

  gameHp: '',
  gameMana: '',
  gameSuit: '',
  svgFrameColor: '#e2e8f0',
  svgCornerColor: '#e2e8f0',
  svgStrokeWidth: 1,

  elements: [
    {
      id: 'title',
      type: 'text',
      side: 'front',
      name: 'Title',
      x: 0, y: -160, width: 240, height: 30, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
      fontFamily: 'Outfit, sans-serif', fontSize: 20, color: '#1e293b',
      textAlign: 'center',
      defaultContent: 'Card Title'
    },
    {
      id: 'art',
      type: 'image',
      side: 'front',
      name: 'Illustration',
      x: 0, y: -25, width: 250, height: 190, rotate: 0, scale: 1, zIndex: 5, opacity: 1,
      url: ''
    },
    {
      id: 'description',
      type: 'multiline',
      side: 'front',
      name: 'Description',
      x: 0, y: 140, width: 240, height: 70, rotate: 0, scale: 1, zIndex: 10, opacity: 1,
      fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#475569',
      textAlign: 'left',
      defaultContent: 'Card description...'
    },
    {
      id: 'back_title',
      type: 'text',
      side: 'back',
      name: 'Game Title',
      x: 0, y: 0, width: 250, height: 40, rotate: 0, scale: 1.5, zIndex: 30, opacity: 1,
      fontFamily: 'serif', fontSize: 24, color: '#1e293b',
      textAlign: 'center',
      defaultContent: 'CARDCRAFT'
    },
    {
      id: 'corner',
      type: 'text',
      side: 'front',
      name: 'Cost',
      x: -135, y: -195, width: 20, height: 20, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
      fontFamily: 'sans-serif', fontSize: 12, color: '#000000',
      textAlign: 'center',
      defaultContent: '1'
    },
    {
      id: 'reversedCorner',
      type: 'text',
      side: 'front',
      name: 'Rarity',
      x: 135, y: 195, width: 20, height: 20, rotate: 0, scale: 1, zIndex: 15, opacity: 1,
      fontFamily: 'sans-serif', fontSize: 12, color: '#000000',
      textAlign: 'center',
      defaultContent: '•'
    }
  ]
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

  // Conflict resolution state
  const [conflictDeck, setConflictDeck] = useState<Deck | null>(null);
  const [conflictRemoteDate, setConflictRemoteDate] = useState<Date | null>(null);
  const [pendingSyncDecks, setPendingSyncDecks] = useState<Deck[]>([]);

  // Toast State
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: ToastType }[]>([]);

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const DELETED_DECKS_KEY = 'cardcraftstudio-deleted-deck-ids';
  const [pendingDeletions, setPendingDeletions] = useState<string[]>(() => {
    const saved = localStorage.getItem(DELETED_DECKS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(DELETED_DECKS_KEY, JSON.stringify(pendingDeletions));
  }, [pendingDeletions]);

  // Init Drive Service & Session Check
  useEffect(() => {
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (CLIENT_ID) {
      driveService.init({ clientId: CLIENT_ID })
        .then(async () => {
          try {
            // Try to reuse stored token or silent sign-in, fallback to explicit consent if needed
            await driveService.ensureSignedIn();
            setIsAuthenticated(true);
          } catch {
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

  const handleSync = async (resumeDecks?: Deck[], silent = false) => {
    setSyncError(null);
    try {
      // Ensure valid session (refreshes token if needed)
      await driveService.ensureSignedIn();
      setIsAuthenticated(true);

      setIsSyncing(true);

      // 1. Get list of files from Drive
      const remoteFiles = await driveService.listFiles();

      // 1.5 Process Pending Deletions FIRST
      if (pendingDeletions.length > 0) {
        const remainingDeletions = [...pendingDeletions];

        for (const deletedId of pendingDeletions) {
          const fileToDelete = remoteFiles.find((f: DriveFile) => f.name === `deck-${deletedId}.json`);
          if (fileToDelete) {
            try {
              await driveService.deleteFile(fileToDelete.id);
              // Also delete any images associated? Maybe later.
            } catch (e) {
              console.error("Failed to delete remote file", e);
            }
          }
          // Remove from local pending list regardless of success (if it didn't exist, we considered it done)
          const index = remainingDeletions.indexOf(deletedId);
          if (index > -1) remainingDeletions.splice(index, 1);
        }
        setPendingDeletions(remainingDeletions);

        // Refresh file list after deletions
        // (Optimization: we could just filter the local array, but let's be safe)
      }

      // Refresh list to ensure we don't sync deleted files
      const currentRemoteFiles = await driveService.listFiles();

      // Determine work list (either full list or remainder if resuming after conflict)
      const decksToProcess = resumeDecks || decks;

      for (let i = 0; i < decksToProcess.length; i++) {
        const localDeck = decksToProcess[i];
        const remoteFile = currentRemoteFiles.find((f: DriveFile) => f.name === `deck-${localDeck.id}.json`);
        const localContent = JSON.stringify(localDeck);

        // SYNC IMAGES FIRST
        const imageRefs = new Set<string>();
        localDeck.cards.forEach(card => {
          if (card.data) {
            Object.values(card.data).forEach(val => {
              if (val && typeof val === 'string' && val.startsWith('ref:')) imageRefs.add(val);
            });
          }
        });
        if (imageRefs.size > 0) {
          await imageService.syncImagesToCloud(Array.from(imageRefs));
        }

        if (remoteFile) {
          const remoteTime = new Date(remoteFile.modifiedTime).getTime();
          const localTime = localDeck.updatedAt || 0;

          if (Math.abs(remoteTime - localTime) > 1000) {
            const remoteContent = await driveService.getFileContent(remoteFile.id);
            const localHash = await calculateHash(localContent);
            const remoteHash = await calculateHash(remoteContent);

            if (localHash === remoteHash) continue;

            if (remoteTime > localTime + 1000) {
              const remaining = decksToProcess.slice(i + 1);
              setPendingSyncDecks(remaining);
              setConflictDeck(localDeck);
              setConflictRemoteDate(new Date(remoteTime));
              setIsSyncing(false);
              return;
            }
          } else {
            continue;
          }
        }

        await driveService.saveFile(`deck-${localDeck.id}.json`, localContent);
        addToast(`Uploaded "${localDeck.name}" to cloud`, 'success');
      }

      // 2. Download NEW decks from cloud (files we don't have locally)
      if (!resumeDecks) {
        const newRemoteFiles = currentRemoteFiles.filter((f: DriveFile) =>
          f.name.startsWith('deck-') &&
          f.name.endsWith('.json') &&
          !decks.find(d => `deck-${d.id}.json` === f.name)
        );

        if (newRemoteFiles.length > 0) {
          addToast(`Found ${newRemoteFiles.length} new decks in cloud`, 'info');
        }

        for (const file of newRemoteFiles) {
          try {
            const content = await driveService.getFileContent(file.id);
            const importedDeck = JSON.parse(content);

            // Basic validation
            if (importedDeck && importedDeck.id && importedDeck.cards) {
              // Download missing images for this deck
              const imageRefs = new Set<string>();
              importedDeck.cards.forEach((card: { data?: Record<string, unknown> }) => {
                if (card.data) {
                  Object.values(card.data).forEach((val: unknown) => {
                    if (val && typeof val === 'string' && val.startsWith('ref:')) imageRefs.add(val.replace('ref:', ''));
                  });
                }
              });

              if (imageRefs.size > 0) {
                // We need to find the specific files for these hashes
                for (const hash of imageRefs) {
                  const imgFile = remoteFiles.find((f: DriveFile) => f.name.startsWith(`img-${hash}.`));
                  if (imgFile) {
                    await imageService.downloadImageIfMissing(hash, imgFile.id);
                  }
                }
              }

              setDecks(prev => {
                if (prev.find(d => d.id === importedDeck.id)) return prev;
                return [...prev, importedDeck];
              });
              addToast(`Downloaded "${importedDeck.name}" from cloud`, 'success');
            }
          } catch (e) {
            console.error("Failed to parse remote deck", file.name, e);
          }
        }
      }

      // Mark sync as enabled persistently
      if (!silent) addToast('Sync completed successfully!');
    } catch (error: unknown) {
      console.error('Sync failed', error);
      const message = (error as { result?: { error?: { message: string } }, message?: string })?.result?.error?.message || (error as Error)?.message || "An unexpected error occurred during sync.";
      setSyncError(message);
      addToast('Sync failed: ' + message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResolveConflict = async (keepLocal: boolean) => {
    if (!conflictDeck) return;

    // Close dialog
    const deckToResolve = conflictDeck;
    setConflictDeck(null);
    setConflictRemoteDate(null);

    setIsSyncing(true);

    try {
      if (keepLocal) {
        // Upload local version (overwriting remote)
        await driveService.saveFile(`deck-${deckToResolve.id}.json`, JSON.stringify(deckToResolve));
        addToast(`Kept local version of "${deckToResolve.name}"`, 'success');
      } else {
        // Download remote version (overwriting local)
        const remoteFiles = await driveService.listFiles();
        const remoteFile = remoteFiles.find((f: DriveFile) => f.name === `deck-${deckToResolve.id}.json`);
        if (remoteFile) {
          const content = await driveService.getFileContent(remoteFile.id);
          const remoteDeck = JSON.parse(content);

          // Download missing images for this deck
          const imageRefs = new Set<string>();
          remoteDeck.cards.forEach((card: { data?: Record<string, unknown> }) => {
            if (card.data) {
              Object.values(card.data).forEach((val: unknown) => {
                if (val && typeof val === 'string' && val.startsWith('ref:')) imageRefs.add(val.replace('ref:', ''));
              });
            }
          });

          if (imageRefs.size > 0) {
            for (const hash of imageRefs) {
              const imgFile = remoteFiles.find((f: DriveFile) => f.name.startsWith(`img-${hash}.`));
              if (imgFile) {
                await imageService.downloadImageIfMissing(hash, imgFile.id);
              }
            }
          }

          setDecks(prev => prev.map(d => d.id === deckToResolve.id ? remoteDeck : d));
          addToast(`Loaded cloud version of "${deckToResolve.name}"`, 'success');
        }
      }

      // Resume sync for remaining decks
      if (pendingSyncDecks.length > 0) {
        const remaining = pendingSyncDecks;
        setPendingSyncDecks([]);
        await handleSync(remaining);
      } else {
        setIsSyncing(false);
      }
    } catch (err) {
      console.error("Conflict resolution failed", err);
      setSyncError("Failed to resolve conflict. Please try again.");
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
    const legacyCards = localStorage.getItem('cardcraftstudio-deck');
    if (legacyCards) {
      try {
        const style = localStorage.getItem('cardcraftstudio-style');
        return [{
          id: crypto.randomUUID(),
          name: localStorage.getItem('cardcraftstudio-deck-name') || "My First Deck",
          cards: JSON.parse(legacyCards),
          style: style ? JSON.parse(style) : defaultDeckStyle,
          updatedAt: Date.now()
        }];
      } catch (e) { console.error("Migration failed", e); }
    }
    return [];
  });

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'deck' | 'editor' | 'style'>('library');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [isNewDeckDialogOpen, setIsNewDeckDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<number | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  // Image Migration Effect
  useEffect(() => {
    const migrateImages = async () => {
      let changed = false;
      const migratedDecks = await Promise.all(decks.map(async (deck) => {
        let deckChanged = false;
        const migratedCards = await Promise.all(deck.cards.map(async (card) => {
          let hasChanges = false;
          const newData = { ...card.data };

          if (card.data) {
            for (const [key, val] of Object.entries(card.data)) {
              if (val) {
                const processed = await imageService.processImage(val);
                if (processed && processed !== val) {
                  newData[key] = processed;
                  hasChanges = true;
                }
              }
            }
          }

          if (hasChanges) {
            deckChanged = true;
            return { ...card, data: newData };
          }
          return card;
        }));

        if (deckChanged) {
          changed = true;
          return { ...deck, cards: migratedCards, updatedAt: Date.now() };
        }
        return deck;
      }));

      if (changed) {
        setDecks(migratedDecks);
      }
    };

    migrateImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Auto-Sync Effect
  useEffect(() => {
    const isEnabled = localStorage.getItem(SYNC_ENABLED_KEY) === 'true';
    if (!isEnabled || !isAuthenticated || isSyncing) return;

    const timer = setTimeout(() => {
      handleSync(undefined, true);
    }, 5000); // 5 second debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks, isAuthenticated]); // Trigger on deck changes or auth status

  const activeDeck = activeDeckId ? decks.find(d => d.id === activeDeckId) : null;

  // Deck Management Helpers
  const handleCreateDeck = () => {
    setIsNewDeckDialogOpen(true);
  };

  const finalizeCreateDeck = (name: string) => {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: name,
      cards: [],
      style: { ...defaultDeckStyle },
      updatedAt: Date.now()
    };
    setDecks(prev => [...prev, newDeck]);
    setActiveDeckId(newDeck.id);
    setView('deck');
    setIsNewDeckDialogOpen(false);
    addToast(`Created deck "${name}"`, 'success');
  };

  const handleDeleteDeck = (id: string) => {
    setDeckToDelete(id);
  };

  const confirmDeleteDeck = () => {
    if (deckToDelete) {
      const id = deckToDelete;
      setDecks(prev => prev.filter(d => d.id !== id));

      // Add to pending deletions for sync
      setPendingDeletions(prev => [...prev, id]);

      if (activeDeckId === id) {
        setActiveDeckId(null);
        setView('library');
      }
      addToast('Deck deleted', 'success');
    }
    setDeckToDelete(null);
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

  const handleImportDeck = async (file: File) => {
    try {
      const importedData = await importDeckFromZip(file);

      const newDeck: Deck = {
        id: crypto.randomUUID(),
        name: importedData.name,
        cards: importedData.cards.map(card => ({ ...card, id: crypto.randomUUID() })), // Regenerate IDs to avoid conflicts
        style: importedData.style || { ...defaultDeckStyle },
        updatedAt: Date.now()
      };

      setDecks(prev => [...prev, newDeck]);
      addToast(`Imported deck "${newDeck.name}"`, 'success');
    } catch (error) {
      console.error('Import error:', error);
      addToast('Failed to import deck', 'error');
    }
  };



  const handleEditCard = (index: number) => {
    setActiveCardIndex(index);
    setView('editor');
  };

  const handleDeleteCard = (index: number) => {
    if (!activeDeck) return;
    setCardToDelete(index);
  };

  const confirmDeleteCard = () => {
    if (activeDeck && cardToDelete !== null) {
      const newCards = activeDeck.cards.filter((_, i) => i !== cardToDelete);
      updateActiveDeck({ cards: newCards });
      addToast('Card deleted', 'success');
    }
    setCardToDelete(null);
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

  const handleCancelEditor = () => {
    setView('deck');
    setActiveCardIndex(null);
  };

  const handleAutoSaveCard = (card: CardConfig) => {
    if (!activeDeck) return;

    // Use a functional update to ensure we don't have race conditions with rapid updates
    setDecks(prevDecks => {
      return prevDecks.map(d => {
        if (d.id !== activeDeckId) return d;

        const newCards = [...d.cards];
        // If we are editing an existing card
        if (activeCardIndex !== null) {
          newCards[activeCardIndex] = card;
        } else {
          // If this is a new card, we technically shouldn't be here repeatedly without an index.
          // Ideally, we created the card *before* or we set the index immediately.
          // But for safety, if we really are "new", we push.
          // HOWEVER, this is dangerous for auto-save loops.
          // FIX: When "Add Card" is clicked, we should create a card immediately and open it.
          // But for now, let's just handle it safe: check if the card with this ID exists?
          // Or rely on the fact that once we push, we MUST set activeCardIndex.
          // But we can't set activeCardIndex in this reducer.
          // So, standard state update:
          return d; // Delegate to side-effect? No.
        }
        return { ...d, cards: newCards, updatedAt: Date.now() };
      });
    });
  };

  // Improved Add Card Flow: Create immediately then open
  const handleAddCard = () => {
    if (!activeDeck) return;
    const newCard: CardConfig = {
      id: crypto.randomUUID(),
      name: 'New Card',
      data: {
        title: 'New Card',
        description: 'Card description...',
        art: '',
        corner: '',
      },
      borderColor: '#000000',
      borderWidth: 8
    };
    const newCards = [...activeDeck.cards, newCard];
    updateActiveDeck({ cards: newCards });
    setActiveCardIndex(newCards.length - 1);
    setView('editor');
  };

  // ... (keep other handlers)

  // Update CardStudio usage below

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
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={handleBackToLibrary}
              title="CardCraft Studio"
            >
              <img src={logo} alt="CardCraft Studio Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                CardCraft Studio
              </span>
            </div>

            {/* Navigation Breadcrumbs */}
            <Navigation
              view={view}
              deckName={activeDeck?.name}
              onNavigateToLibrary={handleBackToLibrary}
              onNavigateToDeck={() => setView('deck')}
            />
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
                onImportDeck={handleImportDeck}
              />
              <NewDeckDialog
                isOpen={isNewDeckDialogOpen}
                onClose={() => setIsNewDeckDialogOpen(false)}
                onCreate={finalizeCreateDeck}
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
              <SyncConflictDialog
                isOpen={!!conflictDeck}
                onClose={() => {
                  setConflictDeck(null);
                  setConflictRemoteDate(null);
                  setPendingSyncDecks([]);
                  setIsSyncing(false);
                }}
                localDeck={conflictDeck}
                remoteDate={conflictRemoteDate}
                onKeepLocal={() => handleResolveConflict(true)}
                onUseCloud={() => handleResolveConflict(false)}
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
                onOpenStyleEditor={() => setView('style')}
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
                onUpdate={handleAutoSaveCard}
                onDone={handleCancelEditor}
              />
            </motion.div>
          )}
          {view === 'style' && activeDeck && (
            <motion.div
              key="style-view"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <GlobalStyleEditor
                deckStyle={activeDeck.style}
                sampleCard={activeDeck.cards[0]}
                onUpdateStyle={handleUpdateDeckStyle}
                onUpdateStyleAndSync={async (style: DeckStyle) => {
                  handleUpdateDeckStyle(style);
                  // Passing the updated deck explicitly to ensure it syncs the new state
                  const updatedDeck = { ...activeDeck, style, updatedAt: Date.now() };
                  await handleSync([updatedDeck], false);
                }}
                onBack={() => setView('deck')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 w-full py-4 border-t bg-background/80 backdrop-blur-md z-50 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; 2026 Antonio 'GNUton' Aloisio. Released under GPL-3.0.
        </p>
      </footer>

      <ConfirmationDialog
        isOpen={deckToDelete !== null}
        title="Delete Deck"
        message="Are you sure you want to delete this deck? All cards within it will be permanently lost."
        onConfirm={confirmDeleteDeck}
        onCancel={() => setDeckToDelete(null)}
        confirmLabel="Delete Deck"
        isDestructive={true}
      />

      <ConfirmationDialog
        isOpen={cardToDelete !== null}
        title="Delete Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        onConfirm={confirmDeleteCard}
        onCancel={() => setCardToDelete(null)}
        confirmLabel="Delete"
        isDestructive={true}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
