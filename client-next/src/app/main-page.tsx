'use client';

import React from 'react';
import { useState } from 'react';
import { useItems } from '@/hooks/use-items';
import { AddItemDialog } from '@/components/add-item-dialog';
import { ItemsList } from '@/components/items-list';
import { DropZone } from '@/components/drop-zone';
import { TagContextMenu } from '@/components/tag-context-menu';
import { TagFilter } from '@/components/tag-filter';
import { TravelItem } from '@/types';

export default function Home() {
    const { items, droppedItems, loading, error, deleteItem, addItem, moveItem, clearDropped, refetchItems } = useItems();
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedItem, setSelectedItem] = useState<TravelItem | null>(null);
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const handleDragStart = (e: React.DragEvent, item: TravelItem) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(item));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (item: TravelItem) => {
        setIsDragOver(false);
        moveItem(item, true);
    };

    const handleRestoreItem = (id: number) => {
        const itemToRestore = droppedItems.find((item) => item.id === id);
        if (itemToRestore) {
            moveItem(itemToRestore, false);
        }
    };

    const handleRightClick = (item: TravelItem) => {
        setSelectedItem(item);
        setIsTagDialogOpen(true);
    };

    const handleDoubleClick = (item: TravelItem) => {
        moveItem(item, true);
    };

    const handleDoubleClickDropped = (item: TravelItem) => {
        moveItem(item, false);
    };

    const filteredItems =
        selectedTags.length === 0
            ? items
            : items.filter((item) =>
                selectedTags.every((tag) => Array.isArray(item.tags) && item.tags.map((tag) => tag.name).includes(tag)),
            );

    const handleTagClick = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Item Manager</h1>
                    <p className="text-muted-foreground">
                        Drag items to organize them • Double-click to move • Right-click to tag • Click tags to filter
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-96">
                    <AddItemDialog onAdd={addItem} isLoading={false} />
                    <div>Total Weight : {droppedItems.reduce((sum, current) => sum + Number(current.weight), 0.0)}</div>
                    <div className="space-y-4">
                        <h2 className="font-semibold text-lg">Available Items</h2>
                        <TagFilter selectedTags={selectedTags} onTagRemove={handleTagClick} />
                        <ItemsList
                            items={filteredItems}
                            onDelete={(id) => deleteItem(id, false)}
                            onDragStart={handleDragStart}
                            onRightClick={handleRightClick}
                            onTagClick={handleTagClick}
                            onDoubleClick={handleDoubleClick}
                        />
                    </div>

                    <DropZone
                        items={droppedItems}
                        onDrop={handleDrop}
                        onRestore={handleRestoreItem}
                        isDragOver={isDragOver}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClearAll={clearDropped}
                        onRightClick={handleRightClick}
                        onDoubleClick={handleDoubleClickDropped}
                    />
                </div>
            </div>

            {selectedItem && (
                <TagContextMenu
                    item={selectedItem}
                    items={items}
                    isOpen={isTagDialogOpen}
                    onClose={() => {
                        setIsTagDialogOpen(false);
                        setSelectedItem(null);
                    }}
                    onTagCreated={() => {}}
                    refetchItems={refetchItems}
                />
            )}
        </main>
    );
}
