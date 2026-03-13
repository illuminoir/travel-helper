'use client';

import React from 'react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TravelItem } from '@/types';
import { useWeightUnit } from '@/contexts/weight-unit-context';
import { toGrams } from '@/lib/weight';

interface AddItemDialogProps {
    onAdd: (name: string, weight: number) => Promise<void>;
    isLoading?: boolean;
    items: TravelItem[];
}

export function AddItemDialog({ onAdd, isLoading, items }: AddItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const { weightUnit } = useWeightUnit();

    const formatName = (raw: string) =>
        raw.trim().replace(/\b\S+/g, word =>
            word[1] === word[1]?.toUpperCase() && word[1] !== word[1]?.toLowerCase()
                ? word
                : word.charAt(0).toUpperCase() + word.slice(1)
        );

    const isDuplicate = (rawName: string) =>
        items.some(item => item.name.toLowerCase() === rawName.trim().toLowerCase());

    const doAdd = async () => {
        try {
            console.log(weight);
            await onAdd(formatName(name), toGrams(parseFloat(weight) || 0, weightUnit));
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

        const weightNum = parseFloat(weight) || 0;

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
                    <Button className="gap-2">
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
                            <label className="text-sm font-medium">Weight ({weightUnit})</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Duplicate Item</DialogTitle>
                        <DialogDescription>
                            An item named <strong>"{formatName(name)}"</strong> already exists in this preset. Are you sure you want to add another one?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>Cancel</Button>
                        <Button onClick={doAdd}>Add Anyway</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}