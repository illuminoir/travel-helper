'use client';

import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Item } from '@/lib/api';

interface ItemCardProps {
    item: Item;
    onDelete: (id: string) => void;
    onDragStart?: (e: React.DragEvent) => void;
    draggable?: boolean;
    isDropped?: boolean;
}

export function ItemCard({
                             item,
                             onDelete,
                             onDragStart,
                             draggable = false,
                             isDropped = false,
                         }: ItemCardProps) {
    return (
        <Card
            className="p-4 flex items-center justify-between gap-4 cursor-move hover:shadow-md transition-shadow"
            draggable={draggable}
            onDragStart={onDragStart}
        >
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                <p className="text-xs text-muted-foreground">
                    {item.category} • {item.weight}kg
                </p>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="flex-shrink-0 text-base leading-none"
            >
                {isDropped ? 'x' : <Trash2 className="w-4 h-4" />}
            </Button>
        </Card>
    );
}