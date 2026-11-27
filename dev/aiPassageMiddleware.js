/**
 * Dev-only webpack-dev-server middleware: POST /api/ai/passage
 * Calls Gemini with GEMINI_API_KEY and returns a schema-valid Passage JSON.
 * Does not write to disk — the client uses the existing FileClient write path.
 */

const { Ajv2020 } = require("ajv/dist/2020")

const passageSchema = require("../src/passage/interlinear.schema.json")
const fewShotExample = require("../public/passages/jing-ye-si/1.json")

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent"

const ajv = new Ajv2020({ allErrors: true })
const validateSchema = ajv.compile(passageSchema)

/** Structural schema check only (Ajv). Client still runs assertPassage. */
function validatePassageJson(data) {
    if (validateSchema(data)) return { ok: true, errors: null }
    return {
        ok: false,
        errors: ajv.errorsText(validateSchema.errors, { separator: "; " }),
    }
}

/**
 * Generate a Passage via Gemini, validate with Ajv, one repair roundtrip on failure.
 * @returns {Promise<{ passage: object } | { error: string, status: number }>}
 */
async function generatePassage({
    text,
    title,
    apiKey,
    fetchImpl = fetch,
}) {
    if (!apiKey) {
        return {
            status: 503,
            error:
                "GEMINI_API_KEY is not set. Add it to the environment (or .env) to use AI passage create.",
        }
    }
    if (typeof text !== "string" || !text.trim()) {
        return { status: 400, error: "text is required" }
    }

    const systemInstruction = [
        "You produce interlinear Passage JSON for language study.",
        "Respond with one JSON object only (no markdown fences).",
        "",
        "Passage shape:",
        "- offset: integer token index where the passage begins (usually 0)",
        "- length: number of tokens",
        "- segments: ordered display blocks; each has text, start, end (inclusive token indices)",
        "- tokens: lexical units with offset, content, charStart, charEnd, transliteration, translation",
        "- glosses: notes with id, start, end (inclusive token indices), content; ranges may overlap",
        "",
        "Rules:",
        "- segments must form a contiguous partition of the token range [offset, offset+length-1]",
        "- each token.content must equal its segment's text.slice(charStart, charEnd) (JS UTF-16)",
        "- within a segment, token char ranges are non-overlapping and left-to-right",
        "- include spaces/punctuation in segment.text; do not make them tokens",
        "- tokenize into meaningful words/compounds (not one char unless appropriate)",
        "- transliteration: Latin phonetics (pinyin with tones, romaji, etc.); may be empty if unknown",
        "- translation: short literal/idiomatic gloss per token",
        "- glosses: add where helpful to a student of the language/text — grammar, interpretation, literal sense, cultural or textual context; overlapping ranges are fine",
        "- prefer scholarship-backed explanations when possible; cite only if the reference itself would help a student",
        "- include a passage-level gloss when useful; use the title when provided",
        "- no extra properties beyond the schema",
        "",
        "Example Passage JSON:",
        JSON.stringify(fewShotExample),
    ].join("\n")

    let userText = "Create a full Passage JSON for this source text."
    if (title && String(title).trim()) {
        userText += `\nTitle (for gloss context): ${String(title).trim()}`
    }
    userText += `\nSource text:\n${text}`

    const contents = [{ role: "user", parts: [{ text: userText }] }]
    let lastErrors = null
    const started = Date.now()
    const log = (msg) => {
        console.log(`[ai-passage] ${msg} (+${Date.now() - started}ms)`)
    }

    log(
        `start title=${JSON.stringify(title ?? "")} chars=${text.length}`
    )

    for (let attempt = 0; attempt < 2; attempt++) {
        let passage
        try {
            log(
                attempt === 0
                    ? "calling Gemini…"
                    : "calling Gemini (schema repair)…"
            )
            const res = await fetchImpl(
                `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemInstruction }],
                        },
                        contents,
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.2,
                        },
                    }),
                }
            )
            const payload = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(
                    payload?.error?.message || `Gemini HTTP ${res.status}`
                )
            }

            const parts = payload?.candidates?.[0]?.content?.parts
            if (!Array.isArray(parts) || parts.length === 0) {
                const block = payload?.promptFeedback?.blockReason
                throw new Error(
                    block
                        ? `Gemini blocked the request (${block})`
                        : "Gemini returned no content"
                )
            }
            const raw = parts.map((p) => p.text ?? "").join("").trim()
            if (!raw) throw new Error("Gemini returned empty text")
            log(`Gemini responded (${raw.length} chars)`)

            try {
                passage = JSON.parse(raw)
            } catch {
                const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
                if (!fenced) throw new Error("model output was not valid JSON")
                passage = JSON.parse(fenced[1].trim())
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            log(`Gemini error: ${message}`)
            return {
                status: attempt === 0 ? 502 : 400,
                error:
                    attempt === 0
                        ? message
                        : `invalid Passage after repair attempt: ${message}; first errors: ${lastErrors}`,
            }
        }

        const check = validatePassageJson(passage)
        if (check.ok) {
            log(
                `schema ok (tokens=${passage.tokens?.length ?? "?"}, glosses=${passage.glosses?.length ?? "?"})`
            )
            return { passage }
        }

        log(`schema failed: ${check.errors}`)
        lastErrors = check.errors
        contents.push(
            { role: "model", parts: [{ text: JSON.stringify(passage) }] },
            {
                role: "user",
                parts: [
                    {
                        text: [
                            "That Passage JSON failed schema validation.",
                            `Validation errors: ${check.errors}`,
                            "Return a corrected Passage JSON object only.",
                        ].join("\n"),
                    },
                ],
            }
        )
    }

    log("giving up after repair")
    return {
        status: 400,
        error: `Passage failed schema validation: ${lastErrors}`,
    }
}

function aiPassageMiddleware(req, res, next) {
    const url = new URL(req.url, "http://localhost")
    if (req.method !== "POST" || url.pathname !== "/api/ai/passage") {
        next()
        return
    }

    ;(async () => {
        try {
            const raw = await new Promise((resolve, reject) => {
                const chunks = []
                req.on("data", (chunk) => chunks.push(chunk))
                req.on("end", () =>
                    resolve(Buffer.concat(chunks).toString("utf8"))
                )
                req.on("error", reject)
            })

            let body
            try {
                body = raw ? JSON.parse(raw) : {}
            } catch {
                res.writeHead(400, { "Content-Type": "text/plain" })
                res.end("invalid JSON")
                return
            }

            const result = await generatePassage({
                text: body.text,
                title: body.title,
                apiKey: process.env.GEMINI_API_KEY,
            })

            if (result.error) {
                res.writeHead(result.status, { "Content-Type": "text/plain" })
                res.end(result.error)
                return
            }

            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify(result.passage))
        } catch (err) {
            res.writeHead(500, { "Content-Type": "text/plain" })
            res.end(err instanceof Error ? err.message : String(err))
        }
    })()
}

module.exports = {
    aiPassageMiddleware,
    generatePassage,
    validatePassageJson,
}
