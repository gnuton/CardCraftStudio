import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, Moon, Cloud, CloudOff, CloudAlert } from 'lucide-react';
import logo from './assets/logo.png';
import { CardStudio, type CardConfig } from './components/CardStudio';
import { DeckStudio } from './components/DeckStudio';
import { LoadingScreen } from './components/LoadingScreen';
import { DeckLibrary, type Deck } from './components/DeckLibrary';
import { SyncErrorDialog } from './components/SyncErrorDialog';
import { SyncConflictDialog } from './components/SyncConflictDialog';
import { NewDeckDialog } from './components/NewDeckDialog';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { ToastContainer, type ToastType } from './components/Toast';
import { driveService } from './services/googleDrive';
import { calculateHash } from './utils/hash';
import { imageService } from './services/imageService';
import { assetService } from './services/assetService';
import { db } from './services/db';
import { GlobalStyleEditor } from './components/GlobalStyleEditor';
import { Navigation } from './components/Navigation';
import { importDeckFromZip } from './utils/deckIO';

import { UserProfile } from './components/UserProfile';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './contexts/AuthContext';
import { ImpersonationBanner } from './components/ImpersonationBanner';


const APP_VERSION = '1.2.0-drive-sync';

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}
const DECKS_STORAGE_KEY = 'cardcraftstudio-decks';
const THEME_STORAGE_KEY = 'cardcraftstudio-theme';
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
  const { isAuthenticated: isAppAuthenticated } = useAuth();
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
            await driveService.ensureSignedIn(true);
            setIsAuthenticated(true);
          } catch {
            setIsAuthenticated(false);
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
  const [decks, setDecks] = useState<Deck[]>([]);

  // Load decks from IndexedDB & Migration from localStorage
  useEffect(() => {
    const initDecks = async () => {
      try {
        // 1. Try IndexedDB
        let localDecks = await db.decks.toArray();

        // 2. If nothing in IDB, try migration from localStorage
        if (localDecks.length === 0) {
          const saved = localStorage.getItem(DECKS_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                localDecks = parsed;
                // Save to IDB immediately
                await db.decks.bulkPut(localDecks);
              }
            } catch (e) {
              console.error("Failed to parse localStorage decks", e);
            }
          }

          // Migration for legacy single-deck data
          const legacyCards = localStorage.getItem('cardcraftstudio-deck');
          if (legacyCards && localDecks.length === 0) {
            try {
              const style = localStorage.getItem('cardcraftstudio-style');
              const newDeck = {
                id: crypto.randomUUID(),
                name: localStorage.getItem('cardcraftstudio-deck-name') || "My First Deck",
                cards: JSON.parse(legacyCards),
                style: style ? JSON.parse(style) : defaultDeckStyle,
                updatedAt: Date.now()
              };
              localDecks = [newDeck];
              await db.decks.put(newDeck);
            } catch (e) { console.error("Migration failed", e); }
          }
        }

        setDecks(localDecks);

        // CLEANUP: If we have migrated or simply to prevent future errors, 
        // we slowly clear localStorage after we're sure we have the data.
        if (localDecks.length > 0) {
          setTimeout(() => {
            localStorage.removeItem(DECKS_STORAGE_KEY);
            localStorage.removeItem('cardcraftstudio-deck');
            localStorage.removeItem('cardcraftstudio-style');
            localStorage.removeItem('cardcraftstudio-deck-name');
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to initialize decks from DB", err);
      }
    };

    initDecks();
  }, []);

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [view, setView] = useState<'landing' | 'library' | 'deck' | 'editor' | 'style'>('landing');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [isNewDeckDialogOpen, setIsNewDeckDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<number | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);

  // Persistence to IndexedDB
  useEffect(() => {
    if (decks.length > 0) {
      db.decks.bulkPut(decks).catch(err => {
        console.error("Failed to save decks to IndexedDB", err);
      });
    }
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
    if (!isEnabled || !isAppAuthenticated || !isAuthenticated || isSyncing) return;

    const timer = setTimeout(() => {
      handleSync(undefined, true);
    }, 5000); // 5 second debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decks, isAuthenticated, isAppAuthenticated]); // Trigger on deck changes or auth status

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

      // Delete from IndexedDB
      db.decks.delete(id).catch(err => console.error("Failed to delete deck from DB", err));

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

  const handleGoToLanding = () => {
    setActiveDeckId(null);
    setView('landing');
  };

  // Editor Key
  const editorKey = activeDeck && activeCardIndex !== null && activeDeck.cards[activeCardIndex]
    ? activeDeck.cards[activeCardIndex].id
    : 'new';

  const handleLoginRequest = async () => {
    try {
      await driveService.ensureSignedIn(false);
      setIsAuthenticated(true);
      localStorage.setItem(SYNC_ENABLED_KEY, 'true');

      // Sync local assets if any
      assetService.syncLocalAssets().then(count => {
        if (count > 0) {
          addToast(`Synced ${count} local assets to cloud`, 'success');
        }
      }).catch(console.error);

      setView('library');
      addToast('Signed in successfully', 'success');
      setTimeout(() => handleSync(), 500);
    } catch (error) {
      console.error('Login failed', error);
      addToast('Login failed', 'error');

      // Clear legacy sync flag
      localStorage.removeItem(SYNC_ENABLED_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loader" version={APP_VERSION} />}

        {view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage
              onEnter={() => setView('library')}
              onLogin={handleLoginRequest}
              isAuthenticated={isAuthenticated || isAppAuthenticated}
            />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              },
              exit: { opacity: 0, x: 50, transition: { duration: 0.2 } }
            }}
            className="min-h-screen flex flex-col transition-colors duration-300"
          >
            {/* Impersonation Banner - Always on top */}
            <ImpersonationBanner />

            {/* Global Top Bar */}
            <motion.nav
              variants={{
                hidden: { y: -100, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="container flex h-16 items-center justify-between px-8 mx-auto max-w-7xl">
                <div className="flex items-center gap-8">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={handleBackToLibrary}
                    title="CardCraft Studio"
                  >
                    <img src={logo} alt="CardCraft Studio Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                      CardCraft Studio
                    </span>
                  </div>

                  <Navigation
                    view={view}
                    deckName={activeDeck?.name}
                    onNavigateToLanding={handleGoToLanding}
                    onNavigateToLibrary={handleBackToLibrary}
                    onNavigateToDeck={() => {
                      if (activeDeck) {
                        setView('deck');
                        setActiveCardIndex(null);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 mr-4 border-r pr-4">
                    {isSyncing ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <Cloud className="w-3 h-3" /> Syncing...
                      </div>
                    ) : syncError ? (
                      <div className="flex items-center gap-2 text-xs text-red-500 cursor-pointer hover:underline" onClick={() => setIsErrorDialogOpen(true)}>
                        <CloudAlert className="w-3 h-3" /> Sync Error
                      </div>
                    ) : (isAuthenticated && isAppAuthenticated) ? (
                      <div
                        className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-md transition-all"
                        title="Sync with Google Drive"
                        data-testid="sync-status"
                        onClick={() => handleSync()}
                      >
                        <Cloud className="w-3 h-3" /> Synced
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground" title="Local Mode">
                        <CloudOff className="w-3 h-3" /> Local
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </button>
                  <UserProfile />
                </div>
              </div>
            </motion.nav>

            <motion.main
              variants={{
                hidden: { x: 50, opacity: 0 },
                visible: { x: 0, opacity: 1, transition: { delay: 0.2, type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="flex-1 container mx-auto px-8 pt-24 pb-24 max-w-7xl"
            >
              {view === 'library' && (
                <DeckLibrary
                  decks={decks}
                  onCreateDeck={handleCreateDeck}
                  onImportDeck={handleImportDeck}
                  onSelectDeck={handleSelectDeck}
                  onDeleteDeck={handleDeleteDeck}
                />
              )}

              {view === 'deck' && activeDeck && (
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
              )}

              {view === 'editor' && activeDeck && activeCardIndex !== null && (
                <CardStudio
                  key={editorKey}
                  initialCard={activeDeck.cards[activeCardIndex]}
                  deckStyle={activeDeck.style}
                  onUpdate={handleAutoSaveCard}
                  onDone={handleCancelEditor}
                  onShowToast={addToast}
                />
              )}

              {view === 'style' && activeDeck && (
                <GlobalStyleEditor
                  deckStyle={activeDeck.style}
                  sampleCard={activeDeck.cards[0]}
                  onUpdateStyle={handleUpdateDeckStyle}
                  onUpdateStyleAndSync={async (style: DeckStyle) => {
                    handleUpdateDeckStyle(style);
                    const updatedDeck = { ...activeDeck, style, updatedAt: Date.now() };
                    await handleSync([updatedDeck], false);
                  }}
                  onBack={() => setView('deck')}
                />
              )}
            </motion.main>

            <motion.footer
              variants={{
                hidden: { y: 100, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } }
              }}
              className="fixed bottom-0 left-0 right-0 w-full py-4 border-t bg-background/80 backdrop-blur-md z-50 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Designed for Creators. Powered by CardCraft Studio.
              </p>
            </motion.footer>

            {/* Dialogs */}
            <NewDeckDialog
              isOpen={isNewDeckDialogOpen}
              onClose={() => setIsNewDeckDialogOpen(false)}
              onCreate={finalizeCreateDeck}
            />

            <ConfirmationDialog
              isOpen={cardToDelete !== null}
              title="Delete Card"
              message="Are you sure you want to delete this card? This action cannot be undone."
              confirmLabel="Delete"
              onConfirm={confirmDeleteCard}
              onCancel={() => setCardToDelete(null)}
            />

            <ConfirmationDialog
              isOpen={!!deckToDelete}
              title="Delete Deck"
              message="Are you sure you want to delete this deck? This action cannot be undone."
              confirmLabel="Delete"
              onConfirm={confirmDeleteDeck}
              onCancel={() => setDeckToDelete(null)}
            />

            <SyncErrorDialog
              isOpen={isErrorDialogOpen}
              onClose={() => setIsErrorDialogOpen(false)}
              error={syncError}
              onRetry={() => handleSync()}
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

            <ToastContainer toasts={toasts} onClose={removeToast} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
