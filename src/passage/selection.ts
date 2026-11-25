import type { Gloss, TokenId } from "@/passage/types";

export type TokenRange = { start: TokenId; end: TokenId };
export type SelectTokenOpts = { shiftKey?: boolean };

/** Inclusive TokenId membership in [start, end]. */
function tokenIdInRange(
    tokenId: TokenId,
    start: TokenId,
    end: TokenId
): boolean {
    return tokenId >= start && tokenId <= end;
}

/** Whether two inclusive TokenId ranges overlap. */
function tokenRangesOverlap(a: TokenRange, b: TokenRange): boolean {
    return a.start <= b.end && a.end >= b.start;
}

/**
 * Active paint/study highlight: focused gloss wins, else selection.
 * Derive once upstream; panels only test membership against the result.
 */
function highlightRangeFor(
    focusedGloss: Gloss | null,
    selectionRange: TokenRange | null
): TokenRange | null {
    if (focusedGloss) {
        return { start: focusedGloss.start, end: focusedGloss.end };
    }
    return selectionRange;
}

/**
 * Whether a segment’s TokenId range is the focus paragraph for paint.
 */
function segmentInFocus(
    segment: TokenRange,
    selectedToken: TokenId,
    highlightRange: TokenRange | null
): boolean {
    if (highlightRange) {
        return tokenRangesOverlap(segment, highlightRange);
    }
    return tokenIdInRange(selectedToken, segment.start, segment.end);
}

export {
    tokenIdInRange,
    tokenRangesOverlap,
    highlightRangeFor,
    segmentInFocus,
};
