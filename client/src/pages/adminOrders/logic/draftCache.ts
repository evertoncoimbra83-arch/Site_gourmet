export function getManualSaleDraftQueryInput(draftId: string) {
  return { draftId };
}

export function mergeDraftItemsById<T extends { id: string }>(
  currentItems: T[],
  incomingItems: T[],
) {
  const byId = new Map<string, T>();

  for (const item of currentItems) {
    byId.set(item.id, item);
  }

  for (const item of incomingItems) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values());
}
