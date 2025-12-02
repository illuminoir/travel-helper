
import { useState, useEffect, useCallback } from "react";
import {itemsApi, tagsApi} from "@/lib/api";
import {Tag, TravelItem} from "@/types";

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load items from API and localStorage
    useEffect(() => {
        const loadData = async () => {
            try {
                console.log("loading tags");
                const apiTags = await tagsApi.getAll()
                console.log(apiTags);
                setTags(apiTags)
                setError(null)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load items")
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const updateTagLinks

    return {
        tags,
        loading,
        error,
    }
}