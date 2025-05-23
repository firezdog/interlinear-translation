import { render, screen } from "@testing-library/react";
import { App } from "@/App";

describe("App component", () => {
  it("renders the main heading", () => {
    render(<App />);
    const heading = screen.getByRole('heading');
    const image = screen.getByRole('img')
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Hello, interlinear!')
    expect(image).toBeInTheDocument();
  });
});