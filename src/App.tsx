import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import { Gloss, Passage, Token } from "@/passage/types";
import { FileClient } from "@/clients/file";
import { buildGlossesByToken } from "@/passage/buildGlossesByToken";
import { studyTokensFor } from "@/passage/projectPassage";
import { ReadingColumn } from "@/components/ReadingColumn";
import { StudyRail } from "@/components/StudyRail";
import { sameGloss } from "@/passage/sameGloss";

const passageOptions = [
    { key: "oku-no-hosomichi", name: "Oku No Hosomichi" },
    { key: "ovid", name: "Ovid's Metamorphoses" },
    { key: "quran", name: "The Quran" },
    { key: "jing-ye-si", name: "靜夜思 (Jing Ye Si)" },
    { key: "notes-underground", name: "Notes From Underground" },
];

function App() {
    const [selectedKey, setSelectedKey] = useState("oku-no-hosomichi");
    const [passage, setPassage] = useState<Passage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<number>(-1);
    const [focusedGloss, setFocusedGloss] = useState<Gloss | null>(null);
    const [showTransliteration, setShowTransliteration] = useState(false);

    const glossesByToken = useMemo(
        () =>
            passage
                ? buildGlossesByToken(passage.tokens, passage.glosses)
                : new Map<number, Gloss[]>(),
        [passage]
    );
    const selectedGlosses: Gloss[] =
        selectedToken === -1 ? [] : (glossesByToken.get(selectedToken) ?? []);

    const wordToken =
        passage && selectedToken >= 0
            ? (passage.tokens.find((t) => t.offset === selectedToken) ?? null)
            : null;

    const studyTokens = useMemo(
        () =>
            passage
                ? studyTokensFor(passage, selectedToken, focusedGloss)
                : ([] as Token[]),
        [passage, selectedToken, focusedGloss]
    );

    useEffect(() => {
        let cancelled = false;
        (async function () {
            try {
                const client = FileClient.getClient();
                const data = await client.read(selectedKey, 1);
                if (cancelled) return;
                setPassage(data);
                setSelectedToken(-1);
                setFocusedGloss(null);
                setError(null);
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : String(err));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedKey]);

    const onSelectToken = useCallback((offset: number) => {
        setSelectedToken((prev) => {
            if (prev === offset) {
                setFocusedGloss(null);
                return -1;
            }
            setFocusedGloss((g) => {
                if (g && (offset < g.start || offset > g.end)) return null;
                return g;
            });
            return offset;
        });
    }, []);

    const onSelectGloss = useCallback((gloss: Gloss) => {
        setFocusedGloss((prev) => {
            if (sameGloss(prev, gloss)) return null;
            setSelectedToken((sel) =>
                sel < gloss.start || sel > gloss.end ? gloss.start : sel
            );
            return gloss;
        });
    }, []);

    if (error) return <pre style={{ color: "red" }}>{error}</pre>;

    return (
        <div className="px-5 py-5" style={{ background: "var(--color-page)" }}>
            <h1 className="py-3 text-3xl font-bold tracking-tight">
                Interlinear Translation
            </h1>
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <label>
                    <span className="pr-3">Select Passage:</span>
                    <select
                        className="border rounded px-1 py-1 bg-white text-sm"
                        value={selectedKey}
                        onChange={(e) => setSelectedKey(e.target.value)}
                    >
                        {passageOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showTransliteration}
                        onChange={(e) => setShowTransliteration(e.target.checked)}
                    />
                    Transliteration
                </label>
            </div>
            <div className="study-layout my-4">
                {passage ? (
                    <ReadingColumn
                        passage={passage}
                        glossesByToken={glossesByToken}
                        selectedToken={selectedToken}
                        focusedGloss={focusedGloss}
                        showTransliteration={showTransliteration}
                        onSelectToken={onSelectToken}
                    />
                ) : null}
                <StudyRail
                    studyTokens={studyTokens}
                    wordToken={wordToken}
                    passage={passage}
                    selectedGlosses={selectedGlosses}
                    selectedToken={selectedToken}
                    focusedGloss={focusedGloss}
                    onSelectToken={onSelectToken}
                    onSelectGloss={onSelectGloss}
                />
            </div>
        </div>
    );
}

export { App };
