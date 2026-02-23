'use client';

import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TravelItem } from '@/types';

interface EditWeightDialogProps {
    item: TravelItem;
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: TravelItem, newWeight: number) => Promise<void>;
}

export function EditWeightDialog({ item, isOpen, onClose, onSave }: EditWeightDialogProps) {
    const [weight, setWeight] = useState(String(item.weight));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const parsed = parseFloat(weight);
        if (isNaN(parsed) || parsed < 0) {
            setError('Please enter a valid positive number.');
            return;
        }
        setLoading(true);
        await onSave(item, parsed);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Weight</DialogTitle>
                    <DialogDescription>Update the weight for: {String(item.name || 'Item')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={weight}
                            onChange={(e) => { setWeight(e.target.value); setError(''); }}
                            placeholder="Weight in kg"
                            className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">kg</span>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
