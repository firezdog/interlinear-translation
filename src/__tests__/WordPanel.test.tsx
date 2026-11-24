import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

    it("edits transliteration with Save and Escape", () => {
        const onUpdateToken = jest.fn();
        render(<WordPanel token={token} onUpdateToken={onUpdateToken} />);

        const editBtns = screen.getAllByRole("button", { name: "Edit" });
        expect(editBtns).toHaveLength(2);
        fireEvent.click(editBtns[0]);

        const input = screen.getByLabelText("Edit transliteration");
        expect(input).toHaveValue("tsukihi");
        fireEvent.change(input, { target: { value: "tsuki-hi" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(onUpdateToken).toHaveBeenCalledWith(0, {
            transliteration: "tsuki-hi",
        });

        fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
        const again = screen.getByLabelText("Edit transliteration");
        fireEvent.change(again, { target: { value: "scratch" } });
        fireEvent.keyDown(again, { key: "Escape" });
        expect(onUpdateToken).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByLabelText("Edit transliteration")
        ).not.toBeInTheDocument();
    });

    it("edits literal with Cmd+Enter", () => {
        const onUpdateToken = jest.fn();
        render(<WordPanel token={token} onUpdateToken={onUpdateToken} />);

        fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);
        const input = screen.getByLabelText("Edit literal");
        fireEvent.change(input, { target: { value: "days and months" } });
        fireEvent.keyDown(input, { key: "Enter", metaKey: true });
        expect(onUpdateToken).toHaveBeenCalledWith(0, {
            translation: "days and months",
        });
    });
});
