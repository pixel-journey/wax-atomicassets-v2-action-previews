/**
 * Author succession from atomicassets-contract tag v2.0.0.
 * Read from include/atomicassets.hpp and src/atomicassets.cpp.
 * Not compiled. Not executed on a node. require_auth is a name compare here.
 *
 * AUTHOR_SWAP_TIME_DELTA = 60 * 60 * 24 * 7.
 * owner permission: acceptance_date = now.
 * active (owner flag false): acceptance_date = now + one week.
 * Accept window is [acceptance_date, acceptance_date + one week).
 * One pending row per collection. The contract string keeps the apostrophe in "author's".
 */

import { account } from "./names";

export const WEEK = 60 * 60 * 24 * 7;

export type Pending = {
  collection: string;
  currentAuthor: string;
  newAuthor: string;
  acceptanceDate: number;
};

export type AuthorState = {
  collection: string;
  author: string;
  pending: Pending | null;
};

export type Step = { ok: false; reason: string } | { ok: true; state: AuthorState };

function clock(now: number): string | null {
  if (!Number.isInteger(now) || now < 0 || now > 4_000_000_000) return "now must be a unix second from 0 to 4000000000";
  return null;
}

export function propose(
  state: AuthorState,
  actor: string,
  newAuthor: string,
  ownerPermission: boolean,
  now: number,
): Step {
  const bad =
    account(state.collection, "collection") ||
    account(state.author, "author") ||
    account(actor, "actor") ||
    account(newAuthor, "new author") ||
    clock(now);
  if (bad) return { ok: false, reason: bad };
  if (actor !== state.author) return { ok: false, reason: "require_auth would fail" };
  if (state.pending) {
    return { ok: false, reason: "Can't swap author's while an authorswap is underway for this collection" };
  }
  return {
    ok: true,
    state: {
      collection: state.collection,
      author: state.author,
      pending: {
        collection: state.collection,
        currentAuthor: state.author,
        newAuthor,
        acceptanceDate: now + (ownerPermission ? 0 : WEEK),
      },
    },
  };
}

export function accept(state: AuthorState, actor: string, now: number): Step {
  const bad = account(actor, "actor") || clock(now);
  if (bad) return { ok: false, reason: bad };
  if (!state.pending) return { ok: false, reason: "No author swaps for this collection found" };
  if (state.author !== state.pending.currentAuthor) return { ok: false, reason: "Current author mismatch" };
  if (actor !== state.pending.newAuthor) return { ok: false, reason: "require_auth would fail" };
  if (now < state.pending.acceptanceDate) {
    const left = state.pending.acceptanceDate - now;
    return { ok: false, reason: `[ ${left} ] seconds remaining until this author swap can be accepted` };
  }
  if (now >= state.pending.acceptanceDate + WEEK) {
    return { ok: false, reason: "Author swap for this collection has expired" };
  }
  return {
    ok: true,
    state: { collection: state.collection, author: state.pending.newAuthor, pending: null },
  };
}

export function reject(state: AuthorState, actor: string): Step {
  const bad = account(actor, "actor");
  if (bad) return { ok: false, reason: bad };
  if (!state.pending) return { ok: false, reason: "No author swaps for this collection found" };
  if (state.author !== state.pending.currentAuthor) return { ok: false, reason: "Current author mismatch" };
  if (actor !== state.pending.currentAuthor && actor !== state.pending.newAuthor) {
    return { ok: false, reason: "Missing required authorizations" };
  }
  return { ok: true, state: { collection: state.collection, author: state.author, pending: null } };
}
