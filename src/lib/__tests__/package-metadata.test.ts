import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

interface PackageManifest {
    version?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

async function readPackageManifest(): Promise<PackageManifest> {
    return JSON.parse(await readFile(resolve("package.json"), "utf8"))
}

describe("package dependency compatibility", () => {
    it("keeps BTST authorization adapters out of public entries", async () => {
        const entrypoints = await Promise.all(
            ["src/index.ts", "src/client.ts", "src/server.ts"].map((path) =>
                readFile(resolve(path), "utf8")
            )
        )

        for (const entrypoint of entrypoints) {
            expect(entrypoint).not.toContain("./lib/better-auth-provider")
            expect(entrypoint).not.toContain(
                "./lib/better-auth-server-provider"
            )
        }
    })

    /**
     * @see https://github.com/better-stack-ai/better-auth-ui/issues/20
     */
    it("publishes the BTST v3 RC with one compatible auth dependency set", async () => {
        const manifest = await readPackageManifest()

        expect(manifest.version).toBe("2.0.0-rc.3")
        expect(manifest.peerDependencies).toMatchObject({
            "@better-auth/api-key": "1.7.2",
            "@better-auth/passkey": "1.7.2",
            "@better-fetch/fetch": "1.3.1",
            "@btst/stack": "^3.0.0-rc.3",
            "@btst/yar": "^1.3.2",
            "@tanstack/react-query": ">=5.100.14",
            "better-auth": "1.7.2"
        })
        expect(manifest.devDependencies).toMatchObject({
            "@better-auth/api-key": "1.7.2",
            "@better-auth/core": "1.7.2",
            "@better-auth/passkey": "1.7.2",
            "@better-auth/utils": "0.4.2",
            "@better-fetch/fetch": "1.3.1",
            "@btst/stack": "3.0.0-rc.3",
            "@btst/yar": "1.3.2",
            "better-auth": "1.7.2",
            "better-call": "1.4.0"
        })
        expect(manifest.dependencies).not.toHaveProperty("@better-auth/api-key")
        expect(manifest.dependencies).not.toHaveProperty("@better-fetch/fetch")
        expect(manifest.dependencies).not.toHaveProperty("better-call")
        expect(manifest.peerDependencies).not.toHaveProperty(
            "@better-auth/core"
        )
        expect(manifest.peerDependencies).not.toHaveProperty(
            "@better-auth/utils"
        )
        expect(manifest.peerDependencies).not.toHaveProperty("better-call")
    })

    it("marks adapter-only peers as optional", async () => {
        const manifest = await readPackageManifest()

        expect(manifest.peerDependenciesMeta).toMatchObject({
            "@daveyplate/better-auth-tanstack": { optional: true },
            "@instantdb/react": { optional: true },
            "@triplit/client": { optional: true },
            "@triplit/react": { optional: true }
        })
    })

    it("keeps optional adapters out of base source entry points", async () => {
        const entrypoints = await Promise.all(
            ["src/index.ts", "src/client.ts", "src/server.ts"].map((path) =>
                readFile(resolve(path), "utf8")
            )
        )

        for (const entrypoint of entrypoints) {
            expect(entrypoint).not.toContain("@daveyplate/better-auth-tanstack")
            expect(entrypoint).not.toContain("@instantdb/react")
            expect(entrypoint).not.toContain("@triplit/")
        }
    })
})

describe("RC publishing", () => {
    it("can safely publish or retry a prerelease without moving latest", async () => {
        const workflow = await readFile(
            resolve(".github/workflows/release.yml"),
            "utf8"
        )

        expect(workflow).toContain("workflow_dispatch:")
        expect(workflow).toContain(
            "ref: $" +
                "{{ github.event.release.tag_name || inputs.release_tag }}"
        )
        expect(workflow).toContain("npm install -g npm@11.17.0")
        expect(workflow).toContain("run: pnpm lint")
        expect(workflow).toContain("run: pnpm typecheck")
        expect(workflow).toContain("run: pnpm test")
        expect(workflow).toContain("run: pnpm run build")
        expect(workflow).toContain("npm publish --access public --provenance")
        expect(workflow).toContain(
            'npm view "@btst/better-auth-ui@$PKG_VERSION"'
        )
        expect(workflow).toContain(
            'npm view "@btst/better-auth-ui@$NPM_DIST_TAG"'
        )
    })
})
