# Education — author, RAM payer, and two offers

> **Rung:** `npm test` runs `src/*.test.ts`.  
> **The test is the rule.** The C++ was read at tag v2.0.0. It was not compiled and not sent.

## What you should be able to do

| Level | After this file |
| --- | --- |
| Beginner | Say who becomes author, and when |
| Intermediate | Pick the asset `setlastpayer` actually touches |
| Masterclass | Keep AtomicAssets `createoffer` apart from AtomicMarket `createbuyo` |

---

## Beginner — one week, or none

`WEEK` is `604800`. `propose` stores `acceptanceDate = now` when `ownerPermission` is true, and `now + WEEK` when it is false. The contract comment calls those the owner and active paths. This function does not ask a node which permission signed.

```ts
propose({ collection: "pixel", author: "alice", pending: null }, "alice", "bob", true, now)
accept(that, "bob", now) // author becomes bob, pending is null

propose(same, "alice", "bob", false, now)
accept(that, "bob", now + WEEK - 1)
// "[ 1 ] seconds remaining until this author swap can be accepted"
```

Accept at `acceptanceDate + WEEK` is expired (`now >= acceptanceDate + WEEK`). A second `propose` while one is pending returns the contract string, including the apostrophe in `author's`. `reject` by alice or bob clears the row and leaves the author. A third account gets `Missing required authorizations`.

`require_auth would fail` is our preview text. The chain does not use that sentence.

### Predict, then run

```bash
npm test
```

---

## Intermediate — greatest id, not the collection you hoped

| Attack | Naive code | This lab | Test |
| --- | --- | --- | --- |
| `setlastpayer` updates every asset in the collection | filter by collection | the greatest `assetId` must already be in that collection | id `9` in `other` blocks a call aimed at `pixel` |
| Pay RAM for an asset you do not hold | any id | the id must be in the list passed as the new payer's assets | empty list |
| Set the payer to the same account | no-op success | the contract string refuses it | already `alice` |
| Treat this as the byte estimate | 8 bytes per name | no byte count in `ramPayer.ts` | the return is old and new payer, plus the `logrampayer` names |

`wax-ram-cleanup-garbage-collection-assistant` is the byte estimate. Do not add these results. A successful `setRamPayer` also names the inline `logrampayer` tuple: the new payer, the asset id, the old payer, and the new payer again. The action is not sent. Attribute bytes live in [wax-atomic-template-and-schema-explorer](https://github.com/pixel-journey/wax-atomic-template-and-schema-explorer) `previewAttributeBytes`.

---

## Masterclass — `createoffer` is not `createbuyo`

AtomicAssets `createoffer` still takes two vectors. Two sender ids and an empty recipient side pass the shape check. Sender equal to recipient fails. A repeated id on one side fails. Memo length 256 passes the shape path; 257 fails. `checked: "shape-only"` means ownership and the transferable flag were not looked at.

`previewCreateOfferHeld` continues from there. It uses the contract sentences: `The assets in sender_asset_ids must be unique`, `The assets in recipient_asset_ids must be unique`, `Offer sender doesn't own at least one of the provided assets (ID: …)`, and `At least one asset isn't transferable (ID: …)`. The recipient side uses the same ownership sentence with the word `recipient`. A templateless asset skips the flag, the same way `template_id < 0` does in the cpp. `is_account` is still not called. `checked: "held"` is still not a broadcast.

AtomicMarket `createbuyo` is one asset. The opened source and the tests are [wax-atomic-markets-and-trading-interface](https://github.com/pixel-journey/wax-atomic-markets-and-trading-interface). This file's `previewCreateBuyo` is only the one-id refusal. Do not treat it as the sale course.

`previewCancelOffer` requires the sender. `previewAcceptOffer` and `previewDeclineOffer` require the recipient. A missing id returns `No offer with this id exists`. These are auth checks only. The contract re-checks ownership on accept; this preview does not.

`previewCreateTemplate(false, false)` returns the contract string `A template cannot be both non-transferable and non-burnable`. The other three pairs succeed. The check is at creation. An already-stored template in that state is not deleted by this function. Delete, lock, and reduce-max live in [wax-atomic-template-and-schema-explorer](https://github.com/pixel-journey/wax-atomic-template-and-schema-explorer).

`previewTransfer` refuses a self-send, an empty id list, a memo over 256, a repeated id, a missing id, and a template with `transferable: false`. The contract string includes the id: `At least one asset isn't transferable (ID: …)`. A templateless asset skips that flag. `is_account` is not checked.

`previewBurn` refuses a missing id and a template with `burnable: false` (`The asset is not burnable`). A templateless asset can burn. That function does not move tokens. `previewBurnCredit` is the later block: a non-empty `backed_tokens` list is added into the balances table, creating the row when the owner has none. An empty list leaves the table alone. It does not send `eosio.token::transfer`. v2 `mintasset` still rejects a non-empty `tokens_to_back`. Do not use the credit function to invent a new backed mint.

## Deposit is not backing

`backasset` fails with `Native backing has been deprecated on the AtomicAssets Contract`. The balances table is a different path, and the cpp still has it.

| Call | Contract string or result | This lab |
| --- | --- | --- |
| `announcedepo` for a symbol not in `supported_tokens` | `The specified symbol is not supported` | `previewAnnounceDeposit` |
| `announcedepo` with no row | emplace a zero quantity | `createdRow: true`, amount `"0"` |
| `announcedepo` when that symbol is already on the row | return, no write | `alreadyAnnounced: true` |
| token notify, token not supported | `The transferred token is not supported` | pass `tokenSupported: false` |
| token notify, memo is not `deposit` | `invalid memo` | exact |
| memo `deposit`, no balance row | `You need to first initialize the balance table row using the announcedepo action` | exact |
| memo `deposit`, symbol not announced | `You first need to announce the asset type you're backing using the announcedepo action` | exact. The word "backing" is the contract's. The action still only adds a balance. |
| `withdraw` of 0 | `token_to_withdraw must be positive` | exact |
| `withdraw` with no row | `The specified account does not have a balance table row` | exact |
| `withdraw` for a missing symbol | `The specified account does not have a balance for the symbol specified in the quantity` | exact |
| `withdraw` above the balance | `The specified account's balance is lower than the specified quantity` | exact |
| `withdraw` that hits zero | that symbol is erased; an empty vector erases the row | `quantities: null` |
| `withdraw` of a symbol that is not in `supported_tokens` | the balance still drops; the transfer loop sends nothing | `transferSent: false`. This is the source. It is not a success you should rely on. |

Symbols are compared as the strings you passed. The contract compares `eosio::symbol`. Amounts are integer strings. A successful deposit is not an NFT backing and not a pack unbox. Pack open is [wax-drops-and-pack-opening-experience](https://github.com/pixel-journey/wax-drops-and-pack-opening-experience). Holder airdrops that replace backing are [wax-nft-backed-token-unlock-visualizer](https://github.com/pixel-journey/wax-nft-backed-token-unlock-visualizer).

Official reading: [atomicassets-contract v2.0.0](https://github.com/atomicassets/atomicassets-contract/releases/tag/v2.0.0), [docs.wax.io How-To AtomicAssets](https://docs.wax.io/build/tutorials/howto_atomicassets).

`previewPayOfferRam` rewrites `ramPayer`. A missing offer uses `No offer with this id exists`. The same payer is allowed, matching the erase-then-emplace. Byte amounts are not measured.

`previewSetMutable(true, editor)` returns `ramPayer: editor`. That is `setassetdata`: the authorized editor who writes mutable data becomes the RAM payer. A missing asset returns `No asset with this id exists` (not the burn string, which adds "for this owner"). The schema is not serialized here. Mint refusals, including empty `tokens_to_back`, are [wax-atomic-template-and-schema-explorer](https://github.com/pixel-journey/wax-atomic-template-and-schema-explorer).

Native backing stays deprecated. `backasset` in the same cpp file fails unconditionally. A deposit does not escrow a token inside an NFT. Holder splits remain `equalSplit` and `duePayout` in `wax-nft-backed-token-unlock-visualizer`.

### What this course will not teach

- A broadcast, a RAM byte refund, or `is_account`
- `atomicdropsx::claimdrop` (no opened repo contains that contract)
- That `shape-only` or `held` means the offer would succeed on chain
- That `transferSent: false` is a safe withdraw. The balance already moved.
