import { Passage } from "@/passage/types"
import { InterlinearClient } from "@/clients/types"
import { assertPassage } from "@/passage/validatePassage"
import { publicAssetUrl } from "@/clients/basePath"


class FileClient implements InterlinearClient {
    private static _instance: FileClient | null = null;

    public static getClient(): FileClient {
        if (!this._instance) {
            FileClient._instance = new FileClient();
        }

        return FileClient._instance!;
    }

    async read(passageKey: string, page: number): Promise<Passage> {
        const path = publicAssetUrl(`passages/${passageKey}/${page}.json`);
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error('failed to load passage');
        }

        const data = await response.json();
        return assertPassage(data);
    }

    async write(passageKey: string, page: number, passage: Passage): Promise<void> {
        const validated = assertPassage(passage);
        const params = new URLSearchParams({
            key: passageKey,
            page: String(page),
        });
        const response = await fetch(`/api/passage?${params}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(validated),
        });

        if (!response.ok) {
            throw new Error("error while saving passage");
        }
    }
}

export { FileClient };
