"use client"

import type React from "react"
import type { TravelItem } from "@/types"

import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TagContextMenuProps {
    item: TravelItem
    isOpen: boolean
    onClose: () => void
    onSaveTags: (itemId: number, tags: Array<{ name: string }>) => Promise<void>
}

export function TagContextMenu({ item, isOpen, onClose, onSaveTags }: TagContextMenuProps) {
    const normalizedTags = Array.isArray(item.tags)
        ? item.tags
            .map((tag) => (typeof tag === "object" && tag.name ? tag.name : String(tag || "").trim()))
            .filter(Boolean)
        : []

    const [tags, setTags] = useState<string[]>(normalizedTags)
    const [tagInput, setTagInput] = useState("")
    const [loading, setLoading] = useState(false)

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput("")
        }
    }

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag))
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const tagObjects = tags.map((tag) => ({ name: tag }))
            await onSaveTags(item.id, tagObjects)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleAddTag()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tag Item</DialogTitle>
                    <DialogDescription>Add tags to: {String(item.name || "Item")}</DialogDescription>
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
                                key={`tag-${String(tag)}-${index}`}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                            >
                                {String(tag || "")}
                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-600">
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
                            {loading ? "Saving..." : "Save Tags"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
