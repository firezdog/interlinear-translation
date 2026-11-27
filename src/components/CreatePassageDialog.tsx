import React, { useEffect, useId, useRef, useState } from "react";
import {
    getPassageCreateClient,
    passageCreateClients,
} from "@/clients/passageCreate";
import type {
    PassageCreateClientId,
    TokenizeMode,
} from "@/clients/types";
import { FileClient } from "@/clients/file";

const PASSAGE_KEY_RE = /^[a-z0-9-]+$/;
const DEFAULT_CREATE_CLIENT: PassageCreateClientId = "ai";

export type CreatePassageResult = {
    key: string;
    title: string;
};

function CreatePassageDialog({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (result: CreatePassageResult) => void;
}) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [title, setTitle] = useState("");
    const [key, setKey] = useState("");
    const [createClientId, setCreateClientId] =
        useState<PassageCreateClientId>(DEFAULT_CREATE_CLIENT);
    const [mode, setMode] = useState<TokenizeMode>("whitespace");
    const [text, setText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [elapsedSec, setElapsedSec] = useState(0);

    const createClient = getPassageCreateClient(createClientId);

    useEffect(() => {
        const el = dialogRef.current;
        if (!el) return;
        if (open) {
            if (!el.open) el.showModal();
        } else if (el.open) {
            el.close();
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setTitle("");
        setKey("");
        setCreateClientId(DEFAULT_CREATE_CLIENT);
        setMode("whitespace");
        setText("");
        setError(null);
        setSubmitting(false);
        setElapsedSec(0);
    }, [open]);

    useEffect(() => {
        if (!submitting) {
            setElapsedSec(0);
            return;
        }
        setElapsedSec(0);
        const id = window.setInterval(() => {
            setElapsedSec((s) => s + 1);
        }, 1000);
        return () => window.clearInterval(id);
    }, [submitting]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const trimmedTitle = title.trim();
        const trimmedKey = key.trim();
        if (!trimmedTitle) {
            setError("Title is required");
            return;
        }
        if (!PASSAGE_KEY_RE.test(trimmedKey)) {
            setError("Key must match [a-z0-9-]+");
            return;
        }
        if (!text.trim()) {
            setError("Passage text is required");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const passage = await createClient.create({
                text,
                title: trimmedTitle,
                mode,
            });
            await FileClient.getClient().write(trimmedKey, 1, passage);
            onCreated({ key: trimmedKey, title: trimmedTitle });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className="create-passage-dialog"
            aria-labelledby={titleId}
            onCancel={(e) => {
                e.preventDefault();
                if (!submitting) onClose();
            }}
            onClose={() => {
                if (open) onClose();
            }}
        >
            <form className="create-passage-form" onSubmit={onSubmit}>
                <h2 id={titleId} className="create-passage-heading">
                    New passage
                </h2>

                <label className="create-passage-field">
                    <span>Title</span>
                    <input
                        className="gloss-compose-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={submitting}
                        autoFocus
                    />
                </label>

                <label className="create-passage-field">
                    <span>Key</span>
                    <input
                        className="gloss-compose-input"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        disabled={submitting}
                        placeholder="my-passage"
                        spellCheck={false}
                        autoComplete="off"
                    />
                </label>

                <fieldset className="create-passage-field create-passage-mode">
                    <legend>Create with</legend>
                    {passageCreateClients.map((client) => (
                        <label
                            key={client.id}
                            className="inline-flex items-center gap-2 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="create-client"
                                checked={createClientId === client.id}
                                onChange={() => setCreateClientId(client.id)}
                                disabled={submitting}
                            />
                            {client.label}
                        </label>
                    ))}
                </fieldset>

                {createClient.id === "local" ? (
                    <fieldset className="create-passage-field create-passage-mode">
                        <legend>Tokenize</legend>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="tokenize-mode"
                                checked={mode === "whitespace"}
                                onChange={() => setMode("whitespace")}
                                disabled={submitting}
                            />
                            Whitespace
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="tokenize-mode"
                                checked={mode === "cjv"}
                                onChange={() => setMode("cjv")}
                                disabled={submitting}
                            />
                            CJV
                        </label>
                    </fieldset>
                ) : null}

                <label className="create-passage-field">
                    <span>Text</span>
                    <textarea
                        className="gloss-compose-input create-passage-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={submitting}
                        rows={10}
                    />
                </label>

                {error ? (
                    <p className="create-passage-error" role="alert">
                        {error}
                    </p>
                ) : null}

                {submitting && createClient.id === "ai" ? (
                    <p className="create-passage-status" role="status">
                        Waiting on Gemini (tokenize + gloss). This can take
                        15–60s
                        {elapsedSec > 0 ? ` · ${elapsedSec}s` : "…"}
                    </p>
                ) : null}

                <div className="create-passage-actions">
                    <button
                        type="button"
                        className="gloss-compose-submit"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="gloss-compose-submit"
                        disabled={submitting}
                    >
                        {submitting ? createClient.submittingLabel : "Create"}
                    </button>
                </div>
            </form>
        </dialog>
    );
}

export { CreatePassageDialog };
