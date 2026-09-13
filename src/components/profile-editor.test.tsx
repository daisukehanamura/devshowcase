import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { emptyProfileInput } from "@/lib/profile/draft";
import { saved, type SavePayload, type SaveState } from "@/lib/profile/save";
import { ProfileEditor } from "./profile-editor";

/** 実際の Server Action の代わり。呼ばれた引数を見たいので差し替えられるようにしてある。 */
const fakeAction = (result: SaveState) => vi.fn(async (_prev: SaveState, _payload: SavePayload) => result);

const setup = (action = fakeAction(saved("hanamaru", true)), persistent = true) => {
  render(
    <ProfileEditor
      initial={emptyProfileInput()}
      originalSlug={null}
      action={action}
      persistent={persistent}
    />,
  );
  return action;
};

describe("ProfileEditor", () => {
  it("保存先が無いときは消えることを伝える", () => {
    setup(fakeAction(saved("x", true)), false);
    expect(screen.getByText(/開発サーバを止めると消えます/)).toBeInTheDocument();
  });

  it("保存先があるときは警告を出さない", () => {
    setup();
    expect(screen.queryByText(/開発サーバを止めると消えます/)).toBeNull();
  });

  it("新規のときは「作成する」", () => {
    setup();
    expect(screen.getByRole("button", { name: "作成する" })).toBeInTheDocument();
  });

  it("入力した内容を Server Action に渡す", async () => {
    const user = userEvent.setup();
    const action = setup();

    await user.type(screen.getByLabelText(/ページの URL/), "hanamaru");
    await user.type(screen.getByLabelText(/表示名/), "はなまる");
    await user.type(screen.getByLabelText("肩書き"), "バックエンドエンジニア");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(action).toHaveBeenCalledTimes(1);
    const [, payload] = action.mock.calls[0];
    expect(payload.originalSlug).toBeNull();
    expect(payload.profile).toMatchObject({
      slug: "hanamaru",
      displayName: "はなまる",
      headline: "バックエンドエンジニア",
      published: false,
    });
  });

  it("スキルを積んで保存できる", async () => {
    const user = userEvent.setup();
    const action = setup();

    await user.type(screen.getByLabelText("技術を検索して追加"), "ts{Enter}");
    await user.click(screen.getByRole("button", { name: "作成する" }));

    const [, payload] = action.mock.calls[0];
    expect(payload.profile).toMatchObject({
      skills: [{ slug: "typescript", label: "TypeScript", level: 3, years: 1 }],
    });
  });

  it("経歴を追加すると入力欄が増える", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByText(/まだ経歴がありません/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "経歴を追加" }));

    expect(screen.getByLabelText(/会社・組織/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "新しい経歴" })).toBeInTheDocument();
  });

  it("経歴に使った技術は登録済みスキルから選ぶ", async () => {
    const user = userEvent.setup();
    const action = setup();

    await user.type(screen.getByLabelText("技術を検索して追加"), "go{Enter}");
    await user.click(screen.getByRole("button", { name: "経歴を追加" }));
    await user.click(screen.getByRole("button", { name: "Go", pressed: false }));
    await user.click(screen.getByRole("button", { name: "作成する" }));

    const [, payload] = action.mock.calls[0];
    expect(payload.profile).toMatchObject({ experiences: [{ stack: ["go"] }] });
  });

  it("保存に成功すると公開ページへの導線を出し、次からは更新になる", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByRole("link", { name: "公開ページを見る" })).toHaveAttribute(
      "href",
      "/p/hanamaru",
    );
    expect(screen.getByText("公開ページを作成しました。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存する" })).toBeInTheDocument();
  });

  it("二度目の保存は更新として送る", async () => {
    const user = userEvent.setup();
    const action = setup();

    await user.click(screen.getByRole("button", { name: "作成する" }));
    await user.click(await screen.findByRole("button", { name: "保存する" }));

    expect(action.mock.calls[1][1].originalSlug).toBe("hanamaru");
  });

  it("サーバが返したエラーを該当の入力欄に出す", async () => {
    const user = userEvent.setup();
    setup(
      fakeAction({
        status: "error",
        message: "入力に問題があります。",
        errors: { slug: "この URL は既に使われています", displayName: "表示名は必須です" },
      }),
    );

    await user.click(screen.getByRole("button", { name: "作成する" }));

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((a) => a.textContent)).toContain("この URL は既に使われています");
    expect(alerts.map((a) => a.textContent)).toContain("表示名は必須です");
    expect(screen.getByText(/入力に問題があります。（2件）/)).toBeInTheDocument();
  });

  it("エラーが出た入力欄は aria-invalid を立てる", async () => {
    const user = userEvent.setup();
    setup(
      fakeAction({ status: "error", message: "だめ", errors: { displayName: "表示名は必須です" } }),
    );

    await user.click(screen.getByRole("button", { name: "作成する" }));

    expect(await screen.findByLabelText(/表示名/)).toHaveAttribute("aria-invalid", "true");
  });
});
