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
    getAll: (presetId: number) => apiCall<TravelItem[]>(`/items?preset_id=${presetId}`),
    delete: (id: number) => apiCall<void>(`/items/${id}`, { method: 'DELETE' }),
    add: (name: string, weight: number, presetId: number, options?: { quantity?: number; dropped?: boolean; orderIndex?: number }) =>
        apiCall<TravelItem>('/items', {
            method: 'PUT',
            body: JSON.stringify({
                name,
                weight,
                preset_id: presetId,
                ...(options?.quantity !== undefined && { quantity: options.quantity }),
                ...(options?.dropped !== undefined && { dropped: options.dropped }),
                ...(options?.orderIndex !== undefined && { order_index: options.orderIndex }),
            }),
        }),
    batchAdd: (items: { name: string; weight: number; preset_id: number; quantity?: number; dropped?: boolean; order_index?: number }[]) =>
        apiCall<{ insertedIds: number[] }>('/items/batch', {
            method: 'PUT',
            body: JSON.stringify({ items }),
        }),
    updateWeight: (id: number, weight: number) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ weight }),
        }),
    updateDropped: (id: number, dropped: boolean) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ dropped }),
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
            body: JSON.stringify({ order_index: orderIndex }),
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
        apiCall<void>(`/tagMapping/${itemId}`, {
            method: 'DELETE',
        }),
    getAllTagsOnItem: (itemId: number) =>
        apiCall<void>(`/tagMapping/${itemId}`, {
            method: 'GET',
        }),
};

// --- CSV Export ---

export function exportToCSV(items: TravelItem[]): void {
    const allTags = new Map<number, string>();
    items.forEach(item => {
        item.tags?.forEach(tag => allTags.set(tag.id, tag.name));
    });

    const tagsLines = ['## TAGS', 'id,name'];
    allTags.forEach((name, id) => {
        tagsLines.push(`${id},"${name.replace(/"/g, '""')}"`);
    });

    const itemsLines = ['## ITEMS', 'id,name,weight,tag_ids'];
    items.forEach(item => {
        const tagIds = (item.tags || []).map(t => t.id).join(';');
        itemsLines.push(`${item.id},"${item.name.replace(/"/g, '""')}",${item.weight},"${tagIds}"`);
    });

    const csv = [...tagsLines, '', ...itemsLines].join('\n');
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
        return cols.some(c => c !== ''); // skip fully empty rows
    });

    const tagNameToId = new Map<string, number>();
    const tags: ImportData['tags'] = [];
    const items: ImportData['items'] = [];

    let nextTagId = 1;
    let nextItemId = 1;

    const getOrCreateTag = (name: string): number => {
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
        const primaryTag = cols[0]?.trim();
        const itemName = cols[1]?.trim();
        const secondaryTag = cols[5]?.trim();

        if (!itemName) continue; // skip rows with no item name

        const tagIds: number[] = [];

        if (primaryTag) {
            const id = getOrCreateTag(primaryTag);
            if (id !== -1) tagIds.push(id);
        }
        if (secondaryTag) {
            const id = getOrCreateTag(secondaryTag);
            if (id !== -1) tagIds.push(id);
        }

        const quantity = Math.max(0, parseInt(cols[2]?.trim()) || 0);

        items.push({
            id: nextItemId++,
            name: itemName,
            weight: 0,
            quantity,
            tagIds,
        });
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

export async function importFromCSV(data: ImportData, presetId: number): Promise<void> {
    await itemsApi.deleteAll(presetId);
    await tagsApi.deleteAll();

    const tagIdMap = new Map<number, number>();
    for (const tag of data.tags) {
        const created = await tagsApi.create(tag.name);
        tagIdMap.set(tag.id, created.id);
    }

    if (data.items.length === 0) return;

    const { insertedIds } = await itemsApi.batchAdd(
        data.items.map(item => ({
            name: item.name,
            weight: item.weight,
            preset_id: presetId,
            quantity: item.quantity ?? 0,
            dropped: false,
            order_index: 0,
        }))
    );

    await Promise.all(
        data.items.flatMap((item, i) =>
            item.tagIds.map(oldTagId => {
                const newTagId = tagIdMap.get(oldTagId);
                if (newTagId !== undefined) {
                    return tagMappingApi.createTagMapping(insertedIds[i], newTagId);
                }
            }).filter(Boolean)
        )
    );
}