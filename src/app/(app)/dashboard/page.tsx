import Link from "next/link";

import { beginAccountCreationAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { SetupCallout } from "@/components/setup-callout";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getCatalogGlazes, getInventory, getInventoryFolders, requireViewer } from "@/lib/data";
import { ACTIVE_GLAZE_BRANDS } from "@/lib/utils";

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const [inventory, catalog, folders] = await Promise.all([
    getInventory(viewer.profile.id),
    getCatalogGlazes(viewer.profile.id),
    getInventoryFolders(viewer.profile.id),
  ]);
  const ownedItems = inventory.filter((item) => item.status === "owned");
  const wishlistItems = inventory.filter((item) => item.status === "wishlist");
  const emptyItems = inventory.filter((item) => item.status === "archived");
  const commercialCount = catalog.filter(
    (glaze) =>
      glaze.sourceType === "commercial" &&
      glaze.brand &&
      ACTIVE_GLAZE_BRANDS.includes(glaze.brand as (typeof ACTIVE_GLAZE_BRANDS)[number]),
  ).length;

  if (viewer.profile.isAnonymous) {
    return (
      <div className="space-y-8">
        {viewer.mode === "demo" ? <SetupCallout compact /> : null}

        <PageHeader
          eyebrow="Guest mode"
          title="Browse the glaze inventory first."
          description="Guest browsing lets you explore the commercial catalog and glaze pages, but account-only tools stay locked until you create an account."
          actions={
            <>
              <Link href="/glazes" className={buttonVariants({})}>
                Open library
              </Link>
              <form action={beginAccountCreationAction}>
                <button type="submit" className={buttonVariants({ variant: "ghost" })}>
                  Create account
                </button>
              </form>
            </>
          }
        />

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">What you can do next</p>
            <h2 className="display-font text-3xl tracking-tight">Open the commercial catalog and start exploring.</h2>
            <p className="text-sm leading-6 text-muted">
              You can search {commercialCount} commercial glazes by code, name, brand, colour, finish, cone, and description right now.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/glazes" className={buttonVariants({})}>
                Open library
              </Link>
            </div>
          </Panel>

          <Panel className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Create an account to unlock</p>
            <div className="space-y-3 text-sm leading-6 text-muted">
              <p>Save glazes to your own inventory instead of remembering what is on the shelf.</p>
              <p>Keep a wishlist of glazes you want to buy or test later.</p>
              <p>Create custom folders for projects, clay bodies, classes, or buying plans.</p>
              <p>Set profile defaults so glaze pages prefer the firing temperature and atmosphere you actually use.</p>
              <p>Leave comments and studio notes directly under each glaze.</p>
            </div>
            <Badge tone="success">Verified account unlocks inventory tools</Badge>
          </Panel>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {viewer.mode === "demo" ? <SetupCallout compact /> : null}

      <PageHeader
        eyebrow="Workspace"
        title={`Welcome back, ${viewer.profile.displayName.split(" ")[0]}`}
        description="Keep track of what is on your shelf, what is on your wishlist, and how your glazes are grouped for real studio work."
        actions={
          <>
            <Link href="/glazes" className={buttonVariants({})}>
              Open library
            </Link>
            {viewer.profile.isAnonymous ? (
              <span
                className={buttonVariants({
                  variant: "ghost",
                  className: "cursor-not-allowed opacity-50 grayscale",
                })}
                aria-disabled="true"
              >
                Inventory locked
              </span>
            ) : (
              <Link href="/inventory" className={buttonVariants({ variant: "ghost" })}>
                View inventory
              </Link>
            )}
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Panel>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">On shelf</p>
          <p className="display-font mt-4 text-5xl tracking-tight">
            {ownedItems.length}
          </p>
        </Panel>
        <Panel>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Wishlist</p>
          <p className="display-font mt-4 text-5xl tracking-tight">
            {wishlistItems.length}
          </p>
        </Panel>
        <Panel>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Empty</p>
          <p className="display-font mt-4 text-5xl tracking-tight">{emptyItems.length}</p>
        </Panel>
        <Panel>
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Folders</p>
          <p className="display-font mt-4 text-5xl tracking-tight">{folders.length}</p>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Your inventory</p>
              <h2 className="display-font mt-2 text-3xl tracking-tight">Pieces you can act on right now</h2>
            </div>
            {viewer.profile.isAnonymous ? (
              <span
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "cursor-not-allowed opacity-50 grayscale",
                })}
                aria-disabled="true"
              >
                Inventory locked
              </span>
            ) : (
              <Link href="/inventory" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View inventory
              </Link>
            )}
          </div>

          <div className="grid gap-4">
            {[...ownedItems, ...wishlistItems].slice(0, 5).map((item) => (
              <Panel key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{item.glaze.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {[item.glaze.brand, item.glaze.code, item.glaze.cone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={item.status === "owned" ? "success" : "accent"}>
                    {item.status === "owned" ? "On shelf" : "Wishlist"}
                  </Badge>
                  <Link
                    href={`/glazes/${item.glaze.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full sm:w-auto" })}
                  >
                    Open glaze
                  </Link>
                </div>
              </Panel>
            ))}
            {!ownedItems.length && !wishlistItems.length ? (
              <Panel>
                <p className="text-sm leading-6 text-muted">
                  {viewer.profile.isAnonymous
                    ? "Guest browsing is active. Open the library to explore, then sign in to start building a shelf."
                    : "You have not saved anything yet. Start in the library and put some on your shelf or wishlist."}
                </p>
              </Panel>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Catalog workflow</p>
            <h2 className="display-font mt-2 text-3xl tracking-tight">Work straight from the library</h2>
          </div>
          <Panel className="space-y-4">
            <p className="text-sm leading-6 text-muted">
              Browse Mayco, AMACO, and Coyote glazes, save them to your shelf or wishlist directly from the library, and use folders to organize them around actual projects.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/glazes" className={buttonVariants({})}>
                Open library
              </Link>
              {viewer.profile.isAnonymous ? (
                <span
                  className={buttonVariants({
                    variant: "ghost",
                    className: "cursor-not-allowed opacity-50 grayscale",
                  })}
                  aria-disabled="true"
                >
                  Inventory locked
                </span>
              ) : (
                <Link href="/inventory" className={buttonVariants({ variant: "ghost" })}>
                  Review inventory
                </Link>
              )}
            </div>
          </Panel>
        </div>
      </section>

      <Panel className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Current focus</p>
            <h3 className="display-font mt-2 text-3xl tracking-tight">
              Inventory first, combinations later.
            </h3>
          </div>

          <Badge tone="success">Multi-brand inventory workflow</Badge>
        </div>
      </Panel>
    </div>
  );
}
