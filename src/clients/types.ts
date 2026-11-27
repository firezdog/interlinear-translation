import { Passage } from "@/passage/types";

export interface InterlinearClient {
    read(passageKey: string, page: number): Promise<Passage>;
    write(passageKey: string, page: number, passage: Passage): Promise<void>;
}

export type PassageCreateClientId = "ai" | "local";

export type TokenizeMode = "whitespace" | "cjv";

export type PassageCreateInput = {
    text: string;
    title?: string;
    /** Required by the local client; ignored by AI. */
    mode?: TokenizeMode;
};

export interface PassageCreateClient {
    readonly id: PassageCreateClientId;
    readonly label: string;
    readonly submittingLabel: string;
    create(input: PassageCreateInput): Promise<Passage>;
}
