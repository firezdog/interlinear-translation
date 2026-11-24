import "@testing-library/jest-dom";

Element.prototype.scrollIntoView = jest.fn();

if (typeof crypto.randomUUID !== "function") {
    Object.defineProperty(crypto, "randomUUID", {
        value: () => "00000000-0000-4000-8000-000000000000",
        configurable: true,
    });
}
