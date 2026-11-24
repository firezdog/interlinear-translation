import React from "react";
import { render, screen } from "@testing-library/react";
import { WordPanel } from "@/components/WordPanel";
import { Token } from "@/passage/types";

const token: Token = {
    offset: 0,
    content: "月日",
    charStart: 0,
    charEnd: 2,
    transliteration: "tsukihi",
    translation: "moon / sun",
};

describe("WordPanel", () => {
    it("renders three lexical rows for a token", () => {
        render(<WordPanel token={token} />);
        expect(screen.getByText("Original")).toBeInTheDocument();
        expect(screen.getByText("Transliteration")).toBeInTheDocument();
        expect(screen.getByText("Literal")).toBeInTheDocument();
        expect(screen.getByText("月日")).toBeInTheDocument();
        expect(screen.getByText("tsukihi")).toBeInTheDocument();
        expect(screen.getByText("moon / sun")).toBeInTheDocument();
    });

    it("reserves placeholders when empty", () => {
        render(<WordPanel token={null} />);
        expect(screen.getAllByText("—")).toHaveLength(3);
    });
});
