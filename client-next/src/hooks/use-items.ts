'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {itemsApi, tagMappingApi} from '@/lib/api';
import { TravelItem } from '@/types';

const sortItemsByName = (items: TravelItem[]) => [...items].sort((a, b) => a.name.localeCompare(b.name));

export function useItems() {
    const [items, setItems] = useState<TravelItem[]>([]);
    const [droppedItems, setDroppedItems] = useState<TravelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const droppedItemsRef = useRef<TravelItem[]>([]);

    // Keep ref in sync with state
    useEffect(() => {
        droppedItemsRef.current = droppedItems;
    }, [droppedItems]);

    const fetchItems = useCallback(async () => {
        try {
            const apiItems = await itemsApi.getAll();

            const droppedIds = new Set(droppedItemsRef.current.map((item: TravelItem) => item.id));

            const freshDroppedItems = apiItems.filter((item) => droppedIds.has(item.id));
            const availableItems = apiItems.filter((item) => !droppedIds.has(item.id));

            setItems(sortItemsByName(availableItems));
            setDroppedItems(sortItemsByName(freshDroppedItems)); // Update dropped items with fresh data!
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load items');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load items from API
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const deleteItem = useCallback(async (id: number, isDropped: boolean) => {
        if (isDropped) {
            setDroppedItems((prev) => prev.filter((item) => item.id !== id));
        } else {
            try {
                await itemsApi.delete(id);
                await tagMappingApi.removeAllTagsOnItem(id);
                setItems((prev) => prev.filter((item) => item.id !== id));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete item');
            }
        }
    }, []);

    const addItem = useCallback(
        async (name: string, weight: number) => {
            try {
                await itemsApi.add(name, weight);
                const updatedItems = await itemsApi.getAll();
                setItems(updatedItems.filter((item) => !droppedItems.some((d) => d.id === item.id)).sort((a, b) => a.id - b.id));
                await fetchItems();
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete item');
            }
        },
        [droppedItems],
    );

    const moveItem = useCallback((item: TravelItem, toDropped: boolean) => {
        if (toDropped) {
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            setDroppedItems((prev) => {
                const alreadyExists = prev.some((i) => i.id === item.id);
                return alreadyExists ? prev : [...prev, item].sort((a, b) => a.id - b.id);
            });
        } else {
            setDroppedItems((prev) => prev.filter((i) => i.id !== item.id));
            setItems((prev) => {
                const alreadyExists = prev.some((i) => i.id === item.id);
                return alreadyExists ? prev : [...prev, item].sort((a, b) => a.id - b.id);
            });
        }
    }, []);

    const updateWeight = useCallback(async (item: TravelItem, newWeight: number) => {
        try {
            await itemsApi.updateWeight(item.id, newWeight);
            await fetchItems();
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    }, []);

    const clearDropped = useCallback(() => {
        setDroppedItems([]);
        fetchItems();
    }, [fetchItems]);

    return {
        items,
        droppedItems,
        loading,
        error,
        deleteItem,
        addItem,
        moveItem,
        updateWeight,
        clearDropped,
        refetchItems: fetchItems,
    };
}
