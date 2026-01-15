import { Tag, TravelItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function apiCall<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
}

export const itemsApi = {
    getAll: () => apiCall<TravelItem[]>('/items'),
    delete: (id: number) => apiCall<void>(`/items/${id}`, { method: 'DELETE' }),
    add: (name: string, weight: number) =>
        apiCall<TravelItem>('/items', {
            method: 'PUT',
            body: JSON.stringify({ name, weight }),
        }),
};

export const tagsApi = {
    getAll: () => apiCall<Tag[]>('/tags'),
    create: (name: string) =>
        apiCall<{ id: number; name: string }>('/tags', {
            method: 'PUT',
            body: JSON.stringify({ name }),
        }),
};

export const tagMappingApi = {
    createTagMapping: (itemId: number, tagId: number) =>
        apiCall<void>('/tagMapping', {
            method: 'PUT',
            body: JSON.stringify({ itemId, tagId })
        }),
    removeTagMapping: (itemId: number, tagId: number) =>
        apiCall<void>('/tagMapping', {
            method: 'DELETE',
            body: JSON.stringify({ itemId, tagId })
        }),
};