import React, { useEffect, useMemo, useState } from "react";
import { Gloss, Passage } from "@/passage/types";
import { glossSpanText } from "@/passage/projectPassage";
import type { TokenRange } from "@/passage/selection";

function GlossPanel({
    passage,
    glosses,
    selectedToken,
    selectionRange,
    focusedGloss,
    onSelectGloss,
    onAddGloss,
}: {
    passage: Passage;
    glosses: Gloss[];
    selectedToken: number;
    selectionRange: TokenRange | null;
    focusedGloss: Gloss | null;
    onSelectGloss: (gloss: Gloss) => void;
    onAddGloss: (content: string) => void;
}) {
    const [draft, setDraft] = useState("");

    useEffect(() => {
        if (!selectionRange) setDraft("");
    }, [selectionRange]);

    const ordered = useMemo(
        () =>
            [...glosses].sort(
                (a, b) =>
                    a.end - a.start - (b.end - b.start) || a.start - b.start
            ),
        [glosses]
    );

    const draftSpan =
        selectionRange != null
            ? glossSpanText(passage, {
                  id: "draft",
                  start: selectionRange.start,
                  end: selectionRange.end,
                  content: "",
              })
            : "";

    return (
        <section className="study-panel study-panel-gloss" aria-label="Glosses">
            <h2>Glosses</h2>
            <div className="panel-body">
                {selectionRange ? (
                    <div className="gloss-compose">
                        <p className="gloss-hint">
                            Span: {draftSpan}
                            {" · "}
                            Shift-click to extend the range
                        </p>
                        <textarea
                            className="gloss-compose-input"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Commentary for this span"
                            rows={3}
                            aria-label="New gloss commentary"
                        />
                        <button
                            type="button"
                            className="gloss-compose-submit"
                            onClick={() => {
                                onAddGloss(draft);
                                setDraft("");
                            }}
                        >
                            Add gloss
                        </button>
                    </div>
                ) : null}

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
                        <div className="gloss-list">
                            {ordered.map((g) => {
                                const isFocus = focusedGloss?.id === g.id;
                                return (
                                    <button
                                        key={g.id}
                                        type="button"
                                        className={`gloss-card${isFocus ? " is-span-focus" : ""}`}
                                        aria-pressed={isFocus}
                                        onClick={() => onSelectGloss(g)}
                                    >
                                        <span className="span">{glossSpanText(passage, g)}</span>
                                        <div className="body">{g.content}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

export { GlossPanel };
