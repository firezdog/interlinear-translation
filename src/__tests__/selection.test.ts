import {
    highlightRangeFor,
    segmentInFocus,
    tokenIdInRange,
    tokenRangesOverlap,
} from "@/passage/selection";

describe("selection helpers", () => {
    it("tokenIdInRange is inclusive on both ends", () => {
        expect(tokenIdInRange(1, 1, 3)).toBe(true);
        expect(tokenIdInRange(3, 1, 3)).toBe(true);
        expect(tokenIdInRange(0, 1, 3)).toBe(false);
        expect(tokenIdInRange(4, 1, 3)).toBe(false);
    });

    it("tokenRangesOverlap detects inclusive overlap", () => {
        expect(
            tokenRangesOverlap({ start: 0, end: 2 }, { start: 2, end: 4 })
        ).toBe(true);
        expect(
            tokenRangesOverlap({ start: 0, end: 1 }, { start: 2, end: 4 })
        ).toBe(false);
    });

    it("highlightRangeFor prefers focused gloss over selection", () => {
        expect(
            highlightRangeFor(
                { id: "g", start: 2, end: 4, content: "" },
                { start: 0, end: 0 }
            )
        ).toEqual({ start: 2, end: 4 });
        expect(highlightRangeFor(null, { start: 0, end: 1 })).toEqual({
            start: 0,
            end: 1,
        });
        expect(highlightRangeFor(null, null)).toBeNull();
    });

    it("segmentInFocus uses highlight range, else selected token", () => {
        const seg = { start: 0, end: 2 };
        expect(segmentInFocus(seg, 5, { start: 2, end: 4 })).toBe(true);
        expect(segmentInFocus(seg, 5, { start: 3, end: 5 })).toBe(false);
        expect(segmentInFocus(seg, 1, null)).toBe(true);
        expect(segmentInFocus(seg, 5, null)).toBe(false);
    });
});
