'use client';

import { ItemCard } from './item-card';
import { TravelItem } from "@/types";

interface ItemsListProps {
    items: TravelItem[];
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent, item: TravelItem) => void;
    onRightClick?: (item: TravelItem) => void;
    onTagClick?: (tag: string) => void;
}

export function ItemsList({
                              items,
                              onDelete,
                              onDragStart,
                              onRightClick,
                              onTagClick,
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
                    onRightClick={onRightClick}
                    onTagClick={onTagClick}
                    draggable
                />
            ))}
        </div>
    );
}
