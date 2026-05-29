# ShiputzAI Google Ads API Integration

Internal server-side Google Ads API tooling for ShiputzAI campaign reporting and controlled account management.

## Local EC2 Setup

The EC2-level env file is `/home/ubuntu/.env`.

Required values:

```bash
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_LOGIN_CUSTOMER_ID=7504938788
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_REFRESH_TOKEN=...
GOOGLE_ADS_CUSTOMER_ID=...
GOOGLE_ADS_LOGIN_CUSTOMER_ID_MODE=auto
```

`GOOGLE_ADS_LOGIN_CUSTOMER_ID` is the Google Ads manager account ID without hyphens. `GOOGLE_ADS_CUSTOMER_ID` is the actual client account to query, also without hyphens.
`GOOGLE_ADS_LOGIN_CUSTOMER_ID_MODE` controls whether the REST client sends the `login-customer-id` header: `auto` sends it for manager-account calls only, `always` forces manager routing, and `never` omits it for direct customer access.

The OAuth refresh token must be created with this scope:

```text
https://www.googleapis.com/auth/adwords
```

The existing Google Workspace OAuth credentials are not enough because they only cover Workspace scopes such as Gmail, Drive, Sheets, and Calendar.

## Commands

```bash
npm run google-ads:status
npm run google-ads:accessible
npm run google-ads:campaigns
npm run ads-brief:dry
npm run ads-brief:send
```

`google-ads:status` checks local configuration without printing secrets. `google-ads:accessible` calls `customers:listAccessibleCustomers`. `google-ads:campaigns` performs a read-only campaign report for the last 7 days.

## Combined Ads Dashboard

The admin dashboard lives at `/admin/ads-dashboard` and calls `/api/admin/ads-dashboard`.
It is protected by the existing Supabase admin auth and combines:

- Google Ads live campaign metrics.
- Meta Ads live campaign metrics when the Meta token/app is working.
- Connection status and action insights.

The daily Discord brief is `scripts/ads-ai-brief-discord.js`. It posts with `SEND=1` and is dry-run by default.

## API Notes

Google Ads REST calls require both an OAuth access token and the `developer-token` header. Manager-account calls also need `login-customer-id`. See Google's official REST authorization docs:

https://developers.google.com/google-ads/api/rest/auth
