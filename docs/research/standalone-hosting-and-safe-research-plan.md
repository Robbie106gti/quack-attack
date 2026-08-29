# Quack Attack standalone hosting and safe research plan

Status: proposal only

Last verified: 2026-08-28

## Decision this plan supports

Choose a safe, maintainable way to publish Quack Attack as a personal standalone web game while preserving the option to present it from a studio website later.

This document does not select a production host, approve a studio embed, deploy anything, add analytics, create accounts, purchase a service, or authorize scanning. It defines the evidence and gates required for those later decisions.

## Recommendation

Keep the game as an independently built and hosted static application on its own origin. Use a normal link from the studio site as the baseline presentation. Treat cross-origin embedding as a separate decision after the studio platform, domain, security headers, accessibility behavior, and commercial-use classification are known.

Evaluate the existing Vercel path first because the repository already contains a Vite build and `vercel.json`. Do not assume the free Hobby plan is appropriate for studio use: Vercel limits Hobby to personal, non-commercial use. Compare Cloudflare Pages or Workers Static Assets and Netlify before paying. Keep GitHub Pages as a personal-project fallback rather than the default studio-hosting choice.

Do not add a backend or player analytics during the first public pilot. The game does not need either to function, and omitting them keeps privacy, consent, security, and removal simple.

## Current repository facts

- The application is a Vite-built TypeScript/Three.js static client.
- `npm run build` produces `dist/`; Vercel is configured to publish that directory.
- The client loads the bundled duck model from `/duck.glb`.
- The page currently requests two Google Fonts from `fonts.googleapis.com` and `fonts.gstatic.com`; that external request matters to privacy and CSP planning.
- There is no backend, account system, persistence, analytics package, service worker, or studio-site integration.
- The repository's MIT license covers the software as distributed, but it is not by itself proof that every bundled model, font use, name, visual identity, or third-party mark is cleared for a new public or studio context.

## Hosting candidates

Pricing and limits change. Recheck the linked official pages at the decision date.

| Candidate | Fit | Material constraints | Pilot position |
| --- | --- | --- | --- |
| Vercel | Lowest migration effort; native Vite guidance, Git previews, custom domains, and immediate deployment rollback | Hobby is restricted to personal/non-commercial use. Studio promotion or financial benefit may require Pro or written clarification. Usage is metered. | First technical baseline; confirm use classification before deployment |
| Cloudflare Pages / Workers Static Assets | Static asset hosting, Git or direct upload, custom subdomains, headers, and rollback options | Cloudflare now recommends Workers for most new application use cases. Pages Free currently documents 500 builds/month, 20,000 files, 25 MiB per file, and 100 custom domains per project. Account and terms review is still required. | Compare as the likely low-cost alternative |
| Netlify | Static hosting, deploy previews, custom domains with SSL, headers, and a straightforward Vite build | Current free accounts use a 300-credit monthly hard limit. Production deploys, bandwidth, and requests consume credits; reaching the limit pauses sites on the account until reset or upgrade. | Compare cost behavior and account isolation |
| GitHub Pages | Simple static project hosting with custom domains and HTTPS | Public repository is required on GitHub Free. Published site limit is 1 GB, bandwidth is a soft 100 GB/month, and GitHub says Pages is not intended as free hosting for an online business or commercial SaaS. | Personal-project fallback only |

### Hosting decision gate

Before selecting a host, record:

1. Whether the release is strictly personal/non-commercial or part of studio promotion.
2. Expected monthly visits and approximate transfer per play session.
3. Whether the source repository will remain public.
4. Who controls the intended domain and hosting account.
5. Whether production must be private before launch.
6. Required custom-header support, rollback, preview access, and spend caps.
7. Confirmation that the game model, names, visual identity, and other third-party materials may be published in the intended context.

## Standalone and studio boundary

### Baseline: link to the standalone game

- The game owns its build, hosting, domain, headers, release cadence, and rollback.
- The studio site owns only the game listing, thumbnail, description, and outbound link.
- A game failure cannot break studio navigation.
- No cross-origin messaging, shared cookies, shared storage, or embedded analytics is needed.
- The game can use a dedicated hostname such as `play.example.test`; the actual domain remains undecided.

This is the recommended first public shape.

### Optional later path: cross-origin iframe

Embedding remains undecided. If evaluated later, both origins must opt in:

- The game's response header must set `Content-Security-Policy: frame-ancestors` to the exact allowed studio origin. `frame-ancestors` must be an HTTP header; a CSP meta element cannot provide it.
- The studio site's CSP must allow the game origin in `frame-src` (or its applicable fallback).
- The iframe should use the smallest viable `sandbox` and Permissions Policy. The game requires scripts; fullscreen, autoplay, pointer lock, storage, and same-origin privileges must be justified individually.
- Use an explicit `referrerpolicy`; start with `no-referrer` unless attribution requirements justify a less restrictive value.
- Verify keyboard focus, touch controls, responsive height, fullscreen escape, audio after a user gesture, loading and failure states, reduced motion, and a visible “open game” fallback.
- Do not introduce `postMessage` until a specific interaction requires it. If introduced, validate exact origins and message schemas on both sides.

An iframe increases coupling and can create confusing analytics, focus, privacy, CSP, and support behavior. It should not be chosen merely to keep visitors visually on the studio page.

### Not recommended now: merge into the studio application

Copying the game into the studio site's build would couple frameworks, dependencies, release schedules, caching, security headers, and rollbacks. Reconsider only if a future product requirement needs shared authentication, navigation state, or first-party data flow.

## Privacy and analytics

### First pilot

- Add no analytics script, fingerprinting, advertising identifier, account, leaderboard, or backend event endpoint.
- Publish a short privacy note that the game itself does not intentionally collect player data, while the hosting provider may process operational request data such as IP address, user agent, and logs under its own terms.
- Avoid player identifiers in URLs, query strings, referrers, error reports, or screenshots.
- Review the current Google Fonts requests. A later implementation should either document them in the privacy/CSP posture or replace them with cleared local/system assets.

### If analytics is proposed later

Create a separate decision record covering purpose, lawful basis where applicable, data fields, retention, processor terms, access, deletion, consent behavior, and whether studio and game traffic remain separate. Prefer aggregate page/session health over player-level tracking.

Vercel describes its Web Analytics as cookie-free and aggregated, but its documented data points can include URL, filtered query parameters, referrer, coarse geolocation, operating system, browser, and device type. That still requires an explicit review; availability is not approval to enable it.

## Competitive technology research

### PublicWWW: weak public clues only

PublicWWW indexes HTML, JavaScript, CSS, and selected HTTP response headers and supports source-fragment queries. This can reveal broad public implementation patterns, such as common WebGL libraries, canvas markup, embedded widgets, or hosting headers.

It cannot establish a competitor's architecture, usage, business success, security posture, ownership, licensing, or current production configuration. Its index coverage, crawl timing, bundling/minification, copied templates, shared identifiers, and CDN behavior can all create false positives or omissions.

Rules:

- Use only the normal free web interface for the bounded pilot.
- Use generic technology signatures, not secrets, credentials, personal identifiers, private URLs, or attempts to identify hidden infrastructure.
- Do not automate, scrape, call an undocumented endpoint, download a dataset, purchase a plan, or create an integration.
- Do not copy or reuse indexed source code. PublicWWW's terms prohibit automated access outside its API and restrict reuse and commercial exploitation of the service.
- Treat every hit as a hypothesis. Manually verify only against the site's public response/source, record the observation date, and label uncertain attribution.
- Store aggregate conclusions and a small evidence table, not third-party source code or bulk domain lists.

### Bounded PublicWWW pilot

1. Define at most five generic signatures relevant to browser games, such as public Three.js markers, WebGL/canvas patterns, install prompts, or common embed wrappers.
2. Review at most 20 results total from the free interface.
3. Manually validate each sampled result using its public page/source without bypassing access controls.
4. Record true match, false positive, uncertain, and unavailable counts.
5. Stop if the free interface requires sensitive account data, if terms change, or if results do not produce decision-relevant patterns.

Success means learning which public presentation or technology patterns deserve normal browser testing. It does not mean identifying a market share, copying features, or making claims about a particular organization.

## Defensive exposure research

### Shodan: owner-authorized assets only

Shodan collects service banners and supports search, host lookup, network monitoring, and on-demand scans. Data can be delayed or incomplete: its main search and host lookup use a recent-data window, cloud/CDN addresses can be shared, DNS changes can reassign addresses, and a banner does not by itself prove ownership or vulnerability.

No Shodan activity is part of the current documentation PR.

Any future use must satisfy all of these gates:

1. The game has been deployed by the user.
2. The exact hostname and hosting project are recorded in an asset inventory.
3. Domain-control evidence and hosting-account ownership are recorded.
4. A named owner approves a dated, exact hostname/IP scope.
5. Shared CDN or platform addresses are identified; unrelated tenants are excluded.
6. The activity is lawful and permitted by the hosting provider and Shodan terms.

### Bounded Shodan pilot after deployment

- Use the normal website for a read-only lookup of the exact owned hostname and its currently resolved address.
- Do not install the CLI/library, use an API, create alerts, request an on-demand scan, enumerate subdomains, expand a CIDR, or inspect unrelated services on a shared address.
- Record only observations attributable to the owned deployment: timestamp, queried hostname/address, banner timestamp, expected service, and whether provider configuration independently confirms it.
- Treat unexpected or stale results as a prompt to check DNS and host configuration, not as proof of compromise.
- Do not publish raw Shodan data. Shodan's terms require attribution when its information is included in published material, and its privacy policy says it records query time, browser/language, and IP address.
- Remove the notes after remediation verification unless there is a documented retention need.

The pilot succeeds if the owned public exposure matches the hosting design or produces a provider-confirmed remediation item. It fails safely if attribution is ambiguous; no broader search follows.

## Bounded research pilot sequence

1. **Rights and intent checkpoint:** classify personal versus studio use and complete the asset/branding rights inventory.
2. **Local baseline:** run the existing build, inventory outbound requests and expected response headers, and measure static output size. Do not deploy.
3. **Hosting paper comparison:** update the candidate table from official pricing, terms, limits, custom-domain, header, preview, and rollback documentation.
4. **PublicWWW sample:** run the bounded generic-signature exercise and report false positives and uncertainty.
5. **Studio information request:** document its platform, exact origin, CSP, iframe policy, responsive container constraints, privacy notice, and release owner. Do not choose embedding yet.
6. **Local embed proof only if requested:** test two local origins with candidate CSP and iframe attributes. No production integration or analytics.
7. **Post-deployment defensive check only after separate approval:** perform the bounded Shodan lookup under the authorization gates above.

## Acceptance criteria

- A host recommendation is backed by current official terms, pricing, limits, custom-domain support, header control, preview behavior, rollback, and expected traffic.
- Personal and studio/commercial use are explicitly classified before a hosting plan is selected.
- Asset, model, font, name, and visual-identity publication rights are recorded before launch.
- PublicWWW findings include sample size, query class, validation method, false positives, uncertainty, and observation date.
- No competitive claim relies on PublicWWW alone.
- Studio embedding remains an explicit decision with a completed CSP, privacy, accessibility, and ownership checklist.
- Any Shodan check has written scope and ownership proof and uses no on-demand scan.
- The first pilot adds no backend, player analytics, account, subscription, runtime dependency, or cross-origin messaging.
- The standalone host can be removed independently; any studio link can be removed in a separate, small studio-site change.

## Risks and controls

| Risk | Control |
| --- | --- |
| Free plan conflicts with studio/commercial use | Classify use first; obtain provider clarification or select an eligible paid/alternative plan |
| Third-party asset or mark is not cleared | Complete a rights inventory before public release; replace or remove anything unresolved |
| PublicWWW false positive becomes a competitive claim | Require manual public-source confirmation and label inference/uncertainty |
| Research exposes or retains third-party data | Keep only minimal aggregate notes; no source-code copies or bulk lists |
| Shodan result is attributed to the wrong tenant | Require ownership proof and independent provider confirmation; stop on shared-IP ambiguity |
| Embed enables clickjacking or excessive capabilities | Default to link-out; exact `frame-ancestors`; minimal sandbox/permissions; local test before approval |
| Cross-site tracking or referrer leakage | No analytics in pilot; explicit referrer policy; no identifiers in URLs |
| A host limit produces surprise downtime or cost | Compare hard/soft limits, account-wide effects, alerts, caps, and rollback before launch |

## Non-goals

- Deploying or publishing the game
- Selecting or purchasing a domain or hosting plan
- Deciding whether the studio site will embed the game
- Modifying the studio site
- Adding analytics, accounts, a leaderboard, database, backend, ads, or monetization
- Installing or integrating PublicWWW, Shodan, or any other research tool
- Evaluating Privacy.com or other video-list candidates outside this scoped hosting research
- Scanning, monitoring, enumerating, or testing third-party assets
- Copying competitor code, assets, names, or presentation
- Adding runtime dependencies or changing automations

## Rollback and removal

This research change is documentation-only and can be reverted by removing this file.

For a future pilot:

- PublicWWW: stop querying and delete local sampled-result notes; no integration or subscription should exist.
- Shodan: remove any manually saved lookup notes. If a separately approved alert is ever created later, delete that exact alert and verify it is absent.
- Standalone host: detach the custom domain, remove its DNS record, and delete or disable the isolated host project. The studio link can then be removed without a studio application rollback.
- Embed experiment: remove the iframe/link, remove the game origin from the studio `frame-src`, and return the game's `frame-ancestors` to `'none'`.
- Analytics: none exists in the pilot. Any future analytics rollout must include its own disablement and data-deletion procedure.

## Official sources

### Hosting

- [Vercel: Vite deployments](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel: plans](https://vercel.com/docs/plans)
- [Vercel: Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel: fair use and commercial usage](https://vercel.com/docs/limits/fair-use-guidelines)
- [Vercel: custom domains](https://vercel.com/docs/domains/set-up-custom-domain)
- [Vercel: deployment rollback behavior](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)
- [Vercel: Web Analytics privacy and data points](https://vercel.com/docs/analytics/privacy-policy)
- [Vercel: Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing)
- [Cloudflare Pages: overview](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages: limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Pages: custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Netlify: pricing](https://www.netlify.com/pricing/)
- [Netlify: credit-based plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)
- [GitHub Pages: overview and visitor IP logging](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pages: limits and commercial-hosting restriction](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub Pages: custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

### Embedding and browser security

- [W3C: Content Security Policy Level 3](https://www.w3.org/TR/CSP/)
- [WHATWG: iframe element, sandbox, permissions, referrer policy, and loading](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element)
- [MDN: CSP `frame-ancestors`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors)

### Public research tools

- [PublicWWW: service and index description](https://publicwww.com/)
- [PublicWWW: query syntax](https://publicwww.com/docs/query-syntax/)
- [PublicWWW: pricing and limits](https://publicwww.com/prices.html)
- [PublicWWW: terms and privacy](https://publicwww.com/terms.html)
- [Shodan: platform and pricing](https://book.shodan.io/getting-started/platform/)
- [Shodan: crawler behavior](https://book.shodan.io/behind-the-scenes/crawler-algorithm/)
- [Shodan: data timeframes](https://book.shodan.io/behind-the-scenes/data-timeframes/)
- [Shodan: network monitoring](https://help.shodan.io/command-line-interface/4-network-monitoring)
- [Shodan: on-demand scanning](https://help.shodan.io/the-basics/on-demand-scanning)
- [Shodan: terms](https://static.shodan.io/legal/terms.html)
- [Shodan: privacy policy](https://account.shodan.io/privacy)
