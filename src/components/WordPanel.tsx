import React from "react";
import { Token } from "@/passage/types";

function WordPanel({ token }: { token: Token | null }) {
    const rows: Array<{ lab: string; val: string }> = [
        { lab: "Original", val: token?.content || "—" },
        { lab: "Transliteration", val: token?.transliteration || "—" },
        { lab: "Literal", val: token?.translation || "—" },
    ];

    return (
        <section className="study-panel study-panel-word" aria-label="Word">
            <h2>Word</h2>
            <div className="panel-body">
                <div className="word-rows">
                    {rows.map((row) => (
                        <div className="row" key={row.lab}>
                            <span className="lab">{row.lab}</span>
                            <span className="val">{row.val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export { WordPanel };
