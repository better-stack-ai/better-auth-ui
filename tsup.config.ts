import { readdirSync } from "node:fs"
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives"
import { defineConfig } from "tsup"

export default defineConfig({
    entry: {
        index: "src/index.ts",
        server: "src/server.ts",
        client: "src/client.tsx",
        ...Object.fromEntries(
            readdirSync("src/lib/auth")
                .filter(
                    (name) =>
                        /-plugin\.tsx?$/.test(name) && name !== "auth-plugin.ts"
                )
                .map((name) => [
                    `plugins/${name.replace(/-plugin\.tsx?$/, "")}`,
                    `src/lib/auth/${name}`
                ])
        )
    },
    format: ["esm"],
    splitting: true,
    skipNodeModulesBundle: true,
    treeshake: false,
    metafile: true,
    esbuildPlugins: [
        preserveDirectivesPlugin({
            directives: ["use client", "use strict"],
            include: /\.(js|ts|jsx|tsx)$/,
            exclude: /node_modules/
        })
    ]
})
