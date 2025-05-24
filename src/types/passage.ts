export interface Token {
    offset: number;
    content: string;
    transliteration: string;
    translation: string;
}

export interface Gloss {
    start: number;
    end: number;
    content: string;
}

export interface Passage {
    offset: number;
    length: number;
    tokens: Token[];
    glosses: Gloss[];
}