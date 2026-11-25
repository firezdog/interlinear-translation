import { CharPos, Gloss, Passage, Segment, Token, TokenId } from "@/passage/types";

/**
 * Runtime association maps derived from a Passage.
 *
 * Invalidation: rebuild the full index whenever `passage` changes.
 * Finer split (alignment vs annotation identity) is a later optimization.
 */
export type PassageIndex = {
    passage: Passage;
    /** Explicit token-id → token (from Token.offset). */
    tokenById: Map<TokenId, Token>;
    /** Which glosses cover each token id (precomputed sweep). */
    glossesByToken: Map<TokenId, Gloss[]>;
    segmentContaining(tokenId: TokenId): Segment | undefined;
    tokensInRange(start: TokenId, end: TokenId): Token[];
    glossSpanText(gloss: Gloss): string;
};

/** Sweep tokens left-to-right, activating/deactivating glosses via start/end pointers. */
function buildGlossesByToken(
    tokens: Token[],
    glosses: Gloss[]
): Map<TokenId, Gloss[]> {
    const byStart = [...glosses].sort((a, b) => a.start - b.start);
    const byEnd = [...glosses].sort((a, b) => a.end - b.end);
    let startPtr = 0;
    let endPtr = 0;
    const active = new Set<Gloss>();
    const glossesByToken = new Map<TokenId, Gloss[]>();

    for (const token of tokens) {
        while (endPtr < byEnd.length && byEnd[endPtr].end < token.offset) {
            active.delete(byEnd[endPtr]);
            endPtr++;
        }
        while (
            startPtr < byStart.length &&
            byStart[startPtr].start <= token.offset
        ) {
            active.add(byStart[startPtr]);
            startPtr++;
        }
        glossesByToken.set(token.offset, [...active]);
    }

    return glossesByToken;
}

/**
 * Build lookup maps and range helpers from a passage.
 * Call again whenever `passage` changes (full rebuild).
 */
function indexPassage(passage: Passage): PassageIndex {
    const tokenById = new Map<TokenId, Token>();
    for (const token of passage.tokens) {
        tokenById.set(token.offset, token);
    }
    const sortedById = [...passage.tokens].sort((a, b) => a.offset - b.offset);
    const glossesByToken = buildGlossesByToken(passage.tokens, passage.glosses);

    function segmentContaining(tokenId: TokenId): Segment | undefined {
        return passage.segments.find(
            (s) => tokenId >= s.start && tokenId <= s.end
        );
    }

    function tokensInRange(start: TokenId, end: TokenId): Token[] {
        /** First index with token.offset >= target. */
        function lowerBound(target: TokenId): number {
            let lo = 0;
            let hi = sortedById.length;
            while (lo < hi) {
                const mid = (lo + hi) >>> 1;
                if (sortedById[mid].offset < target) lo = mid + 1;
                else hi = mid;
            }
            return lo;
        }
        /** First index with token.offset > target. */
        function upperBound(target: TokenId): number {
            let lo = 0;
            let hi = sortedById.length;
            while (lo < hi) {
                const mid = (lo + hi) >>> 1;
                if (sortedById[mid].offset <= target) lo = mid + 1;
                else hi = mid;
            }
            return lo;
        }
        return sortedById.slice(lowerBound(start), upperBound(end));
    }

    function glossSpanText(gloss: Gloss): string {
        const first = tokenById.get(gloss.start);
        const last = tokenById.get(gloss.end);
        if (!first || !last) {
            return tokensInRange(gloss.start, gloss.end)
                .map((t) => t.content)
                .join("");
        }
        const seg = segmentContaining(gloss.start);
        const segEnd = segmentContaining(gloss.end);
        if (seg && seg === segEnd) {
            const from: CharPos = first.charStart;
            const to: CharPos = last.charEnd;
            return seg.text.slice(from, to);
        }
        // Cross-segment: concatenate per-segment slices
        const parts: string[] = [];
        for (const s of passage.segments) {
            if (s.end < gloss.start || s.start > gloss.end) continue;
            const lo = tokenById.get(Math.max(s.start, gloss.start));
            const hi = tokenById.get(Math.min(s.end, gloss.end));
            if (lo && hi) {
                const from: CharPos = lo.charStart;
                const to: CharPos = hi.charEnd;
                parts.push(s.text.slice(from, to));
            }
        }
        return parts.join(" ");
    }

    return {
        passage,
        tokenById,
        glossesByToken,
        segmentContaining,
        tokensInRange,
        glossSpanText,
    };
}

export { indexPassage, buildGlossesByToken };
