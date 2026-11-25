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

    function mockPanelAndCardRects(
        panelTop: number,
        panelBottom: number,
        cardTop: number,
        cardBottom: number
    ) {
        const rect = (top: number, bottom: number) =>
            ({
                top,
                bottom,
                left: 0,
                right: 0,
                width: 0,
                height: bottom - top,
                x: 0,
                y: top,
                toJSON() {
                    return {};
                },
            }) as DOMRect;

        return jest
            .spyOn(HTMLElement.prototype, "getBoundingClientRect")
            .mockImplementation(function (this: HTMLElement) {
                if (this.classList.contains("panel-body")) {
                    return rect(panelTop, panelBottom);
                }
                if (this.classList.contains("gloss-card")) {
                    return rect(cardTop, cardBottom);
                }
                return rect(0, 0);
            });
    }

    it("marks the focused gloss card as read view with Edit, and scrolls into view", () => {
        const rectSpy = mockPanelAndCardRects(0, 100, 200, 260);

        const { rerender, container } = render(
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

        const panel = container.querySelector(".panel-body") as HTMLElement;
        panel.scrollTop = 0;

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
        const focused = screen.getByText("mid gloss").closest(".gloss-card");
        expect(focused).toHaveClass("is-span-focus");
        expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
        expect(
            screen.queryByLabelText("Edit gloss commentary")
        ).not.toBeInTheDocument();
        expect(panel.scrollTop).toBe(192);
        rectSpy.mockRestore();
    });

    it("scrolls the gloss list into view when a covered token is selected", () => {
        const rectSpy = mockPanelAndCardRects(0, 100, 180, 240);

        const { rerender, container } = render(
            <GlossPanel
                passage={passage}
                glosses={[]}
                selectedToken={-1}
                selectionRange={null}
                focusedGloss={null}
                onSelectGloss={() => {}}
                onAddGloss={() => {}}
                onUpdateGloss={() => {}}
            />
        );

        const panel = container.querySelector(".panel-body") as HTMLElement;
        panel.scrollTop = 0;

        rerender(
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

        expect(panel.scrollTop).toBe(172);
        rectSpy.mockRestore();
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

    it("enters edit mode then saves with Save and Cmd+Enter", () => {
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

        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        const input = screen.getByLabelText("Edit gloss commentary");
        expect(input).toHaveValue("mid gloss");
        fireEvent.change(input, { target: { value: "updated mid" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(onUpdateGloss).toHaveBeenCalledWith("mid", "updated mid");

        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        const again = screen.getByLabelText("Edit gloss commentary");
        fireEvent.change(again, { target: { value: "via shortcut" } });
        fireEvent.keyDown(again, { key: "Enter", metaKey: true });
        expect(onUpdateGloss).toHaveBeenCalledWith("mid", "via shortcut");
    });

    it("exits edit mode on Escape without saving", () => {
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

        fireEvent.click(screen.getByRole("button", { name: "Edit" }));
        const input = screen.getByLabelText("Edit gloss commentary");
        fireEvent.change(input, { target: { value: "scratch" } });
        fireEvent.keyDown(input, { key: "Escape" });
        expect(onUpdateGloss).not.toHaveBeenCalled();
        expect(
            screen.queryByLabelText("Edit gloss commentary")
        ).not.toBeInTheDocument();
        expect(screen.getByText("mid gloss")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    });
});
