import { z } from "zod";

/** 公開 URL の一部になるので、英数字とハイフンだけに絞る。 */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "3文字以上にしてください")
  .max(40, "40文字以内にしてください")
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "英小文字・数字・ハイフンのみ（先頭と末尾はハイフン不可）");

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "YYYY-MM 形式で入力してください");

const nullableUrl = z
  .union([z.string().trim().url("URL の形式が不正です"), z.literal(""), z.null()])
  .transform((v) => (v ? v : null));

export const skillSchema = z.object({
  slug: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(60),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  years: z.number().min(0).max(60),
});

export const experienceSchema = z
  .object({
    id: z.string().min(1),
    company: z.string().trim().min(1, "会社名は必須です").max(120),
    role: z.string().trim().max(120).default(""),
    startedAt: yearMonth,
    endedAt: z.union([yearMonth, z.null()]).default(null),
    summary: z.string().max(2000).default(""),
    highlights: z.array(z.string().max(300)).max(20).default([]),
    stack: z.array(z.string().max(60)).max(40).default([]),
  })
  .refine((e) => e.endedAt === null || e.endedAt >= e.startedAt, {
    message: "終了年月が開始年月より前になっています",
    path: ["endedAt"],
  });

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "プロジェクト名は必須です").max(120),
  description: z.string().max(2000).default(""),
  url: nullableUrl,
  repo: z
    .union([z.string().trim().regex(/^[\w.-]+\/[\w.-]+$/, "owner/repo 形式で入力してください"), z.literal(""), z.null()])
    .transform((v) => (v ? v : null)),
  imageUrl: nullableUrl,
  videoUrl: nullableUrl,
  tags: z.array(z.string().max(40)).max(20).default([]),
  featured: z.boolean().default(false),
});

export const profileInputSchema = z.object({
  slug: slugSchema,
  displayName: z.string().trim().min(1, "表示名は必須です").max(80),
  headline: z.string().trim().max(160).default(""),
  bio: z.string().max(4000).default(""),
  location: z
    .union([z.string().trim().max(80), z.null()])
    .transform((v) => (v ? v : null)),
  links: z.object({
    github: z
      .union([z.string().trim().regex(/^[A-Za-z0-9-]{1,39}$/, "GitHub ユーザー名の形式が不正です"), z.literal(""), z.null()])
      .transform((v) => (v ? v : null)),
    x: z
      .union([z.string().trim().regex(/^[A-Za-z0-9_]{1,15}$/, "X のユーザー名の形式が不正です"), z.literal(""), z.null()])
      .transform((v) => (v ? v : null)),
    website: nullableUrl,
    email: z
      .union([z.string().trim().email("メールアドレスの形式が不正です"), z.literal(""), z.null()])
      .transform((v) => (v ? v : null)),
  }),
  skills: z.array(skillSchema).max(80),
  experiences: z.array(experienceSchema).max(40),
  projects: z.array(projectSchema).max(60),
  published: z.boolean().default(false),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
