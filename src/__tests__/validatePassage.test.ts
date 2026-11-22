import { assertPassage } from "@/validatePassage";

const validPassage = {
    offset: 0,
    length: 2,
    tokens: [
        { offset: 0, content: "a", transliteration: "a", translation: "a" },
        { offset: 1, content: "b", transliteration: "b", translation: "b" },
    ],
    glosses: [
        { start: 0, end: 1, content: "ab" },
    ],
};

describe("assertPassage", () => {
    it("accepts a valid fixture-shaped passage", () => {
        expect(assertPassage(validPassage)).toEqual(validPassage);
    });

    it("rejects missing tokens", () => {
        const rest = { ...validPassage } as Partial<typeof validPassage>;
        delete rest.tokens;
        expect(() => assertPassage(rest)).toThrow(/tokens/);
    });

    it("rejects bad gloss types", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                glosses: [{ start: "0", end: 1, content: "ab" }],
            })
        ).toThrow(/start/);
    });

    it("rejects glosses where end < start", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                glosses: [{ start: 2, end: 1, content: "bad" }],
            })
        ).toThrow(/end must be >= start/);
    });

    it("rejects a non-object root", () => {
        expect(() => assertPassage(null)).toThrow(/object/);
        expect(() => assertPassage("nope")).toThrow(/object|string/);
    });

    it("rejects missing or invalid offset and length", () => {
        const noOffset = { ...validPassage } as Partial<typeof validPassage>;
        delete noOffset.offset;
        expect(() => assertPassage(noOffset)).toThrow(/offset/);

        expect(() => assertPassage({ ...validPassage, length: 1.5 })).toThrow(/length/);
    });

    it("rejects invalid token fields", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                tokens: [{ offset: 0, content: 1, transliteration: "a", translation: "a" }],
            })
        ).toThrow(/content/);
    });

    it("rejects missing glosses array", () => {
        const rest = { ...validPassage } as Partial<typeof validPassage>;
        delete rest.glosses;
        expect(() => assertPassage(rest)).toThrow(/glosses/);
    });
});
