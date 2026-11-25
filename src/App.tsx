import { useCallback, useEffect, useMemo, useState } from "react";
import React from "react";
import { Gloss, Passage, Token } from "@/passage/types";
import { FileClient } from "@/clients/file";
import { indexPassage } from "@/passage/indexPassage";
import { studyTokensFor } from "@/passage/projectPassage";
import { ReadingColumn } from "@/components/ReadingColumn";
import { StudyRail } from "@/components/StudyRail";
import {
    CreatePassageDialog,
    type CreatePassageResult,
} from "@/components/CreatePassageDialog";
import type { SelectTokenOpts, TokenRange } from "@/passage/selection";

const initialPassageOptions = [
    { key: "oku-no-hosomichi", name: "Oku No Hosomichi" },
    { key: "ovid", name: "Ovid's Metamorphoses" },
    { key: "quran", name: "The Quran" },
    { key: "jing-ye-si", name: "靜夜思 (Jing Ye Si)" },
    { key: "notes-underground", name: "Notes From Underground" },
    { key: "hong-lou-meng", name: "Dream of the Red Chamber" },
    { key: "tang-shi", name: "Tang Poetry" },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

function App() {
    const [passageOptions, setPassageOptions] = useState(initialPassageOptions);
    const [selectedKey, setSelectedKey] = useState("oku-no-hosomichi");
    const [passage, setPassage] = useState<Passage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<number>(-1);
    const [selectionAnchor, setSelectionAnchor] = useState<number>(-1);
    const [selectionRange, setSelectionRange] = useState<TokenRange | null>(null);
    const [focusedGloss, setFocusedGloss] = useState<Gloss | null>(null);
    const [showTransliteration, setShowTransliteration] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
    const [saveError, setSaveError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const index = useMemo(
        () => (passage ? indexPassage(passage) : null),
        [passage]
    );
    const glossesByToken = index?.glossesByToken ?? new Map<number, Gloss[]>();
    const selectedGlosses: Gloss[] =
        selectedToken === -1 ? [] : (glossesByToken.get(selectedToken) ?? []);

    const wordToken =
        index && selectedToken >= 0
            ? (index.tokenById.get(selectedToken) ?? null)
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
            index
                ? studyTokensFor(index, selectedToken, studyFocus)
                : ([] as Token[]),
        [index, selectedToken, studyFocus]
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
                setDirty(false);
                setSaveStatus("idle");
                setSaveError(null);
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
            setDirty(true);
            setSaveStatus("idle");
        },
        [passage, selectionRange]
    );

    const onUpdateGloss = useCallback(
        (id: string, content: string) => {
            if (!passage) return;
            const text = content.trim();
            if (!text) return;
            const glosses = passage.glosses.map((g) =>
                g.id === id ? { ...g, content: text } : g
            );
            setPassage({ ...passage, glosses });
            setFocusedGloss((prev) =>
                prev?.id === id ? { ...prev, content: text } : prev
            );
            setDirty(true);
            setSaveStatus("idle");
        },
        [passage]
    );

    const onUpdateToken = useCallback(
        (
            offset: number,
            patch: { transliteration?: string; translation?: string }
        ) => {
            if (!passage) return;
            const tokens = passage.tokens.map((t) =>
                t.offset === offset ? { ...t, ...patch } : t
            );
            setPassage({ ...passage, tokens });
            setDirty(true);
            setSaveStatus("idle");
        },
        [passage]
    );

    const onSavePassage = useCallback(async () => {
        if (!passage || saveStatus === "saving") return;
        setSaveStatus("saving");
        setSaveError(null);
        try {
            await FileClient.getClient().write(selectedKey, 1, passage);
            setDirty(false);
            setSaveStatus("saved");
        } catch (err) {
            setSaveStatus("error");
            setSaveError(err instanceof Error ? err.message : String(err));
        }
    }, [passage, selectedKey, saveStatus]);

    const onPassageCreated = useCallback((result: CreatePassageResult) => {
        setPassageOptions((prev) => {
            if (prev.some((opt) => opt.key === result.key)) {
                return prev.map((opt) =>
                    opt.key === result.key
                        ? { ...opt, name: result.title }
                        : opt
                );
            }
            return [...prev, { key: result.key, name: result.title }];
        });
        setSelectedKey(result.key);
    }, []);

    if (error) return <pre style={{ color: "red" }}>{error}</pre>;

    const saveLabel =
        saveStatus === "saving"
            ? "Saving…"
            : saveStatus === "saved"
              ? "Saved"
              : saveStatus === "error"
                ? saveError ?? "Save failed"
                : dirty
                  ? "Unsaved changes"
                  : "";

    return (
        <div className="px-5 py-5" style={{ background: "var(--color-page)" }}>
            <h1 className="py-3 text-3xl font-bold tracking-tight">
                Interlinear Translation
            </h1>
            <div className="passage-toolbar mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
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
                <button
                    type="button"
                    className="gloss-compose-submit"
                    onClick={() => setCreateOpen(true)}
                >
                    New passage
                </button>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showTransliteration}
                        onChange={(e) => setShowTransliteration(e.target.checked)}
                    />
                    Transliteration
                </label>
                <button
                    type="button"
                    className="gloss-compose-submit"
                    disabled={!passage || !dirty || saveStatus === "saving"}
                    onClick={onSavePassage}
                >
                    Save
                </button>
                {saveLabel ? (
                    <span
                        className="gloss-hint"
                        style={{ margin: 0 }}
                        role="status"
                    >
                        {saveLabel}
                    </span>
                ) : null}
            </div>
            <div className="study-layout my-4">
                {index ? (
                    <ReadingColumn
                        index={index}
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
                    onUpdateGloss={onUpdateGloss}
                    onUpdateToken={onUpdateToken}
                />
            </div>
            <CreatePassageDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={onPassageCreated}
            />
        </div>
    );
}

export { App };
