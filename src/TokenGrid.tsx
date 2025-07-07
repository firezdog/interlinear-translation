import React from "react";
import { Token } from "@/types/passage";

function TokenGrid({
    token,
    col,
    row,
    isSelected: selected,
    onClick,
}: {
    token: Token;
    col: number;
    row: number;
    isSelected: boolean;
    onClick: () => void;
}) {
    const base = "border border-gray-300 p-2 text-center cursor-pointer";
    const selectedClass = selected ? "bg-yellow-200 hover:bg-orange-200" : "hover:bg-sky-100";
    const rowBg = row % 2 ? "bg-gray-100" : "bg-white";
    const className = `${base} ${selectedClass} ${rowBg}`
    return (
        <>
            <div
                className={className}
                style={{ gridRow: 1 + row * 3, gridColumn: col + 1}}
                onClick={onClick}
            >
                {token.content}
            </div>
            <div
                className={className}
                style={{ gridRow: 2 + row * 3, gridColumn: col + 1}}
                onClick={onClick}
            >
                {token.transliteration}
            </div>
            <div
                className={className}
                style={{ gridRow: 3 + row * 3, gridColumn: col + 1}}
                onClick={onClick}
            >
                {token.translation}
            </div>
        </>
    );
}


export { TokenGrid }