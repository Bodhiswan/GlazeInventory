// TODO(cleanup): legacy route — kept as a redirect while external links may
// still point here. Safe to delete (along with firing-image-form.tsx in this folder
// and uploadCommunityFiringImageAction in src/app/actions/community.ts) once we're
// confident nothing links to /contribute/firing-image anymore. See AGENTS.md "Pending cleanup".
import { redirect } from "next/navigation";

export default function FiringImageRedirectPage() {
  redirect("/contribute");
}
