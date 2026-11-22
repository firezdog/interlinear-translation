import { useEffect, useMemo, useState } from "react";
import React from "react";
import { Gloss, Passage, Token } from "@/types/passage";
import { FileClient } from "@/clients/file";
import { TokenGrid } from "@/TokenGrid";


const passageOptions = [
    { key: 'oku-no-hosomichi', name: 'Oku No Hosomichi'},
    { key: 'ovid', name: 'Ovid\'s Metamorphoses'},
    { key: 'quran', name: 'The Quran'},
    { key: 'lun-yu', name: 'Analects of Confucius'},
    { key: 'notes-underground', name: 'Notes From Underground'}
];

/** Sweep tokens left-to-right, activating/deactivating glosses via start/end pointers. */
function buildGlossesByToken(tokens: Token[], glosses: Gloss[]): Map<number, Gloss[]> {
    const byStart = [...glosses].sort((a, b) => a.start - b.start);
    const byEnd = [...glosses].sort((a, b) => a.end - b.end);
    let startPtr = 0;
    let endPtr = 0;
    const active = new Set<Gloss>();
    const glossesByToken = new Map<number, Gloss[]>();

    for (const token of tokens) {
        while (endPtr < byEnd.length && byEnd[endPtr].end < token.offset) {
            active.delete(byEnd[endPtr]);
            endPtr++;
        }
        while (startPtr < byStart.length && byStart[startPtr].start <= token.offset) {
            active.add(byStart[startPtr]);
            startPtr++;
        }
        glossesByToken.set(token.offset, [...active]);
    }

    return glossesByToken;
}

function App() {
    const [selectedKey, setSelectedKey] = useState("oku-no-hosomichi");
    const [passage, setPassage] = useState<Passage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<number>(-1);
    const [selectedGlosses, setSelectedGlosses] = useState<Gloss[]>([]);
    const [colsPerRow, setColsPerRow] = useState(2);

    const glossesByToken = useMemo(
        () => (passage ? buildGlossesByToken(passage.tokens, passage.glosses) : new Map<number, Gloss[]>()),
        [passage]
    );

    useEffect(() => {
        function updateCols() {
            const width = window.innerWidth;
            if (width >= 1024) setColsPerRow(10);
            else if (width >= 768) setColsPerRow(6);
            else if (width >= 640) setColsPerRow(4);
            else setColsPerRow(2);
        }
        updateCols();
        window.addEventListener("resize", updateCols);
        return () => window.removeEventListener("resize", updateCols);
    }, []);

    useEffect(() => {
        (async function () {
            try {
                const client = FileClient.getClient();
                const data = await client.read(selectedKey, 1);
                setPassage(data);
                setSelectedToken(-1);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(error));
            }
        })();
    }, [selectedKey]);

    useEffect(() => {
        if (selectedToken === -1) {
            setSelectedGlosses([]);
            return;
        }
        setSelectedGlosses(glossesByToken.get(selectedToken) ?? []);
    }, [selectedToken, glossesByToken]);

    if (error) return <pre style={{ color: "red" }}>{error}</pre>;

    const tokens = passage?.tokens ?? [];
    const tokenRows = Math.ceil(tokens.length / colsPerRow);

    return (
        <div className="px-5 py-5">
            <h1 className="py-3 text-3xl font-bold tracking-tight">Interlinear Translation</h1>
            <label>
                <span className="pr-3">Select Passage:</span>
                <select
                    className="border rounded px-1 py-1 bg-white text-sm"
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                >
                    {passageOptions.map((passage, i) => (
                        <option key={i} value={passage.key}>{passage.name}</option>
                    ))}
                </select>
            </label>
            <div
                className={`grid gap-2 w-full max-w-5xl mx-auto my-4 grid-rows-${tokenRows * 3} grid-cols-${colsPerRow}`}
                dir="auto"
            >
            {

                tokens.map((token, i) => {
                    const col = i % colsPerRow;
                    const row = Math.floor(i / colsPerRow);
                    return (
                        <TokenGrid
                            key={token.offset}
                            token={token}
                            col={col}
                            row={row}
                            isSelected={selectedToken === token.offset}
                            onClick={() => setSelectedToken(selectedToken === token.offset ? -1 : token.offset)}
                        />
                    );
                })
            }
            </div>
            <div>
                {selectedGlosses.map((gloss, i) => (
                    <div key={i}>{gloss.content}</div>
                ))}
            </div>
        </div>
    );
}

export { App };
