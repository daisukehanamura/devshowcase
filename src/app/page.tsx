import Link from "next/link";
import { TechIcon } from "@/components/tech-icon";
import { getRepository } from "@/lib/repo";

const PITCH = [
  {
    title: "棚卸しがだるいのを何とかする",
    body: "技術は略称で検索して押すだけ。「ts」で TypeScript、「k8s」で Kubernetes が出ます。",
  },
  {
    title: "文章は整形してから出す",
    body: "思いついた順に書いて整形ボタンを押すと、常体に揃えて箇条書きに割ります。何を直したかも出ます。",
  },
  {
    title: "技術が見た目で伝わる",
    body: "登録した技術はロゴ付きで並びます。経歴ごとに使った技術も紐づけられます。",
  },
];

/** トップに出す技術ロゴ。何のサービスか一目で分かるように並べる。 */
const SHOWCASE = [
  "typescript",
  "react",
  "nextdotjs",
  "go",
  "rust",
  "python",
  "postgresql",
  "docker",
  "kubernetes",
  "terraform",
  "supabase",
  "vercel",
];

export default async function HomePage() {
  const published = await getRepository().listPublished(12);

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-start gap-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          スキルと経歴を、
          <br />
          見せられる形にする
        </h1>
        <p className="max-w-2xl text-muted">
          転職のたびに職務経歴書を書き直すのをやめるためのサービスです。登録しておけば、公開用の
          ポートフォリオがそのまま出来上がります。
        </p>

        <ul className="flex flex-wrap gap-2" aria-label="対応している技術の例">
          {SHOWCASE.map((slug) => (
            <li key={slug}>
              <TechIcon slug={slug} size={28} />
            </li>
          ))}
        </ul>

        <Link
          href="/edit"
          className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          自分のページを作る
        </Link>
      </section>

      <section aria-labelledby="pitch-heading">
        <h2 id="pitch-heading" className="sr-only">
          できること
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {PITCH.map((p) => (
            <li key={p.title} className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {published.length > 0 && (
        <section aria-labelledby="published-heading">
          <h2 id="published-heading" className="mb-5 text-lg font-semibold tracking-tight">
            公開中のページ
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {published.map((profile) => (
              <li key={profile.slug}>
                <Link
                  href={`/p/${profile.slug}`}
                  className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
                >
                  <span className="font-semibold">{profile.displayName}</span>
                  {profile.headline && (
                    <span className="text-sm text-muted">{profile.headline}</span>
                  )}
                  {profile.skills.length > 0 && (
                    <span className="mt-auto flex flex-wrap gap-1.5 pt-2">
                      {profile.skills.slice(0, 8).map((skill) => (
                        <TechIcon
                          key={skill.slug}
                          slug={skill.slug}
                          label={skill.label}
                          size={18}
                        />
                      ))}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
