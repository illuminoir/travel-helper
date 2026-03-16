'use client';

import { Button } from '@/components/ui/button';

export type SortField = 'name' | 'weight';
export type SortDirection = 'asc' | 'desc';
export interface SortState { field: SortField; direction: SortDirection; }

interface SortButtonsProps {
    sort: SortState;
    onChange: (sort: SortState) => void;
}

export function SortButtons({ sort, onChange }: SortButtonsProps) {
    const handleClick = (field: SortField) => {
        if (sort.field === field) {
            onChange({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
        } else {
            onChange({ field, direction: 'asc' });
        }
    };

    const arrow = (field: SortField) => {
        if (sort.field !== field) return null;
        return sort.direction === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <div className="flex gap-1">
            <Button
                variant={sort.field === 'name' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleClick('name')}
            >
                Name{arrow('name')}
            </Button>
            <Button
                variant={sort.field === 'weight' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleClick('weight')}
            >
                Weight{arrow('weight')}
            </Button>
        </div>
    );
}