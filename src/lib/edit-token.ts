import "server-only";
import { cookies } from "next/headers";

/**
 * 編集権限の証明を Cookie で持つ（ログイン機構を入れるまでの暫定）。
 * 作成時にサーバが発行したトークンをそのまま置いておき、更新時に照合する。
 * httpOnly なのでページの JS からは読めない。
 */

const PREFIX = "ds_edit_";
const ONE_YEAR = 60 * 60 * 24 * 365;

export const editCookieName = (slug: string) => `${PREFIX}${slug}`;

const options = () =>
  ({
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR,
    secure: process.env.NODE_ENV === "production",
  });

export const readEditToken = async (slug: string): Promise<string | null> => {
  const jar = await cookies();
  return jar.get(editCookieName(slug))?.value ?? null;
};

export const writeEditToken = async (slug: string, token: string): Promise<void> => {
  const jar = await cookies();
  jar.set(editCookieName(slug), token, options());
};

/** slug を変えたら Cookie も引っ越す。置き忘れると自分のページを編集できなくなる。 */
export const moveEditToken = async (from: string, to: string): Promise<void> => {
  if (from === to) return;
  const jar = await cookies();
  const token = jar.get(editCookieName(from))?.value;
  if (!token) return;
  jar.set(editCookieName(to), token, options());
  jar.delete(editCookieName(from));
};
