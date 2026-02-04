import { tagMappingApi, tagsApi } from '@/lib/api';
import { Tag } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const sortTagsByName = (tags: Tag[]) => [...tags].sort((a, b) => a.name.localeCompare(b.name));

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTags = useCallback(async () => {
        try {
            const apiTags = await tagsApi.getAll();
            setTags(sortTagsByName(apiTags));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tags');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load tags from API on mount
    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

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

    const createTag = async (tagName: string) => {
        await tagsApi.create(tagName);
        // Refetch all tags since the API doesn't return the new tag with its ID
        await fetchTags();
    };

    const deleteTag = async (tagId: number) => {
        await tagsApi.delete(tagId);
        // Refetch all tags after deletion
        await fetchTags();
    };

    return {
        tags,
        updateTags,
        createTag,
        deleteTag,
        refetchTags: fetchTags,
        loading,
        error,
    };
}
