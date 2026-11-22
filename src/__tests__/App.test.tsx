import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { App } from "@/App";
import { FileClient } from "@/clients/file";
import { Passage } from "@/types/passage";

const okuPassage: Passage = {
  offset: 0,
  length: 3,
  tokens: [
    { offset: 0, content: "月日", transliteration: "tsukihi", translation: "moon / sun" },
    { offset: 1, content: "は", transliteration: "wa", translation: "[topic]" },
    { offset: 2, content: "百代", transliteration: "hyakudai", translation: "hundred generations" },
  ],
  glosses: [
    { start: 0, end: 2, content: "full-line gloss" },
    { start: 2, end: 2, content: "mid gloss" },
  ],
};

const ovidPassage: Passage = {
  offset: 0,
  length: 2,
  tokens: [
    { offset: 0, content: "In", transliteration: "", translation: "into" },
    { offset: 1, content: "nova", transliteration: "", translation: "new" },
  ],
  glosses: [
    { start: 0, end: 1, content: "ovid opening" },
  ],
};

describe("App component", () => {
  const read = jest.fn();

  beforeEach(() => {
    read.mockReset();
    jest.spyOn(FileClient, "getClient").mockReturnValue({ read } as unknown as FileClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads a passage and renders tokens", async () => {
    read.mockResolvedValue(okuPassage);
    render(<App />);

    expect(await screen.findByText("月日")).toBeInTheDocument();
    expect(screen.getByText("tsukihi")).toBeInTheDocument();
    expect(screen.getByText("moon / sun")).toBeInTheDocument();
    expect(read).toHaveBeenCalledWith("oku-no-hosomichi", 1);
  });

  it("shows glosses on token click and clears on second click", async () => {
    read.mockResolvedValue(okuPassage);
    render(<App />);

    const token = await screen.findByText("百代");
    fireEvent.click(token);

    expect(screen.getByText("full-line gloss")).toBeInTheDocument();
    expect(screen.getByText("mid gloss")).toBeInTheDocument();

    fireEvent.click(token);
    expect(screen.queryByText("full-line gloss")).not.toBeInTheDocument();
    expect(screen.queryByText("mid gloss")).not.toBeInTheDocument();
  });

  it("resets selection when switching passages", async () => {
    read
      .mockResolvedValueOnce(okuPassage)
      .mockResolvedValueOnce(ovidPassage);
    render(<App />);

    const token = await screen.findByText("百代");
    fireEvent.click(token);
    expect(screen.getByText("mid gloss")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ovid" } });

    expect(await screen.findByText("In")).toBeInTheDocument();
    expect(screen.queryByText("mid gloss")).not.toBeInTheDocument();
    expect(screen.queryByText("百代")).not.toBeInTheDocument();
  });

  it("shows an error when load fails", async () => {
    read.mockRejectedValue(new Error("failed to load passage"));
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("failed to load passage")).toBeInTheDocument();
    });
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
