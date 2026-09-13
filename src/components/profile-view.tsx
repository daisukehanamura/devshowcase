import {
  experienceMonths,
  formatDuration,
  formatYearMonth,
  sortExperiences,
  sortSkills,
  SKILL_LEVEL_LABELS,
  totalCareerMonths,
} from "@/lib/profile/career";
import { parseVideo, safeImageUrl } from "@/lib/profile/media";
import type { Experience, Profile, Project, Skill } from "@/lib/profile/types";
import { CATEGORY_LABELS, findEntry, type SkillCategory } from "@/lib/skills/catalog";
import { TechIcon } from "./tech-icon";

/** 熟練度を5段の目盛りで出す。数字より並べたときの差が見える。 */
const LevelMeter = ({ level, label }: { level: number; label: string }) => (
  <span
    className="inline-flex items-center gap-0.5"
    title={`${label}: ${SKILL_LEVEL_LABELS[level]}`}
    aria-label={`熟練度 ${level}（${SKILL_LEVEL_LABELS[level]}）`}
  >
    {[1, 2, 3, 4, 5].map((n) => (
      <span
        key={n}
        aria-hidden="true"
        className={`h-1 w-2.5 rounded-full ${n <= level ? "bg-accent" : "bg-border"}`}
      />
    ))}
  </span>
);

/** カタログ外の技術も落とさずに出したいので、分類なしの受け皿を用意する。 */
const OTHER = "other" as const;
type GroupKey = SkillCategory | typeof OTHER;

const CATEGORY_ORDER: GroupKey[] = [
  "language",
  "frontend",
  "backend",
  "data",
  "infra",
  "ai",
  "tool",
  OTHER,
];

const groupLabel = (key: GroupKey) => (key === OTHER ? "その他" : CATEGORY_LABELS[key]);

const groupSkills = (skills: Skill[]): Array<[GroupKey, Skill[]]> => {
  const groups = new Map<GroupKey, Skill[]>();
  for (const skill of sortSkills(skills)) {
    const key: GroupKey = findEntry(skill.slug)?.category ?? OTHER;
    groups.set(key, [...(groups.get(key) ?? []), skill]);
  }
  return CATEGORY_ORDER.filter((k) => groups.has(k)).map((k) => [k, groups.get(k)!]);
};

const SkillSection = ({ skills }: { skills: Skill[] }) => (
  <section aria-labelledby="skills-heading" className="flex flex-col gap-5">
    <h2 id="skills-heading" className="text-lg font-semibold tracking-tight">
      スキル
    </h2>
    {groupSkills(skills).map(([key, group]) => (
      <div key={key}>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted">{groupLabel(key)}</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {group.map((skill) => (
            <li
              key={skill.slug}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <TechIcon slug={skill.slug} label={skill.label} size={24} decorative />
              <span className="mr-auto text-sm font-medium">{skill.label}</span>
              <span className="flex flex-col items-end gap-1">
                <LevelMeter level={skill.level} label={skill.label} />
                <span className="text-[11px] leading-none text-muted">{skill.years}年</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </section>
);

const StackRow = ({ stack, skills }: { stack: string[]; skills: Skill[] }) => {
  if (stack.length === 0) return null;
  const labelOf = (slug: string) =>
    skills.find((s) => s.slug === slug)?.label ?? findEntry(slug)?.label ?? slug;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {stack.map((slug) => (
        <li
          key={slug}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted"
        >
          <TechIcon slug={slug} label={labelOf(slug)} size={13} decorative />
          {labelOf(slug)}
        </li>
      ))}
    </ul>
  );
};

const ExperienceItem = ({ experience, skills }: { experience: Experience; skills: Skill[] }) => {
  const period = `${formatYearMonth(experience.startedAt)} 〜 ${
    experience.endedAt ? formatYearMonth(experience.endedAt) : "現在"
  }`;

  return (
    <li className="relative pl-6">
      {/* 縦線と点で時系列を示す。線は次の項目まで伸ばす。 */}
      <span
        aria-hidden="true"
        className="absolute top-2 left-0 h-full w-px bg-border last:hidden"
      />
      <span
        aria-hidden="true"
        className="absolute top-1.5 left-[-3px] size-[7px] rounded-full bg-accent"
      />

      <div className="flex flex-col gap-2 pb-8">
        <div>
          <h3 className="font-semibold">{experience.company}</h3>
          {experience.role && <p className="text-sm text-muted">{experience.role}</p>}
          <p className="text-xs text-muted">
            {period}
            <span className="mx-1.5">·</span>
            {formatDuration(experienceMonths(experience))}
          </p>
        </div>

        {experience.summary && (
          <p className="text-sm whitespace-pre-wrap">{experience.summary}</p>
        )}

        {experience.highlights.length > 0 && (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {experience.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}

        <StackRow stack={experience.stack} skills={skills} />
      </div>
    </li>
  );
};

const ExperienceSection = ({ experiences, skills }: { experiences: Experience[]; skills: Skill[] }) => (
  <section aria-labelledby="experiences-heading">
    <h2 id="experiences-heading" className="mb-5 text-lg font-semibold tracking-tight">
      経歴
    </h2>
    <ul>
      {sortExperiences(experiences).map((experience) => (
        <ExperienceItem key={experience.id} experience={experience} skills={skills} />
      ))}
    </ul>
  </section>
);

const ProjectMedia = ({ project }: { project: Project }) => {
  const video = parseVideo(project.videoUrl);
  const image = safeImageUrl(project.imageUrl);

  if (video?.kind === "file") {
    return (
      <video
        src={video.src}
        controls
        preload="metadata"
        className="aspect-video w-full rounded-lg border border-border bg-surface-strong object-cover"
      />
    );
  }

  if (video?.kind === "embed") {
    return (
      <iframe
        src={video.src}
        title={`${project.name} のデモ動画（${video.title}）`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-lg border border-border bg-surface-strong"
      />
    );
  }

  if (image) {
    return (
      // 任意のホストの画像を受けるので next/image は使わない（remotePatterns を開放したくない）。
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={`${project.name} のスクリーンショット`}
        loading="lazy"
        className="aspect-video w-full rounded-lg border border-border bg-surface-strong object-cover"
      />
    );
  }

  return null;
};

const ProjectCard = ({ project }: { project: Project }) => (
  <li
    className={`flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 ${
      project.featured ? "sm:col-span-2" : ""
    }`}
  >
    <ProjectMedia project={project} />

    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">{project.name}</h3>
      {project.description && (
        <p className="text-sm whitespace-pre-wrap text-muted">{project.description}</p>
      )}

      {project.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-surface-strong px-2 py-0.5 text-xs text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {project.url && (
          <a href={project.url} className="text-accent underline" target="_blank" rel="noreferrer">
            見に行く
          </a>
        )}
        {project.repo && (
          <a
            href={`https://github.com/${project.repo}`}
            className="text-accent underline"
            target="_blank"
            rel="noreferrer"
          >
            {project.repo}
          </a>
        )}
        {parseVideo(project.videoUrl)?.kind === "link" && (
          <a
            href={project.videoUrl ?? ""}
            className="text-accent underline"
            target="_blank"
            rel="noreferrer"
          >
            デモ動画
          </a>
        )}
      </div>
    </div>
  </li>
);

const ProjectSection = ({ projects }: { projects: Project[] }) => (
  <section aria-labelledby="projects-heading">
    <h2 id="projects-heading" className="mb-5 text-lg font-semibold tracking-tight">
      プロジェクト
    </h2>
    <ul className="grid gap-4 sm:grid-cols-2">
      {/* featured を先に出す。同じ並びのままだと「一番上に出す」が効かない。 */}
      {[...projects]
        .sort((a, b) => Number(b.featured) - Number(a.featured))
        .map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
    </ul>
  </section>
);

const LINK_LABELS = { github: "GitHub", x: "X", website: "Web サイト", email: "メール" } as const;

const linkHref = (kind: keyof typeof LINK_LABELS, value: string) => {
  if (kind === "github") return `https://github.com/${value}`;
  if (kind === "x") return `https://x.com/${value}`;
  if (kind === "email") return `mailto:${value}`;
  return value;
};

const Links = ({ links }: { links: Profile["links"] }) => {
  const entries = (Object.keys(LINK_LABELS) as Array<keyof typeof LINK_LABELS>)
    .map((kind) => ({ kind, value: links[kind] }))
    .filter((e): e is { kind: keyof typeof LINK_LABELS; value: string } => Boolean(e.value));

  if (entries.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {entries.map(({ kind, value }) => (
        <li key={kind}>
          <a
            href={linkHref(kind, value)}
            target={kind === "email" ? undefined : "_blank"}
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm transition-colors hover:border-accent"
          >
            {kind === "github" || kind === "x" ? (
              <TechIcon
                slug={kind === "github" ? "github" : "x"}
                label={LINK_LABELS[kind]}
                size={14}
                decorative
              />
            ) : null}
            {LINK_LABELS[kind]}
          </a>
        </li>
      ))}
    </ul>
  );
};

/**
 * 公開プロフィール。
 * 経歴とスキルは保存順ではなく「読ませたい順」に並べ替えてから出す。
 */
export const ProfileView = ({ profile }: { profile: Profile }) => {
  const careerMonths = totalCareerMonths(profile.experiences);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{profile.displayName}</h1>
          {profile.headline && <p className="mt-1 text-lg text-muted">{profile.headline}</p>}
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {profile.location && (
            <div className="flex gap-1.5">
              <dt>拠点</dt>
              <dd className="text-foreground">{profile.location}</dd>
            </div>
          )}
          {careerMonths > 0 && (
            <div className="flex gap-1.5">
              <dt>実務経験</dt>
              {/* 期間が重なる経歴はマージ済みなので、単純合計より実態に近い。 */}
              <dd className="text-foreground">{formatDuration(careerMonths)}</dd>
            </div>
          )}
          {profile.skills.length > 0 && (
            <div className="flex gap-1.5">
              <dt>技術</dt>
              <dd className="text-foreground">{profile.skills.length}件</dd>
            </div>
          )}
        </dl>

        {profile.bio && <p className="max-w-2xl whitespace-pre-wrap">{profile.bio}</p>}

        <Links links={profile.links} />
      </header>

      {profile.skills.length > 0 && <SkillSection skills={profile.skills} />}
      {profile.experiences.length > 0 && (
        <ExperienceSection experiences={profile.experiences} skills={profile.skills} />
      )}
      {profile.projects.length > 0 && <ProjectSection projects={profile.projects} />}
    </div>
  );
};
