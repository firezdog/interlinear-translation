import { Passage } from "@/passage/types";

export interface InterlinearClient {
    read(passageKey: string, page: number): Promise<Passage>;
    write(passageKey: string, page: number, passage: Passage): Promise<void>;
}
