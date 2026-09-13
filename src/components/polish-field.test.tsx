import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PolishField } from "./polish-field";

const RAW = "基本的にはAPIの設計を担当しました。\nドキュメントもしっかりと書きました。";

const Harness = ({ initial = RAW }: { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return <PolishField label="実績" value={value} onChange={setValue} />;
};

const preview = () => screen.getByRole("region", { name: "実績の整形結果" });

describe("PolishField", () => {
  it("整形前は整形案を出さない", () => {
    render(<PolishField label="実績" value={RAW} onChange={vi.fn()} />);
    expect(screen.queryByRole("region", { name: "実績の整形結果" })).toBeNull();
  });

  it("整形すると案と適用した処理が出る", async () => {
    const user = userEvent.setup();
    render(<PolishField label="実績" value={RAW} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "整形する" }));

    expect(within(preview()).getByText(/- APIの設計を担当した/)).toBeInTheDocument();
    const applied = within(preview()).getByRole("list", { name: "適用した処理" });
    expect(within(applied).getByText("冗長な表現を削除")).toBeInTheDocument();
    expect(within(applied).getByText("敬体（ですます）を常体に統一")).toBeInTheDocument();
  });

  it("案は自動で反映せず、反映を押したときだけ書き換える", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PolishField label="実績" value={RAW} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "整形する" }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "反映する" }));

    expect(onChange).toHaveBeenCalledWith(
      "- APIの設計を担当した\n- ドキュメントも書いた",
    );
  });

  it("反映すると整形案は閉じる", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "整形する" }));
    await user.click(screen.getByRole("button", { name: "反映する" }));

    expect(screen.queryByRole("region", { name: "実績の整形結果" })).toBeNull();
    expect(screen.getByLabelText("実績")).toHaveValue("- APIの設計を担当した\n- ドキュメントも書いた");
  });

  it("地の文を選ぶと箇条書きにしない", async () => {
    const user = userEvent.setup();
    render(<PolishField label="実績" value={RAW} onChange={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: "地の文" }));
    await user.click(screen.getByRole("button", { name: "整形する" }));

    expect(within(preview()).getByText(/^APIの設計を担当した。/)).toBeInTheDocument();
  });

  it("常体への統一を切ると敬体のまま整形する", async () => {
    const user = userEvent.setup();
    render(<PolishField label="実績" value="APIの設計を担当しました。" onChange={vi.fn()} />);

    await user.click(screen.getByRole("checkbox", { name: "常体に統一" }));
    await user.click(screen.getByRole("button", { name: "整形する" }));

    expect(within(preview()).getByText("- APIの設計を担当しました")).toBeInTheDocument();
  });

  it("数値が無い文章には定量化の提案を出す", async () => {
    const user = userEvent.setup();
    render(<PolishField label="実績" value="障害対応を担当しました。" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "整形する" }));

    const suggestions = within(preview()).getByRole("list", { name: "改善の提案" });
    expect(within(suggestions).getByText(/数値が入っていません/)).toBeInTheDocument();
  });

  it("本文を書き換えると古い整形案を畳む", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "整形する" }));
    await user.type(screen.getByLabelText("実績"), "追記");

    expect(screen.queryByRole("region", { name: "実績の整形結果" })).toBeNull();
  });

  it("空欄では整形できない", () => {
    render(<PolishField label="実績" value="   " onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "整形する" })).toBeDisabled();
  });
});
