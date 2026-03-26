import { Airline } from '@/types';

export const AIRLINES: Airline[] = [
    {
        name: 'Air France',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Hand luggage', weightKg: 12, notes: 'Max 1 bag + 1 accessory' },
            { name: 'Checked (Economy)', weightKg: 23 },
            { name: 'Checked (Business)', weightKg: 32 },
        ],
    },
    {
        name: 'British Airways',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Hand luggage', weightKg: 23, notes: '1 bag + 1 personal item' },
            { name: 'Checked (Economy)', weightKg: 23 },
            { name: 'Checked (Business)', weightKg: 32 },
        ],
    },
    {
        name: 'Emirates',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Carry-on', weightKg: 7 },
            { name: 'Checked (Economy)', weightKg: 25 },
            { name: 'Checked (Business)', weightKg: 32 },
            { name: 'Checked (First)', weightKg: 40 },
        ],
    },
    {
        name: 'Ryanair',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Small personal bag', weightKg: 10, notes: 'Must fit under seat' },
            { name: 'Cabin bag (Priority)', weightKg: 10, notes: 'Requires priority boarding' },
            { name: 'Checked', weightKg: 20 },
        ],
    },
    {
        name: 'easyJet',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Personal item', weightKg: 15, notes: 'Must fit under seat' },
            { name: 'Cabin bag (Up front)', weightKg: 15 },
            { name: 'Checked', weightKg: 23 },
        ],
    },
    {
        name: 'Lufthansa',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Carry-on', weightKg: 8 },
            { name: 'Checked (Economy)', weightKg: 23 },
            { name: 'Checked (Business)', weightKg: 32 },
        ],
    },
    {
        name: 'Delta',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Carry-on', weightKg: 0, notes: 'No weight limit, must fit overhead' },
            { name: 'Checked (Economy)', weightKg: 23 },
            { name: 'Checked (First)', weightKg: 32 },
        ],
    },
    {
        name: 'United',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Carry-on', weightKg: 0, notes: 'No weight limit, must fit overhead' },
            { name: 'Checked (Economy)', weightKg: 23 },
            { name: 'Checked (Business)', weightKg: 32 },
        ],
    },
    {
        name: 'Singapore Airlines',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Carry-on (Economy)', weightKg: 7 },
            { name: 'Carry-on (Business)', weightKg: 10 },
            { name: 'Checked (Economy)', weightKg: 30 },
            { name: 'Checked (Business)', weightKg: 40 },
        ],
    },
    {
        name: 'Qatar Airways',
        lastUpdated: 'March 2026',
        classes: [
            { name: 'Carry-on (Economy)', weightKg: 7 },
            { name: 'Carry-on (Business)', weightKg: 15 },
            { name: 'Checked (Economy)', weightKg: 23 },
            { name: 'Checked (Business)', weightKg: 32 },
        ],
    },
];