import React, { useMemo } from "react";
import { Gloss, Passage } from "@/passage/types";
import { sameGloss } from "@/passage/sameGloss";
import { glossSpanText } from "@/passage/projectPassage";

function GlossPanel({
    passage,
    glosses,
    selectedToken,
    focusedGloss,
    onSelectGloss,
}: {
    passage: Passage;
    glosses: Gloss[];
    selectedToken: number;
    focusedGloss: Gloss | null;
    onSelectGloss: (gloss: Gloss) => void;
}) {
    const ordered = useMemo(
        () =>
            [...glosses].sort(
                (a, b) =>
                    a.end - a.start - (b.end - b.start) || a.start - b.start
            ),
        [glosses]
    );

    return (
        <section className="study-panel study-panel-gloss" aria-label="Glosses">
            <h2>Glosses</h2>
            <div className="panel-body">
                {selectedToken < 0 ? (
                    <p className="panel-empty">
                        Commentary spans covering the selected unit. Overlaps stack as
                        multiple cards.
                    </p>
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
                                const isFocus = sameGloss(focusedGloss, g);
                                return (
                                    <button
                                        key={`${g.start}-${g.end}-${g.content}`}
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
