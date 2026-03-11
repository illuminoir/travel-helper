'use client';

import React, { useState } from 'react';
import { TravelItem } from '@/types';
import { ItemCard } from './item-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ItemsListProps {
    items: TravelItem[];
    onDelete: (id: number) => void;
    onDragStart: (e: React.DragEvent, item: TravelItem) => void;
    onRightClick?: (item: TravelItem, e: React.MouseEvent) => void;
    onDoubleClick?: (item: TravelItem) => void;
    onTagClick?: (tag: string) => void;
    onQuantityChange?: (item: TravelItem, quantity: number) => void;
}

export function ItemsList({
                              items,
                              onDelete,
                              onDragStart,
                              onRightClick,
                              onTagClick,
                              onDoubleClick,
                              onQuantityChange,
                          }: ItemsListProps) {
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? items.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
        )
        : items;

    return (
        <div className="flex flex-col h-full gap-2">
            <div className="relative flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {filtered.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        {search.trim() ? 'No items match your search' : 'No items available'}
                    </div>
                ) : (
                    filtered.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onDelete={onDelete}
                            onDragStart={(e) => onDragStart(e, item)}
                            onRightClick={onRightClick}
                            onTagClick={onTagClick}
                            draggable
                            onDoubleClick={onDoubleClick}
                            onQuantityChange={onQuantityChange}
                        />
                    ))
                )}
            </div>
        </div>
    );
}