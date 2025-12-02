"use client"
import type {Tag, TravelItem} from "@/types"

import { useState } from "react"
import { X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreateTagDialog } from "@/components/create-tag-dialog"
import * as React from "react";
import {useTags} from "@/hooks/use-tags";

interface TagContextMenuProps {
    item: TravelItem
    isOpen: boolean
    onClose: () => void
    onSaveTags: (itemId: number, tags: Array<{ name: string }>) => Promise<void>
    availableTags: Array<{ id: number; name: string }>
    onTagCreated: (tag: { id: number; name: string }) => void
}

export function TagContextMenu({
                                   item,
                                   isOpen,
                                   onClose,
                                   onSaveTags,
                                   availableTags,
                                   onTagCreated,
                               }: TagContextMenuProps) {
    const normalizedTags = Array.isArray(item.tags)
        ? item.tags
            .map((tag) => (typeof tag === "object" && tag.name ? tag.name : String(tag || "").trim()))
            .filter(Boolean)
        : []
    const { tags, droppedItems, loading, error } = useTags();
    const [selectedTags, setSelectedTags] = useState<string[]>(item.tags.map(tag => tag.name));
    const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false)

    const handleTagToggle = (tagName: string) => {
        setSelectedTags(prevTags =>
            prevTags.some(tag => tag === tagName)
                ? prevTags.filter(tag => tag !== tagName)
                : [...prevTags, tagName]
        );
    }

    const handleSave = async () => {
        //setLoading(true)
        try {
            const tagObjects = tags.map((tag) => ({ name: tag }))
            await onSaveTags(item.id, tagObjects)
            onClose()
        } finally {
            //setLoading(false)
        }
    }

    const handleTagCreated = (newTag: { id: number; name: string }) => {
        onTagCreated(newTag)
        /*if (!tags.includes(newTag.name)) {
            setTags([...tags, newTag.name])
        }*/
        setIsCreateTagDialogOpen(false)
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tag Item</DialogTitle>
                        <DialogDescription>Add tags to: {String(item.name || "Item")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Button onClick={() => setIsCreateTagDialogOpen(true)} variant="outline" className="w-full">
                            + Create New Tag
                        </Button>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Available Tags</p>
                            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                                {tags.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No tags available</p>
                                ) : (
                                    tags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleTagToggle(tag.name)}
                                            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center justify-between transition-colors"
                                        >
                                            <span className="text-sm">{tag.name}</span>
                                            {selectedTags.includes(tag.name) && <Check className="w-4 h-4 text-green-600" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag, index) => (
                                <div
                                    key={`tag-${tag}-${index}`}
                                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                                >
                                    {tag}
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

            <CreateTagDialog
                isOpen={isCreateTagDialogOpen}
                onClose={() => setIsCreateTagDialogOpen(false)}
                onCreateTag={handleTagCreated}
            />
        </>
    )
}
