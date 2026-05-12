# DNS Setup

Create both records in Hostinger DNS:

| Type | Name | Value |
| --- | --- | --- |
| A | `finsync` | VPS public IPv4 |
| A | `api-finsync` | VPS public IPv4 |

Optional if IPv6 is enabled:

| Type | Name | Value |
| --- | --- | --- |
| AAAA | `finsync` | VPS public IPv6 |
| AAAA | `api-finsync` | VPS public IPv6 |

## Validate propagation

```bash
dig +short finsync.paytech.app.br
dig +short api-finsync.paytech.app.br
nslookup finsync.paytech.app.br
nslookup api-finsync.paytech.app.br
```

Only run Certbot after both domains resolve to the VPS.
