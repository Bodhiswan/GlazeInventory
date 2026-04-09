// Legacy route — the "add a glaze" flow has been replaced by the brand
// request form. Anyone who lands here gets sent to the new page.
import { redirect } from "next/navigation";

export default function NewCustomGlazePage() {
  redirect("/glazes/request");
}
