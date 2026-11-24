import { createPassage } from "@/passage/createPassage";
import { assertPassage } from "@/passage/validatePassage";

describe("createPassage", () => {
    it("tokenizes whitespace multi-line prose", () => {
        const passage = createPassage(
            "In nova fert animus.\n\nMutatas dicere formas.",
            "whitespace"
        );

        expect(passage.segments).toHaveLength(2);
        expect(passage.segments[0].text).toBe("In nova fert animus.");
        expect(passage.segments[1].text).toBe("Mutatas dicere formas.");
        expect(passage.glosses).toEqual([]);
        expect(passage.offset).toBe(0);
        expect(passage.length).toBe(passage.tokens.length);

        expect(passage.tokens.map((t) => t.content)).toEqual([
            "In",
            "nova",
            "fert",
            "animus.",
            "Mutatas",
            "dicere",
            "formas.",
        ]);
        for (const t of passage.tokens) {
            expect(t.transliteration).toBe("");
            expect(t.translation).toBe("");
        }

        expect(passage.segments[0]).toMatchObject({ start: 0, end: 3 });
        expect(passage.segments[1]).toMatchObject({ start: 4, end: 6 });

        const first = passage.tokens[0];
        expect(passage.segments[0].text.slice(first.charStart, first.charEnd)).toBe(
            "In"
        );
        expect(assertPassage(passage)).toEqual(passage);
    });

    it("tokenizes CJV per character and leaves punctuation as gaps", () => {
        const passage = createPassage("床前明月光，\n疑是地上霜。", "cjv");

        expect(passage.segments).toHaveLength(2);
        expect(passage.segments[0].text).toBe("床前明月光，");
        expect(passage.segments[1].text).toBe("疑是地上霜。");
        expect(passage.tokens.map((t) => t.content)).toEqual([
            "床",
            "前",
            "明",
            "月",
            "光",
            "疑",
            "是",
            "地",
            "上",
            "霜",
        ]);
        expect(passage.glosses).toEqual([]);

        const lastInFirst = passage.tokens[4];
        expect(lastInFirst.content).toBe("光");
        expect(lastInFirst.charStart).toBe(4);
        expect(lastInFirst.charEnd).toBe(5);
        // Comma at index 5 is an untokenized gap
        expect(passage.segments[0].text[5]).toBe("，");

        expect(assertPassage(passage)).toEqual(passage);
    });

    it("skips empty lines and rejects all-empty input", () => {
        const passage = createPassage("\n\nhello\n  \nworld\n", "whitespace");
        expect(passage.segments).toHaveLength(2);
        expect(passage.tokens.map((t) => t.content)).toEqual(["hello", "world"]);

        expect(() => createPassage("   \n\n  ", "whitespace")).toThrow(
            /empty/i
        );
        expect(() => createPassage("，。", "cjv")).toThrow(/no tokens/i);
    });
});
