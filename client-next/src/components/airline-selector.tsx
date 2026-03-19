'use client';

import { useState } from 'react';
import { AIRLINES } from '@/lib/airlines';
import { fromGrams, WeightUnit } from '@/lib/weight';
import { ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Airline, BaggageClass } from '@/types';

interface AirlineSelectorProps {
    totalGrams: number;
    weightUnit: WeightUnit;
}

export function AirlineSelector({ totalGrams, weightUnit }: AirlineSelectorProps) {
    const [selectedAirline, setSelectedAirline] = useState<Airline | null>(AIRLINES[0]);
    const [selectedClass, setSelectedClass] = useState<BaggageClass | null>(AIRLINES[0].classes[0]);

    const handleAirlineSelect = (airline: Airline) => {
        setSelectedAirline(airline);
        setSelectedClass(airline.classes[0]);
    };

    const handleClear = () => {
        setSelectedAirline(null);
        setSelectedClass(null);
    };

    const totalInUnit = fromGrams(totalGrams, weightUnit);
    const limitInUnit = selectedClass ? fromGrams(selectedClass.weightKg * 1000, weightUnit) : null;
    const isOverLimit = limitInUnit !== null && selectedClass?.weightKg !== 0 && totalInUnit > limitInUnit;
    const hasNoLimit = selectedClass?.weightKg === 0;

    const formatWeight = (grams: number) =>
        `${Math.round(fromGrams(grams, weightUnit) * 1000) / 1000}`;

    return (
        <div className="flex items-center gap-2">
            {/* Airline picker */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 max-w-40">
                        <span className="truncate">{selectedAirline?.name ?? 'Airline'}</span>
                        <ChevronDown className="h-4 w-4 shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                    {AIRLINES.map(airline => (
                        <DropdownMenuItem
                            key={airline.name}
                            onClick={() => handleAirlineSelect(airline)}
                            className={selectedAirline?.name === airline.name ? 'bg-muted font-medium' : ''}
                        >
                            {airline.name}
                        </DropdownMenuItem>
                    ))}
                    {selectedAirline && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleClear} className="text-muted-foreground">
                                Clear
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Class picker */}
            {selectedAirline && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2 max-w-44">
                            <span className="truncate">{selectedClass?.name ?? 'Class'}</span>
                            <ChevronDown className="h-4 w-4 shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {selectedAirline.classes.map(cls => (
                            <DropdownMenuItem
                                key={cls.name}
                                onClick={() => setSelectedClass(cls)}
                                className={selectedClass?.name === cls.name ? 'bg-muted font-medium' : ''}
                            >
                                <div className="flex flex-col">
                                    <span>{cls.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {cls.weightKg === 0 ? 'No limit' : `${cls.weightKg} kg`}
                                        {cls.notes ? ` · ${cls.notes}` : ''}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Total weight */}
            <span className={`font-medium text-xl ${isOverLimit ? 'text-destructive' : ''}`}>
                {hasNoLimit
                    ? <>{formatWeight(totalGrams)} <span className="text-sm text-muted-foreground">(no limit)</span></>
                    : limitInUnit !== null
                        ? <>{formatWeight(totalGrams)} / {limitInUnit}</>
                        : formatWeight(totalGrams)
                }
            </span>
        </div>
    );
}