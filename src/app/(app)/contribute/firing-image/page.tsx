import { PageHeader } from "@/components/page-header";
import { getCatalogGlazes, getUserCombinationExamples } from "@/lib/data";
import { requireViewer } from "@/lib/data/users";
import { getAllVendorExamples } from "@/lib/catalog";
import { FiringImageForm } from "./firing-image-form";

export default async function FiringImagePage() {
  const viewer = await requireViewer();

  const [catalogGlazes, userCombinations] = await Promise.all([
    getCatalogGlazes(viewer.profile.id),
    getUserCombinationExamples(viewer.profile.id).catch(() => []),
  ]);

  const vendorCombinations = getAllVendorExamples();

  const glazeOptions = catalogGlazes.map((g) => ({
    id: g.id,
    label: [g.brand, g.name].filter(Boolean).join(" "),
    sub: g.cone ?? undefined,
  }));

  const combinationOptions = [
    ...vendorCombinations.map((c) => ({
      id: c.id,
      type: "vendor" as const,
      label: c.title,
      sub: [c.cone, c.sourceVendor].filter(Boolean).join(" · "),
    })),
    ...userCombinations.map((c) => ({
      id: c.id,
      type: "user" as const,
      label: c.title,
      sub: [c.cone, c.authorName].filter(Boolean).join(" · "),
    })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Contribute · Firing photo"
        title="Upload a firing photo"
        description="Attach a real-world fired result to any glaze or combination in the library. It will appear in the detail popup for everyone."
      />
      <FiringImageForm glazeOptions={glazeOptions} combinationOptions={combinationOptions} />
    </div>
  );
}
