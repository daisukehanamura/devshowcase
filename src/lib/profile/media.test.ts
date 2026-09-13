import { describe, expect, it } from "vitest";
import { parseVideo, safeImageUrl } from "./media";

describe("parseVideo", () => {
  it("mp4 などの直リンクはそのまま再生する", () => {
    expect(parseVideo("https://example.com/demo.mp4")).toEqual({
      kind: "file",
      src: "https://example.com/demo.mp4",
    });
    expect(parseVideo("https://example.com/demo.webm")?.kind).toBe("file");
    expect(parseVideo("https://example.com/DEMO.MOV")?.kind).toBe("file");
  });

  it("YouTube のいろいろな形から埋め込み URL を作る", () => {
    const embed = { kind: "embed", src: "https://www.youtube.com/embed/abc123", title: "YouTube" };
    expect(parseVideo("https://www.youtube.com/watch?v=abc123")).toEqual(embed);
    expect(parseVideo("https://youtu.be/abc123")).toEqual(embed);
    expect(parseVideo("https://www.youtube.com/shorts/abc123")).toEqual(embed);
    expect(parseVideo("https://www.youtube.com/embed/abc123")).toEqual(embed);
  });

  it("再生する動画が特定できない YouTube URL はリンク扱い", () => {
    expect(parseVideo("https://www.youtube.com/")?.kind).toBe("link");
  });

  it("Vimeo は数字の ID だけ埋め込む", () => {
    expect(parseVideo("https://vimeo.com/123456789")).toEqual({
      kind: "embed",
      src: "https://player.vimeo.com/video/123456789",
      title: "Vimeo",
    });
    expect(parseVideo("https://vimeo.com/channels/staffpicks")?.kind).toBe("link");
  });

  it("知らないサービスは埋め込まずリンクにする", () => {
    expect(parseVideo("https://example.com/watch/1")).toEqual({
      kind: "link",
      src: "https://example.com/watch/1",
    });
  });

  it("URL でないものと http(s) 以外は捨てる", () => {
    expect(parseVideo(null)).toBeNull();
    expect(parseVideo("")).toBeNull();
    expect(parseVideo("ただの文字列")).toBeNull();
    expect(parseVideo("javascript:alert(1)")).toBeNull();
    expect(parseVideo("data:video/mp4;base64,AAAA")).toBeNull();
  });
});

describe("safeImageUrl", () => {
  it("http(s) だけ通す", () => {
    expect(safeImageUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(safeImageUrl("http://example.com/a.png")).toBe("http://example.com/a.png");
  });

  it("それ以外は null", () => {
    expect(safeImageUrl(null)).toBeNull();
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("/local.png")).toBeNull();
  });
});
