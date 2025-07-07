"use client"

import { useState } from "react"
import { Plus, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Sample data for demonstration
const sampleItems = [
    {
        id: 1,
        title: "Project Alpha",
        description: "A comprehensive web application for managing tasks",
        status: "Active",
        date: "2024-01-15",
    },
    {
        id: 2,
        title: "Database Migration",
        description: "Migrating legacy database to new infrastructure",
        status: "In Progress",
        date: "2024-01-20",
    },
    {
        id: 3,
        title: "UI Redesign",
        description: "Complete overhaul of the user interface",
        status: "Completed",
        date: "2024-01-10",
    },
    {
        id: 4,
        title: "API Integration",
        description: "Integrating third-party APIs for enhanced functionality",
        status: "Pending",
        date: "2024-01-25",
    },
    {
        id: 5,
        title: "Security Audit",
        description: "Comprehensive security review and improvements",
        status: "Active",
        date: "2024-01-18",
    },
    {
        id: 6,
        title: "Performance Optimization",
        description: "Optimizing application performance and load times",
        status: "In Progress",
        date: "2024-01-22",
    },
    {
        id: 7,
        title: "Mobile App",
        description: "Developing companion mobile application",
        status: "Planning",
        date: "2024-01-30",
    },
    {
        id: 8,
        title: "Documentation Update",
        description: "Updating technical documentation and user guides",
        status: "Active",
        date: "2024-01-12",
    },
]

const res = await fetch("http://localhost:5001/api/items");
const items = res.ok ? await res.json() : []

export default function Component() {
    const [selectedPage, setSelectedPage] = useState("projects")
    const [filterText, setFilterText] = useState("")
    const [searchText, setSearchText] = useState("")

    // Filter and search logic
    const filteredItems = items.filter((item) => {
        const matchesFilter = filterText === "" || item.status.toLowerCase().includes(filterText.toLowerCase())
        const matchesSearch =
            searchText === "" ||
            item.title.toLowerCase().includes(searchText.toLowerCase()) ||
            item.description.toLowerCase().includes(searchText.toLowerCase())
        return matchesFilter && matchesSearch
    })

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

                        {/* Add Button */}
                        <Button className="w-full sm:w-auto sm:ml-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Item
                        </Button>
                    </div>
                </div>

                {/* Items List */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold capitalize">{selectedPage}</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} found
                        </p>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        {filteredItems.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <div className="text-4xl mb-4">📭</div>
                                <h3 className="text-lg font-medium mb-2">No items found</h3>
                                <p>Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {filteredItems.map((item) => (
                                    <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                                    <CardDescription className="mt-1">{item.description}</CardDescription>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.name)}`}>
                          {item.status}
                        </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span>Weight: {item.weight}g</span>
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
    )
}
