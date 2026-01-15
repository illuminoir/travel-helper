'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTags } from '@/hooks/use-tags';
import { useState } from 'react';

interface CreateTagDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTag: (newTag: { id: number; name: string }) => void;
}

export function CreateTagDialog({ isOpen, onClose }: CreateTagDialogProps) {
    const [tagName, setTagName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { createTag } = useTags();

    const handleCreate = async () => {
        if (!tagName.trim()) {
            setError('Tag name cannot be empty')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await createTag(tagName);
            setTagName('')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create tag')
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreate()
        }
    }

    const handleDialogChange = (open: boolean) => {
        if (!open) {
            setTagName('')
            setError(null)
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Tag</DialogTitle>
                    <DialogDescription>Enter a name for the new tag</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        placeholder="Tag name"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        autoFocus
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={loading}>
                            {loading ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
