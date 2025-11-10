#!/bin/sh
set -eu

CERTBOT_WEBROOT=${CERTBOT_WEBROOT:-/var/www/certbot}
CONF_PATH=/etc/nginx/conf.d/default.conf
ENABLE_SSL=${ENABLE_SSL:-false}
SERVER_NAME_VALUE=${SERVER_NAME:-}
API_SERVER_NAME_VALUE=${API_SERVER_NAME:-}
LE_EMAIL=${LETSENCRYPT_EMAIL:-}
CERTBOT_RENEW_INTERVAL_SECONDS=${CERTBOT_RENEW_INTERVAL:-43200}
USE_STAGING=${LETSENCRYPT_USE_STAGING:-false}
BACKEND_UPSTREAM=${BACKEND_SERVICE_URL:-http://backend:3000}
FRONTEND_SERVER_NAME=${SERVER_NAME_VALUE:-_}
CERTBOT_STAGING_FLAG=""
CERT_DOMAIN_ARGS=""

case "$CERTBOT_RENEW_INTERVAL_SECONDS" in
  ''|*[!0-9]*)
    CERTBOT_RENEW_INTERVAL_SECONDS=43200
    ;;
esac

mkdir -p "$CERTBOT_WEBROOT"

append_frontend_http_server() {
  cat >>"$CONF_PATH" <<EOF
server {
    listen 80;
    server_name ${FRONTEND_SERVER_NAME};

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

append_api_http_server() {
  [ -z "$API_SERVER_NAME_VALUE" ] && return 0
  cat >>"$CONF_PATH" <<EOF
server {
    listen 80;
    server_name ${API_SERVER_NAME_VALUE};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {

        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass ${BACKEND_UPSTREAM};
    }
}

EOF
}

append_frontend_http_redirect() {
  cat >>"$CONF_PATH" <<EOF
server {
    listen 80;
    server_name ${FRONTEND_SERVER_NAME};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

EOF
}

append_api_http_redirect() {
  [ -z "$API_SERVER_NAME_VALUE" ] && return 0
  cat >>"$CONF_PATH" <<EOF
server {
    listen 80;
    server_name ${API_SERVER_NAME_VALUE};

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
    if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

        return 301 https://\$host\$request_uri;
    }
}

EOF
}

append_frontend_https_server() {
  cat >>"$CONF_PATH" <<EOF
server {
    listen 443 ssl;
    server_name ${FRONTEND_SERVER_NAME};

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

append_api_https_server() {
  [ -z "$API_SERVER_NAME_VALUE" ] && return 0
  cat >>"$CONF_PATH" <<EOF
server {
    listen 443 ssl;
    server_name ${API_SERVER_NAME_VALUE};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /.well-known/acme-challenge/ {
        root ${CERTBOT_WEBROOT};
    }

    location / {
    if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass ${BACKEND_UPSTREAM};
    }
}

EOF
}

generate_http_config() {
  : >"$CONF_PATH"
  append_frontend_http_server
  append_api_http_server
}

generate_https_config() {
  : >"$CONF_PATH"
  append_frontend_http_redirect
  append_api_http_redirect
  append_frontend_https_server
  append_api_https_server
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
    $CERTBOT_STAGING_FLAG \
    $CERT_DOMAIN_ARGS
}

renew_certificates() {
  certbot renew --webroot -w "$CERTBOT_WEBROOT" \
    --quiet --deploy-hook "nginx -s reload" \
    $CERTBOT_STAGING_FLAG
}

start_certbot_supervisor() {
  (
    sleep 5

    if ! cert_available; then
      MSG="[letsencrypt] Requesting initial certificate for ${SERVER_NAME_VALUE}"
      if [ -n "$API_SERVER_NAME_VALUE" ]; then
        MSG="$MSG and ${API_SERVER_NAME_VALUE}"
      fi
      echo "$MSG"
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

  if [ -z "$API_SERVER_NAME_VALUE" ]; then
    echo "API_SERVER_NAME must be defined when ENABLE_SSL=true" >&2
    exit 1
  fi

  if [ -z "$LE_EMAIL" ]; then
    echo "LETSENCRYPT_EMAIL must be defined when ENABLE_SSL=true" >&2
    exit 1
  fi

  CERT_DIR="/etc/letsencrypt/live/$SERVER_NAME_VALUE"
  CERT_DOMAIN_ARGS="-d $SERVER_NAME_VALUE -d $API_SERVER_NAME_VALUE"
else
  SERVER_NAME_VALUE=${SERVER_NAME_VALUE:-_}
  FRONTEND_SERVER_NAME=${SERVER_NAME_VALUE}
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
