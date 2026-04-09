import { studioVisitorGateAction } from "@/app/actions/studios";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { SubmitButton } from "@/components/submit-button";
import type { StudioFiringRange } from "@/lib/studio-firing";

export function StudioGate({
  slug,
  displayName,
  firingRange,
}: {
  slug: string;
  displayName: string;
  firingRange: StudioFiringRange;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Studio library</p>
        <h1 className="display-font text-3xl tracking-tight">{displayName}</h1>
        <p className="text-sm leading-6 text-muted">
          Enter your first name and your studio&apos;s 4-digit passcode to view
          the shared glaze library.
        </p>
      </div>

      <Panel>
        <form action={studioVisitorGateAction} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="grid gap-2 text-sm font-medium">
            First name
            <Input name="name" required maxLength={80} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            4-digit studio passcode
            <Input
              name="passcode"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
            />
          </label>

          {firingRange === "both" ? (
            <fieldset className="grid gap-2 text-sm font-medium">
              <legend className="mb-1">What are you painting today?</legend>
              <label className="flex items-center gap-3 border border-border bg-panel px-3 py-2 cursor-pointer">
                <input type="radio" name="scope" value="lowfire" required />
                <span>Earthenware (cone 06)</span>
              </label>
              <label className="flex items-center gap-3 border border-border bg-panel px-3 py-2 cursor-pointer">
                <input type="radio" name="scope" value="midfire" required />
                <span>Midfire (cone 6)</span>
              </label>
              <p className="text-[11px] font-normal text-muted">
                We&apos;ll only show glazes and combinations for the cone you pick.
              </p>
            </fieldset>
          ) : (
            <div className="border border-border bg-panel px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted">
              {firingRange === "lowfire"
                ? "You are using earthenware glazes (cone 06)"
                : "You are using midfire glazes (cone 6)"}
            </div>
          )}

          <SubmitButton pendingText="Checking…">Enter studio library</SubmitButton>
        </form>
      </Panel>

      <p className="text-center text-[11px] uppercase tracking-[0.16em] text-muted">
        Don&apos;t have a passcode? Ask your studio.
      </p>
    </div>
  );
}
