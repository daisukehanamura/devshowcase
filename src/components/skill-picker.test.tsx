import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Skill } from "@/lib/profile/types";
import { SkillPicker } from "./skill-picker";

const ts: Skill = { slug: "typescript", label: "TypeScript", level: 4, years: 5 };

/** value を自分で持って onChange を反映する。制御コンポーネントを画面と同じ条件で動かす。 */
const Harness = ({ initial = [] as Skill[] }) => {
  const [value, setValue] = useState(initial);
  return <SkillPicker value={value} onChange={setValue} />;
};

const search = () => screen.getByLabelText("技術を検索して追加");

describe("SkillPicker", () => {
  it("略称で検索すると候補が絞られる", async () => {
    const user = userEvent.setup();
    render(<SkillPicker value={[]} onChange={vi.fn()} />);

    await user.type(search(), "k8s");

    expect(screen.getByRole("button", { name: "Kubernetes を追加" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "TypeScript を追加" })).toBeNull();
  });

  it("候補を押すと既定の熟練度と年数で積まれる", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SkillPicker value={[]} onChange={onChange} />);

    await user.type(search(), "ts");
    await user.click(screen.getByRole("button", { name: "TypeScript を追加" }));

    expect(onChange).toHaveBeenCalledWith([
      { slug: "typescript", label: "TypeScript", level: 3, years: 1 },
    ]);
  });

  it("Enter で先頭の候補が入り、検索欄が空になる", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(search(), "rails{Enter}");

    expect(screen.getByText("Ruby on Rails")).toBeInTheDocument();
    expect(search()).toHaveValue("");
  });

  it("追加済みの技術は押せない", async () => {
    const user = userEvent.setup();
    render(<SkillPicker value={[ts]} onChange={vi.fn()} />);

    await user.type(search(), "ts");

    expect(screen.getByRole("button", { name: "TypeScript（追加済み）" })).toBeDisabled();
  });

  it("カタログに無い技術は自由入力で追加できる", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(search(), "社内フレームワーク");
    await user.click(screen.getByRole("button", { name: /「社内フレームワーク」を自分で追加/ }));

    expect(screen.getByText("社内フレームワーク")).toBeInTheDocument();
    expect(screen.getByText(/カタログに無い技術は頭文字で表示されます/)).toBeInTheDocument();
  });

  it("カタログにある技術では自由入力の追加を出さない", async () => {
    const user = userEvent.setup();
    render(<SkillPicker value={[]} onChange={vi.fn()} />);

    await user.type(search(), "TypeScript");

    expect(screen.queryByRole("button", { name: /を自分で追加/ })).toBeNull();
  });

  it("熟練度を直せる", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SkillPicker value={[ts]} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("TypeScript の熟練度"), "5");

    expect(onChange).toHaveBeenLastCalledWith([{ ...ts, level: 5 }]);
  });

  it("経験年数に小数を入れられる", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[ts]} />);

    const years = screen.getByLabelText("TypeScript の経験年数");
    await user.clear(years);
    await user.type(years, "2.5");

    expect(years).toHaveValue(2.5);
  });

  it("削除できる", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[ts]} />);

    await user.click(screen.getByRole("button", { name: "TypeScript を削除" }));

    expect(screen.getByText(/まだスキルがありません/)).toBeInTheDocument();
  });

  it("登録済みのスキルを一覧に出す", () => {
    render(
      <SkillPicker
        value={[ts, { slug: "go", label: "Go", level: 2, years: 1 }]}
        onChange={vi.fn()}
      />,
    );

    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("2件登録済み")).toBeInTheDocument();
  });
});
