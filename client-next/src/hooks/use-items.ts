'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { itemsApi, tagMappingApi } from '@/lib/api';
import { TravelItem } from '@/types';

const sortItemsByName = (items: TravelItem[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name));

type UndoAction =
    | { type: 'DELETE_ITEM'; item: TravelItem; previousBagIndex: number | null }
    | { type: 'MOVE_ITEM'; item: TravelItem; previousBagIndex: number | null }
    | { type: 'CLEAR_BAG'; items: TravelItem[]; bagIndex: number }
    | { type: 'CLEAR_ALL_BAGS'; items: TravelItem[] }
    | { type: 'DELETE_ALL'; items: TravelItem[] }
    | { type: 'DROP_ALL'; items: TravelItem[] }
    | { type: 'QUANTITY_CHANGE'; item: TravelItem; previousQuantity: number }
    | { type: 'SORT_BAG'; previousOrder: TravelItem[]; bagIndex: number };

export function useItems(presetId: number | null) {
    const [items, setItems] = useState<TravelItem[]>([]);
    const [bagItems, setBagItems] = useState<TravelItem[]>([]); // all dropped items across all bags
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canUndo, setCanUndo] = useState(false);
    const [isUndoing, setIsUndoing] = useState(false);
    const undoStack = useRef<UndoAction[]>([]);

    const fetchItems = useCallback(async () => {
        if (presetId === null) return;
        try {
            const apiItems = await itemsApi.getAll(presetId);
            console.log(apiItems);
            setItems(sortItemsByName(apiItems.filter(item => item.bagIndex === null)));
            setBagItems(apiItems
                .filter(item => item.bagIndex !== null)
                .sort((a, b) => {
                    if (a.bagIndex !== b.bagIndex) return (a.bagIndex ?? 0) - (b.bagIndex ?? 0);
                    return a.orderIndex - b.orderIndex;
                })
            );
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load items');
        } finally {
            setLoading(false);
        }
    }, [presetId]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    useEffect(() => {
        undoStack.current = [];
        setCanUndo(false);
    }, [presetId]);

    const recordAction = (action: UndoAction) => {
        undoStack.current.push(action);
        setCanUndo(true);
    };

    // Get items for a specific bag
    const getItemsForBag = useCallback((bagIndex: number) => {
        return bagItems.filter(i => i.bagIndex === bagIndex);
    }, [bagItems]);

    const deleteItem = useCallback(async (id: number) => {
        try {
            const item = [...items, ...bagItems].find(i => i.id === id);
            await itemsApi.delete(id);
            await tagMappingApi.removeAllTagsOnItem(id);

            if (item?.bagIndex === null || item?.bagIndex === undefined) {
                setItems(prev => prev.filter(i => i.id !== id));
            } else {
                setBagItems(prev => prev.filter(i => i.id !== id));
            }

            if (item) recordAction({ type: 'DELETE_ITEM', item, previousBagIndex: item.bagIndex ?? null });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    }, [items, bagItems]);

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

    // Move item to a bag (bagIndex) or back to available (null)
    const moveItem = useCallback(async (item: TravelItem, bagIndex: number | null, orderIndex?: number) => {
        const previousBagIndex = item.bagIndex ?? null;

        if (bagIndex !== null) {
            // Moving to a bag
            setItems(prev => sortItemsByName(prev.filter(i => i.id !== item.id)));
            setBagItems(prev => {
                if (prev.some(i => i.id === item.id)) return prev;
                const bagSpecificItems = prev.filter(i => i.bagIndex === bagIndex);
                const idx = orderIndex ?? bagSpecificItems.length;
                const updated = prev.filter(i => i.bagIndex !== bagIndex);
                const newBagItems = [...bagSpecificItems];
                newBagItems.splice(idx, 0, { ...item, bagIndex: bagIndex, orderIndex: idx });
                return [...updated, ...newBagItems];
            });
        } else {
            // Moving back to available
            setBagItems(prev => prev.filter(i => i.id !== item.id));
            setItems(prev => prev.some(i => i.id === item.id) ? prev : sortItemsByName([...prev, { ...item, bagIndex: null }]));
        }

        await itemsApi.updateBagIndex(item.id, bagIndex);
        if (bagIndex !== null && orderIndex !== undefined) {
            await itemsApi.updateOrder(item.id, orderIndex);
        }
        recordAction({ type: 'MOVE_ITEM', item, previousBagIndex });
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

    // Clear all items from a specific bag
    const clearBag = useCallback(async (bagIndex: number) => {
        const bagSpecificItems = bagItems.filter(i => i.bagIndex === bagIndex);
        recordAction({ type: 'CLEAR_BAG', items: [...bagSpecificItems], bagIndex });
        await Promise.all(bagSpecificItems.map(item => itemsApi.updateBagIndex(item.id, null)));
        setBagItems(prev => prev.filter(i => i.bagIndex !== bagIndex));
        await fetchItems();
    }, [bagItems, fetchItems]);

    // Clear all bags
    const clearAllBags = useCallback(async () => {
        recordAction({ type: 'CLEAR_ALL_BAGS', items: [...bagItems] });
        await Promise.all(bagItems.map(item => itemsApi.updateBagIndex(item.id, null)));
        setBagItems([]);
        await fetchItems();
    }, [bagItems, fetchItems]);

    const deleteAll = useCallback(async (itemsToDelete: TravelItem[]) => {
        recordAction({ type: 'DELETE_ALL', items: [...itemsToDelete] });
        await Promise.all(itemsToDelete.map(async (item) => {
            await tagMappingApi.removeAllTagsOnItem(item.id);
            await itemsApi.delete(item.id);
        }));
        await fetchItems();
    }, [fetchItems]);

    const dropAll = useCallback(async (itemsToDrop: TravelItem[], bagIndex: number = 0) => {
        recordAction({ type: 'DROP_ALL', items: [...itemsToDrop] });
        await Promise.all(itemsToDrop.map(item => itemsApi.updateBagIndex(item.id, bagIndex)));
        await fetchItems();
    }, [fetchItems]);

    const undo = useCallback(async () => {
        const action = undoStack.current.pop();
        if (!action || presetId === null) return;
        setCanUndo(undoStack.current.length > 0);

        try {
            switch (action.type) {
                case 'DELETE_ITEM': {
                    const created = await itemsApi.add(action.item.name, Number(action.item.weight), presetId);
                    await itemsApi.updateQuantity(created.id, action.item.quantity ?? 0);
                    for (const tag of action.item.tags) {
                        await tagMappingApi.createTagMapping(created.id, tag.id);
                    }
                    if (action.previousBagIndex !== null) {
                        await itemsApi.updateBagIndex(created.id, action.previousBagIndex);
                    }
                    break;
                }
                case 'MOVE_ITEM': {
                    await itemsApi.updateBagIndex(action.item.id, action.previousBagIndex);
                    break;
                }
                case 'CLEAR_BAG': {
                    await Promise.all(action.items.map(item =>
                        itemsApi.updateBagIndex(item.id, action.bagIndex)
                    ));
                    break;
                }
                case 'CLEAR_ALL_BAGS': {
                    await Promise.all(action.items.map(item =>
                        itemsApi.updateBagIndex(item.id, item.bagIndex ?? 0)
                    ));
                    break;
                }
                case 'DELETE_ALL': {
                    setIsUndoing(true);
                    const { insertedIds } = await itemsApi.batchAdd(
                        action.items.map(item => ({
                            name: item.name,
                            weight: Number(item.weight),
                            presetId: presetId,
                            quantity: item.quantity ?? 0,
                            bagIndex: item.bagIndex ?? null,
                            orderIndex: item.orderIndex ?? 0,
                        }))
                    );
                    await Promise.all(
                        action.items.flatMap((item, i) =>
                            item.tags.map(tag => tagMappingApi.createTagMapping(insertedIds[i], tag.id))
                        )
                    );
                    setIsUndoing(false);
                    break;
                }
                case 'DROP_ALL': {
                    await Promise.all(action.items.map(item => itemsApi.updateBagIndex(item.id, null)));
                    break;
                }
                case 'QUANTITY_CHANGE': {
                    await itemsApi.updateQuantity(action.item.id, action.previousQuantity);
                    setItems(prev => prev.map(i => i.id === action.item.id ? { ...i, quantity: action.previousQuantity } : i));
                    setBagItems(prev => prev.map(i => i.id === action.item.id ? { ...i, quantity: action.previousQuantity } : i));
                    break;
                }
                case 'SORT_BAG': {
                    setBagItems(prev => {
                        const otherBags = prev.filter(i => i.bagIndex !== action.bagIndex);
                        return [...otherBags, ...action.previousOrder];
                    });
                    await Promise.all(action.previousOrder.map((item, index) =>
                        itemsApi.updateOrder(item.id, index)
                    ));
                    break;
                }
            }
            await fetchItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to undo');
            setIsUndoing(false);
        }
    }, [presetId, fetchItems]);

    const updateQuantity = useCallback(async (item: TravelItem, newQuantity: number) => {
        try {
            recordAction({ type: 'QUANTITY_CHANGE', item, previousQuantity: item.quantity ?? 0 });
            await itemsApi.updateQuantity(item.id, newQuantity);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
            setBagItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update quantity');
        }
    }, []);

    const reorderBag = useCallback(async (bagIndex: number, reordered: TravelItem[]) => {
        setBagItems(prev => {
            const otherBags = prev.filter(i => i.bagIndex !== bagIndex);
            return [...otherBags, ...reordered];
        });
        await Promise.all(reordered.map((item, index) => itemsApi.updateOrder(item.id, index)));
    }, []);

    const sortBag = useCallback(async (bagIndex: number, compareFn: (a: TravelItem, b: TravelItem) => number) => {
        const bagSpecificItems = bagItems.filter(i => i.bagIndex === bagIndex);
        recordAction({ type: 'SORT_BAG', previousOrder: [...bagSpecificItems], bagIndex });
        const sorted = [...bagSpecificItems].sort(compareFn);
        setBagItems(prev => {
            const otherBags = prev.filter(i => i.bagIndex !== bagIndex);
            return [...otherBags, ...sorted];
        });
        await Promise.all(sorted.map((item, index) => itemsApi.updateOrder(item.id, index)));
    }, [bagItems]);

    const clearUndoStack = useCallback(() => {
        undoStack.current = [];
        setCanUndo(false);
    }, []);

    return {
        items,
        bagItems,
        getItemsForBag,
        loading,
        isUndoing,
        error,
        setError,
        canUndo,
        deleteItem,
        addItem,
        moveItem,
        updateWeight,
        clearBag,
        clearAllBags,
        deleteAll,
        dropAll,
        undo,
        updateQuantity,
        reorderBag,
        sortBag,
        clearUndoStack,
        refetchItems: fetchItems,
    };
}