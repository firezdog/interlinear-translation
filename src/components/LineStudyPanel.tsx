import React, { useEffect, useRef } from "react";
import { Token } from "@/passage/types";
import {
    tokenIdInRange,
    type SelectTokenOpts,
    type TokenRange,
} from "@/passage/selection";

function LineStudyPanel({
    tokens,
    selectedToken,
    highlightRange,
    glossFocused,
    onSelectToken,
}: {
    tokens: Token[];
    selectedToken: number;
    highlightRange: TokenRange | null;
    /** True when highlight comes from a focused gloss (caption wording). */
    glossFocused: boolean;
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

    const caption = glossFocused
        ? "Gloss span (aligned study)"
        : highlightRange && highlightRange.start !== highlightRange.end
          ? "Selected span"
          : tokens.length > 0
            ? "Paragraph in focus"
            : "\u00a0";

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
                                className={`study-unit${
                                    highlightRange &&
                                    tokenIdInRange(
                                        token.offset,
                                        highlightRange.start,
                                        highlightRange.end
                                    )
                                        ? " tok-in-span"
                                        : ""
                                }`}
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
