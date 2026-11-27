import { aiPassageCreateClient } from "@/clients/aiPassage";
import { localPassageCreateClient } from "@/clients/localPassageCreate";
import type {
    PassageCreateClient,
    PassageCreateClientId,
} from "@/clients/types";

/** AI first (default), then local — dialog radios map from this list. */
const passageCreateClients: readonly PassageCreateClient[] = [
    aiPassageCreateClient,
    localPassageCreateClient,
];

function getPassageCreateClient(
    id: PassageCreateClientId
): PassageCreateClient {
    const client = passageCreateClients.find((c) => c.id === id);
    if (!client) {
        throw new Error(`unknown passage create client: ${id}`);
    }
    return client;
}

export { passageCreateClients, getPassageCreateClient };
