import type { Metadata } from "next";
import { saveProfile } from "@/app/actions";
import { ProfileEditor } from "@/components/profile-editor";
import { emptyProfileInput } from "@/lib/profile/draft";
import { isUsingSupabase } from "@/lib/repo";

export const metadata: Metadata = { title: "ページを作る" };

export default function NewProfilePage() {
  return (
    <ProfileEditor
      initial={emptyProfileInput()}
      originalSlug={null}
      action={saveProfile}
      persistent={isUsingSupabase()}
    />
  );
}
