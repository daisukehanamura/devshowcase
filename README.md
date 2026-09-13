# devshowcase

スキルと経歴を登録して、そのままポートフォリオとして公開できるサービスです。

転職のたびに職務経歴書を書き直す作業をやめたくて作っています。登録しておけば公開ページが出来上がるので、棚卸しの結果をそのまま人に見せられます。

## 何ができるか

**技術の登録が速い**
略称で検索して押すだけで積まれます。`ts` で TypeScript、`k8s` で Kubernetes、`rails` で Ruby on Rails が先頭に出ます。Enter キーで先頭の候補が入るので、検索欄から手を離さずに棚卸しできます。カタログに無い技術（社内フレームワークなど）も自由入力で登録できます。

**文章を整形してから出せる**
雑に書いた文章を「整形する」で整えます。敬体（ですます）を常体に寄せ、冗長表現を落とし、箇条書きに割ります。動詞の活用は音便まで面倒を見るので、「書きました」は「書いた」に、「固まりませんでした」は「固まらなかった」になります。

整形は**案を見せるだけで、勝手に上書きしません**。何を直したかを並べて表示し、「数値が入っていません」「担当した・対応したで止まっています」のような機械では判断できない指摘は別枠で出します。反映するかどうかは書いた本人が決めます。

**技術が見た目で伝わる**
登録した技術は simple-icons のロゴ付きで並びます。経歴ごとに使った技術を紐づけられるので、「どの現場で何を使ったか」が一目で分かります。

**経歴の期間を正しく数える**
副業や兼業で在籍期間が重なっていても、単純な足し算にはしません。期間をマージしてから実働年数を出します。

## 技術構成

| | |
|---|---|
| フレームワーク | Next.js 16（App Router / Turbopack） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| 検証 | Zod |
| 保存先 | Supabase（未設定ならインメモリ） |
| テスト | Vitest + Testing Library |
| ロゴ | simple-icons（使うものだけ `.ts` に焼き込み） |

Vercel に気軽にデプロイしたいので Next.js を選んでいます。ロジックは必ずテストを書きながら進める方針です。

## 動かす

```bash
npm install
npm run dev
```

http://localhost:3000 を開いて、右上の「自分のページを作る」から始められます。

**保存先を設定していない場合はメモリ上にだけ保存されます。**開発サーバを止めると消えます。クローンしてすぐ触れることを優先した挙動で、編集画面にもその旨を表示します。

### 保存先（Supabase）を繋ぐ

データを残したい場合は Supabase を用意します。

1. `supabase/migrations/0001_init.sql` を Supabase の SQL Editor に貼って実行する
2. プロジェクトのルートに `.env.local` を作る

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

両方が揃っていると自動的に Supabase を使い、無ければインメモリに落ちます。

テーブルは RLS を有効にしたうえでポリシーを一切作っていません。anon キーからは読み書きできず、すべてのアクセスがサーバ側の service role 経由になります。編集キーをクライアントに晒さないための作りなので、ここは緩めないでください。

### GitHub API のトークン（任意）

`GITHUB_TOKEN` を置くとリポジトリ取得のレート制限が緩みます（未認証だと 60 リクエスト/時で枯れます）。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバ |
| `npm run build` | 本番ビルド |
| `npm test` | テストを一度実行 |
| `npm run test:watch` | テストを監視実行 |
| `npm run typecheck` | 型チェック |
| `npm run lint` | ESLint |
| `npm run gen:icons` | 技術ロゴのデータを再生成 |

### `npm run typecheck` が `/p/[slug]` で落ちるとき

```
src/app/p/[slug]/page.tsx: Type '"/p/[slug]"' does not satisfy the constraint 'AppRoutes'
```

`PageProps<...>` などのルート型は Next.js が `.next` 以下に生成します。開発サーバが起動時に書いた `.next/dev/types` が古いままだと、実際には存在するルートを知らない状態で型チェックが走ってこうなります。ソース側の問題ではありません。

```bash
rm -rf .next/dev/types && npm run typecheck
```

で消えます（`npm run build` は自前で型を生成するので影響を受けません）。

扱える技術を増やしたいときは `scripts/gen-icons.mjs` の `SLUGS` に simple-icons の slug を足して `npm run gen:icons` を実行し、`src/lib/skills/catalog.ts` の `CATALOG` にエントリを追加します。バンドルに 3000 個の SVG を載せたくないので、使うものだけを `.ts` に焼き込む作りです。

## 構成

```
src/
├── app/                    画面とルーティング
│   ├── page.tsx            トップ
│   ├── actions.ts          保存の Server Action
│   ├── edit/               登録・編集画面
│   └── p/[slug]/           公開ページ
├── components/             UI
└── lib/                    画面を持たないロジック
    ├── polish/             文章整形。敬体→常体、動詞の活用、冗長表現の削除
    ├── profile/            型・スキーマ・在籍期間の集計
    ├── skills/             技術カタログと検索、ロゴの色の判定
    ├── github/             リポジトリの取得とポートフォリオ向けの並べ替え
    └── repo/               永続化の抽象（Supabase / インメモリ）
supabase/migrations/        スキーマ
```

ロジックは `lib/` に閉じていて画面に依存しません。整形を AI に差し替えるときも `lib/polish` の中だけで済みます。

テストは `*.test.ts` を隣に置いています。`lib/github` と `lib/repo/supabase.ts` はまだテストがありません（どちらも外部 API を叩く層です）。

## 所有権の扱い

ログイン機構がまだ無いので、暫定的に**編集キー**で持ち主を判断します。

作成時にサーバがトークンを発行し、httpOnly Cookie に置きます。更新時はこれを照合します。ページの JavaScript からは読めません。

このため**作成したブラウザからしか編集できません**。別のブラウザで開くと編集画面の代わりに案内を出します。未公開のページは本人にだけ見え、それ以外には 404 を返します。

## 現状まだやっていないこと

- **文章整形は AI 未接続**です。いまはルールベースで、入力が同じなら必ず同じ結果になります。差し替え口は `lib/polish` に閉じてあります
- **GitHub 連携が画面に繋がっていません。**リポジトリの取得とランキング（`lib/github`）は実装済みですが、UI から呼んでおらず、テストもまだありません
- OG 画像の生成
- ログイン機構
- `lib/github` と `lib/repo/supabase.ts` のテスト
