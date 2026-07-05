#!/usr/bin/env bash
#
# One-off: push the additive schema changes (Visit, SignupTelemetry,
# PlanGrantLog tables + comped columns on User) to the PRODUCTION database.
#
# The production DATABASE_URL lives ONLY in Neon / the Vercel integration — it
# is intentionally never in local .env (that's what caused the July 4 data
# loss). So you must pass it in for this single command; it is never written
# to disk and does not persist in your shell after this script exits.
#
# Usage (run from the repo root):
#   bash scripts/push-prod-schema.sh 'postgresql://USER:PASS@ep-polished-credit-asp3j0lj-...neon.tech/neondb?sslmode=require'
#
# Get the URL from: Vercel → paytree → Settings → Environment Variables →
# DATABASE_URL (reveal), or the Neon dashboard → Connection string.
#
set -euo pipefail

PROD_URL="${1:-}"
if [[ -z "$PROD_URL" ]]; then
  echo "ERROR: pass the production DATABASE_URL as the first argument (quoted)." >&2
  exit 1
fi

# Sanity check: confirm this really is the known production endpoint before we
# touch it. Abort loudly if the fingerprint is missing.
if [[ "$PROD_URL" != *"ep-polished-credit-asp3j0lj"* ]]; then
  echo "REFUSING: the URL does not contain the known production endpoint" >&2
  echo "  (ep-polished-credit-asp3j0lj). Double-check you pasted the prod URL." >&2
  exit 1
fi

echo "==> 1/2  Previewing the exact SQL that will run (nothing applied yet):"
echo "-------------------------------------------------------------------"
# Prisma 7: the live-DB side comes from the config datasource (prisma.config.ts
# reads env("DATABASE_URL")). We set DATABASE_URL inline; dotenv/config in the
# config file does NOT override an already-set env var, so this prod URL wins
# over the test URL in .env. --to-schema is the target datamodel.
DATABASE_URL="$PROD_URL" npx prisma migrate diff \
  --config prisma.config.ts \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --script
echo "-------------------------------------------------------------------"
echo "The statements above should be ADDITIVE ONLY — CREATE TABLE for Visit /"
echo "SignupTelemetry / PlanGrantLog and ALTER TABLE \"User\" ADD COLUMN for the"
echo "comped fields + onboardingOutcome. If you see any DROP, stop and ask."
echo ""
read -r -p "Apply these to PRODUCTION now? Type 'yes' to proceed: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Aborted — nothing was changed."
  exit 0
fi

echo "==> 2/2  Applying (prisma db push, no --accept-data-loss so nothing can be dropped):"
# --url overrides the datasource URL directly, so this never depends on .env.
npx prisma db push --url "$PROD_URL"

echo ""
echo "Done. Verify a landing-page visit no longer logs P2021, and /admin loads."
