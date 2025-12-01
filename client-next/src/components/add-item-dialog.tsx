"use client"

import type React from "react"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface AddItemDialogProps {
    onAdd: (name: string, weight: number, category: string) => Promise<void>
    isLoading?: boolean
}

export function AddItemDialog({ onAdd, isLoading }: AddItemDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [weight, setWeight] = useState("")
    const [category, setCategory] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name.trim() || !weight || !category.trim()) {
            setError("All fields are required")
            return
        }

        const weightNum = Number.parseFloat(weight)
        if (isNaN(weightNum) || weightNum <= 0) {
            setError("Weight must be a positive number")
            return
        }

        try {
            await onAdd(name, weightNum, category)
            setName("")
            setWeight("")
            setCategory("")
            setOpen(false)
        } catch {
            setError("Failed to add item")
        }
    }

    return (
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
                        <label className="text-sm font-medium">Weight (kg)</label>
                        <Input
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="0"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Category</label>
                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Category"
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? "Adding..." : "Add Item"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
