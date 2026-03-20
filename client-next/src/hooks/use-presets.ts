'use client';

import { useCallback, useEffect, useState } from 'react';
import { presetsApi } from '@/lib/api';

export type Preset = { id: number; name: string; created_at: string };

const PRESET_KEY = 'activePresetId';

export function usePresets() {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [activePresetId, setActivePresetIdState] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const setActivePresetId = useCallback((id: number) => {
        setActivePresetIdState(id);
        localStorage.setItem(PRESET_KEY, String(id));
    }, []);

    const fetchPresets = useCallback(async () => {
        try {
            const data = await presetsApi.getAll();
            setPresets(data);

            if (data.length === 0) {
                const created = await presetsApi.create('Default');
                setPresets([{ ...created, created_at: new Date().toISOString() }]);
                setActivePresetId(created.id);
            } else {
                const saved = localStorage.getItem(PRESET_KEY);
                const savedId = saved ? parseInt(saved) : null;
                const exists = savedId && data.some(p => p.id === savedId);
                setActivePresetId(exists ? savedId! : data[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [setActivePresetId]);

    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    const createPreset = useCallback(async (name: string) => {
        const created = await presetsApi.create(name);
        const newPreset = { ...created, created_at: new Date().toISOString() };
        setPresets(prev => [...prev, newPreset]);
        setActivePresetId(created.id);
        return newPreset;
    }, [setActivePresetId]);

    const deletePreset = useCallback(async (id: number) => {
        await presetsApi.delete(id);
        setPresets(prev => {
            const remaining = prev.filter(p => p.id !== id);
            if (remaining.length > 0) {
                setActivePresetId(remaining[remaining.length - 1].id);
            }
            return remaining;
        });
    }, [setActivePresetId]);

    return {
        presets,
        activePresetId,
        setActivePresetId,
        createPreset,
        deletePreset,
        loading,
        refetchPresets: fetchPresets,
    };
}