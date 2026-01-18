import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from './ConfirmationDialog';
import { describe, it, expect, vi } from 'vitest';

describe('ConfirmationDialog', () => {
    it('does not render when closed', () => {
        render(
            <ConfirmationDialog
                isOpen={false}
                title="Confirm"
                message="Are you sure?"
                onConfirm={() => { }}
                onCancel={() => { }}
            />
        );
        expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('renders when open', () => {
        render(
            <ConfirmationDialog
                isOpen={true}
                title="Delete Card"
                message="Are you sure?"
                onConfirm={() => { }}
                onCancel={() => { }}
                confirmLabel="Delete"
                isDestructive={true}
            />
        );
        expect(screen.getByText('Delete Card')).toBeInTheDocument();
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button clicked', () => {
        const handleConfirm = vi.fn();
        render(
            <ConfirmationDialog
                isOpen={true}
                title="Confirm"
                message="Mesg"
                onConfirm={handleConfirm}
                onCancel={() => { }}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(handleConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button clicked', () => {
        const handleCancel = vi.fn();
        render(
            <ConfirmationDialog
                isOpen={true}
                title="Confirm"
                message="Mesg"
                onConfirm={() => { }}
                onCancel={handleCancel}
            />
        );
        fireEvent.click(screen.getByText('Cancel'));
        expect(handleCancel).toHaveBeenCalled();
    });
});
