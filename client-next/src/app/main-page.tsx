'use client';

import React from 'react';
import { useState, useRef } from 'react';
import { useItems } from '@/hooks/use-items';
import { usePresets } from '@/hooks/use-presets';
import { AddItemDialog } from '@/components/add-item-dialog';
import { ItemsList } from '@/components/items-list';
import { DropZone } from '@/components/drop-zone';
import { EditItemDialog } from '@/components/edit-item-dialog';
import { TagFilter } from '@/components/tag-filter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TravelItem } from '@/types';
import { exportToCSV, importFromCSV, parseCSV } from '@/lib/api';
import { Trash2, ChevronDown, Plus, Undo2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWeightUnit } from '@/contexts/weight-unit-context';
import { fromGrams, smartWeight } from '@/lib/weight';

export default function Home() {
    const { presets, activePresetId, setActivePresetId, createPreset, deletePreset, loading: presetsLoading } = usePresets();
    const { items, droppedItems, loading, error, setError, deleteItem, addItem,
        moveItem, clearDropped, refetchItems, updateWeight,
        canUndo, undo, deleteAll, dropAll, updateQuantity } = useItems(activePresetId);

    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedItem, setSelectedItem] = useState<TravelItem | null>(null);
    const [isEditItemOpen, setIsEditItemOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [showImportWarning, setShowImportWarning] = useState(false);
    const [showNewPresetDialog, setShowNewPresetDialog] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    const [showDeletePresetDialog, setShowDeletePresetDialog] = useState(false);
    const [newPresetError, setNewPresetError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { weightUnit, setWeightUnit } = useWeightUnit();

    const activePreset = presets.find(p => p.id === activePresetId);

    const handleDragStart = (e: React.DragEvent, item: TravelItem) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(item));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (item: TravelItem) => {
        setIsDragOver(false);
        moveItem(item, true);
    };

    const handleRestoreItem = (id: number) => {
        const itemToRestore = droppedItems.find((item) => item.id === id);
        if (itemToRestore) moveItem(itemToRestore, false);
    };

    const handleRightClick = (item: TravelItem, e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setSelectedItem(item);
        setIsEditItemOpen(true);
    };

    const handleDoubleClick = (item: TravelItem) => moveItem(item, true);
    const handleDoubleClickDropped = (item: TravelItem) => moveItem(item, false);

    const filteredItems = selectedTags.length === 0
        ? items
        : items.filter((item) =>
            selectedTags.every((tag) => Array.isArray(item.tags) && item.tags.map((t) => t.name).includes(tag))
        );

    const handleTagClick = (tag: string) => {
        setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    };

    const handleExport = () => exportToCSV([...items, ...droppedItems]);

    const handleImportClick = () => {
        setImportError(null);
        setShowImportWarning(true);
    };

    const handleImportConfirm = () => {
        setShowImportWarning(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || activePresetId === null) return;
        e.target.value = '';
        setIsImporting(true);
        setImportError(null);
        try {
            const text = await file.text();
            const data = parseCSV(text);
            await importFromCSV(data, activePresetId);
            await refetchItems();
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const handleCreatePreset = async () => {
        if (!newPresetName.trim()) return;
        try {
            await createPreset(newPresetName.trim());
            setNewPresetName('');
            setShowNewPresetDialog(false);
            setNewPresetError(null);
        } catch (err) {
            setNewPresetError(err instanceof Error ? err.message : 'Failed to create preset');
        }
    };

    const handleDeletePreset = async () => {
        if (activePresetId === null) return;
        await deletePreset(activePresetId);
        setShowDeletePresetDialog(false);
    };

    if (presetsLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const totalGrams = droppedItems.reduce((sum, current) => sum + Number(current.weight) * (current.quantity ?? 1), 0);
    const convertedWeight = Math.round(fromGrams(totalGrams, weightUnit) * 1000) / 1000;

    return (
        <main className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold">Item Manager</h1>
                        <p className="text-muted-foreground text-sm">
                            Drag items to organize them • Double-click to move • Right-click to edit • Click tags to filter
                        </p>
                        <div className="flex items-center gap-2 mt-1">
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
                                    <DropdownMenuItem onClick={() => setShowNewPresetDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> New Preset
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowDeletePresetDialog(true)}
                                disabled={presets.length <= 1}
                                title="Delete current preset"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Export / Import */}
                    <div className="flex gap-2 mt-1">
                        <Button variant="outline" onClick={handleExport}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
                            {isImporting ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 animate-spin">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Importing…
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Import CSV
                                </>
                            )}
                        </Button>
                        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                    </div>
                </div>

                {/* Error banners */}
                {error && (
                    <div className="flex items-center justify-between p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-4 hover:opacity-70 transition-opacity cursor-pointer" aria-label="Dismiss">✕</button>
                    </div>
                )}
                {importError && (
                    <div className="flex items-center justify-between p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                        <span>Import error: {importError}</span>
                        <button onClick={() => setImportError(null)} className="ml-4 hover:opacity-70 transition-opacity cursor-pointer" aria-label="Dismiss">✕</button>
                    </div>
                )}

                {/* Toolbar row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AddItemDialog onAdd={addItem} isLoading={false} items={[...items, ...droppedItems]} />
                        <Button variant="outline" onClick={() => setSelectedTags([])} disabled={selectedTags.length === 0}>
                            Clear Filters
                        </Button>
                        <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo}>
                            <Undo2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-xl">Total Weight: {smartWeight(totalGrams, weightUnit)}</span>
                        <select
                            value={weightUnit}
                            onChange={(e) => setWeightUnit(e.target.value as 'g' | 'kg' | 'lb' | 'oz')}
                            className="border border-border rounded-md px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                        </select>
                    </div>
                </div>

                {/* Main panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
                    <div className="border-2 border-border rounded-lg p-4 flex flex-col min-h-0 bg-card">
                        <div className="flex items-center justify-between flex-shrink-0 mb-3">
                            <h2 className="font-semibold text-lg">Available Items ({items.length})</h2>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => await deleteAll(items)}
                                    disabled={items.length === 0}
                                >
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => dropAll(items)}
                                    disabled={items.length === 0}
                                >
                                    Drop All
                                </Button>
                            </div>
                        </div>
                        <TagFilter selectedTags={selectedTags} onTagRemove={handleTagClick} />
                        <div className="flex-1 min-h-0 overflow-y-auto mt-2">
                            <ItemsList
                                items={filteredItems}
                                onDelete={(id) => deleteItem(id, false)}
                                onDragStart={handleDragStart}
                                onRightClick={handleRightClick}
                                onTagClick={handleTagClick}
                                onDoubleClick={handleDoubleClick}
                                onQuantityChange={(item, qty) => updateQuantity(item, qty)}
                            />
                        </div>
                    </div>

                    <div
                        className={`border-2 rounded-lg p-4 flex flex-col min-h-0 transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                            e.preventDefault();
                            const data = e.dataTransfer.getData('application/json');
                            if (data) handleDrop(JSON.parse(data));
                        }}
                    >
                        <DropZone
                            items={droppedItems}
                            onRestore={handleRestoreItem}
                            onClearAll={clearDropped}
                            onRightClick={handleRightClick}
                            onDoubleClick={handleDoubleClickDropped}
                            onQuantityChange={(item, qty) => updateQuantity(item, qty)}
                        />
                    </div>
                </div>
            </div>

            {/* Edit Item Dialog */}
            {selectedItem && (
                <EditItemDialog
                    item={selectedItem}
                    items={[...items, ...droppedItems]}
                    isOpen={isEditItemOpen}
                    onClose={() => { setIsEditItemOpen(false); setSelectedItem(null); }}
                    onSaveWeight={async (item, newWeight) => { await updateWeight(item, newWeight); }}
                    refetchItems={refetchItems}
                />
            )}

            {isImporting && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <p className="text-sm font-medium">Importing CSV...</p>
                    </div>
                </div>
            )}

            <Dialog open={showNewPresetDialog} onOpenChange={(open) => {
                setShowNewPresetDialog(open);
                if (!open) { setNewPresetName(''); setNewPresetError(null); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Preset</DialogTitle>
                        <DialogDescription>Give your preset a name.</DialogDescription>
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
                        <Button variant="outline" onClick={() => setShowNewPresetDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreatePreset} disabled={!newPresetName.trim()}>Create</Button>
                    </div>
                </DialogContent>
            </Dialog>

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
                        <Button variant="destructive" onClick={handleDeletePreset}>Delete</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showImportWarning} onOpenChange={setShowImportWarning}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Replace all data?</DialogTitle>
                        <DialogDescription>
                            Importing a CSV will permanently delete <strong>all current items and tags</strong> in this preset and replace them with the contents of the file. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowImportWarning(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleImportConfirm}>Yes, replace everything</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}