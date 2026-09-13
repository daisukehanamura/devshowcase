"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import {
  newExperience,
  newProject,
  type ExperienceDraft,
  type ProjectDraft,
} from "@/lib/profile/draft";
import { errorCount, type FieldErrors } from "@/lib/profile/errors";
import { initialSaveState, type SavePayload, type SaveState } from "@/lib/profile/save";
import type { ProfileInput } from "@/lib/profile/schema";
import { ExperienceEditor } from "./experience-editor";
import { PolishField } from "./polish-field";
import { ProjectEditor } from "./project-editor";
import { SkillPicker } from "./skill-picker";
import { Button, Card, EmptyState, Field, SectionHeading, TextInput } from "./ui";

type Props = {
  initial: ProfileInput;
  /** 新規なら null。既存の編集なら変更前の slug。 */
  originalSlug: string | null;
  action: (prev: SaveState, payload: SavePayload) => Promise<SaveState>;
  /** 保存先が用意されているか。無いと再起動で消えるので、黙って保存させない。 */
  persistent: boolean;
};

const NO_ERRORS: FieldErrors = {};

/**
 * プロフィール編集画面。
 * 下書きは丸ごとこのコンポーネントが持ち、保存のときだけサーバへ送る。
 * 途中で検証しないのは、書いている最中に赤くなるのが気が散るため。
 */
export const ProfileEditor = ({ initial, originalSlug, action, persistent }: Props) => {
  const [profile, setProfile] = useState(initial);
  const [state, save, pending] = useActionState(action, initialSaveState);

  const errors = state.status === "error" ? state.errors : NO_ERRORS;
  // 新規作成が通った後は、次の保存を「更新」にしないと同じ slug で二重に作ってしまう。
  const effectiveOriginalSlug = state.status === "ok" ? state.slug : originalSlug;

  const patch = (change: Partial<ProfileInput>) => setProfile((p) => ({ ...p, ...change }));

  const patchAt = <T,>(list: T[], index: number, next: T): T[] =>
    list.map((item, i) => (i === index ? next : item));

  const onSave = () => startTransition(() => save({ originalSlug: effectiveOriginalSlug, profile }));

  return (
    <div className="flex flex-col gap-6 pb-28">
      {!persistent && (
        <p className="rounded-lg border border-border bg-surface-strong px-4 py-3 text-sm">
          保存先（Supabase）が未設定なので、いまはメモリ上にだけ保存されます。開発サーバを止めると消えます。
        </p>
      )}

      <Card>
        <SectionHeading
          title="公開設定"
          description="公開ページの URL と、公開するかどうかを決めます。"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="ページの URL"
            error={errors["slug"]}
            hint="英小文字・数字・ハイフン。あとから変えられます。"
            required
          >
            {(id) => (
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-sm text-muted">/p/</span>
                <TextInput
                  id={id}
                  value={profile.slug}
                  invalid={Boolean(errors["slug"])}
                  onChange={(e) => patch({ slug: e.target.value })}
                  placeholder="hanamaru"
                  autoComplete="off"
                />
              </div>
            )}
          </Field>

          {/* チェックボックス自身がラベルを持つので Field は挟まない。 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">公開状態</span>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={profile.published}
                onChange={(e) => patch({ published: e.target.checked })}
              />
              このページを公開する
            </label>
            <p className="text-xs text-muted">非公開のあいだは自分だけが見られます。</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeading title="基本情報" description="最初に目に入るところです。" />
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="表示名" error={errors["displayName"]} required>
              {(id) => (
                <TextInput
                  id={id}
                  value={profile.displayName}
                  invalid={Boolean(errors["displayName"])}
                  onChange={(e) => patch({ displayName: e.target.value })}
                  placeholder="はなまる"
                />
              )}
            </Field>

            <Field label="拠点" error={errors["location"]}>
              {(id) => (
                <TextInput
                  id={id}
                  value={profile.location ?? ""}
                  onChange={(e) => patch({ location: e.target.value })}
                  placeholder="東京 / フルリモート"
                />
              )}
            </Field>
          </div>

          <Field
            label="肩書き"
            error={errors["headline"]}
            hint="1行で。「Go と TypeScript でバックエンドを作っています」くらいの粒度が読まれます。"
          >
            {(id) => (
              <TextInput
                id={id}
                value={profile.headline}
                invalid={Boolean(errors["headline"])}
                onChange={(e) => patch({ headline: e.target.value })}
                placeholder="バックエンドエンジニア / 決済基盤"
              />
            )}
          </Field>

          <PolishField
            label="自己紹介"
            defaultFormat="prose"
            rows={5}
            value={profile.bio}
            error={errors["bio"]}
            onChange={(bio) => patch({ bio })}
            hint="思いついた順に書いて、整形ボタンで整えてください。"
            placeholder="受託開発を5年やったあと、いまは自社サービスの決済まわりを見ています。"
          />
        </div>
      </Card>

      <Card>
        <SectionHeading title="リンク" description="連絡先と、見てほしい場所。" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GitHub" error={errors["links.github"]} hint="ユーザー名だけ">
            {(id) => (
              <TextInput
                id={id}
                value={profile.links.github ?? ""}
                invalid={Boolean(errors["links.github"])}
                onChange={(e) => patch({ links: { ...profile.links, github: e.target.value } })}
                placeholder="dellgreen"
              />
            )}
          </Field>

          <Field label="X" error={errors["links.x"]} hint="ユーザー名だけ（@ は不要）">
            {(id) => (
              <TextInput
                id={id}
                value={profile.links.x ?? ""}
                invalid={Boolean(errors["links.x"])}
                onChange={(e) => patch({ links: { ...profile.links, x: e.target.value } })}
                placeholder="hanamaru"
              />
            )}
          </Field>

          <Field label="Web サイト" error={errors["links.website"]}>
            {(id) => (
              <TextInput
                id={id}
                type="url"
                value={profile.links.website ?? ""}
                invalid={Boolean(errors["links.website"])}
                onChange={(e) => patch({ links: { ...profile.links, website: e.target.value } })}
                placeholder="https://example.com"
              />
            )}
          </Field>

          <Field label="メールアドレス" error={errors["links.email"]}>
            {(id) => (
              <TextInput
                id={id}
                type="email"
                value={profile.links.email ?? ""}
                invalid={Boolean(errors["links.email"])}
                onChange={(e) => patch({ links: { ...profile.links, email: e.target.value } })}
                placeholder="you@example.com"
              />
            )}
          </Field>
        </div>
      </Card>

      <Card>
        <SectionHeading
          title="スキル"
          description="ロゴ付きで並びます。まず思いつくものを全部積んでから、熟練度を直すのが速いです。"
        />
        <SkillPicker value={profile.skills} onChange={(skills) => patch({ skills })} />
      </Card>

      <section>
        <SectionHeading
          title="経歴"
          description="新しいものから並べ替えて表示されるので、入力順は気にしなくて大丈夫です。"
          action={
            <Button
              size="sm"
              onClick={() => patch({ experiences: [...profile.experiences, newExperience()] })}
            >
              経歴を追加
            </Button>
          }
        />
        <div className="flex flex-col gap-4">
          {profile.experiences.length === 0 ? (
            <EmptyState>まだ経歴がありません。「経歴を追加」から書き始めてください。</EmptyState>
          ) : (
            profile.experiences.map((experience, index) => (
              <ExperienceEditor
                key={experience.id}
                value={experience}
                prefix={`experiences.${index}`}
                errors={errors}
                availableSkills={profile.skills}
                onChange={(next: ExperienceDraft) =>
                  patch({ experiences: patchAt(profile.experiences, index, next) })
                }
                onRemove={() =>
                  patch({ experiences: profile.experiences.filter((_, i) => i !== index) })
                }
              />
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHeading
          title="プロジェクト"
          description="スクリーンショットや動画の URL を入れると、公開ページで大きく出ます。"
          action={
            <Button
              size="sm"
              onClick={() => patch({ projects: [...profile.projects, newProject()] })}
            >
              プロジェクトを追加
            </Button>
          }
        />
        <div className="flex flex-col gap-4">
          {profile.projects.length === 0 ? (
            <EmptyState>
              まだプロジェクトがありません。GitHub のリポジトリを載せるのもここです。
            </EmptyState>
          ) : (
            profile.projects.map((project, index) => (
              <ProjectEditor
                key={project.id}
                value={project}
                prefix={`projects.${index}`}
                errors={errors}
                onChange={(next: ProjectDraft) =>
                  patch({ projects: patchAt(profile.projects, index, next) })
                }
                onRemove={() => patch({ projects: profile.projects.filter((_, i) => i !== index) })}
              />
            ))
          )}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-auto text-sm" role="status" aria-live="polite">
            {state.status === "ok" && (
              <span>
                {state.message}{" "}
                <Link href={`/p/${state.slug}`} className="font-medium text-accent underline">
                  公開ページを見る
                </Link>
              </span>
            )}
            {state.status === "error" && (
              <span className="text-danger">
                {state.message}
                {errorCount(errors) > 0 && `（${errorCount(errors)}件）`}
              </span>
            )}
            {state.status === "idle" && (
              <span className="text-muted">書けたところまでで保存できます。</span>
            )}
          </div>

          <Button variant="primary" onClick={onSave} disabled={pending}>
            {pending ? "保存中…" : effectiveOriginalSlug ? "保存する" : "作成する"}
          </Button>
        </div>
      </div>
    </div>
  );
};
