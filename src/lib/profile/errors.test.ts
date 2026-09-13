import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorCount, errorKey, fieldErrors, formErrors, hasErrorIn } from "./errors";
import { profileInputSchema } from "./schema";

/** safeParse を失敗させて ZodError を得る小道具。 */
const errorOf = (schema: z.ZodType, value: unknown): z.ZodError => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("失敗するはずの入力が通ってしまった");
  return result.error;
};

describe("errorKey", () => {
  it("パスをドット区切りにする", () => {
    expect(errorKey(["links", "github"])).toBe("links.github");
    expect(errorKey(["experiences", 0, "company"])).toBe("experiences.0.company");
    expect(errorKey([])).toBe("");
  });
});

describe("fieldErrors", () => {
  it("ネストした配列のパスをキーにする", () => {
    const error = errorOf(profileInputSchema, {
      slug: "me",
      displayName: "",
      location: null,
      links: { github: "", x: "", website: "", email: "" },
      skills: [],
      experiences: [{ id: "e1", company: "", startedAt: "2020-13" }],
      projects: [],
    });

    const errors = fieldErrors(error);
    expect(errors["displayName"]).toBe("表示名は必須です");
    expect(errors["slug"]).toBe("3文字以上にしてください");
    expect(errors["experiences.0.company"]).toBe("会社名は必須です");
    expect(errors["experiences.0.startedAt"]).toBe("YYYY-MM 形式で入力してください");
  });

  it("同じフィールドは最初のメッセージだけ残す", () => {
    const schema = z.object({
      name: z.string().min(5, "短すぎます").regex(/^[A-Z]/, "大文字で始めてください"),
    });
    expect(fieldErrors(errorOf(schema, { name: "ab" }))).toEqual({ name: "短すぎます" });
  });
});

describe("formErrors", () => {
  it("フィールドに紐づかないエラーだけ拾う", () => {
    const schema = z
      .object({ a: z.number(), b: z.number() })
      .refine((v) => v.a < v.b, { message: "a は b より小さくしてください" });

    expect(formErrors(errorOf(schema, { a: 2, b: 1 }))).toEqual(["a は b より小さくしてください"]);
    expect(formErrors(errorOf(schema, { a: "x", b: 1 }))).toEqual([]);
  });
});

describe("hasErrorIn", () => {
  const errors = { "experiences.0.company": "会社名は必須です", displayName: "表示名は必須です" };

  it("前方一致でセクション内のエラーを見つける", () => {
    expect(hasErrorIn(errors, "experiences")).toBe(true);
    expect(hasErrorIn(errors, "experiences.0")).toBe(true);
    expect(hasErrorIn(errors, "experiences.1")).toBe(false);
    expect(hasErrorIn(errors, "projects")).toBe(false);
  });

  it("完全一致も拾う", () => {
    expect(hasErrorIn(errors, "displayName")).toBe(true);
  });

  it("途中までしか一致しないキーは拾わない", () => {
    expect(hasErrorIn({ displayNameKana: "x" }, "displayName")).toBe(false);
  });
});

describe("errorCount", () => {
  it("残っているエラーの件数を返す", () => {
    expect(errorCount({})).toBe(0);
    expect(errorCount({ a: "x", b: "y" })).toBe(2);
  });
});
