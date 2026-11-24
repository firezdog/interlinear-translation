import React, { useEffect, useRef } from "react";
import { Gloss, Token } from "@/passage/types";
import type { SelectTokenOpts, TokenRange } from "@/passage/selection";

function LineStudyPanel({
    tokens,
    selectedToken,
    selectionRange,
    focusedGloss,
    onSelectToken,
}: {
    tokens: Token[];
    selectedToken: number;
    selectionRange: TokenRange | null;
    focusedGloss: Gloss | null;
    onSelectToken: (offset: number, opts?: SelectTokenOpts) => void;
}) {
    const selectedRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (selectedToken < 0) return;
        selectedRef.current?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
        });
    }, [selectedToken, tokens]);

    const caption = focusedGloss
        ? "Gloss span (aligned study)"
        : selectionRange && selectionRange.start !== selectionRange.end
          ? "Selected span"
          : tokens.length > 0
            ? "Paragraph in focus"
            : "\u00a0";

    const inSpan = (offset: number) => {
        if (focusedGloss) {
            return offset >= focusedGloss.start && offset <= focusedGloss.end;
        }
        return !!(
            selectionRange &&
            offset >= selectionRange.start &&
            offset <= selectionRange.end
        );
    };

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
                                ref={
                                    selectedToken === token.offset
                                        ? selectedRef
                                        : undefined
                                }
                                type="button"
                                className={`study-unit${inSpan(token.offset) ? " tok-in-span" : ""}`}
                                aria-pressed={selectedToken === token.offset}
                                onClick={(e) =>
                                    onSelectToken(token.offset, {
                                        shiftKey: e.shiftKey,
                                    })
                                }
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
