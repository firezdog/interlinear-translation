/** Work-level token identity (not a character offset). */
export type TokenId = number;
/** UTF-16 index into a content string (e.g. Segment.text). */
export type CharPos = number;

/** Paragraph block of display text. Tokens overlay char ranges into `text`. */
export interface Segment {
    /** Optional display label only (e.g. "1.1") — not a literary type. */
    label?: string;
    /** Display base text, including spaces and punctuation. */
    text: string;
    /** Inclusive start token id (work-level). */
    start: TokenId;
    /** Inclusive end token id (work-level). */
    end: TokenId;
}

/** Atomic lexical unit. `offset` is a TokenId in the full work. */
export interface Token {
    /** Token id from the beginning of the full text (not a UTF-16 code unit). */
    offset: TokenId;
    /** Lexical form; must equal containing segment.text.slice(charStart, charEnd). */
    content: string;
    /** Inclusive start into the containing segment's text (JS UTF-16 code units). */
    charStart: CharPos;
    /** Exclusive end into the containing segment's text (JS UTF-16 code units). */
    charEnd: CharPos;
    transliteration: string;
    translation: string;
}

/** Commentary covering an inclusive range of token ids. */
export interface Gloss {
    /** Stable identity within the work (authoring / selection key). */
    id: string;
    /** Inclusive start token id. */
    start: TokenId;
    /** Inclusive end token id; must be >= start. */
    end: TokenId;
    content: string;
}

/** One page/chunk of a work: ordered segments + token overlays + glosses. */
export interface Passage {
    /** Token id where this passage begins in the full text. */
    offset: TokenId;
    /** Length of the passage in tokens. */
    length: number;
    segments: Segment[];
    tokens: Token[];
    glosses: Gloss[];
}
