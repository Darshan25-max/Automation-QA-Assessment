# How Task 1 was executed (reproducible)

The hosted demo (`demo.realworld.io`) was not reachable from the machine used for testing, so a public RealWorld implementation was run locally.

```bash
git clone https://github.com/TonyMckes/conduit-realworld-example-app   # tested commit 5e127d8
cd conduit-realworld-example-app && npm install
# PostgreSQL 16 on port 5433, empty database "conduit"
cat > backend/.env <<'E'
PORT=3001
JWT_KEY=localtestkey
DEV_DB_USERNAME=postgres
DEV_DB_PASSWORD=
DEV_DB_NAME=conduit
DEV_DB_HOSTNAME=127.0.0.1
DEV_DB_PORT=5433
DEV_DB_DIALECT=postgres
E
# one-line change so the DB port is configurable: add  port: process.env.DEV_DB_PORT  to development{} in backend/config/config.js
(cd backend && node index.js) &        # API  http://localhost:3001
(cd frontend && npx vite --host 127.0.0.1) &   # UI  http://localhost:3000/#/
```
Then run the scripts (Playwright must be installed: `npm i playwright && npx playwright install chromium`):
```bash
cd test-scripts && node main.js        # full functional run, prints observations
node iso4.js ; node iso5.js ; node extra.js   # isolated reproductions of individual bugs
node evidence.js                        # regenerates the API evidence images
```
Scripts expect an empty database (`truncate "Users" cascade;`) and write screenshots to `../screenshots/` (edit `SHOTS` in `lib.js` if you move things).
No application source code was modified except the DB-port line above. Bug fixes are **not** part of this repository.
