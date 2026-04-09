import {
  createOrUpdateStudioAction,
  deleteStudioAction,
} from "@/app/actions/studios";
import { getStudioForOwner, getOwnerInventoryShareList } from "@/lib/data/studios";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { requireViewer } from "@/lib/data/users";
import { STUDIO_FIRING_LABELS } from "@/lib/studio-firing";
import { StudioShareList } from "./studio-share-list";

export async function StudioTab({ ownerUserId }: { ownerUserId: string }) {
  const viewer = await requireViewer();
  const studio = await getStudioForOwner(ownerUserId);
  const inventory = await getOwnerInventoryShareList(ownerUserId);
  const url = studio ? `/studio/${studio.slug}` : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Studio mode</p>
          <h2 className="display-font mt-1 text-2xl tracking-tight">
            Share a public library with your studio members.
          </h2>
        </div>

        {studio ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Live at
              </p>
              <a
                href={url!}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-foreground underline break-all"
              >
                glazeinventory.com{url}
              </a>
            </div>

            <div className="border border-border bg-panel px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Scan to open
              </p>
              {(() => {
                const fullUrl = `https://glazeinventory.com${url}`;
                const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(fullUrl)}`;
                return (
                  <div className="mt-2 flex flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrSrc}
                      alt={`QR code linking to ${fullUrl}`}
                      width={240}
                      height={240}
                      className="border border-border bg-white"
                    />
                    <a
                      href={qrSrc}
                      download={`${studio.slug}-studio-qr.png`}
                      className="text-[11px] uppercase tracking-[0.16em] text-muted hover:text-foreground"
                    >
                      Download PNG
                    </a>
                    <p className="text-[11px] text-muted">
                      Print this and stick it on the table — members can scan
                      with their phone instead of typing the URL.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="border border-border bg-panel px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Current passcode
              </p>
              <p className="display-font mt-1 text-3xl tracking-[0.4em]">
                {studio.passcode || "————"}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Share this with your studio members so they can sign in.
              </p>
            </div>

            <div className="border border-border bg-panel px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Firing range
              </p>
              <p className="mt-1 text-sm">{STUDIO_FIRING_LABELS[studio.firingRange]}</p>
              <p className="mt-1 text-[11px] text-muted">
                Visitors only see glazes and combinations that match this range.
              </p>
              <form action={createOrUpdateStudioAction} className="mt-3 grid gap-2">
                <Select name="firingRange" defaultValue={studio.firingRange}>
                  <option value="lowfire">Earthenware only (cone 06)</option>
                  <option value="midfire">Midfire only (cone 6)</option>
                  <option value="both">Both cone 06 and cone 6</option>
                </Select>
                <SubmitButton pendingText="Saving…">Update firing range</SubmitButton>
              </form>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.16em] text-muted hover:text-foreground">
                Change passcode
              </summary>
              <form action={createOrUpdateStudioAction} className="mt-3 grid gap-3">
                <Input
                  name="passcode"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  defaultValue=""
                  placeholder="New 4-digit passcode"
                />
                <SubmitButton pendingText="Saving…">Save passcode</SubmitButton>
              </form>
            </details>

            <p className="text-xs text-muted">
              Renames used: {studio.renameCount} / 3.
            </p>

            <form action={deleteStudioAction}>
              <button
                type="submit"
                className="text-[11px] uppercase tracking-[0.16em] text-muted hover:text-foreground"
              >
                Delete studio page
              </button>
            </form>
          </div>
        ) : (
          <form action={createOrUpdateStudioAction} className="grid gap-4">
            <p className="text-sm leading-6 text-muted">
              Enable studio mode to create a passcode-protected page where your
              studio members can browse your shared glazes and combinations.
            </p>
            <label className="grid gap-2 text-sm font-medium">
              Studio name
              <Input
                name="studioName"
                defaultValue={viewer.profile.studioName ?? ""}
                required
                placeholder="e.g. Muddy Hands Ceramics"
                maxLength={80}
              />
              <span className="text-[11px] leading-5 text-muted">
                Your public URL will be generated from this name.
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              4-digit visitor passcode
              <Input
                name="passcode"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
                defaultValue=""
                placeholder="1234"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Firing range
              <Select name="firingRange" defaultValue="" required>
                <option value="" disabled>
                  Pick a firing range
                </option>
                <option value="lowfire">Earthenware only (cone 06)</option>
                <option value="midfire">Midfire only (cone 6)</option>
                <option value="both">Both cone 06 and cone 6</option>
              </Select>
              <span className="text-[11px] leading-5 text-muted">
                Members only see glazes and combinations matching this range, so
                cone 06 and cone 6 ware never get mixed up.
              </span>
            </label>
            <SubmitButton pendingText="Creating…">Create studio page</SubmitButton>
          </form>
        )}
      </Panel>

      <Panel className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Shared glazes
          </p>
          <h3 className="display-font mt-1 text-xl tracking-tight">
            Choose which owned glazes appear on your studio page.
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            Only glazes you check here will show up publicly. Personal notes and
            quantities stay private; visitors see vendor info, finish notes, and
            firing examples — never your ratings or comments.
          </p>
        </div>

        {inventory.length === 0 ? (
          <p className="text-sm text-muted">
            You don&apos;t have any owned glazes yet. Add some to your inventory and
            they&apos;ll show up here.
          </p>
        ) : (
          <StudioShareList inventory={inventory} />
        )}
      </Panel>
    </div>
  );
}
