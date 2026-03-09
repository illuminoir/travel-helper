'use client';

import { useState, useEffect, useCallback } from 'react';
import { presetsApi } from '@/lib/api';

export type Preset = { id: number; name: string; created_at: string };

export function usePresets() {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [activePresetId, setActivePresetId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPresets = useCallback(async () => {
        try {
            const data = await presetsApi.getAll();
            setPresets(data);

            // Auto-select first preset, or create Default if none exist
            if (data.length === 0) {
                const created = await presetsApi.create('Default');
                setPresets([{ ...created, created_at: new Date().toISOString() }]);
                setActivePresetId(created.id);
            } else {
                setActivePresetId(prev => prev ?? data[0].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    const createPreset = useCallback(async (name: string) => {
        const created = await presetsApi.create(name);
        const newPreset = { ...created, created_at: new Date().toISOString() };
        setPresets(prev => [...prev, newPreset]);
        setActivePresetId(created.id);
        return newPreset;
    }, []);

    const deletePreset = useCallback(async (id: number) => {
        await presetsApi.delete(id);
        setPresets(prev => {
            const remaining = prev.filter(p => p.id !== id);
            if (remaining.length > 0) {
                setActivePresetId(remaining[0].id);
            }
            return remaining;
        });
    }, []);

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