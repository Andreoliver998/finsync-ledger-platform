# SSL Setup

## Install Certbot

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

## Issue certificates

Preferred command:

```bash
sudo certbot --nginx -d finsync.paytech.app.br -d api-finsync.paytech.app.br
```

If Certbot creates separate certificate directories per host, update the certificate paths in the NGINX config after the first issuance.

## Validate renewal

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

## Required TLS posture

- Redirect HTTP to HTTPS.
- Keep TLS 1.2+ and TLS 1.3 enabled.
- Enable HSTS after both domains work over HTTPS.
- Never proxy the public API over plain HTTP outside localhost.

## Reload NGINX

```bash
sudo nginx -t
sudo systemctl reload nginx
```
