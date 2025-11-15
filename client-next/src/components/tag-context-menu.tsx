'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {Tag, TravelItem} from "@/types";

interface TagContextMenuProps {
    item: TravelItem;
    isOpen: boolean;
    onClose: () => void;
    onSaveTags: (itemId: number, tags: Tag[] | undefined) => Promise<void>;
}

export function TagContextMenu({
                                   item,
                                   isOpen,
                                   onClose,
                                   onSaveTags,
                               }: TagContextMenuProps) {
        const [tags, setTags] = useState<Tag[] | undefined>(item.tags);
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddTag = () => {
        if (tagInput.trim() && tags && !tags.map(tag => tag.name).includes(tagInput.trim())) {
            setTags([...tags, {id: 0, name: tagInput.trim()}]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: Tag) => {
        if (tags) {
            setTags(tags.filter((t) => t !== tag));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSaveTags(item.id, tags);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTag();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tag Item</DialogTitle>
                    <DialogDescription>Add tags to: {item.name}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter a tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <Button onClick={handleAddTag} variant="outline">
                            Add
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                            <div
                                key={`tag-${tag}-${index}`}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                            >
                                {tag}
                                <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:text-blue-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Tags'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
