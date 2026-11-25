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
  const originalPublicPath = process.env.PUBLIC_PATH;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    delete process.env.PUBLIC_PATH;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalPublicPath === undefined) {
      delete process.env.PUBLIC_PATH;
    } else {
      process.env.PUBLIC_PATH = originalPublicPath;
    }
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

  it("prefixes the passage URL with PUBLIC_PATH", async () => {
    process.env.PUBLIC_PATH = "/interlinear-translation/";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => validPassage,
    });

    await FileClient.getClient().read("oku-no-hosomichi", 1);

    expect(fetchMock).toHaveBeenCalledWith(
      "/interlinear-translation/passages/oku-no-hosomichi/1.json"
    );
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

describe("FileClient.write", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("PUTs validated passage JSON to the write API", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => "",
    });

    await FileClient.getClient().write("oku-no-hosomichi", 1, validPassage);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/passage?key=oku-no-hosomichi&page=1",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPassage),
      }
    );
  });

  it("throws a generic message when the write response is not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 405,
      text: async () =>
        "<html><head><title>405 Not Allowed</title></head></html>",
    });

    await expect(
      FileClient.getClient().write("oku-no-hosomichi", 1, validPassage)
    ).rejects.toThrow("error while saving passage");
  });

  it("throws before fetch when passage fails validation", async () => {
    await expect(
      FileClient.getClient().write("oku-no-hosomichi", 1, {
        offset: 0,
        length: 1,
      } as never)
    ).rejects.toThrow(/tokens/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
