import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

interface PackageManifest {
    version?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
}

async function readPackageManifest(): Promise<PackageManifest> {
    return JSON.parse(await readFile(resolve("package.json"), "utf8"))
}

describe("package dependency compatibility", () => {
    /**
     * @see https://github.com/better-stack-ai/better-stack/issues/163
     */
    it("publishes the BTST v3 RC with one compatible auth dependency set", async () => {
        const manifest = await readPackageManifest()

        expect(manifest.version).toBe("2.0.0-rc.1")
        expect(manifest.peerDependencies).toMatchObject({
            "@better-auth/api-key": "1.6.16",
            "@better-auth/passkey": "1.6.16",
            "@better-auth/utils": "0.4.1",
            "@better-fetch/fetch": "1.2.2",
            "@btst/stack": "^3.0.0-rc.1",
            "@btst/yar": "^1.3.0",
            "@tanstack/react-query": ">=5.100.14",
            "better-auth": "1.6.16",
            "better-call": "1.3.6"
        })
        expect(manifest.devDependencies).toMatchObject({
            "@better-auth/api-key": "1.6.16",
            "@better-auth/passkey": "1.6.16",
            "@better-auth/utils": "0.4.1",
            "@better-fetch/fetch": "1.2.2",
            "@btst/stack": "3.0.0-rc.1",
            "@btst/yar": "1.3.0",
            "better-auth": "1.6.16",
            "better-call": "1.3.6"
        })
        expect(manifest.dependencies).not.toHaveProperty("@better-auth/api-key")
        expect(manifest.dependencies).not.toHaveProperty("@better-fetch/fetch")
        expect(manifest.dependencies).not.toHaveProperty("better-call")
    })
})
