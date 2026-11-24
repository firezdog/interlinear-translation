import React from "react";
import { Gloss, Passage, Token } from "@/passage/types";
import { LineStudyPanel } from "@/components/LineStudyPanel";
import { WordPanel } from "@/components/WordPanel";
import { GlossPanel } from "@/components/GlossPanel";
import type { SelectTokenOpts, TokenRange } from "@/passage/selection";

function StudyRail({
    studyTokens,
    wordToken,
    passage,
    selectedGlosses,
    selectedToken,
    selectionRange,
    focusedGloss,
    onSelectToken,
    onSelectGloss,
    onAddGloss,
    onUpdateGloss,
}: {
    studyTokens: Token[];
    wordToken: Token | null;
    passage: Passage | null;
    selectedGlosses: Gloss[];
    selectedToken: number;
    selectionRange: TokenRange | null;
    focusedGloss: Gloss | null;
    onSelectToken: (offset: number, opts?: SelectTokenOpts) => void;
    onSelectGloss: (gloss: Gloss) => void;
    onAddGloss: (content: string) => void;
    onUpdateGloss: (id: string, content: string) => void;
}) {
    return (
        <aside className="study-rail" aria-label="Study rail">
            <LineStudyPanel
                tokens={studyTokens}
                selectedToken={selectedToken}
                selectionRange={selectionRange}
                focusedGloss={focusedGloss}
                onSelectToken={onSelectToken}
            />
            <WordPanel token={wordToken} />
            {passage ? (
                <GlossPanel
                    passage={passage}
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
