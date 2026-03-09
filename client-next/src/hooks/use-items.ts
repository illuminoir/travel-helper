'use client';

import { useState, useEffect, useCallback } from 'react';
import { itemsApi, tagMappingApi } from '@/lib/api';
import { TravelItem } from '@/types';

const sortItemsByName = (items: TravelItem[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name));

export function useItems(presetId: number | null) {
    const [items, setItems] = useState<TravelItem[]>([]);
    const [droppedItems, setDroppedItems] = useState<TravelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        if (presetId === null) return;
        try {
            const apiItems = await itemsApi.getAll(presetId);
            setItems(sortItemsByName(apiItems.filter(item => !item.dropped)));
            setDroppedItems(sortItemsByName(apiItems.filter(item => item.dropped)));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load items');
        } finally {
            setLoading(false); // only flips once, never back to true
        }
    }, [presetId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const deleteItem = useCallback(async (id: number, isDropped: boolean) => {
        try {
            await itemsApi.delete(id);
            await tagMappingApi.removeAllTagsOnItem(id);
            if (isDropped) {
                setDroppedItems(prev => prev.filter(item => item.id !== id));
            } else {
                setItems(prev => prev.filter(item => item.id !== id));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    }, []);

    const addItem = useCallback(async (name: string, weight: number) => {
        if (presetId === null) return;
        try {
            await itemsApi.add(name, weight, presetId);
            await fetchItems();
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add item');
            throw err;
        }
    }, [presetId, fetchItems]);

    const moveItem = useCallback(async (item: TravelItem, toDropped: boolean) => {
        if (toDropped) {
            setItems(prev => prev.filter(i => i.id !== item.id));
            setDroppedItems(prev => prev.some(i => i.id === item.id) ? prev : [...prev, item]);
        } else {
            setDroppedItems(prev => prev.filter(i => i.id !== item.id));
            setItems(prev => prev.some(i => i.id === item.id) ? prev : [...prev, item]);
        }
        await itemsApi.updateDropped(item.id, toDropped);
    }, []);

    const updateWeight = useCallback(async (item: TravelItem, newWeight: number) => {
        try {
            await itemsApi.updateWeight(item.id, newWeight);
            await fetchItems();
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update weight');
        }
    }, [fetchItems]);

    const clearDropped = useCallback(async () => {
        await Promise.all(droppedItems.map(item => itemsApi.updateDropped(item.id, false)));
        setDroppedItems([]);
        await fetchItems();
    }, [droppedItems, fetchItems]);

    return {
        items,
        droppedItems,
        loading,
        error,
        setError,
        deleteItem,
        addItem,
        moveItem,
        updateWeight,
        clearDropped,
        refetchItems: fetchItems,
    };
}