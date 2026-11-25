import React, { useMemo } from "react";
import type { PassageIndex } from "@/passage/indexPassage";
import { projectPassage } from "@/passage/projectPassage";
import {
    segmentInFocus,
    tokenIdInRange,
    type SelectTokenOpts,
    type TokenRange,
} from "@/passage/selection";

function ReadingColumn({
    index,
    selectedToken,
    highlightRange,
    showTransliteration,
    onSelectToken,
}: {
    index: PassageIndex;
    selectedToken: number;
    highlightRange: TokenRange | null;
    showTransliteration: boolean;
    onSelectToken: (offset: number, opts?: SelectTokenOpts) => void;
}) {
    const { paragraphs } = useMemo(() => projectPassage(index), [index]);
    const glossesByToken = index.glossesByToken;

    const tokenHighlighted = (tokenId: number) =>
        !!highlightRange &&
        tokenIdInRange(tokenId, highlightRange.start, highlightRange.end);

    return (
        <div className="reading-column" dir="auto">
            {paragraphs.map((para) => {
                const focus = segmentInFocus(
                    para.segment,
                    selectedToken,
                    highlightRange
                );
                return (
                    <div
                        key={`${para.segment.start}-${para.segment.end}`}
                        className={`reading-para${focus ? " is-focus" : ""}`}
                    >
                        {para.label != null && para.label !== "" ? (
                            <span className="reading-para-label">{para.label}</span>
                        ) : null}
                        <p className="reading-orig" dir="auto">
                            {para.runs.map((run, i) => {
                                if (run.type === "text") {
                                    return (
                                        <React.Fragment key={`t-${i}`}>
                                            {run.value}
                                        </React.Fragment>
                                    );
                                }
                                const token = run.token;
                                const hasGloss =
                                    (glossesByToken.get(token.offset) ?? []).length > 0;
                                const cls = [
                                    "tok",
                                    hasGloss ? "tok-has-gloss" : "",
                                    tokenHighlighted(token.offset) ? "tok-in-span" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ");
                                return (
                                    <button
                                        key={token.offset}
                                        type="button"
                                        className={cls}
                                        aria-pressed={selectedToken === token.offset}
                                        onClick={(e) =>
                                            onSelectToken(token.offset, {
                                                shiftKey: e.shiftKey,
                                            })
                                        }
                                    >
                                        {token.content}
                                    </button>
                                );
                            })}
                        </p>
                        <div
                            className={`translit-subline${showTransliteration ? "" : " is-off"}`}
                            aria-hidden={!showTransliteration}
                            dir="auto"
                        >
                            {showTransliteration
                                ? para.tokenRuns.map(({ token }, i) =>
                                      token.transliteration ? (
                                          <React.Fragment key={token.offset}>
                                              {i > 0 ? " " : null}
                                              <button
                                                  type="button"
                                                  className={`tok${
                                                      tokenHighlighted(token.offset)
                                                          ? " tok-in-span"
                                                          : ""
                                                  }`}
                                                  aria-pressed={
                                                      selectedToken === token.offset
                                                  }
                                                  onClick={(e) =>
                                                      onSelectToken(token.offset, {
                                                          shiftKey: e.shiftKey,
                                                      })
                                                  }
                                              >
                                                  {token.transliteration}
                                              </button>
                                          </React.Fragment>
                                      ) : null
                                  )
                                : "\u00a0"}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export { ReadingColumn };
