import { Gloss } from "@/passage/types";

function sameGloss(a: Gloss | null | undefined, b: Gloss | null | undefined): boolean {
    if (!a || !b) return false;
    return a.start === b.start && a.end === b.end && a.content === b.content;
}

export { sameGloss };
