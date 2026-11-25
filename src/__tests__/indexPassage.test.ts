import { indexPassage } from "@/passage/indexPassage";
import { Passage } from "@/passage/types";

const poem: Passage = {
    offset: 0,
    length: 6,
    segments: [
        { label: "1", text: "床前 明月 光，", start: 0, end: 2 },
        { label: "2", text: "疑是 地上 霜。", start: 3, end: 5 },
    ],
    tokens: [
        {
            offset: 0,
            content: "床前",
            charStart: 0,
            charEnd: 2,
            transliteration: "chuángqián",
            translation: "before the bed",
        },
        {
            offset: 1,
            content: "明月",
            charStart: 3,
            charEnd: 5,
            transliteration: "míngyuè",
            translation: "bright moon",
        },
        {
            offset: 2,
            content: "光",
            charStart: 6,
            charEnd: 7,
            transliteration: "guāng",
            translation: "light",
        },
        {
            offset: 3,
            content: "疑是",
            charStart: 0,
            charEnd: 2,
            transliteration: "yísì",
            translation: "suspect it is",
        },
        {
            offset: 4,
            content: "地上",
            charStart: 3,
            charEnd: 5,
            transliteration: "dìshàng",
            translation: "on the ground",
        },
        {
            offset: 5,
            content: "霜",
            charStart: 6,
            charEnd: 7,
            transliteration: "shuāng",
            translation: "frost",
        },
    ],
    glosses: [{ id: "moon", start: 1, end: 1, content: "moon" }],
};

describe("indexPassage", () => {
    it("builds tokenById keyed by TokenId (Token.offset)", () => {
        const index = indexPassage(poem);
        expect(index.tokenById.size).toBe(6);
        expect(index.tokenById.get(1)).toBe(poem.tokens[1]);
        expect(index.tokenById.get(99)).toBeUndefined();
    });

    it("segmentContaining returns the segment for a token id", () => {
        const index = indexPassage(poem);
        expect(index.segmentContaining(1)?.label).toBe("1");
        expect(index.segmentContaining(4)?.label).toBe("2");
        expect(index.segmentContaining(99)).toBeUndefined();
    });

    it("tokensInRange returns tokens whose TokenId lies in [start, end]", () => {
        const index = indexPassage(poem);
        expect(index.tokensInRange(1, 3).map((t) => t.offset)).toEqual([
            1, 2, 3,
        ]);
        expect(index.tokensInRange(0, 0).map((t) => t.offset)).toEqual([0]);
        expect(index.tokensInRange(10, 20)).toEqual([]);
    });

    it("glossSpanText slices segment text including interstitial spaces", () => {
        const index = indexPassage(poem);
        expect(
            index.glossSpanText({ id: "x", start: 0, end: 2, content: "x" })
        ).toBe("床前 明月 光");
    });

    it("glossSpanText joins cross-segment spans with a space", () => {
        const index = indexPassage(poem);
        expect(
            index.glossSpanText({ id: "x", start: 2, end: 3, content: "x" })
        ).toBe("光 疑是");
    });
});
