'use client';

import * as React from 'react';
import { Tag, Pencil } from 'lucide-react';

interface ItemContextMenuProps {
    x: number;
    y: number;
    onEditTags: () => void;
    onEditWeight: () => void;
    onClose: () => void;
}

export function ItemContextMenu({ x, y, onEditTags, onEditWeight, onClose }: ItemContextMenuProps) {
    React.useEffect(() => {
        const handleClickOutside = () => onClose();

        // Delay so the current event doesn't immediately trigger close
        const timer = setTimeout(() => {
            window.addEventListener('click', handleClickOutside);
            window.addEventListener('contextmenu', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('contextmenu', handleClickOutside);
        };
    }, [onClose]);

    console.log('itemContextMenu', x, y);

    return (
        <div
            style={{ top: y, left: x }}
            className="fixed z-50 min-w-[160px] rounded-md border border-border bg-popover shadow-md py-1 text-popover-foreground"
        >
            <button
                onClick={(e) => { e.stopPropagation(); onEditWeight(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
                <Pencil className="w-4 h-4" />
                Edit Weight
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onEditTags(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
                <Tag className="w-4 h-4" />
                Edit Tags
            </button>
        </div>
    );
}
