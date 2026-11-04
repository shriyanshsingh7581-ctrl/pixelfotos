import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rules = fs.readFileSync('./firestore.rules', 'utf8');

test('Dirty Dozen Security Invariants in firestore.rules', () => {
  // 1. Default deny catch-all exists
  assert.ok(rules.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));

  // 2. Shadow Field Rejection (hasOnly & hasAll present in all entity validators)
  assert.ok(rules.includes("data.keys().hasOnly(['studioName', 'slug', 'ownerId', 'subscriptionPlan', 'subscriptionStatus', 'watermarkText', 'createdAt'])"));
  assert.ok(rules.includes("data.keys().hasOnly(['studioId', 'projectId', 'ownerId', 'galleryName', 'accessType', 'passwordHash', 'selectionLimit', 'watermarkEnabled', 'downloadEnabled', 'status', 'createdAt'])"));

  // 3. Identity Spoofing Guard (ownerId == request.auth.uid)
  assert.ok(rules.includes('data.ownerId == request.auth.uid'));

  // 4. Email Verification Enforcement
  assert.ok(rules.includes('request.auth.token.email_verified == true'));

  // 5. PII Split Collection Isolation
  assert.ok(rules.includes('match /private/{docId}'));
  assert.ok(rules.includes('allow get: if isValidId(userId) && isValidId(docId) && (isOwner(userId) || isAdmin());'));

  // 6. Relational Existence Check (Orphaned Write Prevention)
  assert.ok(rules.includes('exists(/databases/$(database)/documents/studios/$(incoming().studioId))'));
  assert.ok(rules.includes('exists(/databases/$(database)/documents/projects/$(incoming().projectId))'));

  // 7. ID Poisoning Guard
  assert.ok(rules.includes("id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$')"));

  // 8. Terminal State Locking
  assert.ok(rules.includes("existing().status != 'locked'"));
  assert.ok(rules.includes("existing().status != 'delivered'"));

  // 9. Temporal Integrity (request.time)
  assert.ok(rules.includes('incoming().createdAt == request.time'));

  // 10. Query Enforcer on list
  assert.ok(rules.includes('allow list: if isSignedIn() && existing().ownerId == request.auth.uid;'));
});
