'use client';


import { CreateTagDialog } from '@/components/create-tag-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useTags } from '@/hooks/use-tags';

import type { Tag, TravelItem } from '@/types';
import { Check, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

interface TagContextMenuProps {
    item: TravelItem;
    items: TravelItem[];
    isOpen: boolean;
    onClose: () => void;
    onTagCreated: (tag: { id: number; name: string }) => void;
    refetchItems: () => void;
}

export function TagContextMenu({
                                   item,
                                   items,
                                   isOpen,
                                   onClose,
                                   refetchItems,
                               }: TagContextMenuProps) {
    const { tags, updateTags, createTag, deleteTag, loading } = useTags();
    const [selectedTags, setSelectedTags] = useState<string[]>(item.tags.map(tag => tag.name));
    const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
    const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

    const handleTagToggle = (tagName: string) => {
        setSelectedTags(prevTags =>
            prevTags.some(tag => tag === tagName)
                ? prevTags.filter(tag => tag !== tagName)
                : [...prevTags, tagName]
        );
    };

    const handleSave = async () => {
        const itemTags = item.tags;
        const itemTagNames = itemTags.map(tag => tag.name);

        const tagsToCreate = tags.filter(tag => selectedTags
            .filter(tagName => !itemTagNames.includes(tagName))
            .includes(tag.name))
            .map(tag => tag.id);
        const tagsToDelete = itemTags.filter(tag => !selectedTags.includes(tag.name))
            .map(tag => tag.id);

        await updateTags(item.id, tagsToCreate, tagsToDelete);
        refetchItems();
        onClose();
    };

    const handleCreateTag = async (tagName: string) => {
        await createTag(tagName);
        setIsCreateTagDialogOpen(false);
    };

    const isTagInUse = (tagId: number) => {
        return items.some(item =>
            item.tags.some(tag => tag.id === tagId)
        );
    };

    const handleDeleteTag = async (tag: Tag) => {
        await deleteTag(tag.id);
        setSelectedTags(prev => prev.filter(t => t !== tag.name));
        refetchItems();
    };

    const handleDeleteClick = (tag: Tag) => {
        if (isTagInUse(tag.id)) {
            // Needs warning
            setTagToDelete(tag);
        } else {
            // Safe to delete immediately
            handleDeleteTag(tag);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tag Item</DialogTitle>
                        <DialogDescription>Add tags to: {String(item.name || 'Item')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Button onClick={() => setIsCreateTagDialogOpen(true)} variant="outline" className="w-full">
                            + Create New Tag
                        </Button>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Available Tags</p>
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
                                                    {selectedTags.includes(tag.name) &&
                                                        <Check className="w-4 h-4 text-green-600"/>}
                                                </button>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                                <ContextMenuItem
                                                    onClick={() => handleDeleteClick(tag)}
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
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag, index) => (
                                <div
                                    key={`tag-${tag}-${index}`}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                                >
                                    {tag}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Tags'}
                            </Button>
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
                        <Button
                            variant="outline"
                            onClick={() => setTagToDelete(null)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!tagToDelete) return;
                                await handleDeleteTag(tagToDelete);
                                setTagToDelete(null); // close dialog
                            }}
                            disabled={loading}
                        >
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
