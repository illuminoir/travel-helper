'use client';

import { useState } from 'react';
import { AIRLINES } from '@/lib/airlines';
import { WeightUnit } from '@/lib/weight';
import { Check, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Airline, BaggageClass, SelectedBag, TravelItem } from '@/types';

interface AirlineSelectorProps {
    weightUnit: WeightUnit;
    onBagsChange: (bags: SelectedBag[]) => void;
    getItemsForBag: (bagIndex: number) => TravelItem[];
}

export function AirlineSelector({ weightUnit, onBagsChange, getItemsForBag }: AirlineSelectorProps) {
    const [selectedAirline, setSelectedAirline] = useState<Airline>(AIRLINES[0]);
    const [selectedBags, setSelectedBags] = useState<SelectedBag[]>([]);
    const [pendingRemoval, setPendingRemoval] = useState<SelectedBag | null>(null);

    const handleAirlineSelect = (airline: Airline) => {
        setSelectedAirline(airline);
    };

    const handleAddBag = (cls: BaggageClass) => {
        const existing = selectedBags.find(
            b => b.airline.name === selectedAirline.name && b.bagClass.name === cls.name
        );

        if (!existing) {
            // Add
            const updated = [
                ...selectedBags,
                { id: crypto.randomUUID(), airline: selectedAirline, bagClass: cls },
            ];
            setSelectedBags(updated);
            onBagsChange(updated);
            return;
        }

        // Find this bag's index in selectedBags
        const bagIndex = selectedBags.findIndex(b => b.id === existing.id);
        const itemsInBag = getItemsForBag(bagIndex);

        if (itemsInBag.length > 0) {
            // Has items — warn first
            setPendingRemoval(existing);
        } else {
            // Empty — remove immediately
            removeBag(existing.id);
        }
    };

    const removeBag = (id: string) => {
        const updated = selectedBags.filter(b => b.id !== id);
        setSelectedBags(updated);
        onBagsChange(updated);
        setPendingRemoval(null);
    };

    const isBagSelected = (cls: BaggageClass) =>
        selectedBags.some(b => b.airline.name === selectedAirline.name && b.bagClass.name === cls.name);

    return (
        <>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Airline picker */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1 max-w-40">
                                <span className="truncate">{selectedAirline.name}</span>
                                <ChevronDown className="h-3 w-3 shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                            {AIRLINES.map(airline => (
                                <DropdownMenuItem
                                    key={airline.name}
                                    onClick={() => handleAirlineSelect(airline)}
                                    className={selectedAirline.name === airline.name ? 'bg-muted font-medium' : ''}
                                >
                                    {airline.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Class picker */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1 max-w-44">
                                <span className="truncate">Bag classes</span>
                                <ChevronDown className="h-3 w-3 shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {selectedAirline.classes.map(cls => (
                                <DropdownMenuItem
                                    key={cls.name}
                                    onSelect={(e) => { e.preventDefault(); handleAddBag(cls); }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex flex-col">
                                        <span>{cls.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {cls.weightKg === 0 ? 'No limit' : `${cls.weightKg} kg`}
                                            {cls.notes ? ` · ${cls.notes}` : ''}
                                        </span>
                                    </div>
                                    {isBagSelected(cls) && <Check className="h-4 w-4 ml-2" />}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Warning dialog */}
            <Dialog open={!!pendingRemoval} onOpenChange={(open) => { if (!open) setPendingRemoval(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove bag?</DialogTitle>
                        <DialogDescription>
                            <strong>{pendingRemoval?.airline.name} · {pendingRemoval?.bagClass.name}</strong> still has items in it.
                            Removing it will send all its items back to available.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setPendingRemoval(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => pendingRemoval && removeBag(pendingRemoval.id)}>
                            Remove anyway
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}