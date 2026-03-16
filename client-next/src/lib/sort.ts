import { TravelItem } from '@/types';

export type SortOption = 'name-asc' | 'name-desc' | 'weight-asc' | 'weight-desc';

export function sortItems(items: TravelItem[], sort: SortOption): TravelItem[] {
    return [...items].sort((a, b) => {
        switch (sort) {
            case 'name-asc':  return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'weight-asc':  return Number(a.weight) - Number(b.weight);
            case 'weight-desc': return Number(b.weight) - Number(a.weight);
        }
    });
}