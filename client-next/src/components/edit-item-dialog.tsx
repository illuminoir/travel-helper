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
import { useWeightUnit } from '@/contexts/weight-unit-context';
import { toGrams, fromGrams } from '@/lib/weight';
import { itemsApi } from '@/lib/api';

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
    const { weightUnit } = useWeightUnit();

    // Name state
    const [name, setName] = useState(item.name);
    const [nameLoading, setNameLoading] = useState(false);
    const [nameError, setNameError] = useState('');

    // Weight state
    const [weight, setWeight] = useState(
        String(Math.round(fromGrams(parseFloat(String(item.weight)), weightUnit) * 1000) / 1000)
    );
    const [weightLoading, setWeightLoading] = useState(false);
    const [weightError, setWeightError] = useState('');

    // Tag state
    const [savedTags, setSavedTags] = useState<string[]>(item.tags.map(t => t.name));
    const [selectedTags, setSelectedTags] = useState<string[]>(item.tags.map(t => t.name));
    const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

    const handleSaveName = async () => {
        if (!name.trim()) { setNameError('Name cannot be empty.'); return; }
        if (name.trim() === item.name) return; // no change
        setNameLoading(true);
        try {
            await itemsApi.updateName(item.id, name.trim());
            await refetchItems();
            setNameError('');
        } catch (err) {
            setNameError(err instanceof Error ? err.message : 'Failed to rename item');
        } finally {
            setNameLoading(false);
        }
    };

    const handleSaveWeight = async () => {
        const parsed = parseFloat(weight);
        if (isNaN(parsed) || parsed < 0) {
            setWeightError('Please enter a valid positive number.');
            return;
        }
        setWeightLoading(true);
        await onSaveWeight(item, toGrams(parsed, weightUnit));
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
            selectedTags.filter(n => !savedTags.includes(n)).includes(tag.name)
        ).map(tag => tag.id);
        const tagsToDelete = tags.filter(tag =>
            savedTags.filter(n => !selectedTags.includes(n)).includes(tag.name)
        ).map(tag => tag.id);
        await updateTags(item.id, tagsToCreate, tagsToDelete);
        await refetchItems();
        setSavedTags([...selectedTags]);
    };

    const handleSave = async () => {
        await handleSaveName();
        await handleSaveWeight();
        await handleSaveTags();
    };

    const handleSaveAndExit = async () => {
        await handleSave();
        onClose();
    };

    const handleCreateTag = async (tagName: string) => {
        await createTag(tagName);
        handleTagToggle(tagName);
        setIsCreateTagDialogOpen(false);
    };

    const isTagInUse = (tagId: number) => items.some(i => i.tags.some(t => t.id === tagId));

    const handleDeleteTag = async (tag: Tag) => {
        await deleteTag(tag.id);
        setSelectedTags(prev => prev.filter(t => t !== tag.name));
        setSavedTags(prev => prev.filter(t => t !== tag.name));
        refetchItems();
    };

    const isBusy = loading || weightLoading || nameLoading;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{String(item.name)}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">

                        {/* Name */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Name</p>
                            <Input
                                value={name}
                                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                                placeholder="Item name"
                            />
                            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                        </div>

                        <div className="border-t" />

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
                                    onFocus={(e) => {
                                        const target = e.target;
                                        setTimeout(() => target.setSelectionRange(target.value.length, target.value.length), 0);
                                    }}
                                    className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground">{weightUnit}</span>
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
                                <Button variant="outline" onClick={onClose} disabled={isBusy}>Cancel</Button>
                                <Button variant="outline" onClick={handleSave} disabled={isBusy}>
                                    {isBusy ? 'Saving...' : 'Save'}
                                </Button>
                                <Button onClick={handleSaveAndExit} disabled={isBusy}>
                                    {isBusy ? 'Saving...' : 'Save & Exit'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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