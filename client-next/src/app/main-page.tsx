'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useItems } from '@/hooks/use-items';
import { usePresets } from '@/hooks/use-presets';
import { useAuth } from '@/contexts/auth-context';
import { AddItemDialog } from '@/components/add-item-dialog';
import { ItemsList } from '@/components/items-list';
import { DropZone } from '@/components/drop-zone';
import { EditItemDialog } from '@/components/edit-item-dialog';
import { TagFilter } from '@/components/tag-filter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TravelItem } from '@/types';
import { exportToCSV, importFromCSV, parseCSV } from '@/lib/api';
import { ChevronDown, LogOut, Trash2, Undo2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWeightUnit } from '@/contexts/weight-unit-context';
import { SortButtons, SortState } from '@/components/sort-buttons';
import { AirlineSelector } from '@/components/airline-selector';
import { PresetManager } from '@/components/preset-manager';

export default function Home() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const { presets, activePresetId, setActivePresetId, createPreset, deletePreset, loading: presetsLoading } = usePresets();
    const {
        items, droppedItems, loading, error, setError, deleteItem, addItem,
        moveItem, clearDropped, refetchItems, updateWeight,
        canUndo, undo, deleteAll, dropAll, updateQuantity, reorderDropped, sortDropped,
    } = useItems(activePresetId);

    const [selectedItem, setSelectedItem] = useState<TravelItem | null>(null);
    const [isEditItemOpen, setIsEditItemOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [showImportWarning, setShowImportWarning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { weightUnit, setWeightUnit } = useWeightUnit();
    const [availableSort, setAvailableSort] = useState<SortState>({ field: 'name', direction: 'asc' });
    const [droppedSort, setDroppedSort] = useState<SortState>({ field: 'name', direction: 'asc' });

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const toCompareFn = (sort: SortState) => (a: TravelItem, b: TravelItem) => {
        if (sort.field === 'name') {
            return sort.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else {
            return sort.direction === 'asc' ? Number(a.weight) - Number(b.weight) : Number(b.weight) - Number(a.weight);
        }
    };

    const handleDragStart = (e: React.DragEvent, item: TravelItem) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(item));
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

    const handleDoubleClick = (item: TravelItem) => moveItem(item, true, 0);
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

    const handleDroppedSort = (sort: SortState) => {
        setDroppedSort(sort);
        sortDropped(toCompareFn(sort));
    };

    const handleUndo = async () => {
        setAvailableSort({ field: 'name', direction: 'asc' });
        setDroppedSort({ field: 'name', direction: 'asc' });
        await undo();
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (authLoading || presetsLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!user) return null;

    const totalGrams = droppedItems.reduce((sum, current) => sum + Number(current.weight) * (current.quantity ?? 1), 0);

    return (
        <main className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-3">
                    {/* Top row: title + actions */}
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold">Travel helper</h1>

                        {/* Export / Import / User */}
                        <div className="flex flex-wrap gap-2 items-center justify-end">
                            <Button variant="outline" size="sm" onClick={handleExport} className="cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span className="hidden sm:inline">Export CSV</span>
                                <span className="sm:hidden">Export</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isImporting} className="cursor-pointer">
                                {isImporting ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 animate-spin">
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                        </svg>
                                        Importing…
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        <span className="hidden sm:inline">Import CSV</span>
                                        <span className="sm:hidden">Import</span>
                                    </>
                                )}
                            </Button>
                            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                            <Button variant="outline" size="icon" onClick={handleLogout} title="Sign out" className="cursor-pointer h-8 w-8">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Preset manager */}
                    <PresetManager
                        presets={presets}
                        activePresetId={activePresetId}
                        setActivePresetId={setActivePresetId}
                        createPreset={createPreset}
                        deletePreset={deletePreset}
                        items={items}
                        droppedItems={droppedItems}
                        onError={(msg) => setError(msg)}
                        refetchItems={refetchItems}
                    />
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <AddItemDialog onAdd={addItem} isLoading={false} items={[...items, ...droppedItems]} />
                        <Button variant="outline" onClick={() => setSelectedTags([])} disabled={selectedTags.length === 0}>
                            Clear Filters
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleUndo} disabled={!canUndo}>
                            <Undo2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <AirlineSelector totalGrams={totalGrams} weightUnit={weightUnit} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center gap-1 w-16">
                                    <span>{weightUnit}</span>
                                    <ChevronDown className="h-3 w-3 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {(['g', 'kg', 'lb', 'oz'] as const).map(unit => (
                                    <DropdownMenuItem
                                        key={unit}
                                        onClick={() => setWeightUnit(unit)}
                                        className={weightUnit === unit ? 'bg-muted font-medium' : ''}
                                    >
                                        {unit}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Main panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[calc(100vh-16rem)]">
                    <div className="border-2 border-border rounded-lg p-4 flex flex-col min-h-0 bg-card h-[60vh] lg:h-auto">
                        <div className="flex items-center justify-between flex-shrink-0 mb-3 flex-wrap gap-2">
                            <h2 className="font-semibold text-lg">Available Items ({items.length})</h2>
                            <div className="flex gap-2 items-center flex-wrap">
                                <SortButtons sort={availableSort} onChange={setAvailableSort} />
                                <Button variant="outline" size="sm" onClick={async () => await deleteAll(items)} disabled={items.length === 0}>
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete All
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => dropAll(items)} disabled={items.length === 0}>
                                    Drop All
                                </Button>
                            </div>
                        </div>
                        <TagFilter selectedTags={selectedTags} onTagRemove={handleTagClick} />
                        <div className="flex-1 min-h-0 overflow-y-auto mt-2">
                            <ItemsList
                                items={[...filteredItems].sort(toCompareFn(availableSort))}
                                onDelete={(id) => deleteItem(id, false)}
                                onDragStart={handleDragStart}
                                onRightClick={handleRightClick}
                                onTagClick={handleTagClick}
                                onDoubleClick={handleDoubleClick}
                                onQuantityChange={(item, qty) => updateQuantity(item, qty)}
                            />
                        </div>
                    </div>

                    <div className="border-2 border-border rounded-lg p-4 flex flex-col min-h-0 bg-card min-h-96">
                        <DropZone
                            items={droppedItems}
                            onRestore={handleRestoreItem}
                            onClearAll={clearDropped}
                            onRightClick={handleRightClick}
                            onDoubleClick={handleDoubleClickDropped}
                            onQuantityChange={(item, qty) => updateQuantity(item, qty)}
                            onReorder={reorderDropped}
                            onDropNewItem={(item, index) => moveItem(item, true, index)}
                            sort={droppedSort}
                            onSort={handleDroppedSort}
                        />
                    </div>
                </div>
            </div>

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