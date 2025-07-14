"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, X, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TravelItem } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"


export default function Component() {
    const [items, setItems] = useState<TravelItem[]>([]);
    const [selectedPage, setSelectedPage] = useState("projects");
    const [filterText, setFilterText] = useState("");
    const [searchText, setSearchText] = useState("");
    const [droppedItems, setDroppedItems] = useState<TravelItem[]>([])
    const [draggedItem, setDraggedItem] = useState<TravelItem | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newItemName, setNewItemName] = useState("")
    const [newItemWeight, setNewItemWeight] = useState("")

    useEffect(() => {
        fetch('http://localhost:5001/api/items')
            .then(res => res.json())
            .then(setItems)
            .catch(console.error);
    }, []);

    // Clear all function
    const clearAll = () => {
        if (confirm("Are you sure you want to clear all dropped items?")) {
            setDroppedItems([])
            localStorage.removeItem("droppedItems")
        }
    }

    // Filter and search logic
    const filteredItems = items.filter((item: TravelItem) => {
        const isNotDropped = !droppedItems.find((droppedItem) => droppedItem.id === item.id)
        const matchesTags = filterText === "" || item.tags?.map(tag => tag.name.toLowerCase()).includes(filterText.toLowerCase());
        const matchesSearch =
            searchText === "" ||
            item.name.toLowerCase().includes(searchText.toLowerCase());
        return isNotDropped && matchesTags && matchesSearch
    })

    console.log(filteredItems);

    const handleDragStart = (e: React.DragEvent, item: TravelItem) => {
        setDraggedItem(item)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragEnd = () => {
        setDraggedItem(null)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        // Only set isDragOver to false if we're leaving the drop zone entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        if (draggedItem && !droppedItems.find((item) => item.id === draggedItem.id)) {
            setDroppedItems((prev) => [...prev, draggedItem])
        }
        setDraggedItem(null)
    }

    const removeFromDropZone = (itemId: number) => {
        setDroppedItems((prev) => prev.filter((item) => item.id !== itemId))
    }

    const deleteItem = async (itemId: number) => {
        if (confirm("Are you sure you want to delete this item permanently?")) {
            // Remove from sampleItems array
            const itemIndex = items.findIndex((item) => item.id === itemId)
            if (itemIndex > -1) {
                items.splice(itemIndex, 1)
            }

            try {
                const res = await fetch(`http://localhost:5001/api/items/${itemId}`, {
                    method: 'DELETE',
                });

                if (!res.ok) throw new Error(`Failed to delete item with id ${itemId}`);

                const result = await res.json();
                console.log('Item deleted: ', result);
            } catch (err) {
                console.error(err);
            }

            // Also remove from dropped items if it exists there
            setDroppedItems((prev) => prev.filter((item) => item.id !== itemId))
        }
    }

    // TODO review code and fix item adding
    const handleAddNewItem = async () => {
        if (newItemName.trim() && newItemWeight.trim()) {
            try {
                const res = await fetch(`http://localhost:5001/api/items`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: newItemName,
                        weight: newItemWeight as unknown as number,
                    }),
                });

                const result = await res.json();
                console.log('Item created: ', result);
            } catch (err) {
                console.error(err);
            }

            // Reset form and close dialog
            setNewItemName("")
            setNewItemWeight("")
            setIsDialogOpen(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800"
            case "in progress":
                return "bg-blue-100 text-blue-800"
            case "completed":
                return "bg-gray-100 text-gray-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "planning":
                return "bg-purple-100 text-purple-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Page Dropdown */}
                        <div className="w-full sm:w-48">
                            <Select value={selectedPage} onValueChange={setSelectedPage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select page" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="projects">Projects</SelectItem>
                                    <SelectItem value="tasks">Tasks</SelectItem>
                                    <SelectItem value="users">Users</SelectItem>
                                    <SelectItem value="settings">Settings</SelectItem>
                                    <SelectItem value="reports">Reports</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter Field */}
                        <div className="w-full sm:w-48 relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Filter by tag..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Search Field */}
                        <div className="w-full sm:w-64 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search items..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Add Button with Dialog */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto sm:ml-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Item</DialogTitle>
                                    <DialogDescription>
                                        Create a new item with a name and weight. Click submit when you are done.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="col-span-3"
                                            placeholder="Enter item name..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="weight" className="text-right">
                                            Weight
                                        </Label>
                                        <Input
                                            id="weight"
                                            value={newItemWeight}
                                            onChange={(e) => setNewItemWeight(e.target.value)}
                                            className="col-span-3"
                                            placeholder="Enter weight..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        onClick={handleAddNewItem}
                                        disabled={!newItemName.trim() || !newItemWeight.trim()}
                                    >
                                        Submit
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Save and Clear Buttons */}
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={clearAll} disabled={droppedItems.length === 0}>
                                Clear All
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                    {/* Left Side - Items List */}
                    <div className="bg-white rounded-lg shadow-sm border flex flex-col">
                        <div className="p-6 border-b flex-shrink-0">
                            <h2 className="text-xl font-semibold capitalize">{selectedPage}</h2>
                            <p className="text-gray-600 text-sm mt-1">
                                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} found
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredItems.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <div className="text-4xl mb-4">📭</div>
                                    <h3 className="text-lg font-medium mb-2">No items found</h3>
                                    <p>Try adjusting your search or filter criteria</p>
                                </div>
                            ) : (
                                <div className="p-6 space-y-4">
                                    {filteredItems.map((item) => (
                                        <Card
                                            key={item.id}
                                            className={`hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                                draggedItem?.id === item.id ? "opacity-50 scale-95" : ""
                                            }`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                                        <CardDescription className="mt-1">{item.tags?.map(tag => tag.name).join(", ")}</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.name)}`}
                            >
                              {item.name}
                            </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteItem(item.id)
                                                            }}
                                                            className="h-6 w-6 p-0 hover:bg-red-100"
                                                        >
                                                            <Trash2 className="h-3 w-3 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex items-center justify-between text-sm text-gray-500">
                                                    <span>Created: {"TMP"}</span>
                                                    <span>ID: #{item.id}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Drop Zone */}
                    <div
                        className={`bg-white rounded-lg shadow-sm border flex flex-col transition-all ${
                            isDragOver ? "border-blue-400 bg-blue-50" : "border-dashed border-gray-300"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="p-6 border-b flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">Drop Zone</h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {droppedItems.length} {droppedItems.length === 1 ? "item" : "items"} dropped
                                    </p>
                                </div>
                                <div className="text-xs text-gray-500">Auto-saved</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {droppedItems.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-center text-gray-500 p-12">
                                    <div>
                                        <div className="text-6xl mb-4">🎯</div>
                                        <h3 className="text-lg font-medium mb-2">Drop items here</h3>
                                        <p>Drag items from the left panel to this area</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-4">
                                    {droppedItems.map((item) => (
                                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                                        <CardDescription className="mt-1">{item.tags?.map(tag => tag.name).join(", ")}</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.name)}`}
                            >
                              {"TMP"}
                            </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeFromDropZone(item.id)}
                                                            className="h-6 w-6 p-0 hover:bg-red-100"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="flex items-center justify-between text-sm text-gray-500">
                                                    <span>Created: {"TMP"}</span>
                                                    <span>ID: #{item.id}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

