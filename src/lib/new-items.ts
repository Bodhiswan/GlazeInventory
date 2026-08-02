export const NEW_ITEM_WINDOW_DAYS = 7;

export function getNewItemCutoff(now = new Date()) {
  return new Date(now.getTime() - NEW_ITEM_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function isCreatedWithinNewWindow(createdAt?: string | null, now = new Date()) {
  if (!createdAt) {
    return false;
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }

  return created >= getNewItemCutoff(now);
}
