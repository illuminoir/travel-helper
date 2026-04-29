'use client';

import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TravelItem } from '@/types';
import { toGrams } from '@/lib/weight';

interface AddItemDialogProps {
    onAdd: (name: string, weight: number) => Promise<void>;
    isLoading?: boolean;
    items: TravelItem[];
    triggerRef?: React.Ref<HTMLButtonElement>;
}

export function AddItemDialog({ onAdd, isLoading, items, triggerRef }: AddItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

    const confirmRef = useRef<HTMLButtonElement>(null);

    const formatName = (raw: string) => {
        const exceptions = ['iphone', 'ipad', 'ipod', 'imac', 'iwatch'];
        return raw.trim().toLowerCase()
            .replace(/\b\w+/g, word =>
                exceptions.includes(word) ? 'i' + word.slice(1).charAt(0).toUpperCase() + word.slice(2) : word.charAt(0).toUpperCase() + word.slice(1)
            );
    };

    const isDuplicate = (rawName: string) =>
        items.some(item => item.name.toLowerCase() === rawName.trim().toLowerCase());

    const getRoundedWeight = () =>
        parseFloat(parseFloat(weight).toFixed(3)) || 0;

    const doAdd = async () => {
        try {
            await onAdd(formatName(name), toGrams(getRoundedWeight(), 'kg'));
            setName('');
            setWeight('');
            setOpen(false);
            setShowDuplicateWarning(false);
        } catch {
            setError('Failed to add item');
            setShowDuplicateWarning(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        const weightNum = getRoundedWeight();

        if (weightNum < 0) {
            setError('Weight must be a positive number');
            return;
        }

        if (isDuplicate(name)) {
            setShowDuplicateWarning(true);
            return;
        }

        await doAdd();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button ref={triggerRef} className="gap-2 cursor-pointer">
                        <Plus className="w-4 h-4" />
                        Add Item
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Item name"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Weight (kg)</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.001"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                onBlur={(e) => {
                                    const rounded = parseFloat(e.target.value);
                                    if (!isNaN(rounded)) {
                                        setWeight(String(parseFloat(rounded.toFixed(3))));
                                    }
                                }}
                                placeholder="0"
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? 'Adding...' : 'Add Item'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
                <DialogContent onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    confirmRef.current?.focus();
                }}>
                    <DialogHeader>
                        <DialogTitle>Duplicate Item</DialogTitle>
                        <DialogDescription>
                            An item named <strong>&#34;{formatName(name)}&#34;</strong> already exists in this preset. Are you sure you want to add another one?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>Cancel</Button>
                        <Button ref={confirmRef} onClick={doAdd}>Add Anyway</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}