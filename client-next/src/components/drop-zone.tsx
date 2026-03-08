'use client';

import React, { useState } from 'react';
import type { TravelItem } from '@/types';

import { ItemCard } from './item-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface DropZoneProps {
    items: TravelItem[];
    onRestore: (id: number) => void;
    onDoubleClick?: (item: TravelItem) => void;
    onClearAll: () => void;
    onRightClick?: (item: TravelItem, e: React.MouseEvent) => void;
}

export function DropZone({
                             items,
                             onRestore,
                             onDoubleClick,
                             onClearAll,
                             onRightClick,
                         }: DropZoneProps) {
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? items.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
        )
        : items;

    return (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-lg">
                    Dropped Items ({items.length})
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearAll}
                    className="text-xs"
                    disabled={items.length === 0}
                >
                    Clear All
                </Button>
            </div>


            <div className="relative flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search dropped items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>

            {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-center">
                    <p>Drag items here</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-center">
                    <p>No items match your search</p>
                </div>
            ) : (
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                    {filtered.map((item) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            onDelete={onRestore}
                            onRightClick={onRightClick}
                            onDoubleClick={onDoubleClick}
                            draggable={false}
                            isDropped={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}