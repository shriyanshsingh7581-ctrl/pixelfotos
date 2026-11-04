# Security Specification (Phase 0 — Payload-First Security TDD)

## 1. Data Invariants
1. **Global Default-Deny**: All paths not explicitly matched are denied (`allow read, write: if false`).
2. **Email Verification Gate**: Every write operation requires `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Split Isolation**: User PII (`email`, `phone`) is stored strictly in `/users/{userId}/private/info` and readable ONLY by `isOwner(userId)` or `isAdmin()`.
4. **Privilege Escalation Prevention**: During `/users/{userId}` creation or update, users cannot assign themselves `super_admin`; `role` is restricted to studio/client roles and immutable on client updates.
5. **Relational Consistency (Master Gate)**:
   - Creating a `/projects/{projectId}` requires `exists(/databases/$(database)/documents/studios/$(incoming().studioId))` and `get(...).data.ownerId == request.auth.uid`.
   - Creating a `/galleries/{galleryId}` requires `exists(/databases/$(database)/documents/studios/$(incoming().studioId))` and `exists(/databases/$(database)/documents/projects/$(incoming().projectId))`.
   - Accessing or creating `/galleries/{galleryId}/photos/{photoId}` checks parent gallery ownership or public/published status via `get()`.
6. **Terminal State Locking**: Once a gallery reaches `status == 'locked'`, non-admin updates are rejected.
7. **Temporal & Immortal Field Integrity**: `createdAt == request.time` on creation; `createdAt`, `ownerId`, and `studioId` are immutable on update.
8. **Secure List Queries**: Every `allow list` rule enforces `resource.data.ownerId == request.auth.uid` or `resource.data.accessType == 'public'` without `get()`/`exists()` inside list rules.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Shadow Field Injection)**: Create `/studios/st_1` with `{ studioName: "A", slug: "a", ownerId: "u1", subscriptionPlan: "pro", subscriptionStatus: "active", watermarkText: "A", createdAt: request.time, isVerifiedAdmin: true }` -> `PERMISSION_DENIED` (`hasOnly` check).
2. **Payload 2 (Identity Spoofing)**: Authenticated as `u1`, create `/studios/st_1` with `ownerId: "u2"` -> `PERMISSION_DENIED`.
3. **Payload 3 (Unverified Email Spoof)**: Authenticated with `email: "singhshriyansh51@gmail.com"` and `email_verified: false`, write to `/studios/st_1` -> `PERMISSION_DENIED`.
4. **Payload 4 (PII Cross-Tenant Read)**: Authenticated as `u2`, `get` `/users/u1/private/info` -> `PERMISSION_DENIED`.
5. **Payload 5 (Orphaned Project Write)**: Create `/projects/p1` referencing non-existent `studioId: "ghost_studio"` -> `PERMISSION_DENIED` (`exists()` check).
6. **Payload 6 (ID Poisoning / 2KB Path ID)**: Create document with 200-char ID or invalid characters `st$bad!` -> `PERMISSION_DENIED` (`isValidId` check).
7. **Payload 7 (Value Poisoning on Update)**: Update `/galleries/g1` field `galleryName` with a boolean `true` or 5000-char string -> `PERMISSION_DENIED` (`isValidGallery` wrapper on update).
8. **Payload 8 (Terminal State Bypass)**: Update `/galleries/g1` when `resource.data.status == 'locked'` as non-admin -> `PERMISSION_DENIED`.
9. **Payload 9 (Immortal Field Mutation)**: Update `/projects/p1` changing `ownerId` or `createdAt` -> `PERMISSION_DENIED`.
10. **Payload 10 (Client Timestamp Forgery)**: Create `/studios/st_1` with past/future `createdAt` != `request.time` -> `PERMISSION_DENIED`.
11. **Payload 11 (Unconstrained List Scraping)**: List `/projects` without `where('ownerId', '==', uid)` -> `PERMISSION_DENIED` (`resource.data.ownerId == request.auth.uid`).
12. **Payload 12 (Self-Assigned Role Escalation)**: Create `/users/u1` with `role: "super_admin"` -> `PERMISSION_DENIED`.
