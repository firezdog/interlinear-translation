/** Paragraph block of display text. Tokens overlay char ranges into `text`. */
export interface Segment {
    /** Optional display label only (e.g. "1.1") — not a literary type. */
    label?: string;
    /** Display base text, including spaces and punctuation. */
    text: string;
    /** Inclusive start token index (work-level). */
    start: number;
    /** Inclusive end token index (work-level). */
    end: number;
}

/** Atomic lexical unit. `offset` is a token index in the full work. */
export interface Token {
    /** Token index from the beginning of the full text (not a UTF-16 code unit). */
    offset: number;
    /** Lexical form; must equal containing segment.text.slice(charStart, charEnd). */
    content: string;
    /** Inclusive start into the containing segment's text (JS UTF-16 code units). */
    charStart: number;
    /** Exclusive end into the containing segment's text (JS UTF-16 code units). */
    charEnd: number;
    transliteration: string;
    translation: string;
}

/** Commentary covering an inclusive range of token indices. */
export interface Gloss {
    /** Inclusive start token index. */
    start: number;
    /** Inclusive end token index; must be >= start. */
    end: number;
    content: string;
}

/** One page/chunk of a work: ordered segments + token overlays + glosses. */
export interface Passage {
    /** Token index where this passage begins in the full text. */
    offset: number;
    /** Length of the passage in tokens. */
    length: number;
    segments: Segment[];
    tokens: Token[];
    glosses: Gloss[];
}
