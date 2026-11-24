import React, { useMemo } from "react";
import { Gloss, Passage } from "@/passage/types";
import { projectPassage } from "@/passage/projectPassage";

function ReadingColumn({
    passage,
    glossesByToken,
    selectedToken,
    focusedGloss,
    showTransliteration,
    onSelectToken,
}: {
    passage: Passage;
    glossesByToken: Map<number, Gloss[]>;
    selectedToken: number;
    focusedGloss: Gloss | null;
    showTransliteration: boolean;
    onSelectToken: (offset: number) => void;
}) {
    const { paragraphs } = useMemo(() => projectPassage(passage), [passage]);

    const inFocusedGloss = (offset: number) =>
        !!(focusedGloss && offset >= focusedGloss.start && offset <= focusedGloss.end);

    const segmentIsFocus = (start: number, end: number) => {
        if (focusedGloss) {
            return focusedGloss.start <= end && focusedGloss.end >= start;
        }
        return selectedToken >= start && selectedToken <= end;
    };

    return (
        <div className="reading-column" dir="auto">
            {paragraphs.map((para) => {
                const focus = segmentIsFocus(para.segment.start, para.segment.end);
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
                                    inFocusedGloss(token.offset) ? "tok-in-span" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ");
                                return (
                                    <button
                                        key={token.offset}
                                        type="button"
                                        className={cls}
                                        aria-pressed={selectedToken === token.offset}
                                        onClick={() => onSelectToken(token.offset)}
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
                                                  className="tok"
                                                  aria-pressed={
                                                      selectedToken === token.offset
                                                  }
                                                  onClick={() =>
                                                      onSelectToken(token.offset)
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
