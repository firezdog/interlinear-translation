import React, { useEffect, useMemo, useRef, useState } from "react";
import { Gloss } from "@/passage/types";
import type { PassageIndex } from "@/passage/indexPassage";
import type { TokenRange } from "@/passage/selection";

function GlossPanel({
    index,
    glosses,
    selectedToken,
    selectionRange,
    focusedGloss,
    onSelectGloss,
    onAddGloss,
    onUpdateGloss,
}: {
    index: PassageIndex;
    glosses: Gloss[];
    selectedToken: number;
    selectionRange: TokenRange | null;
    focusedGloss: Gloss | null;
    onSelectGloss: (gloss: Gloss) => void;
    onAddGloss: (content: string) => void;
    onUpdateGloss: (id: string, content: string) => void;
}) {
    const [draft, setDraft] = useState("");
    const [editing, setEditing] = useState(false);
    const [editDraft, setEditDraft] = useState("");
    const focusedCardRef = useRef<HTMLDivElement | null>(null);
    const glossListRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!selectionRange) setDraft("");
    }, [selectionRange]);

    useEffect(() => {
        setEditing(false);
        setEditDraft(focusedGloss?.content ?? "");
    }, [focusedGloss?.id]);

    useEffect(() => {
        if (!editing) {
            setEditDraft(focusedGloss?.content ?? "");
        }
    }, [focusedGloss?.content, editing]);

    const ordered = useMemo(
        () =>
            [...glosses].sort(
                (a, b) =>
                    a.end - a.start - (b.end - b.start) || a.start - b.start
            ),
        [glosses]
    );

    useEffect(() => {
        if (!focusedGloss) {
            setEditing(false);
        }
    }, [focusedGloss]);

    useEffect(() => {
        if (selectedToken < 0 || ordered.length === 0) return;
        const target =
            (focusedGloss && focusedCardRef.current) ||
            glossListRef.current?.querySelector<HTMLElement>(".gloss-card");
        if (!target) return;

        const panel = target.closest(".panel-body");
        if (panel instanceof HTMLElement) {
            const targetRect = target.getBoundingClientRect();
            const panelRect = panel.getBoundingClientRect();
            const above = targetRect.top < panelRect.top + 4;
            const below = targetRect.bottom > panelRect.bottom - 4;
            if (above || below) {
                panel.scrollTop += targetRect.top - panelRect.top - 8;
            }
            return;
        }

        target.scrollIntoView({
            block: "nearest",
            inline: "nearest",
        });
    }, [selectedToken, focusedGloss, ordered]);

    const draftSpan =
        selectionRange != null
            ? index.glossSpanText({
                  id: "draft",
                  start: selectionRange.start,
                  end: selectionRange.end,
                  content: "",
              })
            : "";

    const submitDraft = () => {
        onAddGloss(draft);
        setDraft("");
    };

    const startEdit = (gloss: Gloss) => {
        setEditDraft(gloss.content);
        setEditing(true);
    };

    const saveEdit = (gloss: Gloss) => {
        onUpdateGloss(gloss.id, editDraft);
        setEditing(false);
    };

    const cancelEdit = (gloss: Gloss) => {
        setEditDraft(gloss.content);
        setEditing(false);
    };

    return (
        <section className="study-panel study-panel-gloss" aria-label="Glosses">
            <h2>Glosses</h2>
            <div className="panel-body">
                {selectedToken < 0 ? (
                    selectionRange ? null : (
                        <p className="panel-empty">
                            Commentary spans covering the selected unit. Overlaps stack as
                            multiple cards.
                        </p>
                    )
                ) : ordered.length === 0 ? (
                    <p className="panel-empty">No commentary gloss covers this unit.</p>
                ) : (
                    <>
                        <p className="gloss-hint">
                            {ordered.length > 1
                                ? `${ordered.length} glosses · tightest first · click a card to highlight its full span`
                                : "Click the card to highlight this gloss’s full span in the text"}
                        </p>
                        <div className="gloss-list" ref={glossListRef}>
                            {ordered.map((g) => {
                                const isFocus = focusedGloss?.id === g.id;
                                if (isFocus) {
                                    return (
                                        <div
                                            key={g.id}
                                            ref={focusedCardRef}
                                            className="gloss-card is-span-focus"
                                            aria-pressed="true"
                                        >
                                            <button
                                                type="button"
                                                className="span gloss-card-span-toggle"
                                                onClick={() => onSelectGloss(g)}
                                            >
                                                {index.glossSpanText(g)}
                                            </button>
                                            {editing ? (
                                                <>
                                                    <textarea
                                                        className="gloss-compose-input gloss-card-edit"
                                                        value={editDraft}
                                                        onChange={(e) =>
                                                            setEditDraft(e.target.value)
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key === "Enter" &&
                                                                (e.metaKey || e.ctrlKey)
                                                            ) {
                                                                e.preventDefault();
                                                                saveEdit(g);
                                                            } else if (e.key === "Escape") {
                                                                e.preventDefault();
                                                                cancelEdit(g);
                                                            }
                                                        }}
                                                        rows={3}
                                                        aria-label="Edit gloss commentary"
                                                    />
                                                    <div className="gloss-card-actions">
                                                        <button
                                                            type="button"
                                                            className="gloss-compose-submit"
                                                            onClick={() => saveEdit(g)}
                                                        >
                                                            Save
                                                        </button>
                                                        <span className="gloss-hint">
                                                            ⌘/Ctrl+Enter to save
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="body">{g.content}</div>
                                                    <div className="gloss-card-actions">
                                                        <button
                                                            type="button"
                                                            className="field-edit-btn"
                                                            onClick={() => startEdit(g)}
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                }
                                return (
                                    <button
                                        key={g.id}
                                        type="button"
                                        className="gloss-card"
                                        aria-pressed={false}
                                        onClick={() => onSelectGloss(g)}
                                    >
                                        <span className="span">
                                            {index.glossSpanText(g)}
                                        </span>
                                        <div className="body">{g.content}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {selectionRange ? (
                    <div className="gloss-compose">
                        <p className="gloss-hint">
                            Span: {draftSpan}
                            {" · "}
                            Shift-click to extend · ⌘/Ctrl+Enter to add
                        </p>
                        <textarea
                            className="gloss-compose-input"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    (e.metaKey || e.ctrlKey)
                                ) {
                                    e.preventDefault();
                                    submitDraft();
                                }
                            }}
                            placeholder="Commentary for this span"
                            rows={3}
                            aria-label="New gloss commentary"
                        />
                        <button
                            type="button"
                            className="gloss-compose-submit"
                            onClick={submitDraft}
                        >
                            Add gloss
                        </button>
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export { GlossPanel };
