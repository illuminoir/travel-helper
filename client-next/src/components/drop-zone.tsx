'use client';

import type React from 'react';
import type { TravelItem } from '@/types';

import { ItemCard } from './item-card';
import { Button } from '@/components/ui/button';

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
    return (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-sm">
                    Dropped Items ({items.length})
                </h3>
                {items.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearAll}
                        className="text-xs"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-center">
                    <p>Drag items here</p>
                </div>
            ) : (
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                    {items.map((item) => (
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
