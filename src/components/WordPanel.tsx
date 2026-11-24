import React, { useEffect, useState } from "react";
import { Token } from "@/passage/types";

type EditableField = "transliteration" | "translation";

function WordPanel({
    token,
    onUpdateToken,
}: {
    token: Token | null;
    onUpdateToken?: (
        offset: number,
        patch: { transliteration?: string; translation?: string }
    ) => void;
}) {
    const [editingField, setEditingField] = useState<EditableField | null>(null);
    const [draft, setDraft] = useState("");

    useEffect(() => {
        setEditingField(null);
        setDraft("");
    }, [token?.offset]);

    const startEdit = (field: EditableField, value: string) => {
        setEditingField(field);
        setDraft(value);
    };

    const saveEdit = () => {
        if (!token || !editingField || !onUpdateToken) return;
        onUpdateToken(token.offset, { [editingField]: draft });
        setEditingField(null);
        setDraft("");
    };

    const cancelEdit = () => {
        setEditingField(null);
        setDraft("");
    };

    const renderEditable = (field: EditableField, label: string, value: string) => {
        const isEditing = editingField === field;
        if (isEditing) {
            return (
                <div className="row" key={label}>
                    <span className="lab">{label}</span>
                    <div className="val-edit">
                        <textarea
                            className="gloss-compose-input"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    (e.metaKey || e.ctrlKey)
                                ) {
                                    e.preventDefault();
                                    saveEdit();
                                } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelEdit();
                                }
                            }}
                            rows={2}
                            aria-label={`Edit ${label.toLowerCase()}`}
                        />
                        <div className="gloss-card-actions">
                            <button
                                type="button"
                                className="gloss-compose-submit"
                                onClick={saveEdit}
                            >
                                Save
                            </button>
                            <span className="gloss-hint">⌘/Ctrl+Enter to save</span>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="row" key={label}>
                <span className="lab">{label}</span>
                <span className="val">
                    <span>{value || "—"}</span>
                    {token && onUpdateToken ? (
                        <button
                            type="button"
                            className="field-edit-btn"
                            onClick={() => startEdit(field, value)}
                        >
                            Edit
                        </button>
                    ) : null}
                </span>
            </div>
        );
    };

    return (
        <section className="study-panel study-panel-word" aria-label="Word">
            <h2>Word</h2>
            <div className="panel-body">
                <div className="word-rows">
                    <div className="row">
                        <span className="lab">Original</span>
                        <span className="val">{token?.content || "—"}</span>
                    </div>
                    {renderEditable(
                        "transliteration",
                        "Transliteration",
                        token?.transliteration ?? ""
                    )}
                    {renderEditable(
                        "translation",
                        "Literal",
                        token?.translation ?? ""
                    )}
                </div>
            </div>
        </section>
    );
}

export { WordPanel };
