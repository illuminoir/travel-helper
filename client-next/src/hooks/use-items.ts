'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { itemsApi, tagMappingApi } from '@/lib/api';
import { TravelItem } from '@/types';

const sortItemsByName = (items: TravelItem[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name));

type UndoAction =
    | { type: 'DELETE_ITEM'; item: TravelItem; wasDropped: boolean }
    | { type: 'MOVE_ITEM'; item: TravelItem; wasDropped: boolean }
    | { type: 'CLEAR_DROPPED'; items: TravelItem[] }
    | { type: 'DELETE_ALL'; items: TravelItem[] }
    | { type: 'DROP_ALL'; items: TravelItem[] }
    | { type: 'QUANTITY_CHANGE'; item: TravelItem; previousQuantity: number };

export function useItems(presetId: number | null) {
    const [items, setItems] = useState<TravelItem[]>([]);
    const [droppedItems, setDroppedItems] = useState<TravelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canUndo, setCanUndo] = useState(false);
    const undoStack = useRef<UndoAction[]>([]);

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
            setLoading(false);
        }
    }, [presetId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Clear undo stack when preset changes
    useEffect(() => {
        undoStack.current = [];
        setCanUndo(false);
    }, [presetId]);

    const recordAction = (action: UndoAction) => {
        undoStack.current.push(action);
        setCanUndo(true);
    };

    const deleteItem = useCallback(async (id: number, isDropped: boolean) => {
        try {
            const allItems = isDropped ? droppedItems : items;
            const item = allItems.find(i => i.id === id);

            await itemsApi.delete(id);
            await tagMappingApi.removeAllTagsOnItem(id);

            if (isDropped) {
                setDroppedItems(prev => prev.filter(i => i.id !== id));
            } else {
                setItems(prev => prev.filter(i => i.id !== id));
            }

            if (item) recordAction({ type: 'DELETE_ITEM', item, wasDropped: isDropped });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    }, [items, droppedItems]);

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
            setItems(prev => sortItemsByName(prev.filter(i => i.id !== item.id)));
            setDroppedItems(prev => prev.some(i => i.id === item.id) ? prev : sortItemsByName([...prev, item]));
        } else {
            setDroppedItems(prev => sortItemsByName(prev.filter(i => i.id !== item.id)));
            setItems(prev => prev.some(i => i.id === item.id) ? prev : sortItemsByName([...prev, item]));
        }
        await itemsApi.updateDropped(item.id, toDropped);
        recordAction({ type: 'MOVE_ITEM', item, wasDropped: !toDropped });
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
        recordAction({ type: 'CLEAR_DROPPED', items: [...droppedItems] });
        await Promise.all(droppedItems.map(item => itemsApi.updateDropped(item.id, false)));
        setDroppedItems([]);
        await fetchItems();
    }, [droppedItems, fetchItems]);

    const deleteAll = useCallback(async (itemsToDelete: TravelItem[]) => {
        recordAction({ type: 'DELETE_ALL', items: [...itemsToDelete] });
        await Promise.all(itemsToDelete.map(item => itemsApi.delete(item.id)));
        await fetchItems();
    }, [fetchItems]);

    const dropAll = useCallback(async (itemsToDrop: TravelItem[]) => {
        recordAction({ type: 'DROP_ALL', items: [...itemsToDrop] });
        await Promise.all(itemsToDrop.map(item => itemsApi.updateDropped(item.id, true)));
        await fetchItems();
    }, [fetchItems]);

    const undo = useCallback(async () => {
        const action = undoStack.current.pop();
        if (!action || presetId === null) return;

        setCanUndo(undoStack.current.length > 0);

        try {
            switch (action.type) {
                case 'DELETE_ITEM': {
                    const created = await itemsApi.add(action.item.name, parseInt(String(action.item.weight)), presetId);
                    for (const tag of action.item.tags) {
                        await tagMappingApi.createTagMapping(created.id, tag.id);
                    }
                    if (action.wasDropped) {
                        await itemsApi.updateDropped(created.id, true);
                    }
                    break;
                }
                case 'MOVE_ITEM': {
                    await itemsApi.updateDropped(action.item.id, action.wasDropped);
                    break;
                }
                case 'CLEAR_DROPPED': {
                    await Promise.all(action.items.map(item => itemsApi.updateDropped(item.id, true)));
                    break;
                }
                case 'DELETE_ALL': {
                    for (const item of action.items) {
                        const created = await itemsApi.add(item.name, item.weight, presetId);
                        for (const tag of item.tags) {
                            await tagMappingApi.createTagMapping(created.id, tag.id);
                        }
                        if (item.dropped) {
                            await itemsApi.updateDropped(created.id, true);
                        }
                    }
                    break;
                }
                case 'DROP_ALL': {
                    await Promise.all(action.items.map(item => itemsApi.updateDropped(item.id, false)));
                    break;
                }
                case 'QUANTITY_CHANGE': {
                    await itemsApi.updateQuantity(action.item.id, action.previousQuantity);
                    setItems(prev => prev.map(i => i.id === action.item.id ? { ...i, quantity: action.previousQuantity } : i));
                    setDroppedItems(prev => prev.map(i => i.id === action.item.id ? { ...i, quantity: action.previousQuantity } : i));
                    break;
                }
            }
            await fetchItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to undo');
        }
    }, [presetId, fetchItems]);

    const updateQuantity = useCallback(async (item: TravelItem, newQuantity: number) => {
        try {
            recordAction({ type: 'QUANTITY_CHANGE', item, previousQuantity: item.quantity ?? 1 });
            await itemsApi.updateQuantity(item.id, newQuantity);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
            setDroppedItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update quantity');
        }
    }, []);

    return {
        items,
        droppedItems,
        loading,
        error,
        setError,
        canUndo,
        deleteItem,
        addItem,
        moveItem,
        updateWeight,
        clearDropped,
        deleteAll,
        dropAll,
        undo,
        updateQuantity,
        refetchItems: fetchItems,
    };
}