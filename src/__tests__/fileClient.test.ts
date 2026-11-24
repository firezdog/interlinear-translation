import { FileClient } from "@/clients/file";

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

describe("FileClient.read", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns a validated passage on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => validPassage,
    });

    const passage = await FileClient.getClient().read("oku-no-hosomichi", 1);

    expect(fetchMock).toHaveBeenCalledWith("/passages/oku-no-hosomichi/1.json");
    expect(passage).toEqual(validPassage);
  });

  it("throws when the response is not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    await expect(FileClient.getClient().read("missing", 1)).rejects.toThrow(
      "failed to load passage"
    );
  });

  it("throws when the payload fails validation", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ offset: 0, length: 1 }),
    });

    await expect(FileClient.getClient().read("bad", 1)).rejects.toThrow(/tokens/);
  });
});
