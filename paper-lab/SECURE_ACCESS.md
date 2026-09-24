# Paper Lab secure access state

## Enforced now
- `GET /api/paper-lab-access` requires the existing Ashwood Workspace server-side session.
- Same-origin validation is required.
- The Workspace cookie is not exposed to JavaScript, copied into a URL, or shared with another hostname.
- The endpoint deliberately refuses to mint a cross-site handoff credential yet.

## Independent-site release condition
The independent Paper Lab site must have a trusted server-side receiver before Ashwood issues any handoff. The receiver must:
1. accept a one-time POSTed ticket (never query-string credentials);
2. redeem it through a server-to-server call;
3. enforce audience = `paper-lab`, short expiry, random nonce and atomic one-time consumption;
4. issue its own `HttpOnly; Secure; SameSite=Strict` host cookie;
5. reject replay, expired tickets, anonymous direct access and foreign origins;
6. keep all database secrets and signing material server-side.

Until a here.now deployment is confirmed to support that receiver and secret storage, the independent site must not be published as private or linked from Workspace. A client-side password prompt is not an acceptable substitute.
