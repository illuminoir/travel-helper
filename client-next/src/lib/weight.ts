export type WeightUnit = 'g' | 'kg' | 'lb' | 'oz';

export function toGrams(value: number, unit: WeightUnit): number {
    switch (unit) {
        case 'g':  return value;
        case 'kg': return value * 1000;
        case 'lb': return value * 453.592;
        case 'oz': return value * 28.3495;
    }
}

export function fromGrams(grams: number, unit: WeightUnit): number {
    switch (unit) {
        case 'g':  return grams;
        case 'kg': return grams / 1000;
        case 'lb': return grams / 453.592;
        case 'oz': return grams / 28.3495;
    }
}

export function formatWeight(grams: number, unit: WeightUnit): string {
    return `${Math.round(fromGrams(grams, unit) * 1000) / 1000} ${unit}`;
}