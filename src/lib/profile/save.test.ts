import { describe, expect, it } from "vitest";
import { InvalidTokenError, ProfileNotFoundError, SlugTakenError } from "@/lib/repo/types";
import { initialSaveState, invalidInput, missingEditToken, saveFailure, saved } from "./save";
import { profileInputSchema } from "./schema";

describe("initialSaveState", () => {
  it("何もしていない状態から始まる", () => {
    expect(initialSaveState).toEqual({ status: "idle" });
  });
});

describe("invalidInput", () => {
  it("zod のエラーをフィールド別に畳んで返す", () => {
    const result = profileInputSchema.safeParse({ slug: "x", displayName: "" });
    if (result.success) throw new Error("失敗するはずの入力が通ってしまった");

    const state = invalidInput(result.error);
    expect(state.status).toBe("error");
    expect(state.errors["displayName"]).toBe("表示名は必須です");
    expect(state.errors["slug"]).toBe("3文字以上にしてください");
  });
});

describe("saved", () => {
  it("新規と更新でメッセージを変える", () => {
    expect(saved("hanamaru", true)).toEqual({
      status: "ok",
      slug: "hanamaru",
      created: true,
      message: "公開ページを作成しました。",
    });
    expect(saved("hanamaru", false).message).toBe("保存しました。");
  });
});

describe("saveFailure", () => {
  it("slug の衝突は入力欄の横に出せるようにする", () => {
    expect(saveFailure(new SlugTakenError("hanamaru")).errors["slug"]).toBe(
      "この URL は既に使われています",
    );
  });

  it("権限と不存在はフィールドに紐づけない", () => {
    expect(saveFailure(new InvalidTokenError())).toEqual({
      status: "error",
      message: "編集キーが一致しません。",
      errors: {},
    });
    expect(saveFailure(new ProfileNotFoundError("nope")).status).toBe("error");
    expect(saveFailure(new ProfileNotFoundError("nope"))).toHaveProperty("errors", {});
  });

  it("想定外のエラーは詳細を晒さない", () => {
    const state = saveFailure(new Error("connection to 10.0.0.1:5432 refused"));
    expect(state.message).not.toMatch(/10\.0\.0\.1/);
    expect(state.message).toMatch(/保存できませんでした/);
  });
});

describe("missingEditToken", () => {
  it("別のブラウザから開いたことが分かる文言にする", () => {
    expect(missingEditToken().status).toBe("error");
    expect(missingEditToken().message).toMatch(/同じブラウザ/);
  });
});
