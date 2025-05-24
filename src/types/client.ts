import { Passage } from "@/types/passage";

export interface InterlinearClient {
    read(passageKey: string, page: number): Promise<Passage>;
}