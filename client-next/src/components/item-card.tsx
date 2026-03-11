'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TravelItem } from '@/types';
import { useWeightUnit } from '@/contexts/weight-unit-context';
import { fromGrams } from '@/lib/weight';

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
    const { weightUnit } = useWeightUnit();
    const [quantity, setQuantity] = useState(item.quantity ?? 1);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep in sync if item changes externally
    useEffect(() => {
        setQuantity(item.quantity ?? 1);
    }, [item.quantity]);

    const handleQuantityChange = (val: number) => {
        const clamped = Math.max(1, val);
        setQuantity(clamped);
    };

    const commitQuantity = () => {
        onQuantityChange?.(item, quantity);
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
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="absolute top-2 right-2 text-base leading-none"
            >
                {isDropped ? 'x' : <Trash2 className="w-4 h-4" />}
            </Button>

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                <p className="text-xs text-muted-foreground">
                    • {Math.round(fromGrams(parseFloat(String(item.weight)), weightUnit) * 1000) / 1000} {weightUnit}
                </p>
            </div>

            {Array.isArray(item.tags) && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => (
                        <button
                            key={`${item.id}-tag-${index}`}
                            onClick={(e) => { e.stopPropagation(); onTagClick?.(tag.name); }}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Quantity — bottom right */}
            <div
                className="absolute bottom-2 right-2 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                <label className="text-xs text-muted-foreground"></label>
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    onBlur={commitQuantity}
                    onKeyDown={(e) => e.key === 'Enter' && commitQuantity()}
                    className="w-8 h-6 text-center text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
        </Card>
    );
}