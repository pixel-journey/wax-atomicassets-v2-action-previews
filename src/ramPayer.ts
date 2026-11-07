/**
 * setrampayer and setlastpayer from atomicassets-contract tag v2.0.0
 * src/atomicassets.cpp. Not compiled. Not executed. No RAM bytes are refunded here.
 *
 * setrampayer: the asset must already sit in the new payer's owned list, and the
 * payer must change. setlastpayer: the greatest asset id in the owned list is the
 * row the contract reaches by walking to the last primary key. A smaller id in the
 * named collection does not win.
 */

import { account, uint64 } from "./names";

export type Held = { assetId: string; collection: string; ramPayer: string };

export type PayerMove =
  | { ok: false; reason: string }
  | { ok: true; assetId: string; oldPayer: string; newPayer: string };

function parseHeld(rows: readonly Held[]): { ok: false; reason: string } | { ok: true; rows: { assetId: bigint; collection: string; ramPayer: string; text: string }[] } {
  if (rows.length > 64) return { ok: false, reason: "pass at most 64 assets" };
  const seen = new Set<string>();
  const parsed = [];
  for (const row of rows) {
    const id = uint64(row.assetId);
    if (id === null) return { ok: false, reason: `${row.assetId} is not a positive uint64` };
    const bad = account(row.collection, "collection") || account(row.ramPayer, "ram payer");
    if (bad) return { ok: false, reason: bad };
    if (seen.has(row.assetId)) return { ok: false, reason: "asset ids must be unique" };
    seen.add(row.assetId);
    parsed.push({ assetId: id, collection: row.collection, ramPayer: row.ramPayer, text: row.assetId });
  }
  return { ok: true, rows: parsed };
}

export function setRamPayer(ownedByNewPayer: readonly Held[], assetId: string, newPayer: string): PayerMove {
  const who = account(newPayer, "new payer");
  if (who) return { ok: false, reason: who };
  const id = uint64(assetId);
  if (id === null) return { ok: false, reason: `${assetId} is not a positive uint64` };
  const parsed = parseHeld(ownedByNewPayer);
  if (!parsed.ok) return parsed;
  const row = parsed.rows.find((item) => item.assetId === id);
  if (!row) return { ok: false, reason: "No asset with this id exists in the new_payer's account" };
  if (row.ramPayer === newPayer) return { ok: false, reason: "new_payer is already the ram_payer of this asset" };
  return { ok: true, assetId: row.text, oldPayer: row.ramPayer, newPayer };
}

export function setLastPayer(owned: readonly Held[], owner: string, collection: string): PayerMove {
  const who = account(owner, "owner") || account(collection, "collection");
  if (who) return { ok: false, reason: who };
  const parsed = parseHeld(owned);
  if (!parsed.ok) return parsed;
  if (parsed.rows.length === 0) return { ok: false, reason: "owner holds no assets" };
  let newest = parsed.rows[0];
  for (const row of parsed.rows) {
    if (row.assetId > newest.assetId) newest = row;
  }
  if (newest.collection !== collection) {
    return { ok: false, reason: "newest owned asset is not in the expected collection" };
  }
  if (newest.ramPayer === owner) return { ok: false, reason: "owner is already the ram_payer of this asset" };
  return { ok: true, assetId: newest.text, oldPayer: newest.ramPayer, newPayer: owner };
}
