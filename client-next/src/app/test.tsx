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
        <div>
            <div>
                <DropdownMenu
                    trigger={<Button><Menu className="w-5 h-5" /></Button>}
                    items={["Page 1", "Page 2", "Page 3"]}
                />
                <Input placeholder="Filter" />
                <Input placeholder="Search" />
                <Button onClick={addItem}><Plus className="w-5 h-5" /></Button>
            </div>

            <div className="mt-4 border rounded p-4 space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="border-b last:border-0 py-2">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}
