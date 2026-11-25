import React from "react";
import { Gloss, Token } from "@/passage/types";
import type { PassageIndex } from "@/passage/indexPassage";
import { LineStudyPanel } from "@/components/LineStudyPanel";
import { WordPanel } from "@/components/WordPanel";
import { GlossPanel } from "@/components/GlossPanel";
import type { SelectTokenOpts, TokenRange } from "@/passage/selection";

function StudyRail({
    studyTokens,
    wordToken,
    index,
    selectedGlosses,
    selectedToken,
    selectionRange,
    highlightRange,
    focusedGloss,
    onSelectToken,
    onSelectGloss,
    onAddGloss,
    onUpdateGloss,
    onUpdateToken,
}: {
    studyTokens: Token[];
    wordToken: Token | null;
    index: PassageIndex | null;
    selectedGlosses: Gloss[];
    selectedToken: number;
    selectionRange: TokenRange | null;
    highlightRange: TokenRange | null;
    focusedGloss: Gloss | null;
    onSelectToken: (offset: number, opts?: SelectTokenOpts) => void;
    onSelectGloss: (gloss: Gloss) => void;
    onAddGloss: (content: string) => void;
    onUpdateGloss: (id: string, content: string) => void;
    onUpdateToken: (
        offset: number,
        patch: { transliteration?: string; translation?: string }
    ) => void;
}) {
    return (
        <aside className="study-rail" aria-label="Study rail">
            <LineStudyPanel
                tokens={studyTokens}
                selectedToken={selectedToken}
                highlightRange={highlightRange}
                glossFocused={focusedGloss != null}
                onSelectToken={onSelectToken}
            />
            <WordPanel token={wordToken} onUpdateToken={onUpdateToken} />
            {index ? (
                <GlossPanel
                    index={index}
                    glosses={selectedGlosses}
                    selectedToken={selectedToken}
                    selectionRange={selectionRange}
                    focusedGloss={focusedGloss}
                    onSelectGloss={onSelectGloss}
                    onAddGloss={onAddGloss}
                    onUpdateGloss={onUpdateGloss}
                />
            ) : (
                <section className="study-panel study-panel-gloss" aria-label="Glosses">
                    <h2>Glosses</h2>
                    <div className="panel-body">
                        <p className="panel-empty">Load a passage to see glosses.</p>
                    </div>
                </section>
            )}
        </aside>
    );
}

export { StudyRail };
