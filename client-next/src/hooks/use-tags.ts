import { tagMappingApi, tagsApi } from "@/lib/api";
import { Tag } from "@/types";
import { useEffect, useState } from "react";

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load items from API and localStorage
    useEffect(() => {
        const loadData = async () => {
            try {
                const apiTags = await tagsApi.getAll();
                setTags(apiTags);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load items");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // when we save the tags for a new item, we need to create isTagged mappings
    // for each new tag id, create a new database mapping (itemId, tagId)
    // and for every removed tag, remove this mapping
    const updateTags = async (
        itemId: number,
        tagsToCreate: number[],
        tagsToDelete: number[]
    ) => {
        for (const tagId of tagsToCreate) {
            await tagMappingApi.createTagMapping(itemId, tagId);
        }
        for (const tagId of tagsToDelete) {
            await tagMappingApi.removeTagMapping(itemId, tagId);
        }
    };

    return {
        tags,
        updateTags,
        loading,
        error,
    };
}