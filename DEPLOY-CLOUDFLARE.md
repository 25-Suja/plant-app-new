# Deploy on Cloudflare (free)

1. Push this folder to a GitHub repo (node_modules/dist are git-ignored).
2. Cloudflare dashboard > Workers & Pages > Create > Import a repository.
3. Build command: `pnpm build`   Deploy command: `npx wrangler deploy --config dist/server/wrangler.json`
4. Settings > Variables and Secrets (add as Secrets):
   - ANTHROPIC_API_KEY  (needed for plant scan; pay-per-use, set a spend limit)
   - PLANTNET_API_KEY   (optional, free tier)
