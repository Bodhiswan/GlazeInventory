// The unified contribution form has been retired. Users who land on the old
// route are redirected to the brand-request page instead. See
// AGENTS.md "Pending cleanup" for the components/actions that can be deleted
// once we're certain nothing else links here.
import { redirect } from "next/navigation";

export default function ContributePage() {
  redirect("/glazes/request");
}
