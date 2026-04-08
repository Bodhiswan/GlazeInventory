// TODO(cleanup): legacy route — kept as a redirect while external links may
// still point here. Safe to delete (along with src/components/publish-combination-form.tsx
// and the publishUserCombinationAction in src/app/actions/combinations.ts) once we're
// confident nothing links to /publish anymore. See AGENTS.md "Pending cleanup".
import { redirect } from "next/navigation";

export default function PublishPage() {
  redirect("/contribute");
}
