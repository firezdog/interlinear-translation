import { indexPassage, type PassageIndex } from "@/passage/indexPassage";
import { Gloss, Passage, Segment, Token, TokenId } from "@/passage/types";

export type TextRun = { type: "text"; value: string };
export type TokenRun = { type: "token"; token: Token };
export type Run = TextRun | TokenRun;

export type ProjectedParagraph = {
    label?: string;
    segment: Segment;
    runs: Run[];
    /** Token runs only, for transliteration subline. */
    tokenRuns: TokenRun[];
};

export type ProjectedPassage = {
    paragraphs: ProjectedParagraph[];
};

/**
 * Project each segment into contiguous text/token runs.
 * Membership via TokenId range on the index; walk is left-to-right by CharPos.
 */
function projectPassage(index: PassageIndex): ProjectedPassage {
    const { passage } = index;
    const paragraphs = passage.segments.map((segment) => {
        const tokens = index
            .tokensInRange(segment.start, segment.end)
            .sort((a, b) => a.charStart - b.charStart);
        const runs: Run[] = [];
        let cursor = 0;
        for (const token of tokens) {
            if (token.charStart > cursor) {
                runs.push({
                    type: "text",
                    value: segment.text.slice(cursor, token.charStart),
                });
            }
            runs.push({ type: "token", token });
            cursor = token.charEnd;
        }
        if (cursor < segment.text.length) {
            runs.push({ type: "text", value: segment.text.slice(cursor) });
        }
        return {
            label: segment.label,
            segment,
            runs,
            tokenRuns: runs.filter((r): r is TokenRun => r.type === "token"),
        };
    });
    return { paragraphs };
}

/**
 * Tokens for Line study: focused gloss span, else the paragraph containing
 * the selected token. No layout measurement.
 */
function studyTokensFor(
    index: PassageIndex,
    selectedToken: TokenId,
    focusedGloss: Gloss | null
): Token[] {
    if (focusedGloss) {
        return index.tokensInRange(focusedGloss.start, focusedGloss.end);
    }
    if (selectedToken < 0) return [];
    const seg = index.segmentContaining(selectedToken);
    if (!seg) return [];
    return index.tokensInRange(seg.start, seg.end);
}

/** Slice of segment text covering a gloss’s tokens (includes interstitial spaces). */
function glossSpanText(passage: Passage, gloss: Gloss): string {
    return indexPassage(passage).glossSpanText(gloss);
}

export {
    projectPassage,
    studyTokensFor,
    glossSpanText,
};
