'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TagFilterProps {
    selectedTags: string[]
    onTagRemove: (tag: string) => void
}

export function TagFilter({ selectedTags, onTagRemove }: TagFilterProps) {
    if (selectedTags.length === 0) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
                <Button key={tag} variant="secondary" size="sm" className="gap-1" onClick={() => onTagRemove(tag)}>
                    {tag}
                    <X className="w-3 h-3" />
                </Button>
            ))}
        </div>
    )
}
