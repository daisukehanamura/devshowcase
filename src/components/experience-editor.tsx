"use client";

import { currentYearMonth } from "@/lib/profile/career";
import type { ExperienceDraft } from "@/lib/profile/draft";
import type { FieldErrors } from "@/lib/profile/errors";
import type { Skill } from "@/lib/profile/types";
import { PolishField, PolishLinesField } from "./polish-field";
import { TechIcon } from "./tech-icon";
import { Button, Card, Field, TextInput } from "./ui";

type Props = {
  value: ExperienceDraft;
  /** エラーを引くための接頭辞。`experiences.0` のような形。 */
  prefix: string;
  errors: FieldErrors;
  /** 登録済みスキルから選ばせる。ここで新しい技術は増やさない。 */
  availableSkills: Skill[];
  onChange: (next: ExperienceDraft) => void;
  onRemove: () => void;
};

export const ExperienceEditor = ({
  value,
  prefix,
  errors,
  availableSkills,
  onChange,
  onRemove,
}: Props) => {
  const patch = (change: Partial<ExperienceDraft>) => onChange({ ...value, ...change });
  const error = (field: string) => errors[`${prefix}.${field}`];
  const isCurrent = value.endedAt === null;
  const title = value.company.trim() || "新しい経歴";

  const toggleStack = (slug: string) =>
    patch({
      stack: value.stack.includes(slug)
        ? value.stack.filter((s) => s !== slug)
        : [...value.stack, slug],
    });

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <Button size="sm" variant="danger" onClick={onRemove} aria-label={`${title} を削除`}>
          削除
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="会社・組織" error={error("company")} required>
          {(id) => (
            <TextInput
              id={id}
              value={value.company}
              invalid={Boolean(error("company"))}
              onChange={(e) => patch({ company: e.target.value })}
              placeholder="株式会社サンプル"
            />
          )}
        </Field>

        <Field label="役割・ポジション" error={error("role")}>
          {(id) => (
            <TextInput
              id={id}
              value={value.role}
              onChange={(e) => patch({ role: e.target.value })}
              placeholder="バックエンドエンジニア / テックリード"
            />
          )}
        </Field>

        <Field label="開始年月" error={error("startedAt")} required>
          {(id) => (
            <TextInput
              id={id}
              type="month"
              value={value.startedAt}
              invalid={Boolean(error("startedAt"))}
              onChange={(e) => patch({ startedAt: e.target.value })}
            />
          )}
        </Field>

        <Field label="終了年月" error={error("endedAt")}>
          {(id) => (
            <div className="flex items-center gap-3">
              <TextInput
                id={id}
                type="month"
                value={value.endedAt ?? ""}
                disabled={isCurrent}
                invalid={Boolean(error("endedAt"))}
                onChange={(e) => patch({ endedAt: e.target.value })}
              />
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) => patch({ endedAt: e.target.checked ? null : currentYearMonth() })}
                />
                在籍中
              </label>
            </div>
          )}
        </Field>
      </div>

      <PolishField
        label="どんな仕事だったか"
        defaultFormat="prose"
        rows={4}
        value={value.summary}
        error={error("summary")}
        onChange={(summary) => patch({ summary })}
        hint="チーム規模・技術構成・自分の立ち位置あたりが書けていると伝わります。"
        placeholder="自社ECのバックエンドを5人チームで開発していました。"
      />

      <PolishLinesField
        label="やったこと・実績"
        defaultFormat="bullets"
        rows={5}
        value={value.highlights}
        onChange={(highlights) => patch({ highlights })}
        hint="1行に1つ。整形すると箇条書きに割れます。"
        placeholder={"決済APIのレスポンスを800ms→120msに短縮\nCI を GitHub Actions に移行して実行時間を半分にした"}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">使った技術</span>
        {availableSkills.length === 0 ? (
          <p className="text-xs text-muted">
            先に「スキル」で技術を登録すると、ここから選べるようになります。
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((skill) => {
              const on = value.stack.includes(skill.slug);
              return (
                <button
                  key={skill.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleStack(skill.slug)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    on
                      ? "border-accent bg-accent-soft font-medium"
                      : "border-border bg-surface text-muted hover:border-accent"
                  }`}
                >
                  <TechIcon slug={skill.slug} label={skill.label} size={14} decorative />
                  {skill.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
