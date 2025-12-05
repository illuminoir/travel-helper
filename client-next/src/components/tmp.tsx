import type {Tag, TravelItem} from "@/types";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateTagDialog } from "@/components/create-tag-dialog";
import { useState } from "react";
import { useTags} from "@/hooks/use-tags";

interface TagContextMenuProps {
  item: TravelItem;
  isOpen: boolean;
  onClose: () => void;
  onSaveTags: (itemId: number, tags: Array<{ name: string }>) => Promise<void>;
  onTagCreated: (tag: { id: number; name: string }) => void;
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
  const [selectedTagId, setSelectedTagId] = useState<string>("")
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false)

  const handleAddTagFromDropdown = () => {
    if (selectedTagId) {
      const tag = availableTags.find((t) => t.id.toString() === selectedTagId)
      if (tag && !tags.includes(tag.name)) {
        //setTags([...tags, tag.name])
        setSelectedTagId("")
      }
    }
  }

  const handleRemoveTag = (tag: Tag) => {
    //setTags(tags.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    //setLoading(true)
    try {
      const tagObjects = tags.map((tag) => ({name: tag}))
      //await onSaveTags(item.id, tagObjects)
      onClose()
    } finally {
      //setLoading(false)
    }
  }

  const handleTagCreated = (newTag: { id: number; name: string }) => {
    onTagCreated(newTag)
    // Add the newly created tag to the item
    /*if (!tags.includes(newTag.name)) {
        setTags([...tags, newTag.name])
    }*/
    setIsCreateTagDialogOpen(false)
  }

  return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tag Item</DialogTitle>
              <DialogDescription>Add tags to: {String(item.name || "Item")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Button onClick={() => setIsCreateTagDialogOpen(true)} variant="outline" className="w-full">
                  + Create New Tag
                </Button>
                <div className="flex gap-2">
                  <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a tag..."/>
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            {tag.name}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddTagFromDropdown} variant="outline">
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.tags?.map((tag, index) => (
                    <div
                        key={`tag-${String(tag.name)}-${index}`}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                    >
                      {String(tag.name || "")}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-600">
                        <X className="w-3 h-3"/>
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

        <CreateTagDialog
            isOpen={isCreateTagDialogOpen}
            onClose={() => setIsCreateTagDialogOpen(false)}
            onCreateTag={handleTagCreated}
        />
      </>
  )
}
