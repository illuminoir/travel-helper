export type Tag = {
    id: number
    name: string
}

export type TravelItem = {
    id: number
    name: string
    weight: number
    quantity: number
    bagIndex: number
    orderIndex: number
    tags: Tag[]
}

export type BaggageClass = {
    name: string;
    weightKg: number;
    notes?: string;
};

export type Airline = {
    name: string;
    lastUpdated: string;
    classes: BaggageClass[];
};

export type SelectedBag = {
    id: string;
    airline: Airline;
    bagClass: BaggageClass;
};