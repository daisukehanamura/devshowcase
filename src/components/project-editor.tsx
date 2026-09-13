"use client";

import { useState } from "react";
import { formatTags, parseTags, type ProjectDraft } from "@/lib/profile/draft";
import type { FieldErrors } from "@/lib/profile/errors";
import { PolishField } from "./polish-field";
import { Button, Card, Field, TextInput } from "./ui";

/**
 * タグ欄。入力中のテキストをこちらで持つ。
 * 配列から毎回組み直すと「, 」を打った瞬間に区切りが消えて打ち直しになる。
 */
const TagsInput = ({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) => {
  const [text, setText] = useState(() => formatTags(value));

  return (
    <TextInput
      id={id}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseTags(e.target.value));
      }}
    />
  );
};

type Props = {
  value: ProjectDraft;
  prefix: string;
  errors: FieldErrors;
  onChange: (next: ProjectDraft) => void;
  onRemove: () => void;
};

export const ProjectEditor = ({ value, prefix, errors, onChange, onRemove }: Props) => {
  const patch = (change: Partial<ProjectDraft>) => onChange({ ...value, ...change });
  const error = (field: string) => errors[`${prefix}.${field}`];
  const title = value.name.trim() || "新しいプロジェクト";

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-muted">
            <input
              type="checkbox"
              checked={value.featured}
              onChange={(e) => patch({ featured: e.target.checked })}
            />
            一番上に出す
          </label>
          <Button size="sm" variant="danger" onClick={onRemove} aria-label={`${title} を削除`}>
            削除
          </Button>
        </div>
      </div>

      <Field label="プロジェクト名" error={error("name")} required>
        {(id) => (
          <TextInput
            id={id}
            value={value.name}
            invalid={Boolean(error("name"))}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="devshowcase"
          />
        )}
      </Field>

      <PolishField
        label="どんなものか"
        defaultFormat="prose"
        rows={3}
        value={value.description}
        error={error("description")}
        onChange={(description) => patch({ description })}
        placeholder="職務経歴とポートフォリオをまとめて公開できるサービス。"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="公開 URL" error={error("url")} hint="デモやサービスのURL">
          {(id) => (
            <TextInput
              id={id}
              type="url"
              value={value.url ?? ""}
              invalid={Boolean(error("url"))}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="https://example.com"
            />
          )}
        </Field>

        <Field label="リポジトリ" error={error("repo")} hint="owner/repo の形式">
          {(id) => (
            <TextInput
              id={id}
              value={value.repo ?? ""}
              invalid={Boolean(error("repo"))}
              onChange={(e) => patch({ repo: e.target.value })}
              placeholder="dellgreen/devshowcase"
            />
          )}
        </Field>

        <Field label="スクリーンショット URL" error={error("imageUrl")}>
          {(id) => (
            <TextInput
              id={id}
              type="url"
              value={value.imageUrl ?? ""}
              invalid={Boolean(error("imageUrl"))}
              onChange={(e) => patch({ imageUrl: e.target.value })}
              placeholder="https://example.com/screenshot.png"
            />
          )}
        </Field>

        <Field label="デモ動画 URL" error={error("videoUrl")} hint="mp4 か YouTube のURL">
          {(id) => (
            <TextInput
              id={id}
              type="url"
              value={value.videoUrl ?? ""}
              invalid={Boolean(error("videoUrl"))}
              onChange={(e) => patch({ videoUrl: e.target.value })}
              placeholder="https://youtu.be/..."
            />
          )}
        </Field>
      </div>

      <Field label="タグ" error={error("tags")} hint="カンマか空白で区切ります">
        {(id) => (
          <TagsInput
            id={id}
            value={value.tags}
            onChange={(tags) => patch({ tags })}
            placeholder="Next.js, Supabase, 個人開発"
          />
        )}
      </Field>
    </Card>
  );
};
