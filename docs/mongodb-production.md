# MongoDB Production Checklist

## Atlas

- [ ] Use MongoDB Atlas production cluster.
- [ ] Enable TLS, default in Atlas connection strings.
- [ ] Create a dedicated database user for FinSync.
- [ ] Use least privilege for the application user.
- [ ] Restrict IP access to the VPS public IP.
- [ ] Disable broad `0.0.0.0/0` access after setup.

## Backups and restore

- [ ] Enable automated snapshots.
- [ ] Test restore into a staging database.
- [ ] Keep backup retention aligned with LGPD and business policy.

## Prisma

```bash
npm run prisma:generate --prefix backend
npm run prisma:push --prefix backend
```

## Indexes and monitoring

- [ ] Confirm Prisma indexes from `schema.prisma` are pushed.
- [ ] Monitor slow queries in Atlas.
- [ ] Alert on high connection count, storage growth and CPU.
- [ ] Rotate database password after initial deployment.
