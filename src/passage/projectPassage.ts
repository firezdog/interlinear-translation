import { indexPassage } from "@/passage/indexPassage";
import { Gloss, Passage, Segment, Token } from "@/passage/types";

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

function tokensInRange(
    tokens: Token[],
    start: number,
    end: number
): Token[] {
    return tokens.filter((t) => t.offset >= start && t.offset <= end);
}

/** Walk segment.text; emit text runs for gaps and token runs for overlays. */
function projectSegment(segment: Segment, tokens: Token[]): Run[] {
    const inSeg = tokensInRange(tokens, segment.start, segment.end).sort(
        (a, b) => a.charStart - b.charStart
    );
    const runs: Run[] = [];
    let cursor = 0;
    for (const token of inSeg) {
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
    return runs;
}

function projectPassage(passage: Passage): ProjectedPassage {
    const paragraphs = passage.segments.map((segment) => {
        const runs = projectSegment(segment, passage.tokens);
        return {
            label: segment.label,
            segment,
            runs,
            tokenRuns: runs.filter((r): r is TokenRun => r.type === "token"),
        };
    });
    return { paragraphs };
}

function segmentContaining(
    segments: Segment[],
    tokenOffset: number
): Segment | undefined {
    return segments.find(
        (s) => tokenOffset >= s.start && tokenOffset <= s.end
    );
}

/**
 * Tokens for Line study: focused gloss span, else the paragraph containing
 * the selected token. No layout measurement.
 */
function studyTokensFor(
    passage: Passage,
    selectedToken: number,
    focusedGloss: Gloss | null
): Token[] {
    if (focusedGloss) {
        return tokensInRange(
            passage.tokens,
            focusedGloss.start,
            focusedGloss.end
        );
    }
    if (selectedToken < 0) return [];
    const seg = segmentContaining(passage.segments, selectedToken);
    if (!seg) return [];
    return tokensInRange(passage.tokens, seg.start, seg.end);
}

/** Slice of segment text covering a gloss’s tokens (includes interstitial spaces). */
function glossSpanText(passage: Passage, gloss: Gloss): string {
    return indexPassage(passage).glossSpanText(gloss);
}

export {
    projectPassage,
    projectSegment,
    studyTokensFor,
    glossSpanText,
    segmentContaining,
};
