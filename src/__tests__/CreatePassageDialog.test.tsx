import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { CreatePassageDialog } from "@/components/CreatePassageDialog";
import { FileClient } from "@/clients/file";
import * as aiPassage from "@/clients/aiPassage";
import { AiPassageUnavailableError } from "@/clients/aiPassage";

const validPassage = {
    offset: 0,
    length: 1,
    segments: [{ text: "hello", start: 0, end: 0 }],
    tokens: [
        {
            offset: 0,
            content: "hello",
            charStart: 0,
            charEnd: 5,
            transliteration: "",
            translation: "",
        },
    ],
    glosses: [],
};

function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText(/^Title$/i), {
        target: { value: "My Passage" },
    });
    fireEvent.change(screen.getByLabelText(/^Key$/i), {
        target: { value: "my-passage" },
    });
    fireEvent.change(screen.getByLabelText(/^Text$/i), {
        target: { value: "hello world" },
    });
}

describe("CreatePassageDialog", () => {
    const write = jest.fn();
    const onClose = jest.fn();
    const onCreated = jest.fn();

    beforeEach(() => {
        write.mockReset();
        write.mockResolvedValue(undefined);
        onClose.mockReset();
        onCreated.mockReset();
        jest.spyOn(FileClient, "getClient").mockReturnValue({
            read: jest.fn(),
            write,
        } as unknown as FileClient);

        // jsdom lacks HTMLDialogElement showModal/close
        HTMLDialogElement.prototype.showModal = jest.fn(function (
            this: HTMLDialogElement
        ) {
            this.setAttribute("open", "");
        });
        HTMLDialogElement.prototype.close = jest.fn(function (
            this: HTMLDialogElement
        ) {
            this.removeAttribute("open");
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("AI path: creates via AI client then writes and closes", async () => {
        const createSpy = jest
            .spyOn(aiPassage.aiPassageCreateClient, "create")
            .mockResolvedValue(validPassage);

        render(
            <CreatePassageDialog
                open
                onClose={onClose}
                onCreated={onCreated}
            />
        );

        fillRequiredFields();
        fireEvent.click(screen.getByRole("button", { name: /^Create$/i }));

        await waitFor(() => {
            expect(createSpy).toHaveBeenCalledWith({
                text: "hello world",
                title: "My Passage",
                mode: "whitespace",
            });
        });
        expect(write).toHaveBeenCalledWith("my-passage", 1, validPassage);
        expect(onCreated).toHaveBeenCalledWith({
            key: "my-passage",
            title: "My Passage",
        });
        expect(onClose).toHaveBeenCalled();
    });

    it("AI path: surfaces 503 without writing", async () => {
        jest.spyOn(aiPassage.aiPassageCreateClient, "create").mockRejectedValue(
            new AiPassageUnavailableError("GEMINI_API_KEY is not set")
        );

        render(
            <CreatePassageDialog
                open
                onClose={onClose}
                onCreated={onCreated}
            />
        );

        fillRequiredFields();
        fireEvent.click(screen.getByRole("button", { name: /^Create$/i }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            /GEMINI_API_KEY/
        );
        expect(write).not.toHaveBeenCalled();
        expect(onCreated).not.toHaveBeenCalled();
    });

    it("local path: tokenizes and writes without calling AI", async () => {
        const aiSpy = jest.spyOn(aiPassage.aiPassageCreateClient, "create");

        render(
            <CreatePassageDialog
                open
                onClose={onClose}
                onCreated={onCreated}
            />
        );

        fireEvent.click(screen.getByLabelText(/Local tokenize/i));
        fillRequiredFields();
        fireEvent.click(screen.getByRole("button", { name: /^Create$/i }));

        await waitFor(() => {
            expect(write).toHaveBeenCalled();
        });
        expect(aiSpy).not.toHaveBeenCalled();
        const [, , passage] = write.mock.calls[0];
        expect(passage.tokens.map((t: { content: string }) => t.content)).toEqual([
            "hello",
            "world",
        ]);
        expect(onCreated).toHaveBeenCalledWith({
            key: "my-passage",
            title: "My Passage",
        });
    });
});
