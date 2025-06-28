import { useEffect, useState } from "react";
import React from "react";
import { Gloss, Passage } from "@/types/passage";
import { FileClient } from "@/clients/file";
import { TokenGrid } from "@/TokenGrid";


const passageOptions = [
    { key: 'oku-no-hosomichi', name: 'Oku No Hosomichi'},
    { key: 'ovid', name: 'Ovid\'s Metamorphoses'},
    { key: 'quran', name: 'The Quran'},
    { key: 'lun-yu', name: 'Analects of Confucius'},
    { key: 'notes-underground', name: 'Notes From Underground'}
];



function App() {
    const [selectedKey, setSelectedKey] = useState("oku-no-hosomichi");
    const [passage, setPassage] = useState<Passage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<number>(-1);
    const [selectedGlosses, setSelectedGlosses] = useState<Gloss[]>([]);
    const [colsPerRow, setColsPerRow] = useState(2);

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
        if (selectedToken === -1 || !passage) {
            setSelectedGlosses([]);
            return;
        }
        const updatedGlosses = passage.glosses.filter(
            (gloss) => gloss.start <= selectedToken && selectedToken <= gloss.end
        );
        setSelectedGlosses(updatedGlosses);
    }, [selectedToken, passage]);

    if (error) return <pre style={{ color: "red" }}>{error}</pre>;

    const tokens = passage?.tokens ?? [];
    const tokenRows = Math.ceil(tokens.length / colsPerRow);

    const tokenDivs = tokens.flatMap((token, i) => {
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
    });

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
                className="grid gap-2 w-full max-w-5xl mx-auto my-4"
                style={{
                    gridTemplateRows: `repeat(${tokenRows * 3}, auto)`,
                    gridTemplateColumns: `repeat(${colsPerRow}, 1fr)`
                }}
                dir="auto"
            >
                {tokenDivs}
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