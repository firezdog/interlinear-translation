import { render, screen } from "@testing-library/react";
import { App } from "@/App";

describe("App component", () => {
  it("renders the main heading", () => {
    render(<App />);
    const heading = screen.getByText(/hello, interlinear!/i);
    expect(heading).toBeInTheDocument();
  });
});