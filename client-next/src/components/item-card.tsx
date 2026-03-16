'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TravelItem } from '@/types';
import { useWeightUnit } from '@/contexts/weight-unit-context';
import { smartWeight } from '@/lib/weight';

interface ItemCardProps {
    item: TravelItem;
    onDelete: (id: number) => void;
    onDragStart?: (e: React.DragEvent) => void;
    onRightClick?: (item: TravelItem, e: React.MouseEvent) => void;
    onTagClick?: (tag: string) => void;
    onDoubleClick?: (item: TravelItem) => void;
    onQuantityChange?: (item: TravelItem, quantity: number) => void;
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
                             onQuantityChange,
                             draggable = false,
                             isDropped = false,
                         }: ItemCardProps) {
    const {weightUnit} = useWeightUnit();
    const [quantity, setQuantity] = useState<number | string>(item.quantity ?? 1);

    useEffect(() => {
        setQuantity(item.quantity ?? 1);
    }, [item.quantity]);

    const commitQuantity = () => {
        const num = parseInt(String(quantity));
        const final = isNaN(num) || num < 1 ? 1 : num;
        setQuantity(final);
        onQuantityChange?.(item, final);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        onRightClick?.(item, e);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onDoubleClick?.(item);
    };

    return (
        <Card
            className="relative p-4 flex flex-col gap-3 cursor-move hover:shadow-md transition-shadow"
            draggable={draggable}
            onDragStart={onDragStart}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
        >
            {/* Top row: name + quantity + trash */}
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm truncate flex-1">{item.name}</h3>
                <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        onBlur={commitQuantity}
                        onKeyDown={(e) => e.key === 'Enter' && commitQuantity()}
                        className="w-8 h-6 text-center text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="text-base leading-none h-6 w-6 p-0"
                    >
                        {isDropped ? 'x' : <Trash2 className="w-4 h-4"/>}
                    </Button>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {smartWeight(parseFloat(String(item.weight)), weightUnit)}
            </p>

            {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => (
                        <button
                            key={`${item.id}-tag-${index}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTagClick?.(tag.name);
                            }}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            )}
        </Card>
    );
}