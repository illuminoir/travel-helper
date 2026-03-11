'use client';

import React, { createContext, useContext, useState } from 'react';
import { WeightUnit } from '@/lib/weight';

const WeightUnitContext = createContext<{
    weightUnit: WeightUnit;
    setWeightUnit: (unit: WeightUnit) => void;
}>({ weightUnit: 'g', setWeightUnit: () => {} });

export function WeightUnitProvider({ children }: { children: React.ReactNode }) {
    const [weightUnit, setWeightUnit] = useState<WeightUnit>('g');
    return (
        <WeightUnitContext.Provider value={{ weightUnit, setWeightUnit }}>
            {children}
        </WeightUnitContext.Provider>
    );
}

export function useWeightUnit() {
    return useContext(WeightUnitContext);
}