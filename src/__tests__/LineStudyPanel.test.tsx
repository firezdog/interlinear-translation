import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LineStudyPanel } from "@/components/LineStudyPanel";
import { Token } from "@/passage/types";

const tokens: Token[] = [
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
];

describe("LineStudyPanel", () => {
    it("renders aligned stacks for a token range", () => {
        render(
            <LineStudyPanel
                tokens={tokens}
                selectedToken={0}
                highlightRange={{ start: 0, end: 0 }}
                glossFocused={false}
                onSelectToken={() => {}}
            />
        );
        expect(screen.getByText("Paragraph in focus")).toBeInTheDocument();
        expect(screen.getByText("月日")).toBeInTheDocument();
        expect(screen.getByText("tsukihi")).toBeInTheDocument();
        expect(screen.getByText("moon / sun")).toBeInTheDocument();
    });

    it("fires onSelectToken from a study unit", () => {
        const onSelectToken = jest.fn();
        render(
            <LineStudyPanel
                tokens={tokens}
                selectedToken={-1}
                highlightRange={null}
                glossFocused={false}
                onSelectToken={onSelectToken}
            />
        );
        fireEvent.click(screen.getByText("は"));
        expect(onSelectToken).toHaveBeenCalledWith(1, { shiftKey: false });
    });

    it("shows gloss-span caption when a gloss is focused", () => {
        render(
            <LineStudyPanel
                tokens={tokens}
                selectedToken={0}
                highlightRange={{ start: 0, end: 1 }}
                glossFocused={true}
                onSelectToken={() => {}}
            />
        );
        expect(screen.getByText("Gloss span (aligned study)")).toBeInTheDocument();
    });
});
