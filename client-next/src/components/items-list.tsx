'use client';

import React from 'react';
import { TravelItem } from '@/types';
import { ItemCard } from './item-card';

interface ItemsListProps {
    items: TravelItem[];
    onDelete: (id: number) => void;
    onDragStart: (e: React.DragEvent, item: TravelItem) => void;
    onRightClick?: (item: TravelItem) => void;
    onDoubleClick?: (item: TravelItem) => void;
    onTagClick?: (tag: string) => void;
}

export function ItemsList({
    items,
    onDelete,
    onDragStart,
    onRightClick,
    onTagClick,
    onDoubleClick,
                          }: ItemsListProps) {
    return (
        <div className="h-full overflow-y-auto pr-2 space-y-2">
            {items.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No items available
                </div>
            ) : (
                items.map((item) => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        onDelete={onDelete}
                        onDragStart={(e) => onDragStart(e, item)}
                        onRightClick={onRightClick}
                        onTagClick={onTagClick}
                        draggable
                        onDoubleClick={onDoubleClick}
                    />
                ))
            )}
        </div>
    );


}
