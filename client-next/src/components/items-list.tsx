'use client';

import { ItemCard } from './item-card';
import type { Item } from '@/lib/api';

interface ItemsListProps {
    items: Item[];
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent, item: Item) => void;
}

export function ItemsList({
                              items,
                              onDelete,
                              onDragStart,
                          }: ItemsListProps) {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No items available
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {items.map((item) => (
                <ItemCard
                    key={item.id}
                    item={item}
                    onDelete={onDelete}
                    onDragStart={(e) => onDragStart(e, item)}
                    draggable
                />
            ))}
        </div>
    );
}
