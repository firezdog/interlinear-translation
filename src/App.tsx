import { useEffect, useState } from "react";

import { Passage } from "@/types/passage";
import { FileClient } from "@/clients/file"
import TokenBlock from "@/TokenBlock";

const passageOptions = [
    { key: 'oku-no-hosomichi', name: 'Oku No Hosomichi'},
    { key: 'ovid', name: 'Ovid\'s Metamorphoses'},
    { key: 'quran', name: 'The Quran'},
]

function App() {
    const [selectedKey, setSelectedKey] = useState("oku-no-hosomichi");
    const [passage, setPassage] = useState<Passage | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const client = FileClient.getClient();
                const data = await client.read(selectedKey, 1);
                setPassage(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : String(error));
            }
        }

        load();
    }, [selectedKey])

    if (error) return <pre style={{ color: "red" }}>{error}</pre>;

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
                    {passageOptions.map((passage) => (
                        <option key={passage.key} value={passage.key}>{passage.name}</option>
                    ))}
                </select>
            </label>
            <div className="py-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10" dir="auto">
                {passage && passage.tokens.map((token) => <TokenBlock key={`${token.content}-${token.offset}`} token={token} />)}
            </div>
        </div>
    );
}

export { App };