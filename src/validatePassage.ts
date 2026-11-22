import Ajv2020 from "ajv/dist/2020";
import { Passage } from "@/types/passage";
import passageSchema from "@/schemas/interlinear.schema.json";

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile<Passage>(passageSchema);

function assertPassage(data: unknown): Passage {
    if (!validate(data)) {
        throw new Error(ajv.errorsText(validate.errors, { separator: "; " }));
    }

    for (let i = 0; i < data.glosses.length; i++) {
        const gloss = data.glosses[i];
        if (gloss.end < gloss.start) {
            throw new Error(`glosses/${i}/end must be >= start`);
        }
    }

    return data;
}

export { assertPassage };
