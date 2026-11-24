import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { App } from "@/App";
import { FileClient } from "@/clients/file";
import { Passage } from "@/passage/types";

const okuPassage: Passage = {
    offset: 0,
    length: 3,
    segments: [{ text: "月日は百代", start: 0, end: 2 }],
    tokens: [
        {
            offset: 0,
            content: "月日",
            charStart: 0,
            charEnd: 2,
            transliteration: "tsukihi",
            translation: "moon / sun",
        },
        {
            offset: 1,
            content: "は",
            charStart: 2,
            charEnd: 3,
            transliteration: "wa",
            translation: "[topic]",
        },
        {
            offset: 2,
            content: "百代",
            charStart: 3,
            charEnd: 5,
            transliteration: "hyakudai",
            translation: "hundred generations",
        },
    ],
    glosses: [
        { id: "full", start: 0, end: 2, content: "full-line gloss" },
        { id: "mid", start: 2, end: 2, content: "mid gloss" },
    ],
};

const jingPassage: Passage = {
    offset: 0,
    length: 3,
    segments: [{ text: "床前 明月 光，", start: 0, end: 2 }],
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
    ],
    glosses: [],
};

const ovidPassage: Passage = {
    offset: 0,
    length: 2,
    segments: [{ text: "In nova", start: 0, end: 1 }],
    tokens: [
        {
            offset: 0,
            content: "In",
            charStart: 0,
            charEnd: 2,
            transliteration: "",
            translation: "into",
        },
        {
            offset: 1,
            content: "nova",
            charStart: 3,
            charEnd: 7,
            transliteration: "",
            translation: "new",
        },
    ],
    glosses: [{ id: "ovid-open", start: 0, end: 1, content: "ovid opening" }],
};

describe("App component", () => {
    const read = jest.fn();

    beforeEach(() => {
        read.mockReset();
        jest.spyOn(FileClient, "getClient").mockReturnValue({
            read,
        } as unknown as FileClient);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("loads a passage and renders original tokens in the reading column", async () => {
        read.mockResolvedValue(okuPassage);
        render(<App />);

        expect(await screen.findByText("月日")).toBeInTheDocument();
        expect(screen.getByText("は")).toBeInTheDocument();
        expect(screen.getByText("百代")).toBeInTheDocument();
        expect(read).toHaveBeenCalledWith("oku-no-hosomichi", 1);
    });

    it("renders 靜夜思 tokens", async () => {
        read.mockResolvedValue(jingPassage);
        render(<App />);

        fireEvent.change(await screen.findByRole("combobox"), {
            target: { value: "jing-ye-si" },
        });

        expect(await screen.findByText("床前")).toBeInTheDocument();
        expect(screen.getByText("明月")).toBeInTheDocument();
        expect(screen.getByText("光")).toBeInTheDocument();
    });

    it("fills word and gloss panels on token click and clears on second click", async () => {
        read.mockResolvedValue(okuPassage);
        render(<App />);

        const token = await screen.findByText("百代");
        fireEvent.click(token);

        expect(screen.getByText("full-line gloss")).toBeInTheDocument();
        expect(screen.getByText("mid gloss")).toBeInTheDocument();
        expect(screen.getByLabelText("Word")).toHaveTextContent("百代");
        expect(screen.getByLabelText("Word")).toHaveTextContent("hyakudai");

        fireEvent.click(token);
        expect(screen.queryByText("full-line gloss")).not.toBeInTheDocument();
        expect(screen.queryByText("mid gloss")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Word")).toHaveTextContent("—");
    });

    it("highlights a gloss span when a gloss card is clicked", async () => {
        read.mockResolvedValue(okuPassage);
        render(<App />);

        fireEvent.click(await screen.findByText("百代"));
        fireEvent.click(screen.getByText("mid gloss"));

        const focused = screen.getByText("mid gloss").closest(".gloss-card");
        expect(focused).toHaveClass("is-span-focus");
        expect(
            focused!.querySelector("button.field-edit-btn")
        ).toBeInTheDocument();
        expect(
            screen.queryByLabelText("Edit gloss commentary")
        ).not.toBeInTheDocument();
        expect(screen.getByText("Gloss span (aligned study)")).toBeInTheDocument();
    });

    it("toggles transliteration without removing reserved sub-line", async () => {
        read.mockResolvedValue(okuPassage);
        render(<App />);

        await screen.findByText("月日");
        const checkbox = screen.getByRole("checkbox", { name: /transliteration/i });
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
        expect(screen.getByText("tsukihi")).toBeInTheDocument();
    });

    it("resets selection when switching passages", async () => {
        read.mockResolvedValueOnce(okuPassage).mockResolvedValueOnce(ovidPassage);
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

    it("shift-click extends a token range and highlights the span", async () => {
        read.mockResolvedValue(okuPassage);
        render(<App />);

        const first = await screen.findByRole("button", { name: "月日" });
        const last = screen.getByRole("button", { name: "百代" });
        fireEvent.click(first);
        fireEvent.click(last, { shiftKey: true });

        const readingBtns = first
            .closest(".reading-orig")
            ?.querySelectorAll("button.tok");
        expect(readingBtns).toHaveLength(3);
        readingBtns?.forEach((btn) => expect(btn).toHaveClass("tok-in-span"));
        expect(screen.getByText(/Span: 月日は百代/)).toBeInTheDocument();
        expect(screen.getByText("Selected span")).toBeInTheDocument();
    });

    it("adds an in-memory gloss for the selected range", async () => {
        read.mockResolvedValue(jingPassage);
        render(<App />);

        fireEvent.change(await screen.findByRole("combobox"), {
            target: { value: "jing-ye-si" },
        });

        const first = await screen.findByText("床前");
        const last = screen.getByText("光");
        fireEvent.click(first);
        fireEvent.click(last, { shiftKey: true });

        fireEvent.change(screen.getByLabelText("New gloss commentary"), {
            target: { value: "opening line" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Add gloss" }));

        const focused = screen.getByText("opening line").closest(".gloss-card");
        expect(focused).toHaveClass("is-span-focus");
        expect(
            focused!.querySelector("button.field-edit-btn")
        ).toBeInTheDocument();
        expect(screen.getByText("Gloss span (aligned study)")).toBeInTheDocument();
        expect(first).toHaveClass("tok-in-span");
        expect(last).toHaveClass("tok-in-span");
    });

    it("edits an existing gloss in memory", async () => {
        read.mockResolvedValue(okuPassage);
        render(<App />);

        fireEvent.click(await screen.findByRole("button", { name: "百代" }));
        fireEvent.click(screen.getByText("mid gloss"));

        const focused = screen.getByText("mid gloss").closest(".gloss-card")!;
        fireEvent.click(focused.querySelector("button.field-edit-btn")!);
        const editor = screen.getByLabelText("Edit gloss commentary");
        fireEvent.change(editor, { target: { value: "revised mid gloss" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        // Save exits edit mode but keeps focus
        expect(
            screen.queryByLabelText("Edit gloss commentary")
        ).not.toBeInTheDocument();
        expect(screen.getByText("revised mid gloss")).toBeInTheDocument();
        expect(
            screen.getByText("revised mid gloss").closest(".gloss-card")
        ).toHaveClass("is-span-focus");
    });

    it("edits word transliteration and literal in memory", async () => {
        read.mockResolvedValue(okuPassage);
        render(<App />);

        fireEvent.click(await screen.findByRole("button", { name: "月日" }));

        const wordPanel = screen.getByLabelText("Word");
        const editBtns = Array.from(
            wordPanel.querySelectorAll("button.field-edit-btn")
        );
        expect(editBtns).toHaveLength(2);

        fireEvent.click(editBtns[0]);
        fireEvent.change(screen.getByLabelText("Edit transliteration"), {
            target: { value: "tsuki-hi" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(wordPanel).toHaveTextContent("tsuki-hi");

        fireEvent.click(
            wordPanel.querySelectorAll("button.field-edit-btn")[1]
        );
        fireEvent.change(screen.getByLabelText("Edit literal"), {
            target: { value: "days and months" },
        });
        fireEvent.keyDown(screen.getByLabelText("Edit literal"), {
            key: "Enter",
            metaKey: true,
        });
        expect(wordPanel).toHaveTextContent("days and months");
    });
});
