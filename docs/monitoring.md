# Monitoring and Logs

## PM2

```bash
pm2 status
pm2 describe finsync-api
pm2 logs finsync-api --lines 200
pm2 monit
```

## PM2 log rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

## Health endpoint

```bash
curl -fsS https://api-finsync.paytech.app.br/api/health
```

Expected:

```json
{
  "status": "ok",
  "environment": "production"
}
```

## NGINX

```bash
sudo journalctl -u nginx -n 200 --no-pager
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Do not log Authorization headers, cookies, Pluggy tokens or database URLs.

## Restart policy

```bash
pm2 save
pm2 startup
sudo systemctl enable nginx
```

## Minimum alerts

- API health endpoint fails.
- PM2 process restarts repeatedly.
- Disk usage above 80%.
- MongoDB connection errors.
- NGINX 5xx rate increases.
- Certbot renewal fails.
