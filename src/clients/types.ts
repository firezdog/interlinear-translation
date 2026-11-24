import { Passage } from "@/passage/types";

export interface InterlinearClient {
    read(passageKey: string, page: number): Promise<Passage>;
}