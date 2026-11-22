import { buildGlossesByToken } from "@/buildGlossesByToken";
import { Gloss, Token } from "@/types/passage";

function token(offset: number): Token {
    return { offset, content: String(offset), transliteration: "", translation: "" };
}

function gloss(start: number, end: number, content: string): Gloss {
    return { start, end, content };
}

describe("buildGlossesByToken", () => {
    it("maps overlapping inclusive ranges (oku-shaped)", () => {
        const tokens = [0, 1, 2, 3, 4, 5, 6].map(token);
        const glosses = [
            gloss(0, 6, "full"),
            gloss(2, 4, "mid"),
        ];

        const result = buildGlossesByToken(tokens, glosses);

        expect(result.get(0)?.map((g) => g.content)).toEqual(["full"]);
        expect(result.get(1)?.map((g) => g.content)).toEqual(["full"]);
        expect(result.get(2)?.map((g) => g.content)).toEqual(["full", "mid"]);
        expect(result.get(3)?.map((g) => g.content)).toEqual(["full", "mid"]);
        expect(result.get(4)?.map((g) => g.content)).toEqual(["full", "mid"]);
        expect(result.get(5)?.map((g) => g.content)).toEqual(["full"]);
        expect(result.get(6)?.map((g) => g.content)).toEqual(["full"]);
    });

    it("treats end as inclusive (single-token and multi-token)", () => {
        const tokens = [0, 1, 2, 3].map(token);
        const glosses = [
            gloss(1, 1, "one"),
            gloss(2, 3, "two"),
        ];

        const result = buildGlossesByToken(tokens, glosses);

        expect(result.get(0)).toEqual([]);
        expect(result.get(1)?.map((g) => g.content)).toEqual(["one"]);
        expect(result.get(2)?.map((g) => g.content)).toEqual(["two"]);
        expect(result.get(3)?.map((g) => g.content)).toEqual(["two"]);
    });

    it("returns empty gloss lists when there are no glosses", () => {
        const tokens = [0, 1].map(token);
        const result = buildGlossesByToken(tokens, []);

        expect(result.get(0)).toEqual([]);
        expect(result.get(1)).toEqual([]);
    });

    it("ignores glosses that never overlap tokens", () => {
        const tokens = [0, 1, 2].map(token);
        const glosses = [gloss(10, 12, "far")];

        const result = buildGlossesByToken(tokens, glosses);

        expect(result.get(0)).toEqual([]);
        expect(result.get(1)).toEqual([]);
        expect(result.get(2)).toEqual([]);
    });

    it("handles unsorted gloss arrays", () => {
        const tokens = [0, 1, 2, 3].map(token);
        const glosses = [
            gloss(2, 3, "later"),
            gloss(0, 1, "earlier"),
        ];

        const result = buildGlossesByToken(tokens, glosses);

        expect(result.get(0)?.map((g) => g.content)).toEqual(["earlier"]);
        expect(result.get(1)?.map((g) => g.content)).toEqual(["earlier"]);
        expect(result.get(2)?.map((g) => g.content)).toEqual(["later"]);
        expect(result.get(3)?.map((g) => g.content)).toEqual(["later"]);
    });
});
