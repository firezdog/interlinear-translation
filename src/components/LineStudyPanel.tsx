import React from "react";
import { Gloss, Token } from "@/passage/types";

function LineStudyPanel({
    tokens,
    selectedToken,
    focusedGloss,
    onSelectToken,
}: {
    tokens: Token[];
    selectedToken: number;
    focusedGloss: Gloss | null;
    onSelectToken: (offset: number) => void;
}) {
    const caption = focusedGloss
        ? "Gloss span (aligned study)"
        : tokens.length > 0
          ? "Paragraph in focus"
          : "\u00a0";

    const inFocusedGloss = (offset: number) =>
        !!(focusedGloss && offset >= focusedGloss.start && offset <= focusedGloss.end);

    return (
        <section className="study-panel study-panel-study" aria-label="Line study">
            <h2>Line study</h2>
            <p className="panel-meta">{caption}</p>
            <div className="panel-body">
                {tokens.length === 0 ? (
                    <p className="panel-empty">
                        Click a unit for its paragraph, or a gloss card for that gloss’s
                        full span—aligned original / transliteration / literal.
                    </p>
                ) : (
                    <div className="study-flow">
                        {tokens.map((token) => (
                            <button
                                key={token.offset}
                                type="button"
                                className={`study-unit${inFocusedGloss(token.offset) ? " tok-in-span" : ""}`}
                                aria-pressed={selectedToken === token.offset}
                                onClick={() => onSelectToken(token.offset)}
                            >
                                <span className="o">{token.content || "\u00a0"}</span>
                                <span className="r">
                                    {token.transliteration || "\u00a0"}
                                </span>
                                <span className="t">{token.translation || "\u00a0"}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export { LineStudyPanel };
