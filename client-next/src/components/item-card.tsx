'use client';

import type React from 'react';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TravelItem } from '@/types';


interface ItemCardProps {
    item: TravelItem;
    onDelete: (id: number) => void;
    onDragStart?: (e: React.DragEvent) => void;
    onRightClick?: (item: TravelItem) => void;
    onTagClick?: (tag: string) => void;
    onDoubleClick?: (item: TravelItem) => void;
    draggable?: boolean;
    isDropped?: boolean;
}

export function ItemCard({
                             item,
                             onDelete,
                             onDragStart,
                             onRightClick,
                             onTagClick,
                             onDoubleClick,
                             draggable = false,
                             isDropped = false,
                         }: ItemCardProps) {
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        onRightClick?.(item)
    }

    const handleDoubleClick = () => {
        onDoubleClick?.(item)
    }

    return (
        <Card
            className="relative p-4 flex flex-col gap-3 cursor-move hover:shadow-md transition-shadow"
            draggable={draggable}
            onDragStart={onDragStart}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
        >
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="absolute top-2 right-2 text-base leading-none"
            >
                {isDropped ? 'x' : <Trash2 className="w-4 h-4" />}
            </Button>

            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                        {} • {item.weight}kg
                    </p>
                </div>
            </div>
            {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => {
                        return (
                            <button
                                key={`${item.id}-tag-${index}`}
                                onClick={() => onTagClick?.(tag.name)}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                            >
                                {tag.name}
                            </button>
                        )
                    })}
                </div>
            )}
        </Card>
    );
}
