
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleDriveBackendService } from '../../src/services/googleDrive';
import { google } from 'googleapis';

// Mock googleapis
const { mockDrive, mockOAuth2Instance } = vi.hoisted(() => {
    const mockDrive = {
        files: {
            list: vi.fn(),
            get: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        }
    };

    const mockOAuth2Instance = {
        setCredentials: vi.fn(),
        getToken: vi.fn(),
        refreshAccessToken: vi.fn()
    };

    return { mockDrive, mockOAuth2Instance };
});

vi.mock('googleapis', () => {
    return {
        google: {
            auth: {
                OAuth2: vi.fn(function () {
                    return mockOAuth2Instance;
                }),
            },
            drive: vi.fn(() => mockDrive),
        }
    };
});

describe('GoogleDriveBackendService', () => {
    const mockAccessToken = 'mock-access-token';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listFiles', () => {
        it('should list files from the folder', async () => {
            // Mock finding the folder
            mockDrive.files.list.mockResolvedValueOnce({
                data: { files: [{ id: 'folder-id' }] }
            });

            // Mock listing files within folder
            const mockFiles = [{ id: 'file1', name: 'deck1.json' }];
            mockDrive.files.list.mockResolvedValueOnce({
                data: { files: mockFiles }
            });

            const result = await googleDriveBackendService.listFiles(mockAccessToken);

            expect(mockDrive.files.list).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockFiles);
        });

        it('should return empty list if folder not found', async () => {
            // Mock folder not found
            mockDrive.files.list.mockResolvedValueOnce({
                data: { files: [] }
            });

            const result = await googleDriveBackendService.listFiles(mockAccessToken);

            expect(mockDrive.files.list).toHaveBeenCalledTimes(1); // Only checked for folder
            expect(result).toEqual([]);
        });
    });

    describe('getFileContent', () => {
        it('should return string content', async () => {
            mockDrive.files.get.mockResolvedValueOnce({
                data: 'some content'
            });

            const result = await googleDriveBackendService.getFileContent(mockAccessToken, 'file-id');
            expect(result).toBe('some content');
        });

        it('should stringify object content', async () => {
            const mockObj = { foo: 'bar' };
            mockDrive.files.get.mockResolvedValueOnce({
                data: mockObj
            });

            const result = await googleDriveBackendService.getFileContent(mockAccessToken, 'file-id');
            expect(result).toBe(JSON.stringify(mockObj));
        });
    });

    describe('saveFile', () => {
        it('should create new file if it does not exist', async () => {
            // Mock getOrCreateFolder -> find folder
            mockDrive.files.list.mockResolvedValueOnce({
                data: { files: [{ id: 'folder-id' }] }
            });
            // Mock check if file exists -> not found
            mockDrive.files.list.mockResolvedValueOnce({
                data: { files: [] }
            });
            // Mock create file
            mockDrive.files.create.mockResolvedValueOnce({
                data: { id: 'new-file-id' }
            });

            const result = await googleDriveBackendService.saveFile(mockAccessToken, 'new-file', 'content');

            expect(mockDrive.files.create).toHaveBeenCalled();
            expect(result).toBe('new-file-id');
        });

        it('should update file if it exists', async () => {
            // Mock getOrCreateFolder -> find folder
            mockDrive.files.list.mockResolvedValueOnce({
                data: { files: [{ id: 'folder-id' }] }
            });
            // Mock check if file exists -> found
            mockDrive.files.list.mockResolvedValueOnce({
                data: { files: [{ id: 'existing-file-id' }] }
            });
            // Mock update file
            mockDrive.files.update.mockResolvedValueOnce({});

            const result = await googleDriveBackendService.saveFile(mockAccessToken, 'existing-file', 'content');

            expect(mockDrive.files.update).toHaveBeenCalled();
            expect(result).toBe('existing-file-id');
        });
    });

    describe('deleteFile', () => {
        it('should delete file', async () => {
            mockDrive.files.delete.mockResolvedValueOnce({});
            await googleDriveBackendService.deleteFile(mockAccessToken, 'file-id');
            expect(mockDrive.files.delete).toHaveBeenCalledWith({ fileId: 'file-id' });
        });
    });
});
