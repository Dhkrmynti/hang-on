#!/bin/sh
# Flip robinheist.cloud between the illustration edition and the real paper, without a rebuild.
#   scripts/site-mode.sh demo   → everyone sees made-up numbers; the booth saves on the page only
#   scripts/site-mode.sh live   → the real paper (launch-ready); ?demo still previews
set -e
MODE="$1"
case "$MODE" in demo | live) ;; *) echo "usage: $0 demo|live" >&2; exit 1 ;; esac
ssh -o BatchMode=yes root@76.13.20.64 "sed -i -E 's/name=\"rh-mode\" content=\"[a-z]+\"/name=\"rh-mode\" content=\"$MODE\"/' /var/www/robinheist.cloud/dist/index.html"
# The demo may try a real X sign-in (nothing saved); the live paper never offers it.
XD=0; [ "$MODE" = demo ] && XD=1
ssh -o BatchMode=yes root@76.13.20.64 "cd /var/www/robinheist-engine && (grep -q '^X_DEMO=' .env && sed -i 's/^X_DEMO=.*/X_DEMO=$XD/' .env || echo 'X_DEMO=$XD' >> .env) && pm2 restart robinheist-engine --update-env >/dev/null && grep '^X_DEMO=' .env"
curl -s -m 15 https://robinheist.cloud/ | grep -o 'rh-mode" content="[a-z]*"'
