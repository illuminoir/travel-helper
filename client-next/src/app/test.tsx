'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Menu } from "lucide-react";
import DropdownMenu from "@/components/ui/dropdown-menu";

export default function Dashboard() {
    const [items, setItems] = useState(["Item 1", "Item 2", "Item 3", "Item 4"]);

    const addItem = () => {
        setItems([...items, `Item ${items.length + 1}`]);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
            {/* Navigation Bar */}
            <div className="flex items-center justify-between space-x-2 border-b pb-2">
                <DropdownMenu
                    trigger={<Button variant="outline"><Menu className="w-5 h-5" /></Button>}
                    items={["Page 1", "Page 2", "Page 3"]}
                />
                <Input placeholder="Filter" className="flex-1 max-w-xs" />
                <Input placeholder="Search" className="flex-1 max-w-xs" />
                <Button onClick={addItem} variant="outline">
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            {/* Elements List */}
            <div className="border rounded-lg p-4 space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="border-b last:border-none py-2">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
