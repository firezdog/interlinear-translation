import {
    getPublicPath,
    normalizePublicPath,
    publicAssetUrl,
} from "@/clients/basePath";

describe("normalizePublicPath", () => {
    it("defaults empty values to root", () => {
        expect(normalizePublicPath(undefined)).toBe("/");
        expect(normalizePublicPath("")).toBe("/");
        expect(normalizePublicPath("   ")).toBe("/");
    });

    it("ensures a leading and trailing slash", () => {
        expect(normalizePublicPath("interlinear-translation")).toBe(
            "/interlinear-translation/"
        );
        expect(normalizePublicPath("/interlinear-translation")).toBe(
            "/interlinear-translation/"
        );
        expect(normalizePublicPath("/interlinear-translation/")).toBe(
            "/interlinear-translation/"
        );
    });

    it("leaves root alone", () => {
        expect(normalizePublicPath("/")).toBe("/");
    });
});

describe("getPublicPath / publicAssetUrl", () => {
    const original = process.env.PUBLIC_PATH;

    afterEach(() => {
        if (original === undefined) {
            delete process.env.PUBLIC_PATH;
        } else {
            process.env.PUBLIC_PATH = original;
        }
    });

    it("defaults to / when PUBLIC_PATH is unset", () => {
        delete process.env.PUBLIC_PATH;
        expect(getPublicPath()).toBe("/");
        expect(publicAssetUrl("passages/oku/1.json")).toBe(
            "/passages/oku/1.json"
        );
    });

    it("prefixes assets with the configured base path", () => {
        process.env.PUBLIC_PATH = "/interlinear-translation/";
        expect(getPublicPath()).toBe("/interlinear-translation/");
        expect(publicAssetUrl("/passages/oku/1.json")).toBe(
            "/interlinear-translation/passages/oku/1.json"
        );
    });
});
