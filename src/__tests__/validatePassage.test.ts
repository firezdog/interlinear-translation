import { assertPassage } from "@/passage/validatePassage";

const validPassage = {
    offset: 0,
    length: 2,
    segments: [{ text: "a b", start: 0, end: 1 }],
    tokens: [
        {
            offset: 0,
            content: "a",
            charStart: 0,
            charEnd: 1,
            transliteration: "a",
            translation: "a",
        },
        {
            offset: 1,
            content: "b",
            charStart: 2,
            charEnd: 3,
            transliteration: "b",
            translation: "b",
        },
    ],
    glosses: [{ id: "ab", start: 0, end: 1, content: "ab" }],
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

    it("rejects missing segments", () => {
        const rest = { ...validPassage } as Partial<typeof validPassage>;
        delete rest.segments;
        expect(() => assertPassage(rest)).toThrow(/segments/);
    });

    it("rejects bad gloss types", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                glosses: [{ id: "ab", start: "0", end: 1, content: "ab" }],
            })
        ).toThrow(/start/);
    });

    it("rejects glosses where end < start", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                glosses: [{ id: "bad", start: 2, end: 1, content: "bad" }],
            })
        ).toThrow(/end must be >= start/);
    });

    it("rejects duplicate gloss ids", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                glosses: [
                    { id: "dup", start: 0, end: 0, content: "a" },
                    { id: "dup", start: 1, end: 1, content: "b" },
                ],
            })
        ).toThrow(/duplicate gloss id/);
    });

    it("rejects glosses missing id", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                glosses: [{ start: 0, end: 1, content: "ab" }],
            })
        ).toThrow(/id/);
    });

    it("rejects content that does not match segment slice", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                tokens: [
                    {
                        offset: 0,
                        content: "x",
                        charStart: 0,
                        charEnd: 1,
                        transliteration: "a",
                        translation: "a",
                    },
                    validPassage.tokens[1],
                ],
            })
        ).toThrow(/content must equal/);
    });

    it("rejects a non-object root", () => {
        expect(() => assertPassage(null)).toThrow(/object/);
        expect(() => assertPassage("nope")).toThrow(/object|string/);
    });

    it("rejects missing or invalid offset and length", () => {
        const noOffset = { ...validPassage } as Partial<typeof validPassage>;
        delete noOffset.offset;
        expect(() => assertPassage(noOffset)).toThrow(/offset/);

        expect(() => assertPassage({ ...validPassage, length: 1.5 })).toThrow(
            /length/
        );
    });

    it("rejects invalid token fields", () => {
        expect(() =>
            assertPassage({
                ...validPassage,
                tokens: [
                    {
                        offset: 0,
                        content: 1,
                        charStart: 0,
                        charEnd: 1,
                        transliteration: "a",
                        translation: "a",
                    },
                ],
            })
        ).toThrow(/content/);
    });

    it("rejects missing glosses array", () => {
        const rest = { ...validPassage } as Partial<typeof validPassage>;
        delete rest.glosses;
        expect(() => assertPassage(rest)).toThrow(/glosses/);
    });
});
