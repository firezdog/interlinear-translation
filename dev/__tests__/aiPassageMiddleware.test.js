/**
 * @jest-environment node
 */

const {
    generatePassage,
    validatePassageJson,
} = require("../aiPassageMiddleware");
const good = require("../../public/passages/jing-ye-si/1.json");

describe("validatePassageJson", () => {
    it("accepts the few-shot passage", () => {
        expect(validatePassageJson(good)).toEqual({ ok: true, errors: null });
    });

    it("rejects incomplete objects", () => {
        const result = validatePassageJson({ offset: 0 });
        expect(result.ok).toBe(false);
        expect(result.errors).toMatch(/required/i);
    });
});

describe("generatePassage", () => {
    it("returns 503 when apiKey is missing", async () => {
        const result = await generatePassage({
            text: "床前明月光",
            apiKey: "",
        });
        expect(result).toMatchObject({ status: 503 });
        expect(result.error).toMatch(/GEMINI_API_KEY/);
    });

    it("returns 400 when text is empty", async () => {
        const result = await generatePassage({
            text: "   ",
            apiKey: "fake",
        });
        expect(result).toEqual({ status: 400, error: "text is required" });
    });

    it("returns a validated passage on first Gemini success", async () => {
        const fetchImpl = jest.fn(async () => ({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [{ text: JSON.stringify(good) }],
                        },
                    },
                ],
            }),
        }));

        const result = await generatePassage({
            text: "床前明月光",
            title: "靜夜思",
            apiKey: "fake",
            fetchImpl,
        });

        expect(result.passage).toEqual(good);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it("repairs once when the first JSON fails schema validation", async () => {
        let calls = 0;
        const fetchImpl = jest.fn(async () => {
            calls += 1;
            const text =
                calls === 1
                    ? JSON.stringify({ offset: 0 })
                    : JSON.stringify(good);
            return {
                ok: true,
                json: async () => ({
                    candidates: [{ content: { parts: [{ text }] } }],
                }),
            };
        });

        const result = await generatePassage({
            text: "床前明月光",
            apiKey: "fake",
            fetchImpl,
        });

        expect(result.passage).toEqual(good);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
        const secondBody = JSON.parse(fetchImpl.mock.calls[1][1].body);
        expect(secondBody.contents.map((c) => c.role)).toEqual([
            "user",
            "model",
            "user",
        ]);
    });

    it("returns 400 when repair still fails validation", async () => {
        const fetchImpl = jest.fn(async () => ({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [{ text: JSON.stringify({ offset: 0 }) }],
                        },
                    },
                ],
            }),
        }));

        const result = await generatePassage({
            text: "床前明月光",
            apiKey: "fake",
            fetchImpl,
        });

        expect(result.status).toBe(400);
        expect(result.error).toMatch(/schema validation/i);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
});
