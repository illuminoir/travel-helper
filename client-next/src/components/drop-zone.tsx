'use client';

import { ItemCard } from './item-card';
import { Button } from '@/components/ui/button';
import {TravelItem} from "@/types";

interface DropZoneProps {
    items: TravelItem[];
    onDrop: (item: TravelItem) => void;
    onRestore: (id: string) => void;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onClearAll: () => void;
    onRightClick?: (item: TravelItem) => void;
}

export function DropZone({
                             items,
                             onDrop,
                             onRestore,
                             isDragOver,
                             onDragOver,
                             onDragLeave,
                             onClearAll,
                             onRightClick,
                         }: DropZoneProps) {
    return (
        <div
            className={`flex-1 border-2 border-dashed rounded-lg p-6 transition-colors ${
                isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/20 bg-muted/50'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData('application/json');
                if (data) {
                    const item = JSON.parse(data);
                    onDrop(item);
                }
            }}
        >
            <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
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
                    <div className="space-y-2 overflow-y-auto flex-1">
                        {items.map((item) => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                onDelete={onRestore}
                                onRightClick={onRightClick}
                                draggable={false}
                                isDropped={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
