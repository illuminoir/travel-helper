'use client';

import { useState } from 'react';
import { useItems } from '@/hooks/use-items';
import { AddItemDialog } from '@/components/add-item-dialog';
import { ItemsList } from '@/components/items-list';
import { DropZone } from '@/components/drop-zone';
import { TravelItem } from '@/types';

export default function Home() {
    const { items, droppedItems, loading, error, deleteItem, addItem, moveItem, clearDropped } = useItems();
    const [isDragOver, setIsDragOver] = useState(false);

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

    const handleRestoreItem = (id: string) => {
        const itemToRestore = droppedItems.find((item) => item.id === id);
        if (itemToRestore) {
            moveItem(itemToRestore, false);
        }
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
                    <p className="text-muted-foreground">Drag items to organize them</p>
                </div>

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <AddItemDialog onAdd={addItem} isLoading={false} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-96">
                    <div className="space-y-4">
                        <h2 className="font-semibold text-lg">Available Items</h2>
                        <ItemsList
                            items={items}
                            onDelete={(id) => deleteItem(id, false)}
                            onDragStart={handleDragStart}
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
                    />
                </div>
            </div>
        </main>
    );
}
