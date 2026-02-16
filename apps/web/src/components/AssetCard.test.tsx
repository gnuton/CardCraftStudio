import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetCard } from './AssetCard';
import type { Asset } from '../types/asset';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('AssetCard', () => {
    const mockAsset: Asset = {
        id: '123',
        userId: 'user1',
        fileName: 'test-image.png',
        driveFileId: 'file1',
        fileHash: 'hash1',
        mimeType: 'image/png',
        fileSize: 1024,
        source: 'uploaded',
        category: 'icon',
        tags: ['test'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageCount: 0
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Mock fetch to return image data
        mockedFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ dataUrl: 'data:image/png;base64,fake' })
        });

        // Mock IntersectionObserver
        const observe = vi.fn();
        const disconnect = vi.fn();
        const unobserve = vi.fn();

        // Map to store callbacks for each instance (though we likely only have one)
        let observerCallback: IntersectionObserverCallback | null = null;

        const IntersectionObserverMock = class {
            constructor(callback: IntersectionObserverCallback, _options: any) {
                observerCallback = callback;
                return {
                    observe,
                    disconnect,
                    unobserve,
                    takeRecords: () => [],
                    root: null,
                    rootMargin: '',
                    thresholds: [],
                } as any;
            }
        };

        window.IntersectionObserver = IntersectionObserverMock as any;

        // Helper to trigger intersection manually
        (window as any).triggerIntersection = (isIntersecting: boolean) => {
            if (observerCallback) {
                observerCallback(
                    [{
                        isIntersecting,
                        target: document.createElement('div'),
                        boundingClientRect: {} as DOMRectReadOnly,
                        intersectionRatio: 1,
                        intersectionRect: {} as DOMRectReadOnly,
                        rootBounds: null,
                        time: Date.now()
                    }],
                    {} as IntersectionObserver
                );
            }
        };

        // Mock import.meta.env
        vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:3000' } });
    });

    it('renders asset info correctly', () => {
        const onClick = vi.fn();
        const onDelete = vi.fn();
        render(<AssetCard asset={mockAsset} onClick={onClick} onDelete={onDelete} />);

        // Expected to be visible immediately as per previous mock behavior if we trigger it
        (window as any).triggerIntersection(true);

        expect(screen.getByText('test-image.png')).toBeInTheDocument();
        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.getByText('📁 Uploaded')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        const onDelete = vi.fn();
        render(<AssetCard asset={mockAsset} onClick={onClick} onDelete={onDelete} />);

        fireEvent.click(screen.getByText('test-image.png').closest('div')!);
        expect(onClick).toHaveBeenCalled();
    });

    it('calls onDelete when delete button clicked', () => {
        const onClick = vi.fn();
        const onDelete = vi.fn();
        // confirm dialog mock
        window.confirm = vi.fn(() => true);

        render(<AssetCard asset={mockAsset} onClick={onClick} onDelete={onDelete} />);

        // Hover to show actions
        fireEvent.mouseEnter(screen.getByText('test-image.png').closest('div')!);

        const deleteBtn = screen.getByTitle('Delete');
        fireEvent.click(deleteBtn);

        expect(onDelete).toHaveBeenCalledWith('123');
    });

    it('renders image with correct source when visible', async () => {
        const mockToken = 'mock-asset-token';
        localStorage.setItem('cc_auth_token', mockToken);
        // Mock import.meta.env again to ensure consistency
        vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:3000' } });

        render(<AssetCard asset={mockAsset} onClick={() => { }} onDelete={() => { }} />);

        // Trigger intersection
        (window as any).triggerIntersection(true);

        const img = await screen.findByRole('img');
        expect(img).toHaveAttribute('src', `http://localhost:3001/api/assets/123/image?token=${mockToken}`);
    });

    it('hides Use button in Browsing Mode', () => {
        render(<AssetCard asset={mockAsset} onClick={() => { }} onDelete={() => { }} isPickingMode={false} />);

        fireEvent.mouseEnter(screen.getByText('test-image.png').closest('div')!);
        expect(screen.queryByTitle('Use')).toBeNull();
        expect(screen.getByTitle('View')).toBeInTheDocument();
        expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('shows Use button only in Picking Mode', () => {
        render(<AssetCard asset={mockAsset} onClick={() => { }} onDelete={() => { }} isPickingMode={true} />);

        fireEvent.mouseEnter(screen.getByText('test-image.png').closest('div')!);
        expect(screen.getByTitle('Use')).toBeInTheDocument();
    });

    it('shows action buttons on hover (Browsing Mode)', async () => {
        render(<AssetCard asset={mockAsset} onClick={() => { }} onDelete={() => { }} />);

        // Hover to show actions
        fireEvent.mouseEnter(screen.getByText('test-image.png').closest('div')!);

        expect(screen.getByTitle('View')).toBeInTheDocument();
        expect(screen.queryByTitle('Use in Card')).toBeNull(); // Should be hidden in browsing mode
        expect(screen.getByTitle('Download')).toBeInTheDocument();
        expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('handles toggle selection via circle in Bulk Mode', () => {
        const onToggle = vi.fn();
        render(
            <AssetCard
                asset={mockAsset}
                onClick={() => { }}
                onDelete={() => { }}
                isBulkMode={true}
                onToggleSelection={onToggle}
            />
        );

        const selectCircle = screen.getByTitle('Select');
        fireEvent.click(selectCircle);
        expect(onToggle).toHaveBeenCalledWith('123');
    });
});
