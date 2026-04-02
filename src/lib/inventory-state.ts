export type InventoryFillLevel = "full" | "half" | "low";

const INVENTORY_STATE_PREFIX = "__glaze_inventory__:";

type StoredInventoryState = {
  note?: string | null;
  fillLevel?: InventoryFillLevel | null;
  quantity?: number | null;
};

export type InventoryState = {
  note: string | null;
  fillLevel: InventoryFillLevel;
  quantity: number;
};

function normalizeNote(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeFillLevel(value: string | null | undefined): InventoryFillLevel {
  if (value === "half" || value === "low") {
    return value;
  }

  return "full";
}

function normalizeQuantity(value: number | string | null | undefined) {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return 1;
  }

  return Math.max(1, Math.round(numeric));
}

export function parseInventoryState(rawValue: string | null | undefined): InventoryState {
  if (!rawValue) {
    return {
      note: null,
      fillLevel: "full",
      quantity: 1,
    };
  }

  if (!rawValue.startsWith(INVENTORY_STATE_PREFIX)) {
    return {
      note: rawValue,
      fillLevel: "full",
      quantity: 1,
    };
  }

  try {
    const parsed = JSON.parse(
      rawValue.slice(INVENTORY_STATE_PREFIX.length),
    ) as StoredInventoryState;

    return {
      note: normalizeNote(parsed.note),
      fillLevel: normalizeFillLevel(parsed.fillLevel),
      quantity: normalizeQuantity(parsed.quantity),
    };
  } catch {
    return {
      note: rawValue,
      fillLevel: "full",
      quantity: 1,
    };
  }
}

export function serializeInventoryState(input: Partial<StoredInventoryState>) {
  const state: InventoryState = {
    note: normalizeNote(input.note),
    fillLevel: normalizeFillLevel(input.fillLevel),
    quantity: normalizeQuantity(input.quantity),
  };

  if (!state.note && state.fillLevel === "full" && state.quantity === 1) {
    return null;
  }

  return `${INVENTORY_STATE_PREFIX}${JSON.stringify(state)}`;
}
