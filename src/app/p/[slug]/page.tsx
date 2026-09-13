import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { readEditToken } from "@/lib/edit-token";
import { getRepository } from "@/lib/repo";

export async function generateMetadata({
  params,
}: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getRepository().findBySlug(slug);
  if (!profile) return { title: "見つかりませんでした" };

  return {
    title: profile.displayName,
    description: profile.headline || profile.bio.slice(0, 120) || undefined,
    // 非公開のページは検索結果に出さない。
    robots: profile.published ? undefined : { index: false, follow: false },
  };
}

export default async function ProfilePage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const profile = await getRepository().findBySlug(slug);
  if (!profile) notFound();

  // 未公開でも作成者本人には見せる（下書きの確認用）。
  const isOwner = (await readEditToken(slug)) !== null;
  if (!profile.published && !isOwner) notFound();

  return (
    <div className="flex flex-col gap-8">
      {isOwner && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-strong px-4 py-3 text-sm">
          <span className="mr-auto">
            {profile.published ? "このページは公開されています。" : "このページは非公開です。あなたにだけ見えています。"}
          </span>
          <Link href={`/edit/${slug}`} className="font-medium text-accent underline">
            編集する
          </Link>
        </div>
      )}

      <ProfileView profile={profile} />
    </div>
  );
}
