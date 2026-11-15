# Worked examples — AtomicAssets v2 action previews

Pure shape/state previews. **Not compiled. Not broadcast.**

## Author swap (`WEEK` delay)

`now = 1_700_000_000`. Collection `pixel`, author alice.

| Path | Behavior |
| --- | --- |
| propose with owner permission (`true`) | `acceptanceDate = now`; bob can accept immediately; at `now + WEEK` accept expires |
| propose without owner (`false`) | `acceptanceDate = now + WEEK`; accept at `now+WEEK-1` fails with seconds remaining; at `now+WEEK` author becomes bob; at `now+2*WEEK` expired |
| second propose while pending | refused |
| carol accepts bob's proposal | refused |
| alice rejects | state returns to open (author alice, no pending) |
| carol rejects | refused |

## RAM payer

`setRamPayer` only if the asset is **already owned** by the new payer account in the model.

| Case | Result |
| --- | --- |
| asset 5, old `ram.payer` → alice | ok, log `logrampayer` |
| same payer again | already the ram_payer |
| empty ownership list | no asset in new_payer's account |

`setLastPayer` picks the **greatest asset id**, not "any in collection". Owned 1/pixel + 9/other, expect pixel → fails (newest is other). Expect other → asset 9.

## Offers

`previewCreateOffer`: multi-id ok; self-offer refused; duplicate id or memo 257 chars refused; memo length 256 boundary checked in tests.

`previewCreateBuyo(["42"])` ok; two ids or empty refused (`createbuyo` is one asset).

Cancel = sender; accept/decline = recipient. Unknown id refused.

`payofferram` moves payer on the offer row without measuring bytes.

Held createoffer: transferable id 1 + templateless id 3 ok. Missing id 9, soulbound id 2, duplicate recipient ids refused with contract-style sentences.

See `EDUCATION.md` for balances/move modules.
