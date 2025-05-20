"use client";

import { useEffect, useRef, useState } from "react";

export default function DropdownMenu({ trigger, items }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

            {isOpen && (
                <div className="absolute top-full mt-1 left-0 w-40 bg-white border rounded shadow z-10">
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
