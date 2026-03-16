'use client';

import React, { useRef, useState } from 'react';
import type { TravelItem } from '@/types';
import { ItemCard } from './item-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SortButtons, SortState } from '@/components/sort-buttons';

interface DropZoneProps {
    items: TravelItem[];
    onRestore: (id: number) => void;
    onDoubleClick?: (item: TravelItem) => void;
    onClearAll: () => void;
    onRightClick?: (item: TravelItem, e: React.MouseEvent) => void;
    onQuantityChange?: (item: TravelItem, quantity: number) => void;
    onReorder: (items: TravelItem[]) => void;
    onDropNewItem: (item: TravelItem, index: number) => void;
    sort: SortState;
    onSort: (sort: SortState) => void;
}

export function DropZone({
                             items,
                             onRestore,
                             onDoubleClick,
                             onClearAll,
                             onRightClick,
                             onQuantityChange,
                             onReorder,
                             onDropNewItem,
                             sort,
                             onSort,
                         }: DropZoneProps) {
    const [search, setSearch] = useState('');
    const [insertIndex, setInsertIndex] = useState<number | null>(null);
    const [isDragOverZone, setIsDragOverZone] = useState(false);
    const dragItemIndex = useRef<number | null>(null);
    const dragCounter = useRef(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const filtered = search.trim()
        ? items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
        : items;

    const getInsertIndex = (e: React.DragEvent): number => {
        const y = e.clientY;
        for (let i = 0; i < itemRefs.current.length; i++) {
            const el = itemRefs.current[i];
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (y < mid) return i;
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
        setInsertIndex(getInsertIndex(e));
    };

    const handleZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragOverZone(false);

        const idx = getInsertIndex(e);
        setInsertIndex(null);

        const isInternal = e.dataTransfer.getData('internal') === 'reorder';

        if (isInternal) {
            const fromIndex = dragItemIndex.current;
            if (fromIndex !== null && fromIndex !== idx) {
                const reordered = [...items];
                const [moved] = reordered.splice(fromIndex, 1);
                const adjustedIdx = idx > fromIndex ? idx - 1 : idx;
                reordered.splice(adjustedIdx, 0, moved);
                onReorder(reordered);
            }
        } else {
            const data = e.dataTransfer.getData('application/json');
            if (data) {
                onDropNewItem(JSON.parse(data), idx);
            }
        }

        dragItemIndex.current = null;
    };

    return (
        <div
            className={`flex flex-col gap-3 flex-1 min-h-0 rounded-lg transition-colors ${isDragOverZone && dragItemIndex.current === null ? 'bg-primary/5' : ''}`}
            onDragEnter={handleZoneDragEnter}
            onDragLeave={handleZoneDragLeave}
            onDragOver={handleZoneDragOver}
            onDrop={handleZoneDrop}
        >
            <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-lg">Dropped Items ({items.length})</h3>
                <div className="flex items-center gap-2">
                    <SortButtons sort={sort} onChange={onSort} />
                    <Button variant="outline" size="sm" onClick={onClearAll} className="text-xs" disabled={items.length === 0}>
                        Clear All
                    </Button>
                </div>
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
                <div className="overflow-y-auto flex-1 min-h-0 pb-2">
                    {filtered.map((item, index) => (
                        <div
                            key={item.id}
                            ref={el => { itemRefs.current[index] = el; }}
                            draggable
                            onDragStart={(e) => handleItemDragStart(e, index)}
                            onDragEnd={handleItemDragEnd}
                            className="relative mb-2"
                        >
                            {insertIndex === index && (
                                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
                            )}
                            <ItemCard
                                item={item}
                                onDelete={onRestore}
                                onRightClick={onRightClick}
                                onDoubleClick={onDoubleClick}
                                draggable={false}
                                isDropped={true}
                                onQuantityChange={onQuantityChange}
                            />
                        </div>
                    ))}
                    {insertIndex === filtered.length && (
                        <div className="h-0.5 bg-primary rounded-full mx-0 mt-1" />
                    )}
                </div>
            )}
        </div>
    );
}