"use client";

import { useId, useMemo, useState } from "react";
import { SKILL_LEVEL_LABELS } from "@/lib/profile/career";
import type { Skill, SkillLevel } from "@/lib/profile/types";
import {
  CATEGORY_LABELS,
  findEntry,
  resolveSlug,
  searchCatalog,
  toCustomSlug,
} from "@/lib/skills/catalog";
import { TechIcon } from "./tech-icon";
import { Button, EmptyState, Select, TextInput } from "./ui";

const LEVELS: SkillLevel[] = [1, 2, 3, 4, 5];

/** 追加した直後の値。あとで直せるので、いちばん多い「実務で使える・1年」から始める。 */
const DEFAULT_LEVEL: SkillLevel = 3;
const DEFAULT_YEARS = 1;

type Props = {
  value: Skill[];
  onChange: (next: Skill[]) => void;
};

/**
 * スキルの棚卸し。
 * 「検索して押すだけで積まれる」ことを最優先にしていて、
 * 熟練度と年数は既定値で入るので後から直せばいい。
 */
export const SkillPicker = ({ value, onChange }: Props) => {
  const [query, setQuery] = useState("");
  const searchId = useId();

  const results = useMemo(() => searchCatalog(query), [query]);
  const selectedSlugs = new Set(value.map((s) => s.slug));

  // カタログに載っている技術なら、自由入力の追加ボタンは出さない（二重登録の元になる）。
  const trimmed = query.trim();
  const customSlug = toCustomSlug(trimmed);
  const canAddCustom = Boolean(trimmed) && !resolveSlug(trimmed) && !selectedSlugs.has(customSlug);

  const add = (slug: string, label: string) => {
    if (selectedSlugs.has(slug)) return;
    onChange([...value, { slug, label, level: DEFAULT_LEVEL, years: DEFAULT_YEARS }]);
    setQuery("");
  };

  const patch = (slug: string, change: Partial<Skill>) => {
    onChange(value.map((s) => (s.slug === slug ? { ...s, ...change } : s)));
  };

  const remove = (slug: string) => {
    onChange(value.filter((s) => s.slug !== slug));
  };

  /** Enter で先頭の候補を積む。検索して押す往復を省くため。 */
  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    const top = results.find((r) => !selectedSlugs.has(r.slug));
    if (top) add(top.slug, top.label);
    else if (canAddCustom) add(customSlug, trimmed);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={searchId} className="text-sm font-medium">
          技術を検索して追加
        </label>
        <TextInput
          id={searchId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="ts, k8s, rails, next.js…"
          autoComplete="off"
        />
        <p className="text-xs text-muted">
          略称でも引けます。Enter で先頭の候補が入ります。
        </p>
      </div>

      <p className="sr-only" aria-live="polite">
        {trimmed ? `${results.length}件の候補` : ""}
      </p>

      <div className="flex flex-wrap gap-2">
        {results.map((entry) => {
          const added = selectedSlugs.has(entry.slug);
          return (
            <button
              key={entry.slug}
              type="button"
              disabled={added}
              onClick={() => add(entry.slug, entry.label)}
              aria-label={added ? `${entry.label}（追加済み）` : `${entry.label} を追加`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent hover:bg-accent-soft disabled:pointer-events-none disabled:opacity-40"
            >
              <TechIcon slug={entry.slug} label={entry.label} size={16} decorative />
              <span>{entry.label}</span>
              <span className="text-xs text-muted">{CATEGORY_LABELS[entry.category]}</span>
            </button>
          );
        })}

        {canAddCustom && (
          <Button size="sm" variant="outline" onClick={() => add(customSlug, trimmed)}>
            「{trimmed}」を自分で追加
          </Button>
        )}
      </div>

      {value.length === 0 ? (
        <EmptyState>まだスキルがありません。上の検索から積んでいってください。</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {value.map((skill) => (
            <li
              key={skill.slug}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <TechIcon slug={skill.slug} label={skill.label} size={22} decorative />
              <span className="mr-auto min-w-24 text-sm font-medium">{skill.label}</span>

              <Select
                aria-label={`${skill.label} の熟練度`}
                value={skill.level}
                onChange={(e) => patch(skill.slug, { level: Number(e.target.value) as SkillLevel })}
                className="w-auto min-w-52"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level} / {SKILL_LEVEL_LABELS[level]}
                  </option>
                ))}
              </Select>

              <span className="inline-flex items-center gap-1.5">
                <TextInput
                  aria-label={`${skill.label} の経験年数`}
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={skill.years}
                  onChange={(e) =>
                    patch(skill.slug, { years: Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted">年</span>
              </span>

              <Button
                size="sm"
                variant="danger"
                aria-label={`${skill.label} を削除`}
                onClick={() => remove(skill.slug)}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted">
          {value.length}件登録済み
          {value.some((s) => !findEntry(s.slug)) && "（カタログに無い技術は頭文字で表示されます）"}
        </p>
      )}
    </div>
  );
};
