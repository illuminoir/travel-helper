'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';
import { useState } from 'react';
import { useItems } from '@/hooks/use-items';
import { AddItemDialog } from '@/components/add-item-dialog';
import { ItemsList } from '@/components/items-list';
import { DropZone } from '@/components/drop-zone';
import { TagContextMenu } from '@/components/tag-context-menu';
import { TagFilter } from '@/components/tag-filter';
import { ItemContextMenu } from '@/components/item-context-menu';
import { EditWeightDialog } from '@/components/edit-weight-dialog';
import { TravelItem } from '@/types';

export default function Home() {
    const { items, droppedItems, loading, error, deleteItem, addItem, moveItem, clearDropped, refetchItems, updateWeight } = useItems();
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedItem, setSelectedItem] = useState<TravelItem | null>(null);
    const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
    const [isEditWeightOpen, setIsEditWeightOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [weightUnit, setWeightUnit] = useState<'g' | 'kg' | 'lb' | 'oz'>('kg');
    const [showClearAllDialog, setShowClearAllDialog] = useState(false);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: TravelItem } | null>(null);

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

    const handleRightClick = (item: TravelItem, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, item });
            console.log('context menu set');
        } else {
            setSelectedItem(item);
            setIsTagDialogOpen(true);
        }
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

    const totalKg = droppedItems.reduce((sum, current) => sum + Number(current.weight), 0.0);
    const convertedWeight =
        weightUnit === 'kg' ? totalKg :
            weightUnit === 'g'  ? totalKg * 1000 :
                weightUnit === 'lb' ? totalKg * 2.20462 :
                    totalKg * 35.274; // oz

    return (
        <main className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Item Manager</h1>
                    <p className="text-muted-foreground">
                        Drag items to organize them • Double-click to move • Right-click to edit • Click tags to filter
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
                    <div className="flex items-center justify-between">
                        <AddItemDialog onAdd={addItem} isLoading={false} />
                        {items.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setShowClearAllDialog(true)}
                            >
                                Clear All Items
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Total Weight :</span>
                        <span>{Math.round(convertedWeight * 1000) / 1000} {weightUnit}</span>
                        <select
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value as 'g' | 'kg' | 'lb' | 'oz')}
                            className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                        </select>
                    </div>

                    <div className="border-2 border-border rounded-lg p-4 flex flex-col min-h-0 bg-card">
                        <h2 className="font-semibold text-lg flex-shrink-0 mb-3">Available Items</h2>
                        <TagFilter selectedTags={selectedTags} onTagRemove={handleTagClick} />
                        <div className="flex-1 min-h-0 overflow-y-auto mt-2">
                            <ItemsList
                                items={filteredItems}
                                onDelete={(id) => deleteItem(id, false)}
                                onDragStart={handleDragStart}
                                onRightClick={handleRightClick}
                                onTagClick={handleTagClick}
                                onDoubleClick={handleDoubleClick}
                            />
                        </div>
                    </div>

                    <div
                        className={`border-2 rounded-lg p-4 flex flex-col min-h-0 transition-colors ${
                            isDragOver
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-card'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                            e.preventDefault();
                            const data = e.dataTransfer.getData('application/json');
                            if (data) {
                                const item = JSON.parse(data);
                                handleDrop(item);
                            }
                        }}
                    >
                        <DropZone
                            items={droppedItems}
                            onRestore={handleRestoreItem}
                            onClearAll={clearDropped}
                            onRightClick={handleRightClick}
                            onDoubleClick={handleDoubleClickDropped}
                        />
                    </div>
                </div>
            </div>

            {contextMenu && (
                <ItemContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onEditTags={() => {
                        setSelectedItem(contextMenu.item);
                        setIsTagDialogOpen(true);
                    }}
                    onEditWeight={() => {
                        setSelectedItem(contextMenu.item);
                        setIsEditWeightOpen(true);
                    }}
                    onClose={() => setContextMenu(null)}
                />
            )}

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

            {selectedItem && isEditWeightOpen && (
                <EditWeightDialog
                    item={selectedItem}
                    isOpen={isEditWeightOpen}
                    onClose={() => {
                        setIsEditWeightOpen(false);
                        setSelectedItem(null);
                    }}
                    onSave={async (item, newWeight) => {
                        await updateWeight(item, newWeight);
                    }}
                />
            )}

            <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear All Items?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete all {items.length} items. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowClearAllDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                await Promise.all(items.map(item => deleteItem(item.id, false)));
                                refetchItems();
                                setShowClearAllDialog(false);
                            }}
                        >
                            Delete All
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
