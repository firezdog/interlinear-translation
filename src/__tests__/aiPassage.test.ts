import {
    AiPassageUnavailableError,
    aiPassageCreateClient,
    createPassageWithAi,
} from "@/clients/aiPassage";

const validPassage = {
    offset: 0,
    length: 1,
    segments: [{ text: "a", start: 0, end: 0 }],
    tokens: [
        {
            offset: 0,
            content: "a",
            charStart: 0,
            charEnd: 1,
            transliteration: "a",
            translation: "a",
        },
    ],
    glosses: [{ id: "g1", start: 0, end: 0, content: "gloss" }],
};

describe("createPassageWithAi", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("posts text/title and returns assertPassage-validated JSON", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => validPassage,
            text: async () => "",
        });

        const passage = await createPassageWithAi({
            text: "a",
            title: "Letter A",
        });

        expect(fetchMock).toHaveBeenCalledWith("/api/ai/passage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "a", title: "Letter A" }),
        });
        expect(passage).toEqual(validPassage);
    });

    it("throws AiPassageUnavailableError on 503", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 503,
            text: async () => "GEMINI_API_KEY is not set",
            json: async () => ({}),
        });

        await expect(createPassageWithAi({ text: "a" })).rejects.toBeInstanceOf(
            AiPassageUnavailableError
        );
        await expect(createPassageWithAi({ text: "a" })).rejects.toThrow(
            /GEMINI_API_KEY/
        );
    });

    it("maps network failure to a readable error", async () => {
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

        await expect(createPassageWithAi({ text: "a" })).rejects.toThrow(
            /Could not reach the AI passage service/
        );
    });

    it("rejects invalid passage payloads", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ offset: 0 }),
            text: async () => "",
        });

        await expect(createPassageWithAi({ text: "a" })).rejects.toThrow();
    });
});

describe("aiPassageCreateClient", () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("exposes AI metadata and delegates create", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => validPassage,
            text: async () => "",
        });

        expect(aiPassageCreateClient.id).toBe("ai");
        expect(aiPassageCreateClient.submittingLabel).toMatch(/Generating/);

        const passage = await aiPassageCreateClient.create({
            text: "a",
            title: "A",
        });
        expect(passage).toEqual(validPassage);
    });
});
