import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TokenGrid } from "@/TokenGrid";
import { Token } from "@/types/passage";

const token: Token = {
  offset: 0,
  content: "月日",
  transliteration: "tsukihi",
  translation: "moon / sun",
};

describe("TokenGrid", () => {
  it("renders content, transliteration, and translation", () => {
    render(
      <TokenGrid token={token} col={0} row={0} isSelected={false} onClick={() => {}} />
    );

    expect(screen.getByText("月日")).toBeInTheDocument();
    expect(screen.getByText("tsukihi")).toBeInTheDocument();
    expect(screen.getByText("moon / sun")).toBeInTheDocument();
  });

  it("applies selected styles when selected", () => {
    render(
      <TokenGrid token={token} col={0} row={0} isSelected={true} onClick={() => {}} />
    );

    expect(screen.getByText("月日").className).toContain("bg-yellow-200");
  });

  it("applies unselected hover style when not selected", () => {
    render(
      <TokenGrid token={token} col={0} row={0} isSelected={false} onClick={() => {}} />
    );

    expect(screen.getByText("月日").className).toContain("hover:bg-sky-100");
    expect(screen.getByText("月日").className).not.toContain("bg-yellow-200");
  });

  it("fires onClick from each cell", () => {
    const onClick = jest.fn();
    render(
      <TokenGrid token={token} col={1} row={2} isSelected={false} onClick={onClick} />
    );

    fireEvent.click(screen.getByText("月日"));
    fireEvent.click(screen.getByText("tsukihi"));
    fireEvent.click(screen.getByText("moon / sun"));

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("places cells on the correct grid rows and column", () => {
    render(
      <TokenGrid token={token} col={2} row={1} isSelected={false} onClick={() => {}} />
    );

    expect(screen.getByText("月日")).toHaveStyle({ gridRow: "4", gridColumn: "3" });
    expect(screen.getByText("tsukihi")).toHaveStyle({ gridRow: "5", gridColumn: "3" });
    expect(screen.getByText("moon / sun")).toHaveStyle({ gridRow: "6", gridColumn: "3" });
  });
});
