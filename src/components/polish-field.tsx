"use client";

import { useId, useState } from "react";
import { polish, type PolishFormat, type PolishResult } from "@/lib/polish";
import { arrayToLines, linesToArray } from "@/lib/profile/draft";
import { Button, TextArea } from "./ui";

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** 箇条書き向きの欄（実績など）と地の文向きの欄（自己紹介など）で既定を変える。 */
  defaultFormat?: PolishFormat;
  hint?: string;
  error?: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
};

const FORMATS: Array<{ value: PolishFormat; label: string }> = [
  { value: "bullets", label: "箇条書き" },
  { value: "prose", label: "地の文" },
];

/**
 * 文章の整形つき入力欄。
 * 雑に書いたものを貼って整形ボタンを押すと、整形案と「何を直したか」が出る。
 * 勝手に上書きせず、必ず案を見せてから反映するのは、
 * 書いた本人の意図を潰さないため（整形はまだルールベースで、判断はできない）。
 */
export const PolishField = ({
  label,
  value,
  onChange,
  defaultFormat = "bullets",
  hint,
  error,
  rows = 6,
  placeholder,
  required,
}: Props) => {
  const id = useId();
  const [format, setFormat] = useState<PolishFormat>(defaultFormat);
  const [plainForm, setPlainForm] = useState(true);
  const [removeFillers, setRemoveFillers] = useState(true);
  const [result, setResult] = useState<PolishResult | null>(null);

  const run = () => setResult(polish(value, { format, plainForm, removeFillers }));

  const apply = () => {
    if (!result) return;
    onChange(result.text);
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-label="必須">
            *
          </span>
        )}
      </label>

      <TextArea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        invalid={Boolean(error)}
        onChange={(e) => {
          onChange(e.target.value);
          // 元の文が変わった整形案は的外れになるので、畳む。
          setResult(null);
        }}
      />

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button size="sm" variant="primary" onClick={run} disabled={!value.trim()}>
          整形する
        </Button>

        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">{label}の整形の形式</legend>
          {FORMATS.map((f) => (
            <label key={f.value} className="flex items-center gap-1 text-xs text-muted">
              <input
                type="radio"
                name={`${id}-format`}
                value={f.value}
                checked={format === f.value}
                onChange={() => setFormat(f.value)}
              />
              {f.label}
            </label>
          ))}
        </fieldset>

        <label className="flex items-center gap-1 text-xs text-muted">
          <input
            type="checkbox"
            checked={plainForm}
            onChange={(e) => setPlainForm(e.target.checked)}
          />
          常体に統一
        </label>

        <label className="flex items-center gap-1 text-xs text-muted">
          <input
            type="checkbox"
            checked={removeFillers}
            onChange={(e) => setRemoveFillers(e.target.checked)}
          />
          冗長表現を削除
        </label>
      </div>

      {result && (
        <section
          aria-label={`${label}の整形結果`}
          className="mt-2 flex flex-col gap-3 rounded-lg border border-accent/40 bg-accent-soft p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">整形案</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={apply}>
                反映する
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
                閉じる
              </Button>
            </div>
          </div>

          <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 text-sm whitespace-pre-wrap font-sans">
            {result.text}
          </pre>

          {result.applied.length > 0 && (
            <ul aria-label="適用した処理" className="flex flex-wrap gap-1.5">
              {result.applied.map((a) => (
                <li
                  key={a}
                  className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted"
                >
                  {a}
                </li>
              ))}
            </ul>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted">ここは自分で判断してください</h4>
              <ul aria-label="改善の提案" className="mt-1 flex flex-col gap-1">
                {result.suggestions.map((s) => (
                  <li key={s} className="text-xs leading-relaxed">
                    ・{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

/**
 * 1行1項目の欄を PolishField で編集する。
 * 配列を直に編集すると入力中の空行が消えて改行できないので、
 * 編集中はテキストを持ち主にして、配列はそこから導出する。
 */
export const PolishLinesField = ({
  value,
  onChange,
  ...rest
}: Omit<Props, "value" | "onChange"> & {
  value: string[];
  onChange: (next: string[]) => void;
}) => {
  const [text, setText] = useState(() => arrayToLines(value));

  return (
    <PolishField
      {...rest}
      value={text}
      onChange={(next) => {
        setText(next);
        onChange(linesToArray(next));
      }}
    />
  );
};
