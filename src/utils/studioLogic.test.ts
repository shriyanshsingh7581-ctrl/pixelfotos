import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashGalleryPassword,
  verifyGalleryPassword,
  calculateSelectionMetrics,
  canTogglePhotoSelection,
  calculateGSTInvoice,
  evaluateStudioQuota,
  buildCloudinaryTransformUrl,
} from './studioLogic';

test('Gallery password hashing is deterministic and verifies accurately', () => {
  const hash = hashGalleryPassword('RoyalWedding2026');
  assert.ok(hash.startsWith('sha256_sim_'));
  assert.notEqual(hash, 'RoyalWedding2026');
  assert.equal(verifyGalleryPassword('RoyalWedding2026', hash), true);
  assert.equal(verifyGalleryPassword('WrongPass', hash), false);
});

test('Selection metrics and limit enforcement prevent exceeding photographer limit', () => {
  const samplePhotos = [
    { selected: true, liked: true },
    { selected: true, liked: false },
    { selected: false, liked: true },
  ];
  const metrics = calculateSelectionMetrics(samplePhotos, 2);
  assert.equal(metrics.selectedCount, 2);
  assert.equal(metrics.likedCount, 2);
  assert.equal(metrics.limitReached, true);
  assert.equal(metrics.progressPercent, 100);

  const attemptAdd = canTogglePhotoSelection(false, 2, 2, 'published');
  assert.equal(attemptAdd.allowed, false);

  const attemptRemove = canTogglePhotoSelection(true, 2, 2, 'published');
  assert.equal(attemptRemove.allowed, true);

  const lockedAttempt = canTogglePhotoSelection(true, 1, 5, 'locked');
  assert.equal(lockedAttempt.allowed, false);
});

test('GST invoice calculation computes CGST, SGST, balance, and verified status', () => {
  const items = [
    { id: '1', description: '3-Day Luxury Wedding Coverage', quantity: 1, unitPrice: 100000 },
    { id: '2', description: 'Handcrafted Italian Flush-Mount Album', quantity: 2, unitPrice: 15000 },
  ];
  // Subtotal = 130,000; 18% GST = 23,400 (CGST 11,700 + SGST 11,700); Grand Total = 153,400
  const partialCalc = calculateGSTInvoice(items, 18, 53400, false);
  assert.equal(partialCalc.subtotal, 130000);
  assert.equal(partialCalc.cgstAmount, 11700);
  assert.equal(partialCalc.sgstAmount, 11700);
  assert.equal(partialCalc.grandTotal, 153400);
  assert.equal(partialCalc.balanceDue, 100000);
  assert.equal(partialCalc.derivedStatus, 'partially_paid');

  // Without verified payment record, full advance still stays partially_paid (never auto-marked paid without verification)
  const unverifiedFull = calculateGSTInvoice(items, 18, 153400, false);
  assert.equal(unverifiedFull.derivedStatus, 'partially_paid');

  const verifiedFull = calculateGSTInvoice(items, 18, 153400, true);
  assert.equal(verifiedFull.derivedStatus, 'paid');
});

test('Studio subscription quota evaluation flags exceeded limits accurately', () => {
  const starterPlan = {
    id: 'starter' as const,
    name: 'Studio Starter',
    tagline: 'For solo creators',
    monthlyPrice: 29,
    yearlyPrice: 290,
    storageLimitGB: 100,
    projectLimit: 10,
    photoLimit: 5000,
    galleryLimit: 15,
    teamMemberLimit: 2,
    aiCredits: 500,
    features: [],
  };

  const okCheck = evaluateStudioQuota(starterPlan, {
    storageUsedBytes: 25 * 1024 * 1024 * 1024,
    projectCount: 4,
    photoCount: 1200,
    galleryCount: 5,
  });
  assert.equal(okCheck.withinQuota, true);
  assert.equal(okCheck.storagePercent, 25);

  const overCheck = evaluateStudioQuota(starterPlan, {
    storageUsedBytes: 50 * 1024 * 1024 * 1024,
    projectCount: 10,
    photoCount: 1200,
    galleryCount: 5,
  });
  assert.equal(overCheck.withinQuota, false);
  assert.equal(overCheck.warnings.length, 1);
});

test('Cloudinary transformation URL builder injects optimization and watermark parameters', () => {
  const url = buildCloudinaryTransformUrl('lumina-demo', 'photography-studios/st1/wed01', {
    width: 1200,
    quality: 'auto:best',
    watermarkText: 'Atelier Lumina',
  });
  assert.ok(url.includes('res.cloudinary.com/lumina-demo/image/upload/'));
  assert.ok(url.includes('w_1200'));
  assert.ok(url.includes('Atelier%20Lumina'));
});
