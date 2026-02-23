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
    updateWeight: (id: number, weight: number) =>
        apiCall<TravelItem>(`/items/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ weight }),
        }),
    deleteAll: () => apiCall<void>('/items', { method: 'DELETE' }),
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
    items: { id: number; name: string; weight: number; tagIds: number[] }[];
};

export function parseCSV(csvText: string): ImportData {
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);

    let section: 'tags' | 'items' | null = null;
    const tags: ImportData['tags'] = [];
    const items: ImportData['items'] = [];

    for (const line of lines) {
        if (line === '## TAGS') { section = 'tags'; continue; }
        if (line === '## ITEMS') { section = 'items'; continue; }
        if (line.startsWith('id,')) continue;

        const cols = parseCSVLine(line);

        if (section === 'tags' && cols.length >= 2) {
            tags.push({ id: Number(cols[0]), name: cols[1] });
        } else if (section === 'items' && cols.length >= 4) {
            const tagIds = cols[3] ? cols[3].split(';').map(Number).filter(n => !isNaN(n) && n > 0) : [];
            items.push({
                id: Number(cols[0]),
                name: cols[1],
                weight: Number(cols[2]),
                tagIds,
            });
        }
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

export async function importFromCSV(data: ImportData): Promise<void> {
    // 1. Cleanse: delete all items first (removes tag mappings), then all tags
    await itemsApi.deleteAll();
    await tagsApi.deleteAll();

    // 2. Re-create tags, map old IDs -> new IDs
    const tagIdMap = new Map<number, number>();
    for (const tag of data.tags) {
        const created = await tagsApi.create(tag.name);
        tagIdMap.set(tag.id, created.id);
    }

    // 3. Re-create items with their tag mappings
    for (const item of data.items) {
        const created = await itemsApi.add(item.name, item.weight);
        for (const oldTagId of item.tagIds) {
            const newTagId = tagIdMap.get(oldTagId);
            if (newTagId !== undefined) {
                await tagMappingApi.createTagMapping(created.id, newTagId);
            }
        }
    }
}