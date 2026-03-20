'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, Copy, Plus, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TravelItem } from '@/types';
import { itemsApi, tagMappingApi } from '@/lib/api';
import { Preset } from '@/hooks/use-presets';

interface PresetManagerProps {
    presets: Preset[];
    activePresetId: number | null;
    setActivePresetId: (id: number) => void;
    createPreset: (name: string) => Promise<Preset>;
    deletePreset: (id: number) => Promise<void>;
    items: TravelItem[];
    droppedItems: TravelItem[];
    onError: (msg: string) => void;
    refetchItems: () => void;
}

export function PresetManager({
                                  presets,
                                  activePresetId,
                                  setActivePresetId,
                                  createPreset,
                                  deletePreset,
                                  items,
                                  droppedItems,
                                  onError,
                                  refetchItems,
                              }: PresetManagerProps) {
    const [showNewPresetDialog, setShowNewPresetDialog] = useState(false);
    const [showDeletePresetDialog, setShowDeletePresetDialog] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [newPresetError, setNewPresetError] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [loading, setLoading] = useState(false);

    const activePreset = presets.find(p => p.id === activePresetId);

    const handleCreatePreset = async () => {
        if (!newPresetName.trim()) return;
        setLoading(true);
        try {
            const newPreset = await createPreset(newPresetName.trim());

            if (isCloning) {
                const allItems = [...items, ...droppedItems];

                const { insertedIds } = await itemsApi.batchAdd(
                    allItems.map(item => ({
                        name: item.name,
                        weight: Number(item.weight),
                        preset_id: newPreset.id,
                        quantity: item.quantity ?? 0,
                        dropped: Boolean(item.dropped),
                        order_index: item.orderIndex ?? 0,
                    }))
                );

                // Batch tag mappings
                await Promise.all(
                    allItems.flatMap((item, i) =>
                        item.tags.map(tag => tagMappingApi.createTagMapping(insertedIds[i], tag.id))
                    )
                );

                setActivePresetId(newPreset.id);
                await refetchItems();
            }

            setNewPresetName('');
            setShowNewPresetDialog(false);
            setNewPresetError(null);
            setIsCloning(false);
        } catch (err) {
            setNewPresetError(err instanceof Error ? err.message : 'Failed to create preset');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePreset = async () => {
        if (activePresetId === null) return;
        try {
            await deletePreset(activePresetId);
            setShowDeletePresetDialog(false);
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to delete preset');
        }
    };

    const openNewPreset = () => {
        setIsCloning(false);
        setNewPresetName('');
        setNewPresetError(null);
        setShowNewPresetDialog(true);
    };

    const openClonePreset = () => {
        setIsCloning(true);
        setNewPresetName('');
        setNewPresetError(null);
        setShowNewPresetDialog(true);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Preset selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2 min-w-40">
                            <span className="flex-1 text-left truncate">{activePreset?.name ?? 'Select preset'}</span>
                            <ChevronDown className="h-4 w-4 shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-40">
                        {presets.map(preset => (
                            <DropdownMenuItem
                                key={preset.id}
                                onClick={() => setActivePresetId(preset.id)}
                                className={activePresetId === preset.id ? 'bg-muted font-medium' : ''}
                            >
                                {preset.name}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={openNewPreset}>
                            <Plus className="h-4 w-4 mr-2" /> New Preset
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete preset */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowDeletePresetDialog(true)}
                    disabled={presets.length <= 1}
                    title="Delete current preset"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>

                {/* Save as new preset */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={openClonePreset}
                    disabled={items.length === 0 && droppedItems.length === 0}
                    title="Save current items as a new preset"
                >
                    <Copy className="h-4 w-4 mr-2" /> Save as new preset
                </Button>
            </div>

            {/* New / Clone preset dialog */}
            <Dialog open={showNewPresetDialog} onOpenChange={(open) => {
                setShowNewPresetDialog(open);
                if (!open) { setNewPresetName(''); setNewPresetError(null); setIsCloning(false); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCloning ? 'Save as New Preset' : 'New Preset'}</DialogTitle>
                        <DialogDescription>
                            {isCloning
                                ? 'Creates a new preset with a copy of all current items.'
                                : 'Give your new preset a name.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="e.g. Weekend Trip"
                        value={newPresetName}
                        onChange={(e) => { setNewPresetName(e.target.value); setNewPresetError(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePreset()}
                        autoFocus
                    />
                    {newPresetError && <p className="text-sm text-destructive">{newPresetError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowNewPresetDialog(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePreset} disabled={!newPresetName.trim() || loading}>
                            {loading ? 'Creating...' : isCloning ? 'Save' : 'Create'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete preset dialog */}
            <Dialog open={showDeletePresetDialog} onOpenChange={setShowDeletePresetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Preset?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete <strong>{activePreset?.name}</strong> and all its items. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowDeletePresetDialog(false)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeletePreset}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleDeletePreset()}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}