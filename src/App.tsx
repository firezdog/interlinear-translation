import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import { Gloss, Passage, Token } from "@/passage/types";
import { FileClient } from "@/clients/file";
import { buildGlossesByToken } from "@/passage/buildGlossesByToken";
import { studyTokensFor } from "@/passage/projectPassage";
import { ReadingColumn } from "@/components/ReadingColumn";
import { StudyRail } from "@/components/StudyRail";
import type { SelectTokenOpts, TokenRange } from "@/passage/selection";

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
    const [selectionAnchor, setSelectionAnchor] = useState<number>(-1);
    const [selectionRange, setSelectionRange] = useState<TokenRange | null>(null);
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

    const studyFocus = useMemo(() => {
        if (focusedGloss) return focusedGloss;
        if (selectionRange && selectionRange.start !== selectionRange.end) {
            return {
                id: "__selection",
                start: selectionRange.start,
                end: selectionRange.end,
                content: "",
            };
        }
        return null;
    }, [focusedGloss, selectionRange]);

    const studyTokens = useMemo(
        () =>
            passage
                ? studyTokensFor(passage, selectedToken, studyFocus)
                : ([] as Token[]),
        [passage, selectedToken, studyFocus]
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
                setSelectionAnchor(-1);
                setSelectionRange(null);
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

    const onSelectToken = useCallback(
        (offset: number, opts?: SelectTokenOpts) => {
            const shiftKey = !!opts?.shiftKey;

            if (shiftKey && selectionAnchor >= 0) {
                setSelectedToken(offset);
                setSelectionRange({
                    start: Math.min(selectionAnchor, offset),
                    end: Math.max(selectionAnchor, offset),
                });
                setFocusedGloss(null);
                return;
            }

            setSelectedToken((prev) => {
                if (prev === offset) {
                    setFocusedGloss(null);
                    setSelectionAnchor(-1);
                    setSelectionRange(null);
                    return -1;
                }
                setSelectionAnchor(offset);
                setSelectionRange({ start: offset, end: offset });
                setFocusedGloss((g) => {
                    if (g && (offset < g.start || offset > g.end)) return null;
                    return g;
                });
                return offset;
            });
        },
        [selectionAnchor]
    );

    const onSelectGloss = useCallback((gloss: Gloss) => {
        setFocusedGloss((prev) => {
            if (prev?.id === gloss.id) return null;
            setSelectedToken((sel) =>
                sel < gloss.start || sel > gloss.end ? gloss.start : sel
            );
            return gloss;
        });
    }, []);

    const onAddGloss = useCallback(
        (content: string) => {
            if (!passage || !selectionRange) return;
            const text = content.trim();
            if (!text) return;
            const gloss: Gloss = {
                id: crypto.randomUUID(),
                start: selectionRange.start,
                end: selectionRange.end,
                content: text,
            };
            setPassage({
                ...passage,
                glosses: [...passage.glosses, gloss],
            });
            setFocusedGloss(gloss);
        },
        [passage, selectionRange]
    );

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
                        selectionRange={selectionRange}
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
                    selectionRange={selectionRange}
                    focusedGloss={focusedGloss}
                    onSelectToken={onSelectToken}
                    onSelectGloss={onSelectGloss}
                    onAddGloss={onAddGloss}
                />
            </div>
        </div>
    );
}

export { App };
