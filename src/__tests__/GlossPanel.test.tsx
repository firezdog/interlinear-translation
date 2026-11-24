import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlossPanel } from "@/components/GlossPanel";
import { Gloss, Passage } from "@/passage/types";

const passage: Passage = {
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
    glosses: [],
};

const glosses: Gloss[] = [
    { id: "full", start: 0, end: 2, content: "full-line gloss" },
    { id: "mid", start: 2, end: 2, content: "mid gloss" },
];

describe("GlossPanel", () => {
    it("lists glosses tightest-first and highlights span on click", () => {
        const onSelectGloss = jest.fn();
        render(
            <GlossPanel
                passage={passage}
                glosses={glosses}
                selectedToken={2}
                selectionRange={{ start: 2, end: 2 }}
                focusedGloss={null}
                onSelectGloss={onSelectGloss}
                onAddGloss={() => {}}
                onUpdateGloss={() => {}}
            />
        );

        const cards = screen.getAllByRole("button").filter((b) =>
            b.classList.contains("gloss-card")
        );
        expect(cards[0]).toHaveTextContent("mid gloss");
        expect(cards[1]).toHaveTextContent("full-line gloss");
        expect(cards[1]).toHaveTextContent("月日は百代");

        fireEvent.click(cards[0]);
        expect(onSelectGloss).toHaveBeenCalledWith(glosses[1]);
    });

    it("marks the focused gloss card and scrolls it into view", () => {
        const scrollIntoView = jest.fn();
        Element.prototype.scrollIntoView = scrollIntoView;

        const { rerender } = render(
            <GlossPanel
                passage={passage}
                glosses={glosses}
                selectedToken={2}
                selectionRange={{ start: 2, end: 2 }}
                focusedGloss={null}
                onSelectGloss={() => {}}
                onAddGloss={() => {}}
                onUpdateGloss={() => {}}
            />
        );
        rerender(
            <GlossPanel
                passage={passage}
                glosses={glosses}
                selectedToken={2}
                selectionRange={{ start: 2, end: 2 }}
                focusedGloss={glosses[1]}
                onSelectGloss={() => {}}
                onAddGloss={() => {}}
                onUpdateGloss={() => {}}
            />
        );
        expect(
            screen.getByLabelText("Edit gloss commentary").closest(".gloss-card")
        ).toHaveClass("is-span-focus");
        expect(scrollIntoView).toHaveBeenCalled();
    });

    it("shows compose form for a selection range and submits gloss text", () => {
        const onAddGloss = jest.fn();
        render(
            <GlossPanel
                passage={passage}
                glosses={[]}
                selectedToken={0}
                selectionRange={{ start: 0, end: 2 }}
                focusedGloss={null}
                onSelectGloss={() => {}}
                onAddGloss={onAddGloss}
                onUpdateGloss={() => {}}
            />
        );

        expect(screen.getByText(/Span: 月日は百代/)).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("New gloss commentary"), {
            target: { value: "  a new note  " },
        });
        fireEvent.click(screen.getByRole("button", { name: "Add gloss" }));
        expect(onAddGloss).toHaveBeenCalledWith("  a new note  ");
    });

    it("submits the draft with Cmd/Ctrl+Enter", () => {
        const onAddGloss = jest.fn();
        render(
            <GlossPanel
                passage={passage}
                glosses={[]}
                selectedToken={0}
                selectionRange={{ start: 0, end: 1 }}
                focusedGloss={null}
                onSelectGloss={() => {}}
                onAddGloss={onAddGloss}
                onUpdateGloss={() => {}}
            />
        );

        const input = screen.getByLabelText("New gloss commentary");
        fireEvent.change(input, { target: { value: "via keyboard" } });
        fireEvent.keyDown(input, { key: "Enter", metaKey: true });
        expect(onAddGloss).toHaveBeenCalledWith("via keyboard");
    });

    it("edits a focused gloss with Save and Cmd+Enter", () => {
        const onUpdateGloss = jest.fn();
        render(
            <GlossPanel
                passage={passage}
                glosses={glosses}
                selectedToken={2}
                selectionRange={{ start: 2, end: 2 }}
                focusedGloss={glosses[1]}
                onSelectGloss={() => {}}
                onAddGloss={() => {}}
                onUpdateGloss={onUpdateGloss}
            />
        );

        const input = screen.getByLabelText("Edit gloss commentary");
        expect(input).toHaveValue("mid gloss");
        fireEvent.change(input, { target: { value: "updated mid" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(onUpdateGloss).toHaveBeenCalledWith("mid", "updated mid");

        fireEvent.change(input, { target: { value: "via shortcut" } });
        fireEvent.keyDown(input, { key: "Enter", metaKey: true });
        expect(onUpdateGloss).toHaveBeenCalledWith("mid", "via shortcut");
    });

    it("restores original text on Escape", () => {
        render(
            <GlossPanel
                passage={passage}
                glosses={glosses}
                selectedToken={2}
                selectionRange={{ start: 2, end: 2 }}
                focusedGloss={glosses[1]}
                onSelectGloss={() => {}}
                onAddGloss={() => {}}
                onUpdateGloss={() => {}}
            />
        );

        const input = screen.getByLabelText("Edit gloss commentary");
        fireEvent.change(input, { target: { value: "scratch" } });
        expect(input).toHaveValue("scratch");
        fireEvent.keyDown(input, { key: "Escape" });
        expect(input).toHaveValue("mid gloss");
    });
});
