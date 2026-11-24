import React from "react";
import { Gloss, Passage, Token } from "@/passage/types";
import { LineStudyPanel } from "@/components/LineStudyPanel";
import { WordPanel } from "@/components/WordPanel";
import { GlossPanel } from "@/components/GlossPanel";

function StudyRail({
    studyTokens,
    wordToken,
    passage,
    selectedGlosses,
    selectedToken,
    focusedGloss,
    onSelectToken,
    onSelectGloss,
}: {
    studyTokens: Token[];
    wordToken: Token | null;
    passage: Passage | null;
    selectedGlosses: Gloss[];
    selectedToken: number;
    focusedGloss: Gloss | null;
    onSelectToken: (offset: number) => void;
    onSelectGloss: (gloss: Gloss) => void;
}) {
    return (
        <aside className="study-rail" aria-label="Study rail">
            <LineStudyPanel
                tokens={studyTokens}
                selectedToken={selectedToken}
                focusedGloss={focusedGloss}
                onSelectToken={onSelectToken}
            />
            <WordPanel token={wordToken} />
            {passage ? (
                <GlossPanel
                    passage={passage}
                    glosses={selectedGlosses}
                    selectedToken={selectedToken}
                    focusedGloss={focusedGloss}
                    onSelectGloss={onSelectGloss}
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
