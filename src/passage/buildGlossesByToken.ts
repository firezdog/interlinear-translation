import { Gloss, Token } from "@/passage/types";

/** Sweep tokens left-to-right, activating/deactivating glosses via start/end pointers. */
function buildGlossesByToken(tokens: Token[], glosses: Gloss[]): Map<number, Gloss[]> {
    const byStart = [...glosses].sort((a, b) => a.start - b.start);
    const byEnd = [...glosses].sort((a, b) => a.end - b.end);
    let startPtr = 0;
    let endPtr = 0;
    const active = new Set<Gloss>();
    const glossesByToken = new Map<number, Gloss[]>();

    for (const token of tokens) {
        while (endPtr < byEnd.length && byEnd[endPtr].end < token.offset) {
            active.delete(byEnd[endPtr]);
            endPtr++;
        }
        while (startPtr < byStart.length && byStart[startPtr].start <= token.offset) {
            active.add(byStart[startPtr]);
            startPtr++;
        }
        glossesByToken.set(token.offset, [...active]);
    }

    return glossesByToken;
}

export { buildGlossesByToken };
