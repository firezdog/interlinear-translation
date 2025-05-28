import React from "react";
import { Token } from "@/types/passage";

export default function TokenBlock(
    { 
        token,
        setSelectedToken,
        selected,
    }: { token: Token, setSelectedToken: (offset: number) => void, selected: boolean }) {
    return (
        <div
            className={`py-1 px-1 text-center ${selected ? "bg-yellow-200 hover:bg-orange-200": "hover:bg-sky-100"}`}
            onClick={() => {
                if (selected) {
                    setSelectedToken(-1);
                    return;
                }
                setSelectedToken(token.offset);
            }}
        >
            <div>{token.content}</div>
            <div>{token.transliteration}</div>
            <div>{token.translation}</div>
        </div>
    )
}