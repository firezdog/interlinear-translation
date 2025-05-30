import React from "react";
import { render, screen } from "@testing-library/react";
import { App } from "@/App";

describe("App component", () => {
  it("renders the main heading", () => {
    render(<App />);
    const heading = screen.getByRole('heading');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Interlinear Translation')
  });
});