# Deployment storage cleanup — November 5, 2026

The Wanted Bounty Vercel project had 108 retained Ready deployments: 104 production and four preview versions. The current public asset directory is approximately 122 MiB. Repeated releases keep additional static/build output and function bundles, so deployment history is a significant storage driver.

After explicit approval of the retention set, 102 obsolete deployments were removed with `vercel remove --safe`, preserving active aliases. Six remain: the live production release, four recent production rollback versions, and the latest preview. The current release remains `dpl_12oixwwuTWTLRgPBvpMr9gtnaFA2`; the public site returned HTTP 200 after cleanup. Supabase data and source history were not deleted.

The existing automatic retention policy remains 30 days for each deployment type; it was not changed by this one-time cleanup. Vercel's recent-deployment and active-alias exceptions can retain some versions longer. Review retention settings if deployment frequency increases again.

Vercel measures usage across time and records daily peak storage. Removing deployments reduces retained output going forward, but does not erase usage already accumulated in the current billing period. No exact GB reduction was available from the deployment-list API.

References:
- https://vercel.com/docs/deployment-storage
- https://vercel.com/docs/deployment-retention
