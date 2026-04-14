'use client';

import React, { useRef, useState } from 'react';
import type { TravelItem } from '@/types';
import { ItemCard } from './item-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SortButtons, SortState } from '@/components/sort-buttons';
import { smartWeight } from '@/lib/weight';
import { useWeightUnit } from '@/contexts/weight-unit-context';

interface ItemsPanelProps {
    title: string;
    bagIndex: number | null; // null = available items panel
    items: TravelItem[];
    weightLimitGrams?: number;
    onDelete: (id: number) => void;
    onDragStart?: (e: React.DragEvent, item: TravelItem) => void;
    onDoubleClick?: (item: TravelItem) => void;
    onRightClick?: (item: TravelItem, e: React.MouseEvent) => void;
    onTagClick?: (tag: string) => void;
    onQuantityChange?: (item: TravelItem, quantity: number) => void;
    onReorder?: (reordered: TravelItem[]) => void;
    onDropNewItem?: (item: TravelItem, index: number) => void;
    onClearAll?: () => void;
    sort: SortState;
    onSort: (sort: SortState) => void;
    headerActions?: React.ReactNode;
    tagFilter?: React.ReactNode;
}

export function ItemsPanel({
                               title,
                               bagIndex,
                               items,
                               weightLimitGrams,
                               onDelete,
                               onDragStart,
                               onDoubleClick,
                               onRightClick,
                               onTagClick,
                               onQuantityChange,
                               onReorder,
                               onDropNewItem,
                               onClearAll,
                               sort,
                               onSort,
                               headerActions,
                               tagFilter,
                           }: ItemsPanelProps) {
    const { weightUnit } = useWeightUnit();
    const [search, setSearch] = useState('');
    const [insertIndex, setInsertIndex] = useState<number | null>(null);
    const [isDragOverZone, setIsDragOverZone] = useState(false);
    const dragItemIndex = useRef<number | null>(null);
    const dragCounter = useRef(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const isBagPanel = bagIndex !== null;

    const filtered = search.trim()
        ? items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
        : items;

    const totalGrams = items.reduce((sum, item) => sum + Number(item.weight) * (item.quantity ?? 1), 0);
    const isOverLimit = weightLimitGrams !== undefined && weightLimitGrams > 0 && totalGrams > weightLimitGrams;
    const weightOver = totalGrams - weightLimitGrams;

    // --- Drag & drop (bag panels only) ---
    const getInsertIndex = (e: React.DragEvent): number => {
        const y = e.clientY;
        for (let i = 0; i < itemRefs.current.length; i++) {
            const el = itemRefs.current[i];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (y < rect.top + rect.height / 2) return i;
        }
        return filtered.length;
    };

    const handleItemDragStart = (e: React.DragEvent, index: number) => {
        dragItemIndex.current = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('internal', 'reorder');
    };

    const handleItemDragEnd = () => {
        dragItemIndex.current = null;
        setInsertIndex(null);
    };

    const handleZoneDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current++;
        setIsDragOverZone(true);
    };

    const handleZoneDragLeave = () => {
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragOverZone(false);
            setInsertIndex(null);
        }
    };

    const handleZoneDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isBagPanel) setInsertIndex(getInsertIndex(e));
    };

    const handleZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragOverZone(false);

        const isInternal = e.dataTransfer.getData('internal') === 'reorder';

        if (isBagPanel) {
            const idx = getInsertIndex(e);
            setInsertIndex(null);

            if (isInternal) {
                const fromIndex = dragItemIndex.current;
                if (fromIndex !== null && fromIndex !== idx) {
                    const reordered = [...items];
                    const [moved] = reordered.splice(fromIndex, 1);
                    const adjustedIdx = idx > fromIndex ? idx - 1 : idx;
                    reordered.splice(adjustedIdx, 0, moved);
                    onReorder?.(reordered);
                }
            } else {
                const data = e.dataTransfer.getData('application/json');
                if (data) onDropNewItem?.(JSON.parse(data), idx);
            }
        }

        dragItemIndex.current = null;
    };

    return (
        <div
            className={`flex flex-col gap-3 flex-1 min-h-0 rounded-lg transition-colors ${
                isBagPanel && isDragOverZone && dragItemIndex.current === null ? 'bg-primary/5' : ''
            }`}
            onDragEnter={isBagPanel ? handleZoneDragEnter : undefined}
            onDragLeave={isBagPanel ? handleZoneDragLeave : undefined}
            onDragOver={isBagPanel ? handleZoneDragOver : undefined}
            onDrop={isBagPanel ? handleZoneDrop : undefined}
        >
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
                <div className="flex flex-col">
                    <h3 className="font-semibold text-lg">{title} ({items.length})</h3>
                    {isBagPanel && (
                        <span className={`text-sm font-medium ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {smartWeight(totalGrams, weightUnit)}
                            {weightLimitGrams !== undefined && weightLimitGrams > 0 && (
                                <> / {smartWeight(weightLimitGrams, weightUnit)}{isOverLimit && ' ⚠'}</>
                            )}
                        </span>
                    )}
                    {isBagPanel && isOverLimit && (
                        <span className="text-sm font-medium text-destructive">
                            {weightOver} {weightUnit} over the limit
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <SortButtons sort={sort} onChange={onSort} />
                    {headerActions}
                    {isBagPanel && onClearAll && (
                        <Button variant="outline" size="sm" onClick={onClearAll} disabled={items.length === 0}>
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {tagFilter}

            <div className="relative flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder={`Search ${isBagPanel ? 'dropped' : ''} items...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>

            {/* Items list */}
            {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-center">
                    <p>{isBagPanel ? 'Drag items here' : 'No items available'}</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-center">
                    <p>No items match your search</p>
                </div>
            ) : (
                <div className={`overflow-y-auto flex-1 min-h-0 pb-2 ${!isBagPanel ? 'pr-2' : ''}`}>
                    {filtered.map((item, index) => (
                        <div
                            key={item.id}
                            ref={el => { itemRefs.current[index] = el; }}
                            draggable={isBagPanel}
                            onDragStart={isBagPanel ? (e) => handleItemDragStart(e, index) : undefined}
                            onDragEnd={isBagPanel ? handleItemDragEnd : undefined}
                            className="relative mb-2"
                        >
                            {isBagPanel && insertIndex === index && (
                                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
                            )}
                            <ItemCard
                                item={item}
                                onDelete={onDelete}
                                onDragStart={!isBagPanel && onDragStart ? (e) => onDragStart(e, item) : undefined}
                                onRightClick={onRightClick}
                                onDoubleClick={onDoubleClick}
                                onTagClick={onTagClick}
                                draggable={!isBagPanel}
                                isDropped={isBagPanel}
                                onQuantityChange={onQuantityChange}
                            />
                        </div>
                    ))}
                    {isBagPanel && insertIndex === filtered.length && (
                        <div className="h-0.5 bg-primary rounded-full mx-0 mt-1" />
                    )}
                </div>
            )}
        </div>
    );
}