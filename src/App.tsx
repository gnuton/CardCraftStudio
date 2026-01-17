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

const APP_VERSION = '1.2.0-drive-sync';
const DECKS_STORAGE_KEY = 'cardcraftstudio-decks';
const THEME_STORAGE_KEY = 'cardcraftstudio-theme';
const SYNC_PROMPT_KEY = 'cardcraftstudio-sync-prompt-shown';
const SYNC_ENABLED_KEY = 'cardcraftstudio-sync-enabled';

export interface DeckStyle {
  cornerColor: string;
  titleColor: string;
  descriptionColor: string;
  cornerFont: string;
  cornerFontSize?: number;
  titleFont: string;
  titleFontSize?: number;
  descriptionFont: string;
  descriptionFontSize?: number;
  backgroundImage: string | null;
  cornerContent: string;

  // Title Extended Styles
  titleX: number;
  titleY: number;
  titleRotate: number;
  titleScale: number;
  titleWidth: number;
  titleBackgroundColor?: string;
  titleBorderColor?: string;
  titleBorderStyle?: string;
  titleBorderWidth?: number; // pixels
  titleOpacity?: number;
  titleZIndex?: number;

  // Description Extended Styles
  descriptionX: number;
  descriptionY: number;
  descriptionRotate: number;
  descriptionScale: number;
  descriptionWidth: number;
  descriptionBackgroundColor?: string;
  descriptionBorderColor?: string;
  descriptionBorderStyle?: string;
  descriptionBorderWidth?: number;
  descriptionOpacity?: number;
  descriptionZIndex?: number;

  // Art/Center Image Extended Styles
  artX: number;
  artY: number;
  artWidth: number;
  artHeight: number;
  artBackgroundColor?: string;
  artBorderColor?: string;
  artBorderStyle?: string;
  artBorderWidth?: number;
  artOpacity?: number;
  artZIndex?: number;
  artRotate?: number; // Added explicitly as it was missing in standard but used in transform

  // Visibility Flags
  showTitle?: boolean;
  showDescription?: boolean;
  showArt?: boolean;
  showTypeBar?: boolean;
  showFlavorText?: boolean;
  showStatsBox?: boolean;
  showWatermark?: boolean;
  showRarityIcon?: boolean;
  showCollectorInfo?: boolean;

  // Type Bar
  typeBarX?: number; typeBarY?: number; typeBarWidth?: number; typeBarRotate?: number;
  typeBarBackgroundColor?: string; typeBarBorderColor?: string; typeBarBorderWidth?: number; typeBarOpacity?: number; typeBarZIndex?: number;
  typeBarContent?: string; typeBarColor?: string; typeBarFont?: string; typeBarFontSize?: number;

  // Flavor Text
  flavorTextX?: number; flavorTextY?: number; flavorTextWidth?: number; flavorTextRotate?: number;
  flavorTextBackgroundColor?: string; flavorTextBorderColor?: string; flavorTextBorderWidth?: number; flavorTextOpacity?: number; flavorTextZIndex?: number;
  flavorTextContent?: string; flavorTextColor?: string; flavorTextFont?: string; flavorTextFontSize?: number;

  // Stats Box
  statsBoxX?: number; statsBoxY?: number; statsBoxWidth?: number; statsBoxHeight?: number; statsBoxRotate?: number;
  statsBoxBackgroundColor?: string; statsBoxBorderColor?: string; statsBoxBorderWidth?: number; statsBoxOpacity?: number; statsBoxZIndex?: number;
  statsBoxContent?: string; statsBoxColor?: string; statsBoxFont?: string; statsBoxFontSize?: number;

  // Watermark
  watermarkX?: number; watermarkY?: number; watermarkWidth?: number; watermarkHeight?: number; watermarkRotate?: number;
  watermarkOpacity?: number; watermarkZIndex?: number; watermarkUrl?: string | null;

  // Rarity Icon
  rarityIconX?: number; rarityIconY?: number; rarityIconWidth?: number; rarityIconHeight?: number; rarityIconRotate?: number;
  rarityIconZIndex?: number; rarityIconUrl?: string | null;

  // Collector Info
  collectorInfoX?: number; collectorInfoY?: number; collectorInfoWidth?: number; collectorInfoRotate?: number;
  collectorInfoZIndex?: number; collectorInfoContent?: string; collectorInfoColor?: string; collectorInfoFont?: string; collectorInfoFontSize?: number;

  // Corner Extended Styles
  showCorner: boolean;
  cornerX: number;
  cornerY: number;
  cornerRotate: number;
  cornerWidth: number;
  cornerHeight: number;
  cornerBackgroundColor?: string;
  cornerBorderColor?: string;
  cornerBorderStyle?: string;
  cornerBorderWidth?: number;
  cornerOpacity?: number;
  cornerZIndex?: number;

  // Reversed Corner Extended Styles
  showReversedCorner: boolean;
  reversedCornerX: number;
  reversedCornerY: number;
  reversedCornerRotate: number;
  reversedCornerWidth: number;
  reversedCornerHeight: number;
  reversedCornerBackgroundColor?: string;
  reversedCornerBorderColor?: string;
  reversedCornerBorderStyle?: string;
  reversedCornerBorderWidth?: number;
  reversedCornerOpacity?: number;
  reversedCornerZIndex?: number;
  reversedCornerFontSize?: number;

  // Game Logic
  gameHp: string;
  gameMana: string;
  gameSuit: string;
  // SVG Styling
  svgFrameColor: string;
  svgCornerColor: string;
  svgStrokeWidth: number;

  // New Base Settings
  cornerRadius?: number;
  shadowIntensity?: number;
  textureOverlay?: 'none' | 'paper' | 'noise' | 'foil' | 'grunge';
  textureOpacity?: number;
  globalFont?: string;
  showBleedLines?: boolean;
  showSafeZone?: boolean;

  // Card Back Styles
  cardBackImage?: string | null;
  cardBackBackgroundColor?: string;
  cardBackTitleContent?: string;
  cardBackTitleFont?: string;
  cardBackTitleFontSize?: number;
  cardBackTitleColor?: string;
  showCardBackTitle?: boolean;
  cardBackTitleX?: number;
  cardBackTitleY?: number;
  cardBackTitleRotate?: number;
  cardBackTitleScale?: number;
  cardBackTitleWidth?: number;
  cardBackTitleZIndex?: number;

  // Copyright Element (Back Only)
  showCardBackCopyright?: boolean;
  cardBackCopyrightContent?: string;
  cardBackCopyrightFont?: string;
  cardBackCopyrightFontSize?: number;
  cardBackCopyrightColor?: string;
  cardBackCopyrightX?: number;
  cardBackCopyrightY?: number;
  cardBackCopyrightRotate?: number;
  cardBackCopyrightScale?: number;
  cardBackCopyrightWidth?: number;
  cardBackCopyrightZIndex?: number;

  id?: string;
  isLocked?: boolean;
}

const defaultDeckStyle: DeckStyle = {
  cornerColor: '#000000',
  titleColor: '#000000',
  descriptionColor: '#000000',
  cornerFont: 'serif',
  titleFont: 'sans-serif',
  descriptionFont: 'sans-serif',
  backgroundImage: null,
  cornerContent: 'A',

  titleX: 0,
  titleY: 0,
  titleRotate: 0,
  titleScale: 1,
  titleWidth: 200,
  titleBackgroundColor: 'rgba(241, 245, 249, 0.9)', // slate-100/90
  titleBorderColor: '#cbd5e1', // slate-300
  titleBorderStyle: 'solid',
  titleBorderWidth: 1,
  titleOpacity: 1,
  titleZIndex: 20,

  descriptionX: 0,
  descriptionY: 0,
  descriptionRotate: 0,
  descriptionScale: 1,
  descriptionWidth: 250,
  descriptionBackgroundColor: 'rgba(255, 255, 255, 0.1)', // white/10
  descriptionBorderColor: 'rgba(255, 255, 255, 0.2)', // white/20
  descriptionBorderStyle: 'solid',
  descriptionBorderWidth: 1,
  descriptionOpacity: 1,
  descriptionZIndex: 20,

  artX: 0,
  artY: 0,
  artWidth: 264,
  artHeight: 164,
  artRotate: 0,
  artZIndex: 10,
  showTitle: true,
  showDescription: true,
  showArt: true,
  showTypeBar: false,
  showFlavorText: false,
  showStatsBox: false,
  showWatermark: false,
  showRarityIcon: false,
  showCollectorInfo: false,

  // Type Bar Defaults
  typeBarX: 0, typeBarY: -20, typeBarWidth: 200, typeBarRotate: 0,
  typeBarBackgroundColor: 'rgba(255, 255, 255, 0.9)', typeBarBorderColor: '#000000', typeBarBorderWidth: 1, typeBarOpacity: 1, typeBarZIndex: 25,
  typeBarContent: 'Type - Subtype', typeBarColor: '#000000', typeBarFont: 'sans-serif',

  // Flavor Text Defaults
  flavorTextX: 0, flavorTextY: 100, flavorTextWidth: 220, flavorTextRotate: 0,
  flavorTextBackgroundColor: 'transparent', flavorTextBorderColor: 'transparent', flavorTextBorderWidth: 0, flavorTextOpacity: 1, flavorTextZIndex: 25,
  flavorTextContent: 'Flavor text goes here.', flavorTextColor: '#000000', flavorTextFont: 'serif',

  // Stats Box Defaults
  statsBoxX: 100, statsBoxY: 150, statsBoxWidth: 60, statsBoxHeight: 30, statsBoxRotate: 0,
  statsBoxBackgroundColor: '#ffffff', statsBoxBorderColor: '#000000', statsBoxBorderWidth: 1, statsBoxOpacity: 1, statsBoxZIndex: 35,
  statsBoxContent: '1 / 1', statsBoxColor: '#000000', statsBoxFont: 'sans-serif',

  // Watermark Defaults
  watermarkX: 0, watermarkY: 0, watermarkWidth: 100, watermarkHeight: 100, watermarkRotate: 0,
  watermarkOpacity: 0.3, watermarkZIndex: 5, watermarkUrl: null,

  // Rarity Icon Defaults
  rarityIconX: 110, rarityIconY: 0, rarityIconWidth: 20, rarityIconHeight: 20, rarityIconRotate: 0,
  rarityIconZIndex: 35, rarityIconUrl: null,

  // Collector Info Defaults
  collectorInfoX: 0, collectorInfoY: 195, collectorInfoWidth: 250, collectorInfoRotate: 0,
  collectorInfoZIndex: 35, collectorInfoContent: 'Artist Name | 001/100', collectorInfoColor: '#000000', collectorInfoFont: 'sans-serif',

  showCorner: true,
  cornerX: -125,
  cornerY: -185,
  cornerRotate: 0,
  cornerWidth: 40,
  cornerHeight: 40,
  cornerZIndex: 30,

  showReversedCorner: true,
  reversedCornerX: 125,
  reversedCornerY: 185,
  reversedCornerRotate: 180,
  reversedCornerWidth: 40,
  reversedCornerHeight: 40,
  reversedCornerZIndex: 30,

  // Functionality defaults
  gameHp: '20',
  gameMana: '10',
  gameSuit: '♥',
  svgFrameColor: '#000000',
  svgCornerColor: '#000000',
  svgStrokeWidth: 2,

  // Card Back Defaults
  cardBackImage: null,
  cardBackBackgroundColor: '#312e81', // indigo-900
  cardBackTitleContent: 'GAME TITLE',
  cardBackTitleFont: 'serif',
  cardBackTitleColor: '#ffffff',
  showCardBackTitle: true,
  cardBackTitleX: 0,
  cardBackTitleY: 0,
  cardBackTitleRotate: 0,
  cardBackTitleScale: 1.5,
  cardBackTitleWidth: 250,
  cardBackTitleZIndex: 30,

  showCardBackCopyright: true,
  cardBackCopyrightContent: '© 2024 CardCraft Studio',
  cardBackCopyrightFont: 'sans-serif',
  cardBackCopyrightColor: '#ffffff',
  cardBackCopyrightX: 0,
  cardBackCopyrightY: 180,
  cardBackCopyrightRotate: 0,
  cardBackCopyrightScale: 0.8,
  cardBackCopyrightWidth: 200,
  cardBackCopyrightZIndex: 30
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

  const handleSync = async (resumeDecks?: Deck[], silent = false) => {
    setSyncError(null);
    try {
      if (!driveService.isSignedIn) {
        await driveService.signIn();
        setIsAuthenticated(true);
      }

      setIsSyncing(true);

      // 1. Get list of files from Drive
      const remoteFiles = await driveService.listFiles();

      // Determine work list (either full list or remainder if resuming after conflict)
      const decksToProcess = resumeDecks || decks;

      for (let i = 0; i < decksToProcess.length; i++) {
        const localDeck = decksToProcess[i];
        const remoteFile = remoteFiles.find((f: any) => f.name === `deck-${localDeck.id}.json`);
        const localContent = JSON.stringify(localDeck);

        // SYNC IMAGES FIRST
        const imageRefs = new Set<string>();
        localDeck.cards.forEach(card => {
          if (card.centerImage?.startsWith('ref:')) imageRefs.add(card.centerImage);
          if (card.topLeftImage?.startsWith('ref:')) imageRefs.add(card.topLeftImage);
          if (card.bottomRightImage?.startsWith('ref:')) imageRefs.add(card.bottomRightImage);
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
        const newRemoteFiles = remoteFiles.filter((f: any) =>
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
              importedDeck.cards.forEach((card: any) => {
                if (card.centerImage?.startsWith('ref:')) imageRefs.add(card.centerImage.replace('ref:', ''));
                if (card.topLeftImage?.startsWith('ref:')) imageRefs.add(card.topLeftImage.replace('ref:', ''));
                if (card.bottomRightImage?.startsWith('ref:')) imageRefs.add(card.bottomRightImage.replace('ref:', ''));
              });

              if (imageRefs.size > 0) {
                // We need to find the specific files for these hashes
                for (const hash of imageRefs) {
                  const imgFile = remoteFiles.find(f => f.name.startsWith(`img-${hash}.`));
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
      localStorage.setItem(SYNC_ENABLED_KEY, 'true');
      if (!silent) addToast('Sync completed successfully!');
    } catch (error: any) {
      console.error('Sync failed', error);
      const message = error?.result?.error?.message || error?.message || "An unexpected error occurred during sync.";
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
        const remoteFile = remoteFiles.find((f: any) => f.name === `deck-${deckToResolve.id}.json`);
        if (remoteFile) {
          const content = await driveService.getFileContent(remoteFile.id);
          const remoteDeck = JSON.parse(content);

          // Download missing images for this deck
          const imageRefs = new Set<string>();
          remoteDeck.cards.forEach((card: any) => {
            if (card.centerImage?.startsWith('ref:')) imageRefs.add(card.centerImage.replace('ref:', ''));
            if (card.topLeftImage?.startsWith('ref:')) imageRefs.add(card.topLeftImage.replace('ref:', ''));
            if (card.bottomRightImage?.startsWith('ref:')) imageRefs.add(card.bottomRightImage.replace('ref:', ''));
          });

          if (imageRefs.size > 0) {
            for (const hash of imageRefs) {
              const imgFile = remoteFiles.find(f => f.name.startsWith(`img-${hash}.`));
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
          const center = await imageService.processImage(card.centerImage);
          const top = await imageService.processImage(card.topLeftImage);
          const bottom = await imageService.processImage(card.bottomRightImage);

          if (center !== card.centerImage || top !== card.topLeftImage || bottom !== card.bottomRightImage) {
            deckChanged = true;
            return {
              ...card,
              centerImage: center,
              topLeftImage: top,
              bottomRightImage: bottom
            };
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
  }, []); // Run once on mount

  // Auto-Sync Effect
  useEffect(() => {
    const isEnabled = localStorage.getItem(SYNC_ENABLED_KEY) === 'true';
    if (!isEnabled || !isAuthenticated || isSyncing) return;

    const timer = setTimeout(() => {
      handleSync(undefined, true);
    }, 5000); // 5 second debounce

    return () => clearTimeout(timer);
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
      title: 'New Card',
      description: 'Card description...',
      topLeftContent: '',
      bottomRightContent: '',
      topLeftImage: null,
      bottomRightImage: null,
      centerImage: null,
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
