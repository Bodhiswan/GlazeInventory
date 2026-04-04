import { InventoryWorkspace } from "@/components/inventory-workspace";
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

      <InventoryWorkspace
        items={inventory}
        firingImageMap={{}}
        preferredCone={viewer.profile.preferredCone ?? null}
        preferredAtmosphere={viewer.profile.preferredAtmosphere ?? null}
      />
    </div>
  );
}
