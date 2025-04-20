"use client";

import { useEffect, useRef, useState } from "react";

export default function DropdownMenu() {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Menu
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 shadow-md rounded-md">
                    <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">Option 1</button>
                    <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">Option 2</button>
                    <button className="block w-full px-4 py-2 text-left hover:bg-gray-100">Option 3</button>
                </div>
            )}
        </div>
    );
}
