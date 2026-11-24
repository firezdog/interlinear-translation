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

    it("marks the focused gloss card", () => {
        render(
            <GlossPanel
                passage={passage}
                glosses={glosses}
                selectedToken={2}
                selectionRange={{ start: 2, end: 2 }}
                focusedGloss={glosses[1]}
                onSelectGloss={() => {}}
                onAddGloss={() => {}}
            />
        );
        expect(screen.getByText("mid gloss").closest("button")).toHaveClass(
            "is-span-focus"
        );
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
            />
        );

        expect(screen.getByText(/Span: 月日は百代/)).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText("New gloss commentary"), {
            target: { value: "  a new note  " },
        });
        fireEvent.click(screen.getByRole("button", { name: "Add gloss" }));
        expect(onAddGloss).toHaveBeenCalledWith("  a new note  ");
    });
});
