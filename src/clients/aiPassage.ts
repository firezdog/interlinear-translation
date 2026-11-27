import { Passage } from "@/passage/types";
import { assertPassage } from "@/passage/validatePassage";
import type { PassageCreateClient } from "@/clients/types";

/** Thrown when the AI create endpoint is unavailable (e.g. no GEMINI_API_KEY). */
class AiPassageUnavailableError extends Error {
    readonly status = 503;

    constructor(message: string) {
        super(message);
        this.name = "AiPassageUnavailableError";
    }
}

async function createPassageWithAi({
    text,
    title,
}: {
    text: string;
    title?: string;
}): Promise<Passage> {
    let response: Response;
    try {
        response = await fetch("/api/ai/passage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, title }),
        });
    } catch {
        throw new Error(
            "Could not reach the AI passage service. Is the dev server running?"
        );
    }

    if (response.status === 503) {
        const detail = (await response.text()).trim();
        throw new AiPassageUnavailableError(
            detail ||
                "AI passage create is unavailable (GEMINI_API_KEY not set)."
        );
    }

    if (!response.ok) {
        const detail = (await response.text()).trim();
        throw new Error(
            detail || `AI passage create failed (HTTP ${response.status})`
        );
    }

    const data: unknown = await response.json();
    return assertPassage(data);
}

const aiPassageCreateClient: PassageCreateClient = {
    id: "ai",
    label: "AI (Gemini)",
    submittingLabel: "Generating…",
    create({ text, title }) {
        return createPassageWithAi({ text, title });
    },
};

export {
    aiPassageCreateClient,
    createPassageWithAi,
    AiPassageUnavailableError,
};
