// TODO(cleanup): legacy route — kept as a redirect while external links may
// still point here. Safe to delete (along with src/components/custom-glaze-form.tsx
// and createCustomGlazeAction in src/app/actions/inventory.ts) once we're confident
// nothing links to /glazes/new anymore. See AGENTS.md "Pending cleanup".
import { redirect } from "next/navigation";

export default function NewCustomGlazePage() {
  redirect("/contribute");
}
