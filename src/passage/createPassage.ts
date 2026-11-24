import { Passage, Segment, Token } from "@/passage/types";
import { assertPassage } from "@/passage/validatePassage";

export type TokenizeMode = "whitespace" | "cjv";

type CharSpan = {
    content: string;
    charStart: number;
    charEnd: number;
};

/** Non-whitespace runs — same idea as Python `str.split()`, with offsets kept. */
const WHITESPACE_TOKEN_RE = /\S+/g;

const CJV_CHAR_RE =
    /^(?:\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul})$/u;

function tokenizeWhitespace(text: string): CharSpan[] {
    const spans: CharSpan[] = [];
    WHITESPACE_TOKEN_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = WHITESPACE_TOKEN_RE.exec(text)) !== null) {
        const content = match[0];
        spans.push({
            content,
            charStart: match.index,
            charEnd: match.index + content.length,
        });
    }
    return spans;
}

function tokenizeCJV(text: string): CharSpan[] {
    const spans: CharSpan[] = [];
    let i = 0;
    while (i < text.length) {
        const code = text.codePointAt(i)!;
        const content = String.fromCodePoint(code);
        const len = content.length;
        if (CJV_CHAR_RE.test(content)) {
            spans.push({ content, charStart: i, charEnd: i + len });
        }
        i += len;
    }
    return spans;
}

function tokenizeLine(text: string, mode: TokenizeMode): CharSpan[] {
    return mode === "cjv" ? tokenizeCJV(text) : tokenizeWhitespace(text);
}

/** Build a validated Passage from raw text. One segment per non-empty line. */
function createPassage(text: string, mode: TokenizeMode): Passage {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
        throw new Error("passage text is empty");
    }

    const segments: Segment[] = [];
    const tokens: Token[] = [];
    let nextOffset = 0;

    for (const line of lines) {
        const spans = tokenizeLine(line, mode);
        if (spans.length === 0) continue;

        const start = nextOffset;
        const end = nextOffset + spans.length - 1;
        segments.push({ text: line, start, end });

        for (const span of spans) {
            tokens.push({
                offset: nextOffset,
                content: span.content,
                charStart: span.charStart,
                charEnd: span.charEnd,
                transliteration: "",
                translation: "",
            });
            nextOffset += 1;
        }
    }

    if (tokens.length === 0) {
        throw new Error("passage text produced no tokens");
    }

    return assertPassage({
        offset: 0,
        length: tokens.length,
        segments,
        tokens,
        glosses: [],
    });
}

export { createPassage };
