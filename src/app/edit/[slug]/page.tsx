import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveProfile } from "@/app/actions";
import { ProfileEditor } from "@/components/profile-editor";
import { readEditToken } from "@/lib/edit-token";
import { toProfileInput } from "@/lib/profile/draft";
import { getRepository, isUsingSupabase } from "@/lib/repo";
import { InvalidTokenError, ProfileNotFoundError } from "@/lib/repo/types";

export const metadata: Metadata = { title: "ページを編集する" };

export default async function EditProfilePage({ params }: PageProps<"/edit/[slug]">) {
  const { slug } = await params;
  const editToken = await readEditToken(slug);

  // 編集キーは作成したブラウザの Cookie にしかない。無いなら編集画面を出さない。
  if (!editToken) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-2xl font-bold tracking-tight">このページは編集できません</h1>
        <p className="text-muted">
          編集キーがこのブラウザに見つかりませんでした。作成したときと同じブラウザから開いてください。
        </p>
        <Link href={`/p/${slug}`} className="text-accent underline">
          公開ページを見る
        </Link>
      </div>
    );
  }

  // try で囲むのは取得だけ。中で JSX を組むと描画中の例外まで飲み込んでしまう。
  let stored;
  try {
    stored = await getRepository().findForEdit(slug, editToken);
  } catch (error) {
    if (error instanceof ProfileNotFoundError || error instanceof InvalidTokenError) notFound();
    throw error;
  }

  return (
    <ProfileEditor
      // editToken は toProfileInput で落ちるので、クライアントには渡らない。
      initial={toProfileInput(stored)}
      originalSlug={slug}
      action={saveProfile}
      persistent={isUsingSupabase()}
    />
  );
}
