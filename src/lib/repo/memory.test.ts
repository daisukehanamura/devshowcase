import { describe, expect, it } from "vitest";
import { emptyProfileInput } from "@/lib/profile/draft";
import type { ProfileInput } from "@/lib/profile/schema";
import { InMemoryProfileRepository } from "./memory";
import {
  InvalidTokenError,
  ProfileNotFoundError,
  SlugTakenError,
  type StoredProfile,
} from "./types";

const input = (over: Partial<ProfileInput> = {}): ProfileInput => ({
  ...emptyProfileInput(),
  slug: "hanamaru",
  displayName: "はなまる",
  ...over,
});

const stored = (over: Partial<StoredProfile>): StoredProfile => ({
  ...input(),
  location: null,
  links: { github: null, x: null, website: null, email: null },
  editToken: "token",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("create", () => {
  it("編集キーを発行して返す", async () => {
    const repo = new InMemoryProfileRepository();
    const created = await repo.create(input());

    expect(created.slug).toBe("hanamaru");
    expect(created.editToken).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("slug が重複したら SlugTakenError", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.create(input());

    await expect(repo.create(input())).rejects.toThrow(SlugTakenError);
  });

  it("毎回違う編集キーを発行する", async () => {
    const repo = new InMemoryProfileRepository();
    const a = await repo.create(input({ slug: "aaa" }));
    const b = await repo.create(input({ slug: "bbb" }));

    expect(a.editToken).not.toBe(b.editToken);
  });
});

describe("findBySlug", () => {
  it("公開レスポンスに編集キーを含めない", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.create(input());

    const found = await repo.findBySlug("hanamaru");
    expect(found).not.toBeNull();
    expect(found).not.toHaveProperty("editToken");
  });

  it("無ければ null", async () => {
    expect(await new InMemoryProfileRepository().findBySlug("nope")).toBeNull();
  });

  it("未公開でも取得できる（本人のプレビュー用に判断は呼び出し側へ任せる）", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.create(input({ published: false }));

    expect(await repo.findBySlug("hanamaru")).toMatchObject({ published: false });
  });
});

describe("findForEdit", () => {
  it("編集キーが合えば返す", async () => {
    const repo = new InMemoryProfileRepository();
    const created = await repo.create(input());

    const found = await repo.findForEdit("hanamaru", created.editToken);
    expect(found.editToken).toBe(created.editToken);
  });

  it("編集キーが違えば InvalidTokenError", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.create(input());

    await expect(repo.findForEdit("hanamaru", "wrong")).rejects.toThrow(InvalidTokenError);
  });

  it("存在しなければ ProfileNotFoundError", async () => {
    const repo = new InMemoryProfileRepository();

    await expect(repo.findForEdit("nope", "token")).rejects.toThrow(ProfileNotFoundError);
  });
});

describe("update", () => {
  it("中身を差し替えて編集キーは据え置く", async () => {
    const repo = new InMemoryProfileRepository();
    const created = await repo.create(input());

    await repo.update("hanamaru", created.editToken, input({ displayName: "はなまる改" }));

    const after = await repo.findForEdit("hanamaru", created.editToken);
    expect(after.displayName).toBe("はなまる改");
    expect(after.editToken).toBe(created.editToken);
  });

  it("返り値に編集キーを含めない", async () => {
    const repo = new InMemoryProfileRepository();
    const created = await repo.create(input());

    const updated = await repo.update("hanamaru", created.editToken, input());
    expect(updated).not.toHaveProperty("editToken");
  });

  it("編集キーが違えば拒否し、中身も変えない", async () => {
    const repo = new InMemoryProfileRepository();
    await repo.create(input());

    await expect(
      repo.update("hanamaru", "wrong", input({ displayName: "乗っ取り" })),
    ).rejects.toThrow(InvalidTokenError);

    expect((await repo.findBySlug("hanamaru"))?.displayName).toBe("はなまる");
  });

  it("slug を変えると引っ越して、古い slug は消える", async () => {
    const repo = new InMemoryProfileRepository();
    const created = await repo.create(input());

    await repo.update("hanamaru", created.editToken, input({ slug: "hanamaru2" }));

    expect(await repo.findBySlug("hanamaru")).toBeNull();
    expect(await repo.findBySlug("hanamaru2")).toMatchObject({ displayName: "はなまる" });
    // 引っ越し先でも同じ編集キーで編集できる。
    expect((await repo.findForEdit("hanamaru2", created.editToken)).slug).toBe("hanamaru2");
  });

  it("使われている slug への引っ越しは断る", async () => {
    const repo = new InMemoryProfileRepository();
    const created = await repo.create(input());
    await repo.create(input({ slug: "taken" }));

    await expect(
      repo.update("hanamaru", created.editToken, input({ slug: "taken" })),
    ).rejects.toThrow(SlugTakenError);

    // 失敗しても元の場所に残っている。
    expect(await repo.findBySlug("hanamaru")).not.toBeNull();
  });

  it("存在しない slug の更新は ProfileNotFoundError", async () => {
    const repo = new InMemoryProfileRepository();

    await expect(repo.update("nope", "token", input())).rejects.toThrow(ProfileNotFoundError);
  });
});

describe("listPublished", () => {
  const repo = () =>
    new InMemoryProfileRepository([
      stored({ slug: "a", published: true, updatedAt: "2026-01-01T00:00:00.000Z" }),
      stored({ slug: "b", published: true, updatedAt: "2026-03-01T00:00:00.000Z" }),
      stored({ slug: "c", published: false, updatedAt: "2026-05-01T00:00:00.000Z" }),
    ]);

  it("公開済みだけを新しい順に返す", async () => {
    expect((await repo().listPublished()).map((p) => p.slug)).toEqual(["b", "a"]);
  });

  it("編集キーを含めない", async () => {
    for (const profile of await repo().listPublished()) {
      expect(profile).not.toHaveProperty("editToken");
    }
  });

  it("件数を絞れる", async () => {
    expect(await repo().listPublished(1)).toHaveLength(1);
  });
});
