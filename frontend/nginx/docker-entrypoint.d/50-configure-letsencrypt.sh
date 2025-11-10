#!/bin/sh
set -eu

CERTBOT_WEBROOT=${CERTBOT_WEBROOT:-/var/www/certbot}
CONF_PATH=/etc/nginx/conf.d/default.conf
ENABLE_SSL=${ENABLE_SSL:-false}
SERVER_NAME_VALUE=${SERVER_NAME:-}
LE_EMAIL=${LETSENCRYPT_EMAIL:-}
CERTBOT_RENEW_INTERVAL_SECONDS=${CERTBOT_RENEW_INTERVAL:-43200}
USE_STAGING=${LETSENCRYPT_USE_STAGING:-false}
CERTBOT_STAGING_FLAG=""

case "$CERTBOT_RENEW_INTERVAL_SECONDS" in
  ''|*[!0-9]*)
    CERTBOT_RENEW_INTERVAL_SECONDS=43200
    ;;
esac

mkdir -p "$CERTBOT_WEBROOT"

generate_http_config() {
  cat >"$CONF_PATH" <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME_VALUE:-_};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
}

generate_https_config() {
  cat >"$CONF_PATH" <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME_VALUE};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${SERVER_NAME_VALUE};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
}

cert_available() {
  [ -n "${CERT_DIR:-}" ] \
    && [ -f "${CERT_DIR}/fullchain.pem" ] \
    && [ -f "${CERT_DIR}/privkey.pem" ]
}

if [ "$USE_STAGING" = "true" ]; then
  CERTBOT_STAGING_FLAG="--staging"
fi

obtain_certificate() {
  certbot certonly --webroot -w "$CERTBOT_WEBROOT" \
    --non-interactive --agree-tos --no-eff-email \
    --email "$LE_EMAIL" \
    -d "$SERVER_NAME_VALUE" \
    $CERTBOT_STAGING_FLAG
}

renew_certificates() {
  certbot renew --webroot -w "$CERTBOT_WEBROOT" \
    --quiet --deploy-hook "nginx -s reload" \
    $CERTBOT_STAGING_FLAG
}

start_certbot_supervisor() {
  (
    # Allow nginx to bind to port 80 before requesting the first certificate.
    sleep 5

    if ! cert_available; then
      echo "[letsencrypt] Requesting initial certificate for ${SERVER_NAME_VALUE}"
      until obtain_certificate; do
        echo "[letsencrypt] Initial request failed, retrying in 30 seconds..." >&2
        sleep 30
      done
      generate_https_config
      nginx -s reload
    fi

    while :; do
      sleep "$CERTBOT_RENEW_INTERVAL_SECONDS"
      renew_certificates || true
    done
  ) &
}

if [ "$ENABLE_SSL" = "true" ]; then
  if [ -z "$SERVER_NAME_VALUE" ] || [ "$SERVER_NAME_VALUE" = "_" ]; then
    echo "SERVER_NAME must be defined when ENABLE_SSL=true" >&2
    exit 1
  fi

  if [ -z "$LE_EMAIL" ]; then
    echo "LETSENCRYPT_EMAIL must be defined when ENABLE_SSL=true" >&2
    exit 1
  fi

  CERT_DIR="/etc/letsencrypt/live/$SERVER_NAME_VALUE"
else
  SERVER_NAME_VALUE=${SERVER_NAME_VALUE:-_}
fi

if [ "$ENABLE_SSL" = "true" ] && cert_available; then
  generate_https_config
else
  generate_http_config
  if [ "$ENABLE_SSL" = "true" ]; then
    echo "[letsencrypt] SSL enabled but certificates not found. Serving HTTP until issuance completes."
  fi
fi

if [ "$ENABLE_SSL" = "true" ]; then
  start_certbot_supervisor
fi
