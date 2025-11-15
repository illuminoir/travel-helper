import {TravelItem} from "@/types";

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
    delete: (id: string) => apiCall<void>(`/items/${id}`, { method: 'DELETE' }),
    add: (name: string, weight: number, category: string) =>
        apiCall<TravelItem>('/items', {
            method: 'POST',
            body: JSON.stringify({ name, weight, category }),
        }),
    updateStatus: (id: string, status: 'available' | 'dropped') =>
        apiCall<void>(`/items/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
    updateTags: (id: string, tags: string[]) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ tags }),
        }),
};
