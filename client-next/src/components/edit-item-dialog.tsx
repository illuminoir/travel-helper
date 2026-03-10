'use client';

import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateTagDialog } from '@/components/create-tag-dialog';
import { useTags } from '@/hooks/use-tags';
import type { Tag, TravelItem } from '@/types';
import { Check, Trash2 } from 'lucide-react';

interface EditItemDialogProps {
    item: TravelItem;
    items: TravelItem[];
    isOpen: boolean;
    onClose: () => void;
    onSaveWeight: (item: TravelItem, newWeight: number) => Promise<void>;
    refetchItems: () => void;
}

export function EditItemDialog({ item, items, isOpen, onClose, onSaveWeight, refetchItems }: EditItemDialogProps) {
    const { tags, updateTags, createTag, deleteTag, loading } = useTags();

    // Weight state
    const [weight, setWeight] = useState(String(parseFloat(String(item.weight))));
    const [weightLoading, setWeightLoading] = useState(false);
    const [weightError, setWeightError] = useState('');

    // Tag state
    const [savedTags, setSavedTags] = useState<string[]>(item.tags.map(t => t.name));
    const [selectedTags, setSelectedTags] = useState<string[]>(item.tags.map(t => t.name));
    const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

    const handleSaveWeight = async () => {
        const parsed = parseFloat(weight);
        if (isNaN(parsed) || parsed < 0) {
            setWeightError('Please enter a valid positive number.');
            return;
        }
        setWeightLoading(true);
        await onSaveWeight(item, parsed);
        setWeightLoading(false);
        setWeightError('');
    };

    const handleTagToggle = (tagName: string) => {
        setSelectedTags(prev =>
            prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
        );
    };

    const handleSaveTags = async () => {
        const tagsToCreate = tags.filter(tag =>
            selectedTags.filter(name => !savedTags.includes(name)).includes(tag.name)
        ).map(tag => tag.id);
        const tagsToDelete = tags.filter(tag =>
            savedTags.filter(name => !selectedTags.includes(name)).includes(tag.name)
        ).map(tag => tag.id);

        await updateTags(item.id, tagsToCreate, tagsToDelete);
        await refetchItems();
        setSavedTags([...selectedTags]);
    };

    const handleSave = async () => {
        await handleSaveWeight();
        await handleSaveTags();
    }

    const handleSaveAndExit = async () => {
        await handleSave();
        onClose();
    };

    const handleCreateTag = async (tagName: string) => {
        await createTag(tagName);
        handleTagToggle(tagName);
        setIsCreateTagDialogOpen(false);
    };

    const isTagInUse = (tagId: number) =>
        items.some(i => i.tags.some(t => t.id === tagId));

    const handleDeleteTag = async (tag: Tag) => {
        await deleteTag(tag.id);
        setSelectedTags(prev => prev.filter(t => t !== tag.name));
        setSavedTags(prev => prev.filter(t => t !== tag.name));
        refetchItems();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{String(item.name)}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* Weight */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Weight</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={weight}
                                    onChange={(e) => { setWeight(e.target.value); setWeightError(''); }}
                                    placeholder="Weight in kg"
                                    className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground">kg</span>
                            </div>
                            {weightError && <p className="text-sm text-destructive">{weightError}</p>}
                        </div>

                        <div className="border-t" />

                        {/* Tags */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Tags</p>
                            <Button onClick={() => setIsCreateTagDialogOpen(true)} variant="outline" className="w-full">
                                + Create New Tag
                            </Button>

                            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                                {tags.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No tags available</p>
                                ) : (
                                    tags.map((tag) => (
                                        <ContextMenu key={tag.id}>
                                            <ContextMenuTrigger asChild>
                                                <button
                                                    onClick={() => handleTagToggle(tag.name)}
                                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center justify-between transition-colors"
                                                >
                                                    <span className="text-sm">{tag.name}</span>
                                                    {selectedTags.includes(tag.name) && <Check className="w-4 h-4 text-green-600" />}
                                                </button>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                                <ContextMenuItem
                                                    onClick={() => isTagInUse(tag.id) ? setTagToDelete(tag) : handleDeleteTag(tag)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    ))
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {selectedTags.map((tag, index) => (
                                    <div key={`${tag}-${index}`} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                        {tag}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                                <Button variant="outline" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save'}
                                </Button>
                                <Button onClick={handleSaveAndExit} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save & Exit'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete tag confirmation */}
            <Dialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tag?</DialogTitle>
                        <DialogDescription>
                            {`Are you sure you want to delete "${tagToDelete?.name}"?`}
                            <br />
                            This will remove it from all items and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setTagToDelete(null)} disabled={loading}>Cancel</Button>
                        <Button variant="destructive" disabled={loading} onClick={async () => {
                            if (!tagToDelete) return;
                            await handleDeleteTag(tagToDelete);
                            setTagToDelete(null);
                        }}>
                            {loading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <CreateTagDialog
                isOpen={isCreateTagDialogOpen}
                onClose={() => setIsCreateTagDialogOpen(false)}
                onCreateTag={handleCreateTag}
            />
        </>
    );
}