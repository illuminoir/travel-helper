import { Tag, TravelItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        credentials: 'include',
        ...options,
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `API error: ${response.statusText}`);
    }
    return response.json();
}

export const presetsApi = {
    getAll: () => apiCall<{ id: number; name: string; created_at: string }[]>('/presets'),
    create: (name: string) =>
        apiCall<{ id: number; name: string }>('/presets', {
            method: 'PUT',
            body: JSON.stringify({ name }),
        }),
    delete: (id: number) => apiCall<void>(`/presets/${id}`, { method: 'DELETE' }),
};

export const itemsApi = {
    getAll: (presetId: number) => apiCall<TravelItem[]>(`/items?presetId=${presetId}`),
    delete: (id: number) => apiCall<void>(`/items/${id}`, { method: 'DELETE' }),
    add: (name: string, weight: number, presetId: number, options?: {
        quantity?: number;
        bagIndex?: number | null;
        orderIndex?: number;
    }) =>
        apiCall<TravelItem>('/items', {
            method: 'PUT',
            body: JSON.stringify({
                name,
                weight,
                presetId: presetId,
                ...(options?.quantity !== undefined && { quantity: options.quantity }),
                ...(options?.bagIndex !== undefined && { bagIndex: options.bagIndex }),
                ...(options?.orderIndex !== undefined && { orderIndex: options.orderIndex }),
            }),
        }),
    batchAdd: (items: {
        name: string;
        weight: number;
        presetId: number;
        quantity?: number;
        bagIndex?: number | null;
        orderIndex?: number;
    }[]) =>
        apiCall<{ insertedIds: number[] }>('/items/batch', {
            method: 'PUT',
            body: JSON.stringify({ items }),
        }),
    updateWeight: (id: number, weight: number) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ weight }),
        }),
    updateBagIndex: (id: number, bagIndex: number | null) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ bagIndex: bagIndex }),
        }),
    updateQuantity: (id: number, quantity: number) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        }),
    updateName: (id: number, name: string) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name }),
        }),
    updateOrder: (id: number, orderIndex: number) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ orderIndex: orderIndex }),
        }),
    deleteAll: (presetId: number) =>
        apiCall<void>(`/items?preset_id=${presetId}`, { method: 'DELETE' }),
};

export const tagsApi = {
    getAll: () => apiCall<Tag[]>('/tags'),
    create: (name: string) =>
        apiCall<{ id: number; name: string }>('/tags', {
            method: 'PUT',
            body: JSON.stringify({ name }),
        }),
    delete: (id: number) =>
        apiCall<void>(`/tags/${id}`, { method: 'DELETE' }),
    deleteAll: () => apiCall<void>('/tags', { method: 'DELETE' }),
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
    removeAllTagsOnItem: (itemId: number) =>
        apiCall<void>(`/tagMapping/${itemId}`, { method: 'DELETE' }),
    getAllTagsOnItem: (itemId: number) =>
        apiCall<void>(`/tagMapping/${itemId}`, { method: 'GET' }),
};

// --- CSV Export ---

export function exportToCSV(items: TravelItem[]): void {
    const lines: string[] = [];

    for (const item of items) {
        const primaryTag = item.tags?.[0]?.name ?? '';
        const secondaryTag = item.tags?.[1]?.name ?? '';
        const quantity = item.quantity ?? 0;
        const name = item.name.replace(/"/g, '""');
        lines.push(`${primaryTag},"${name}",${quantity},,,${secondaryTag},`);
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `items-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// --- CSV Import ---

export type ImportData = {
    tags: { id: number; name: string }[];
    items: { id: number; name: string; quantity: number; weight: number; tagIds: number[] }[];
};

export function parseCSV(csvText: string): ImportData {
    const lines = csvText.split('\n').map(l => l.trim()).filter(line => {
        const cols = line.split(',').map(c => c.trim());
        return cols.some(c => c !== '');
    });

    const tagNameToId = new Map<string, number>();
    const tags: ImportData['tags'] = [];
    const items: ImportData['items'] = [];

    let nextTagId = 1;
    let nextItemId = 1;

    const getOrCreateTag = (name: string | undefined): number => {
        if (!name) return -1;
        const normalized = name.trim();
        if (!normalized) return -1;
        if (tagNameToId.has(normalized)) return tagNameToId.get(normalized)!;
        const id = nextTagId++;
        tagNameToId.set(normalized, id);
        tags.push({ id, name: normalized });
        return id;
    };

    for (const line of lines) {
        const cols = parseCSVLine(line);
        const firstTag = cols[0]?.trim();
        const name = cols[1]?.trim();
        const quantity = Math.max(1, parseInt(cols[2]?.trim()) || 1);
        const secondaryTag = cols[5]?.trim();

        if (!name) continue;

        const tagIds: number[] = [];
        const tagId1 = getOrCreateTag(firstTag);
        if (tagId1 !== -1) tagIds.push(tagId1);
        const tagId2 = getOrCreateTag(secondaryTag);
        if (tagId2 !== -1) tagIds.push(tagId2);

        items.push({ id: nextItemId++, name, weight: 0, quantity, tagIds });
    }

    return { tags, items };
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

export async function importFromCSV(data: ImportData, presetId: number, clearData: boolean = true, existingItems: TravelItem[] = []): Promise<void> {
    if (clearData) {
        await itemsApi.deleteAll(presetId);
        await tagsApi.deleteAll();
    }

    const tagIdMap = new Map<number, number>();
    for (const tag of data.tags) {
        const created = await tagsApi.create(tag.name);
        tagIdMap.set(tag.id, created.id);
    }

    if (data.items.length === 0) return;

    // Build a set of existing names (lowercase) for duplicate detection
    const existingNames = new Set(existingItems.map(i => i.name.toLowerCase()));
    const usedNames = new Set(existingNames);

    const deduplicatedItems = data.items.map(item => {
        let name = item.name;
        if (usedNames.has(name.toLowerCase())) {
            let counter = 2;
            while (usedNames.has(`${name} (${counter})`.toLowerCase())) {
                counter++;
            }
            name = `${name} (${counter})`;
        }
        usedNames.add(name.toLowerCase());
        return { ...item, name };
    });

    const { insertedIds } = await itemsApi.batchAdd(
        deduplicatedItems.map(item => ({
            name: item.name,
            weight: item.weight,
            presetId: presetId,
            quantity: item.quantity ?? 0,
            bagIndex: null,
        }))
    );

    await Promise.all(
        deduplicatedItems.flatMap((item, i) =>
            item.tagIds.map(oldTagId => {
                const newTagId = tagIdMap.get(oldTagId);
                if (newTagId !== undefined) {
                    return tagMappingApi.createTagMapping(insertedIds[i], newTagId);
                }
            }).filter(Boolean)
        )
    );
}