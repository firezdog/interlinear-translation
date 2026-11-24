import Ajv2020 from "ajv/dist/2020";
import { Passage, Segment, Token } from "@/passage/types";
import passageSchema from "@/passage/interlinear.schema.json";

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile<Passage>(passageSchema);

function segmentForToken(segments: Segment[], offset: number): Segment | undefined {
    return segments.find((s) => offset >= s.start && offset <= s.end);
}

function assertPassage(data: unknown): Passage {
    if (!validate(data)) {
        throw new Error(ajv.errorsText(validate.errors, { separator: "; " }));
    }

    for (let i = 0; i < data.glosses.length; i++) {
        const gloss = data.glosses[i];
        if (gloss.end < gloss.start) {
            throw new Error(`glosses/${i}/end must be >= start`);
        }
    }

    for (let i = 0; i < data.segments.length; i++) {
        const seg = data.segments[i];
        if (seg.end < seg.start) {
            throw new Error(`segments/${i}/end must be >= start`);
        }
    }

    if (data.segments.length === 0 && data.tokens.length > 0) {
        throw new Error("segments must cover tokens");
    }

    // Non-overlapping partition of tokens in document order
    let expected = data.offset;
    for (let i = 0; i < data.segments.length; i++) {
        const seg = data.segments[i];
        if (seg.start !== expected) {
            throw new Error(
                `segments/${i}/start must be ${expected} (contiguous partition)`
            );
        }
        expected = seg.end + 1;
    }
    if (data.tokens.length > 0) {
        const lastOffset = data.offset + data.length - 1;
        if (expected !== lastOffset + 1) {
            throw new Error("segments must partition the passage token range");
        }
    }

    const byOffset = new Map<number, Token>();
    for (const t of data.tokens) {
        if (byOffset.has(t.offset)) {
            throw new Error(`duplicate token offset ${t.offset}`);
        }
        byOffset.set(t.offset, t);
    }

    for (const t of data.tokens) {
        if (t.charEnd < t.charStart) {
            throw new Error(`token ${t.offset}: charEnd must be >= charStart`);
        }
        const seg = segmentForToken(data.segments, t.offset);
        if (!seg) {
            throw new Error(`token ${t.offset} is not covered by any segment`);
        }
        const slice = seg.text.slice(t.charStart, t.charEnd);
        if (slice !== t.content) {
            throw new Error(
                `token ${t.offset}: content must equal segment.text.slice(charStart, charEnd)`
            );
        }
    }

    // Within each segment, char ranges non-overlapping and ordered
    for (let si = 0; si < data.segments.length; si++) {
        const seg = data.segments[si];
        let prevEnd = 0;
        for (let offset = seg.start; offset <= seg.end; offset++) {
            const t = byOffset.get(offset);
            if (!t) {
                throw new Error(`segments/${si}: missing token ${offset}`);
            }
            if (t.charStart < prevEnd) {
                throw new Error(
                    `token ${offset}: char range overlaps previous token in segment`
                );
            }
            prevEnd = t.charEnd;
        }
    }

    return data;
}

export { assertPassage };
