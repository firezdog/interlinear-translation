import { Passage } from "@/types/passage"
import { InterlinearClient } from "@/types/client"


class FileClient implements InterlinearClient {
    private static _instance: FileClient | null = null;

    public static getClient(): FileClient {
        if (!this._instance) {
            FileClient._instance = new FileClient();
        }

        return FileClient._instance!;
    }

    async read(passageKey: string, page: number): Promise<Passage> {
        const path = `/passages/${passageKey}/${page}.json`;
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error('failed to load passage');
        }

        const data = await response.json();
        return data as Passage; // TODO: validation
    }
}

export { FileClient };