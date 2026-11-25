import { indexPassage } from "@/passage/indexPassage";
import { projectPassage, studyTokensFor } from "@/passage/projectPassage";
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

describe("projectPassage", () => {
    it("emits text gaps and token runs for a segment", () => {
        const { paragraphs } = projectPassage(indexPassage(poem));
        expect(paragraphs).toHaveLength(2);
        const runs = paragraphs[0].runs;
        expect(runs[0]).toEqual({ type: "token", token: poem.tokens[0] });
        expect(runs[1]).toEqual({ type: "text", value: " " });
        expect(runs[2]).toEqual({ type: "token", token: poem.tokens[1] });
        expect(runs[3]).toEqual({ type: "text", value: " " });
        expect(runs[4]).toEqual({ type: "token", token: poem.tokens[2] });
        expect(runs[5]).toEqual({ type: "text", value: "，" });
    });
});

describe("studyTokensFor", () => {
    const index = indexPassage(poem);

    it("returns the paragraph tokens for a selection", () => {
        const tokens = studyTokensFor(index, 1, null);
        expect(tokens.map((t) => t.offset)).toEqual([0, 1, 2]);
    });

    it("returns gloss span tokens when a gloss is focused", () => {
        const tokens = studyTokensFor(index, 1, poem.glosses[0]);
        expect(tokens.map((t) => t.offset)).toEqual([1]);
    });

    it("returns empty when nothing is selected", () => {
        expect(studyTokensFor(index, -1, null)).toEqual([]);
    });
});
