import { InventoryWorkspace } from "@/components/inventory-workspace";
import { Panel } from "@/components/ui/panel";
import { getInventory, requireViewer } from "@/lib/data";
import { formatSearchQuery } from "@/lib/utils";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await requireViewer();
  const inventory = await getInventory(viewer.profile.id);
  const params = await searchParams;
  const error = formatSearchQuery(params.error);

  return (
    <div className="space-y-6">
      {error ? (
        <div className="border border-[#bb6742]/18 bg-[#bb6742]/10 px-4 py-3 text-sm text-[#7f4026]">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      {viewer.profile.isAnonymous ? (
        <Panel className="space-y-4 opacity-70">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Guest mode</p>
          <h2 className="display-font text-3xl tracking-tight">Inventory is locked while browsing as a guest.</h2>
          <p className="text-sm leading-6 text-muted">
            You can explore the commercial catalog and open glaze pages, but saving glazes to your shelf and wishlist needs a verified account.
          </p>
          <div className="border border-border bg-panel p-4 grayscale">
            <div className="grid grid-cols-[minmax(0,1.2fr)_0.8fr] gap-4 text-xs uppercase tracking-[0.2em] text-muted">
              <span>Glaze</span>
              <span>Collection</span>
            </div>
          </div>
        </Panel>
      ) : (
        <InventoryWorkspace
          items={inventory}
          firingImageMap={{}}
          preferredCone={viewer.profile.preferredCone ?? null}
          preferredAtmosphere={viewer.profile.preferredAtmosphere ?? null}
        />
      )}
    </div>
  );
}
