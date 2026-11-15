# Tips

- Owner-permission author swap is immediate; active-permission waits a week. Tests encode both.
- RAM payer change is ownership-gated in this model — you cannot assign payer for an asset you do not hold.
- `createbuyo` is AtomicMarket one-asset; `createoffer` is AtomicAssets multi-asset trade.
- Never treat these previews as a substitute for reading the live ABI on the network you deploy to.
