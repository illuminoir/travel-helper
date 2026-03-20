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
    let result: number;
    switch (unit) {
        case 'g':  result = grams; break;
        case 'kg': result = grams / 1000; break;
        case 'lb': result = grams / 453.592; break;
        case 'oz': result = grams / 28.3495; break;
    }
    return Math.round(result * 100) / 100;
}


export function smartWeight(grams: number, unit: WeightUnit): string {
    if (unit === 'g' && grams >= 1000) {
        return `${Math.round(grams / 1000 * 1000) / 1000} kg`;
    }
    return `${Math.round(fromGrams(grams, unit) * 1000) / 1000} ${unit}`;
}