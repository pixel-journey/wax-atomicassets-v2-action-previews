/**
 * transfer flag and burn flag from atomicassets-contract tag v2.0.0
 * src/atomicassets.cpp (internal_transfer, burnasset). Not compiled.
 * is_account is not checked. A local held list stands in for the owner's assets.
 */

import { account, uint64 } from "./names";

export type Held = {
  id: string;
  hasTemplate: boolean;
  transferable: boolean;
  burnable: boolean;
};

export type Move =
  | { ok: false; reason: string }
  | { ok: true; action: "transfer" | "burnasset"; ids: readonly string[] };

export function previewTransfer(input: {
  from: string;
  to: string;
  assetIds: readonly string[];
  memo: string;
  held: readonly Held[];
}): Move {
  const bad = account(input.from, "from") || account(input.to, "to");
  if (bad) return { ok: false, reason: bad };
  if (input.from === input.to) return { ok: false, reason: "Can't transfer assets to yourself" };
  if (input.assetIds.length === 0) return { ok: false, reason: "asset_ids needs to contain at least one id" };
  if (input.memo.length > 256) return { ok: false, reason: "A transfer memo can only be 256 characters max" };
  const seen = new Set<bigint>();
  for (const id of input.assetIds) {
    const n = uint64(id);
    if (n === null) return { ok: false, reason: `${id} is not a positive uint64` };
    if (seen.has(n)) return { ok: false, reason: "Can't transfer the same asset multiple times" };
    seen.add(n);
    const row = input.held.find((item) => item.id === id);
    if (!row) return { ok: false, reason: `Sender doesn't own at least one of the provided assets (ID: ${id})` };
    if (row.hasTemplate && !row.transferable) {
      return { ok: false, reason: `At least one asset isn't transferable (ID: ${id})` };
    }
  }
  return { ok: true, action: "transfer", ids: [...input.assetIds] };
}

export function previewBurn(owner: string, assetId: string, held: readonly Held[]): Move {
  const bad = account(owner, "owner");
  if (bad) return { ok: false, reason: bad };
  if (uint64(assetId) === null) return { ok: false, reason: `${assetId} is not a positive uint64` };
  const row = held.find((item) => item.id === assetId);
  if (!row) return { ok: false, reason: "No asset with this id exists for this owner" };
  if (row.hasTemplate && !row.burnable) return { ok: false, reason: "The asset is not burnable" };
  return { ok: true, action: "burnasset", ids: [assetId] };
}

/**
 * setassetdata writes mutable data and sets ram_payer to the authorized editor.
 * Serialization against the schema is not done. Collection auth is not checked.
 */
export type MutableWrite =
  | { ok: false; reason: string }
  | { ok: true; action: "setassetdata"; ramPayer: string };

export function previewSetMutable(assetExists: boolean, editor: string): MutableWrite {
  const bad = account(editor, "editor");
  if (bad) return { ok: false, reason: bad };
  if (!assetExists) return { ok: false, reason: "No asset with this id exists" };
  return { ok: true, action: "setassetdata", ramPayer: editor };
}

