#!/bin/bash
cd /opt/maritimeerp
git pull origin main
docker compose build --no-cache
docker compose up -d
echo "✅ MaritimeERP redéployé !"
