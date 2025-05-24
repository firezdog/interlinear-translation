import { useEffect, useState } from "react";

import { Passage } from "@/types/passage";
import { FileClient } from "@/clients/file"

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
        <div>
            <h1>Hello, interlinear!</h1>
            <label>
                Select Passage:{" "}
                <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
                    {passageOptions.map((passage) => (
                        <option key={passage.key} value={passage.key}>{passage.name}</option>
                    ))}
                </select>
            </label>
            <hr></hr>
            <p>{JSON.stringify(passage)}</p>
            <hr></hr>
            <img src="/mockup.png"></img>
        </div>
    );
}

export { App };