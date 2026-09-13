import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechIcon } from "./tech-icon";

describe("TechIcon", () => {
  it("カタログにあるロゴは SVG で出し、表示名を読み上げに渡す", () => {
    render(<TechIcon slug="typescript" />);
    const icon = screen.getByRole("img", { name: "TypeScript" });
    expect(icon.tagName.toLowerCase()).toBe("svg");
    expect(icon.querySelector("path")).not.toBeNull();
  });

  it("色が付いているロゴはブランド色で塗る", () => {
    render(<TechIcon slug="typescript" />);
    expect(screen.getByRole("img", { name: "TypeScript" })).toHaveStyle({ color: "#3178C6" });
  });

  it("黒に寄ったロゴはブランド色を当てず、テーマの文字色に任せる", () => {
    render(<TechIcon slug="rust" />);
    const icon = screen.getByRole("img", { name: "Rust" });
    expect(icon.getAttribute("style")).toBeNull();
    expect(icon).toHaveClass("text-foreground");
  });

  it("カタログに無い技術は頭文字で代替する", () => {
    render(<TechIcon slug="my-in-house-framework" label="社内フレームワーク" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("社")).toBeInTheDocument();
  });

  it("装飾指定のときは読み上げから外す", () => {
    // 隣に「Go」という文字が出ている場面。読み上げると「Go Go」になってしまう。
    const { container } = render(<TechIcon slug="go" decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("label を渡すとカタログの名前より優先する", () => {
    render(<TechIcon slug="nextdotjs" label="Next.js 16" />);
    expect(screen.getByRole("img", { name: "Next.js 16" })).toBeInTheDocument();
  });
});
