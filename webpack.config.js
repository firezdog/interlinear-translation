const path = require("path")
const fs = require("fs")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")

const PASSAGE_KEY_RE = /^[a-z0-9-]+$/
const PAGE_RE = /^\d+$/
const passagesRoot = path.resolve(__dirname, "public", "passages")

function collectBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = []
        req.on("data", (chunk) => chunks.push(chunk))
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
        req.on("error", reject)
    })
}

function passageWriteMiddleware(req, res, next) {
    const url = new URL(req.url, "http://localhost")
    if (req.method !== "PUT" || url.pathname !== "/api/passage") {
        next()
        return
    }

    const key = url.searchParams.get("key") ?? ""
    const page = url.searchParams.get("page") ?? ""
    if (!PASSAGE_KEY_RE.test(key) || !PAGE_RE.test(page)) {
        res.writeHead(400, { "Content-Type": "text/plain" })
        res.end("invalid passage key or page")
        return
    }

    const target = path.resolve(passagesRoot, key, `${page}.json`)
    if (!target.startsWith(passagesRoot + path.sep)) {
        res.writeHead(403, { "Content-Type": "text/plain" })
        res.end("forbidden")
        return
    }

    ;(async () => {
        try {
            const raw = await collectBody(req)
            let data
            try {
                data = JSON.parse(raw)
            } catch {
                res.writeHead(400, { "Content-Type": "text/plain" })
                res.end("invalid JSON")
                return
            }

            await fs.promises.mkdir(path.dirname(target), { recursive: true })
            await fs.promises.writeFile(
                target,
                JSON.stringify(data, null, 2) + "\n",
                "utf8"
            )
            res.writeHead(204)
            res.end()
        } catch (err) {
            res.writeHead(500, { "Content-Type": "text/plain" })
            res.end(err instanceof Error ? err.message : String(err))
        }
    })()
}

module.exports = {
    mode: "development",
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "/"
    },
    devtool: "inline-source-map",
    devServer: {
        // Don't live-reload when Save overwrites passage JSON on disk.
        static: {
            directory: path.resolve(__dirname, "public"),
            watch: {
                ignored: path.resolve(__dirname, "public", "passages"),
            },
        },
        hot: true,
        port: 3000,
        host: "0.0.0.0",
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer?.app) {
                throw new Error("webpack-dev-server is not defined")
            }
            // Run before static middleware so PUT isn't treated as a static miss.
            middlewares.unshift({
                name: "passage-write",
                middleware: passageWriteMiddleware,
            })
            return middlewares
        },
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
        alias: {
            "@": path.resolve(__dirname, "src")
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html"
        }),
        new CopyPlugin({
            patterns: [
                {"from": "./public", "to": ".", "globOptions": {ignore: ["**/*.html"]}},
            ]
        })
    ]
}
