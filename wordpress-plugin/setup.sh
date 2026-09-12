#!/usr/bin/env bash
# One-time environment preparation. Installs WP-CLI, completes the WordPress
# install, activates the plugin and seeds data - so the candidate does none of it.
#
# Failures are LOUD on purpose. A silent half-setup is worse than a clear error,
# because it costs you your setup window before you find out.
set -u

fail() {
  echo ""
  echo "=================================================="
  echo " SETUP FAILED"
  echo " $1"
  echo ""
  echo " Please stop and contact us on the assessment email"
  echo " thread. Paste this message and your OS. This is our"
  echo " packaging problem, not part of your assessment."
  echo "=================================================="
  exit 1
}

# --- WP-CLI -----------------------------------------------------------------
# The official WordPress image does NOT ship wp-cli, so it is fetched once.
# This is the only network call in setup beyond the Docker image pulls.
if [ ! -f /usr/local/bin/wp ]; then
  echo "Fetching WP-CLI..."
  if ! curl -fsSL -o /usr/local/bin/wp \
      https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar; then
    fail "Could not download WP-CLI from raw.githubusercontent.com.
 The container is running but has NOT been set up.
 Usually a proxy, firewall or offline network."
  fi
  chmod +x /usr/local/bin/wp
fi

command -v wp >/dev/null 2>&1 || fail "WP-CLI is not executable after download."

cd /var/www/html || fail "WordPress directory /var/www/html is missing."

# --- WordPress install ------------------------------------------------------
installed=0
for i in $(seq 1 30); do
  if wp core is-installed --allow-root >/dev/null 2>&1; then
    installed=1
    break
  fi
  if wp core install --allow-root \
      --url=http://localhost:8080 \
      --title="Bema Learn" \
      --admin_user=admin \
      --admin_password=assessment123 \
      --admin_email=admin@example.test \
      --skip-email >/dev/null 2>&1; then
    installed=1
    break
  fi
  sleep 3
done

[ "$installed" -eq 1 ] || fail "WordPress did not install after 90 seconds.
 The database container may not be reachable."

# --- Plugin -----------------------------------------------------------------
wp plugin activate bemalearn --allow-root >/dev/null 2>&1

wp plugin is-active bemalearn --allow-root >/dev/null 2>&1 \
  || fail "The Bema Learn plugin did not activate."

wp rewrite structure '/%postname%/' --allow-root >/dev/null 2>&1
wp rewrite flush --hard --allow-root >/dev/null 2>&1

# --- Prove the seed data actually landed ------------------------------------
# Activation alone is not proof. The tables must hold rows.
# Uses WP-CLI rather than an HTTP client, so this check does not depend on
# curl/wget being present and does not go over the network.
cat > /tmp/bl-verify.php <<'PHPEOF'
<?php
global $wpdb;
$n = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bl_courses");
exit($n > 0 ? 0 : 1);
PHPEOF

api_ok=0
for i in $(seq 1 10); do
  if wp eval-file /tmp/bl-verify.php --allow-root >/dev/null 2>&1; then
    api_ok=1
    break
  fi
  sleep 2
done
rm -f /tmp/bl-verify.php

[ "$api_ok" -eq 1 ] || fail "The plugin activated but its tables are empty or missing.
 Seeding did not complete. Check: docker compose logs wordpress"

echo ""
echo "=================================================="
echo " Bema Learn ready at http://localhost:8080"
echo " API: http://localhost:8080/wp-json/bemalearn/v1/courses"
echo " Admin: admin / assessment123"
echo "=================================================="
