import { ChevronRight, Home, FolderOpen, Edit, Palette, LayoutGrid } from 'lucide-react';
import { cn } from '../utils/cn';

interface NavigationProps {
    view: 'library' | 'deck' | 'editor' | 'style';
    deckName?: string;
    onNavigateToLibrary: () => void;
    onNavigateToDeck?: () => void;
    onNavigateToLanding: () => void;
}

export const Navigation = ({
    view,
    deckName,
    onNavigateToLibrary,
    onNavigateToDeck,
    onNavigateToLanding
}: NavigationProps) => {
    return (
        <nav className="flex items-center gap-2 text-sm">
            {/* Home (Landing Page) */}
            <button
                onClick={onNavigateToLanding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                title="Back to Home"
            >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
            </button>

            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />

            {/* Library */}
            <button
                onClick={onNavigateToLibrary}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all",
                    view === 'library'
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Deck Library"
            >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Library</span>
            </button>

            {/* Show deck navigation when not in library */}
            {view !== 'library' && (
                <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />

                    {/* Deck */}
                    <button
                        onClick={onNavigateToDeck}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all",
                            view === 'deck'
                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        title="Back to Deck"
                    >
                        <FolderOpen className="w-4 h-4" />
                        <span className="hidden sm:inline max-w-[150px] truncate">
                            {deckName || 'Deck'}
                        </span>
                    </button>
                </>
            )}

            {/* Show card editor indicator */}
            {view === 'editor' && (
                <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 font-medium">
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline">Card Editor</span>
                    </div>
                </>
            )}

            {/* Show style editor indicator */}
            {view === 'style' && (
                <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 font-medium">
                        <Palette className="w-4 h-4" />
                        <span className="hidden sm:inline">Style Editor</span>
                    </div>
                </>
            )}
        </nav>
    );
};
