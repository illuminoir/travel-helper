'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useItems } from '@/hooks/use-items';
import { usePresets } from '@/hooks/use-presets';
import { useAuth } from '@/contexts/auth-context';
import { ItemsPanel } from '@/components/items-panel';
import { EditItemDialog } from '@/components/edit-item-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddItemDialog } from '@/components/add-item-dialog';
import { SelectedBag, TravelItem } from '@/types';
import { exportToCSV, importFromCSV, parseCSV } from '@/lib/api';
import { ChevronDown, LogOut, Trash2, Undo2, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWeightUnit } from '@/contexts/weight-unit-context';
import { SortState } from '@/components/sort-buttons';
import { AirlineSelector } from '@/components/airline-selector';
import { PresetManager } from '@/components/preset-manager';

export default function Home() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const { presets, activePresetId, setActivePresetId, createPreset, deletePreset, loading: presetsLoading } = usePresets();
    const {
        items, bagItems, getItemsForBag, loading, error, setError,
        deleteItem, addItem, moveItem, refetchItems, updateWeight,
        canUndo, undo, deleteAll, dropAll, updateQuantity,
        reorderBag, sortBag, clearBag, clearAllBags, clearUndoStack,
    } = useItems(activePresetId);

    const [selectedItem, setSelectedItem] = useState<TravelItem | null>(null);
    const [isEditItemOpen, setIsEditItemOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [showImportWarning, setShowImportWarning] = useState(false);
    const [shouldReplaceOnImport, setShouldReplaceOnImport] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { weightUnit, setWeightUnit } = useWeightUnit();
    const [availableSort, setAvailableSort] = useState<SortState>({ field: 'name', direction: 'asc' });
    const [bagSorts, setBagSorts] = useState<Record<number, SortState>>({});
    const [focusedPanelIndex, setFocusedPanelIndex] = useState<number>(0);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const addItemDialogRef = useRef<HTMLButtonElement>(null);
    const [selectedBags, setSelectedBags] = useState<SelectedBag[]>(() => {
        try {
            const saved = localStorage.getItem('selectedBags');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const activeBagIndex = focusedPanelIndex > 0 ? focusedPanelIndex - 1 : null;

    // Last added bag index for double-click drop target
    const lastBagIndex = selectedBags.length > 0 ? selectedBags.length - 1 : 0;

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

    const handleRightClick = (item: TravelItem, e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        setSelectedItem(item);
        setIsEditItemOpen(true);
    };

    const handleDoubleClick = (item: TravelItem) => {
        if (activeBagIndex === null) return;
        moveItem(item, activeBagIndex, 0);
    };

    const handleDoubleClickDropped = (item: TravelItem) => moveItem(item, null);

    const handleExport = () => exportToCSV([...items, ...bagItems]);

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
            await importFromCSV(data, activePresetId, shouldReplaceOnImport, shouldReplaceOnImport ? [] : [...items, ...bagItems]);
            await refetchItems();
            clearUndoStack();
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const handleBagSort = (bagIndex: number, sort: SortState) => {
        setBagSorts(prev => ({ ...prev, [bagIndex]: sort }));
        sortBag(bagIndex, toCompareFn(sort));
    };

    const handleUndo = async () => {
        setAvailableSort({ field: 'name', direction: 'asc' });
        setBagSorts({});
        await undo();
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const getFocusedPanelItems = useCallback((): TravelItem[] => {
        if (focusedPanelIndex === 0) {
            return [...items].sort(toCompareFn(availableSort));
        }
        const bagIndex = focusedPanelIndex - 1;
        const bagSort = bagSorts[bagIndex] ?? { field: 'name', direction: 'asc' };
        return [...getItemsForBag(bagIndex)].sort(toCompareFn(bagSort));
    }, [focusedPanelIndex, items, availableSort, bagSorts, getItemsForBag]);

    const storageKey = `selectedBags_${activePresetId}`;

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Disable when dialog is open
            if (isEditItemOpen || document.querySelector('[role="dialog"]')) return;

            const isMac = navigator.platform.toUpperCase().includes('MAC');
            const totalPanels = 1 + selectedBags.length;

            // Ctrl/Cmd+Z — undo
            if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (canUndo) await handleUndo();
                return;
            }

            switch (e.key) {
                case 'Tab': {
                    e.preventDefault();
                    const next = e.shiftKey
                        ? (focusedPanelIndex - 1 + totalPanels) % totalPanels
                        : (focusedPanelIndex + 1) % totalPanels;
                    setFocusedPanelIndex(next);
                    setSelectedItemId(null);
                    // Sync activeBagIndex
                    if (next > 0) setFocusedPanelIndex(next);
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    const panelItems = getFocusedPanelItems();
                    if (panelItems.length === 0) break;
                    if (selectedItemId === null) {
                        setSelectedItemId(panelItems[0].id);
                    } else {
                        const idx = panelItems.findIndex(i => i.id === selectedItemId);
                        setSelectedItemId(panelItems[(idx + 1) % panelItems.length].id);
                    }
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    const panelItems = getFocusedPanelItems();
                    if (panelItems.length === 0) break;
                    if (selectedItemId === null) {
                        setSelectedItemId(panelItems[panelItems.length - 1].id);
                    } else {
                        const idx = panelItems.findIndex(i => i.id === selectedItemId);
                        setSelectedItemId(panelItems[(idx - 1 + panelItems.length) % panelItems.length].id);
                    }
                    break;
                }
                case 'Enter': {
                    e.preventDefault();
                    if (selectedItemId === null) break;
                    const allItems = [...items, ...bagItems];
                    const item = allItems.find(i => i.id === selectedItemId);
                    if (!item) break;

                    if (focusedPanelIndex === 0) {
                        // Available → move to active bag
                        if (activeBagIndex === null) break;
                        await moveItem(item, activeBagIndex, 0);
                    } else {
                        // Bag → move back to available
                        await moveItem(item, null);
                    }
                    setSelectedItemId(null);
                    break;
                }
                case 'Delete':
                case 'Backspace': {
                    if (focusedPanelIndex === 0) break;
                    if (selectedItemId === null) break;
                    e.preventDefault();
                    const item = bagItems.find(i => i.id === selectedItemId);
                    if (!item) break;
                    await moveItem(item, null);
                    setSelectedItemId(null);
                    break;
                }
                case 'e':
                case 'E': {
                    if (selectedItemId === null) break;
                    const allItems = [...items, ...bagItems];
                    const item = allItems.find(i => i.id === selectedItemId);
                    if (!item) break;
                    e.preventDefault();
                    setSelectedItem(item);
                    setIsEditItemOpen(true);
                    break;
                }
                case 'a':
                case 'A': {
                    e.preventDefault();
                    // Trigger add item dialog — we need a ref for this
                    addItemDialogRef.current?.click();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedPanelIndex, selectedItemId, selectedBags, activeBagIndex, canUndo, isEditItemOpen, items, bagItems, getFocusedPanelItems]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            const bags = saved ? JSON.parse(saved) : [];
            setSelectedBags(bags);
            setFocusedPanelIndex(bags.length > 0 ? bags.length : null);
        } catch {
            setSelectedBags([]);
            setFocusedPanelIndex(0);
        }
    }, [storageKey]);

    if (authLoading || presetsLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const handleBagsChange = async (bags: SelectedBag[]) => {
        // Find removed bags
        const removedIndices = selectedBags
            .map((_, i) => i)
            .filter(i => !bags.some((_, newI) => newI === i));

        // Move items from removed bags back to available
        for (const bagIndex of removedIndices) {
            const itemsInBag = getItemsForBag(bagIndex);
            await Promise.all(itemsInBag.map(item => moveItem(item, null)));
        }

        setSelectedBags(bags);
        localStorage.setItem(storageKey, JSON.stringify(bags));
        if (bags.length > 0) setFocusedPanelIndex(bags.length);
        else setFocusedPanelIndex(0);
    };

    if (!user) return null;

    return (
        <main className="min-h-screen bg-gradient-to-br from-background to-muted p-4 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold">Travel helper</h1>
                        <div className="flex flex-wrap gap-2 items-center justify-end">
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
                            <Button variant="outline" size="sm" onClick={handleExport} className="cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span className="hidden sm:inline">Export CSV</span>
                                <span className="sm:hidden">Export</span>
                            </Button>
                            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="cursor-pointer h-8 w-8">
                                        <User className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        {user.email}
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <PresetManager
                        presets={presets}
                        activePresetId={activePresetId}
                        setActivePresetId={setActivePresetId}
                        createPreset={createPreset}
                        deletePreset={deletePreset}
                        items={items}
                        droppedItems={bagItems}
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

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <AddItemDialog onAdd={addItem} isLoading={false} items={[...items, ...bagItems]} triggerRef={addItemDialogRef} />
                        {/*<Button variant="outline" onClick={() => setSelectedTags([])} disabled={selectedTags.length === 0}>
                            Clear Filters
                        </Button> */}
                        <Button variant="outline" size="icon" onClick={handleUndo} disabled={!canUndo}>
                            <Undo2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <AirlineSelector
                            weightUnit={weightUnit}
                            onBagsChange={handleBagsChange}
                            getItemsForBag={getItemsForBag}
                        />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Available items */}
                    <div
                        onClick={() => setFocusedPanelIndex(0)}
                        className={`border-2 rounded-lg p-4 flex flex-col min-h-0 bg-card h-[60vh] lg:h-[calc(100vh-20rem)] transition-colors ${
                            focusedPanelIndex === 0 ? 'border-primary' : 'border-border'
                        }`}
                    >
                        <ItemsPanel
                            title="Available Items"
                            bagIndex={null}
                            items={[...items].sort(toCompareFn(availableSort))}
                            sort={availableSort}
                            onSort={setAvailableSort}
                            onDelete={(id) => deleteItem(id)}
                            onDragStart={handleDragStart}
                            onRightClick={handleRightClick}
                            onDoubleClick={handleDoubleClick}
                            onQuantityChange={(item, qty) => updateQuantity(item, qty)}
                            headerActions={
                                <>
                                    <Button variant="outline" size="sm" onClick={async () => await deleteAll(items)} disabled={items.length === 0}>
                                        <Trash2 className="w-3 h-3 mr-1" /> Delete All
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => dropAll(items, 0)} disabled={items.length === 0 || selectedBags.length === 0}>
                                        Drop All
                                    </Button>
                                </>
                            }
                            selectedItemId={selectedItemId}
                            onItemSelect={(item) => {
                                setSelectedItemId(item.id);
                                setFocusedPanelIndex(0);
                            }}
                        />
                    </div>

                    {/* Bag panels */}
                    <div className="flex flex-col gap-4 overflow-y-auto h-[60vh] lg:h-[calc(100vh-20rem)]">
                        {selectedBags.length === 0 ? (
                            <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center text-muted-foreground text-center bg-card h-[60vh] lg:h-[calc(100vh-20rem)]">
                                <p>Add a bag using the airline selector above to start packing</p>
                            </div>
                        ) : (
                            selectedBags.map((bag, bagIndex) => {
                                const bagSort = bagSorts[bagIndex] ?? { field: 'name', direction: 'asc' };
                                const thisBagItems = getItemsForBag(bagIndex);
                                const sortedBagItems = [...thisBagItems].sort(toCompareFn(bagSort));
                                const weightLimitGrams = bag.bagClass.weightKg * 1000;

                                return (
                                    <div
                                        key={bag.id}
                                        onClick={() => setFocusedPanelIndex(bagIndex + 1)}
                                        className={`border-2 rounded-lg p-4 flex flex-col bg-card flex-shrink-0 cursor-default transition-colors ${
                                            focusedPanelIndex === bagIndex + 1 ? 'border-primary' : 'border-border'
                                        }`}
                                        style={{ height: selectedBags.length === 1 ? '100%' : '400px' }}
                                    >
                                        <ItemsPanel
                                            title={`${bag.airline.name} · ${bag.bagClass.name}`}
                                            bagIndex={bagIndex}
                                            items={sortedBagItems}
                                            weightLimitGrams={weightLimitGrams}
                                            sort={bagSort}
                                            onSort={(sort) => handleBagSort(bagIndex, sort)}
                                            onDelete={(id) => deleteItem(id)}
                                            onRightClick={handleRightClick}
                                            onDoubleClick={handleDoubleClickDropped}
                                            onQuantityChange={(item, qty) => updateQuantity(item, qty)}
                                            onReorder={(reordered) => reorderBag(bagIndex, reordered)}
                                            onDropNewItem={(item, index) => moveItem(item, bagIndex, index)}
                                            onClearAll={() => clearBag(bagIndex)}
                                            selectedItemId={selectedItemId}
                                            onItemSelect={(item) => {
                                                setSelectedItemId(item.id);
                                                setFocusedPanelIndex(bagIndex + 1);
                                            }}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {selectedItem && (
                <EditItemDialog
                    item={selectedItem}
                    items={[...items, ...bagItems]}
                    isOpen={isEditItemOpen}
                    onClose={() => { setIsEditItemOpen(false); setSelectedItem(null); setSelectedItemId(null); }}
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
                        <DialogTitle>Import CSV</DialogTitle>
                        <DialogDescription>
                            How would you like to handle the import?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowImportWarning(false)}>Cancel</Button>
                        <Button variant="outline" onClick={() => { setShouldReplaceOnImport(false); handleImportConfirm(); }}>
                            Add to existing
                        </Button>
                        <Button variant="destructive" onClick={() => { setShouldReplaceOnImport(true); handleImportConfirm(); }}>
                            Replace everything
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}