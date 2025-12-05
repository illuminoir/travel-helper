"use client"

import { useState, useEffect, useCallback } from "react";
import { itemsApi } from "@/lib/api";
import { TravelItem } from "@/types";

export function useItems() {
    const [items, setItems] = useState<TravelItem[]>([]);
    const [droppedItems, setDroppedItems] = useState<TravelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load items from API and localStorage
    useEffect(() => {
        const loadData = async () => {
            try {
                const apiItems = await itemsApi.getAll()

                const saved = localStorage.getItem('droppedItems');
                let droppedItemsData: TravelItem[] = [];

                if (saved) {
                    try {
                        droppedItemsData = JSON.parse(saved)
                    } catch {
                        localStorage.removeItem("droppedItems")
                    }
                }

                const droppedIds = new Set(droppedItemsData.map((item: TravelItem) => item.id))
                const availableItems = apiItems.filter((item) => !droppedIds.has(item.id))

                setItems(availableItems)
                setDroppedItems(droppedItemsData)
                setError(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load items")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    // Now persistence happens when items change via moveItem
    useEffect(() => {
        localStorage.setItem('droppedItems', JSON.stringify(droppedItems));
    }, [droppedItems]);

    const deleteItem = useCallback(
        async (id: number, isDropped: boolean) => {
            if (isDropped) {
                setDroppedItems((prev) => prev.filter((item) => item.id !== id));
            } else {
                try {
                    await itemsApi.delete(id);
                    setItems((prev) => prev.filter((item) => item.id !== id));
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to delete item');
                }
            }
        },
        []
    );

    const addItem = useCallback(
        async (name: string, weight: number) => {
            try {
                await itemsApi.add(name, weight);
                const updatedItems = await itemsApi.getAll();
                setItems(updatedItems.filter(item =>
                    !droppedItems.some(d => d.id === item.id)
                ));
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete item")
            }
        },
        [droppedItems]
    );

    const moveItem = useCallback((item: TravelItem, toDropped: boolean) => {
        if (toDropped) {
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            setDroppedItems((prev) => {
                const alreadyExists = prev.some((i) => i.id === item.id)
                return alreadyExists ? prev : [...prev, item]
            })
        } else {
            setDroppedItems((prev) => prev.filter((i) => i.id !== item.id))
            setItems((prev) => {
                const alreadyExists = prev.some((i) => i.id === item.id)
                return alreadyExists ? prev : [...prev, item]
            })
        }
    }, [])

    const clearDropped = useCallback(() => {
        setDroppedItems([])
    }, [])

    return {
        items,
        droppedItems,
        loading,
        error,
        deleteItem,
        addItem,
        moveItem,
        clearDropped,
    }
}
