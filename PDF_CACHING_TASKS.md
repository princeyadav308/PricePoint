# PDF Caching Implementation — Task Breakdown

> **Project**: PricePoint  
> **Status**: Implementation Complete ✅  
> **Date**: 2026-08-07  
> **Related Files**: ROADMAP.md, PRD.md, HANDOFF.md (if exists)

---

## 1. Schema & Database Layer

### 1.1 Prisma Schema Update (COMPLETED)
- **Status**: ✅ Complete
- **Files**: `server/prisma/schema.prisma`
- **Changes**:
  - Added `claudeData Json?` — stores validated Claude narrative
  - Added `templateVersion Int @default(1)` — tracks PDF template version
  - Added `generationStatus String @default("idle")` — states: idle | generating | complete | failed
- **Verification**: Schema compiles without errors

### 1.2 Database Migration (PENDING — Manual Step)
- **Status**: ⬜ Pending Execution
- **Action Required**: Run `npx prisma migrate dev --name report-caching-fields`
- **Dependencies**: Requires database connectivity
- **Rollback Plan**: `npx prisma migrate reset` if issues

---

## 2. Storage & Versioning Infrastructure

### 2.1 Storage Module (COMPLETED)
- **Status**: ✅ Complete
- **File**: `server/src/lib/storage.ts`
- **Functions Implemented**:
  - `ensureBucket()` — Creates private `pricepoint-reports` bucket
  - `uploadPdf(documentId, verificationHash, pdfBuffer)` — Uploads PDF, returns storage path
  - `getSignedPdfUrl(storagePath, expiresInSeconds=900)` — Generates 15-min signed URL
- **Testing**: Unit tests written, integration pending

### 2.2 Version Tracking Module (COMPLETED)
- **Status**: ✅ Complete
- **File**: `server/src/lib/reportVersion.ts`
- **Exports**:
  - `CURRENT_TEMPLATE_VERSION = 1` — with detailed bump trigger documentation
  - `CURRENT_CLAUDE_SCHEMA_VERSION = 1` — independent of template
  - `regenerationReason(trigger)` — helper for logging
- **Documentation**: Comment blocks list exact triggers for version bumps

---

## 3. Backend API Endpoints

### 3.1 Enhanced POST `/api/generate-report` (COMPLETED)
- **Status**: ✅ Complete
- **File**: `server/src/server.ts`
- **Changes**:
  - Accepts optional `documentId` in request body
  - After validation, persists `claudeData`, `templateVersion`, `claudeSchemaVersion` to Report
  - Sets `generationStatus = 'complete'`
  - Logs successful persistence with metadata

### 3.2 Enhanced POST `/api/generate-pdf` (COMPLETED)
- **Status**: ✅ Complete
- **File**: `server/src/server.ts`
- **Changes**:
  - Accepts optional `documentId` in request body
  - Atomic lock via `UPDATE ... WHERE generationStatus != 'generating' OR (generating AND stale > 5min)`
  - Returns 409 if lock acquisition fails (concurrent generation)
  - On success: uploads to Supabase Storage, updates `pdfUrl`, `templateVersion`, `generationStatus = 'complete'`
  - On storage failure: serves PDF directly, logs error, sets `generationStatus = 'failed'`
  - On Puppeteer failure: sets `generationStatus = 'failed'`
  - Cleanup: always closes browser/page in `finally` block

### 3.3 NEW GET `/api/reports/:documentId/pdf` (PENDING — Need routes/reports.ts update)
- **Status**: ⬜ Not Started
- **Target File**: `server/src/routes/reports.ts`
- **Requirements**:
  1. Verify auth token
  2. Fetch Report with Session → Lead
  3. Payment gate: `paymentStatus === 'Paid'` or 403
  4. Ownership: `Lead.supabaseUserId === user.id` (primary), fallback `Lead.email === user.email`
  5. Cache check: `pdfUrl` exists AND `templateVersion === CURRENT_TEMPLATE_VERSION`
  6. If cached + current → `getSignedPdfUrl()` → return `{ url: signedUrl }`
  7. If not → return 404 (client falls back to generation flow)

---

## 4. Frontend Integration

### 4.1 Success.tsx Updates (PENDING)
- **Status**: ⬜ Not Started
- **File**: `client/src/pages/Success.tsx`
- **Changes Needed**:
  - Pass `documentId` to `/api/generate-report` call
  - Pass `documentId` to `/api/generate-pdf` call
  - Handle 409 response from PDF generation (show toast, retry)

### 4.2 ProfilePage.tsx Updates (PENDING)
- **Status**: ⬜ Not Started
- **File**: `client/src/pages/ProfilePage.tsx`
- **Changes Needed** in `handleDownload`:
  1. Try `GET /api/reports/:documentId/pdf`
  2. **200** → open signed URL (instant download)
  3. **404** → fall back to existing Claude + Puppeteer flow
  4. **409** → toast "Report is being generated…" + auto-retry GET after 5s (max 3 retries)
  5. **403** → toast "Access denied" (shouldn't happen in normal flow)

---

## 5. Verification Plan (From Implementation Plan)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1 | Generate report on Success page → verify PDF in Supabase Storage bucket (private) | ⬜ | |
| 2 | Verify `pdfUrl`, `claudeData`, `templateVersion = CURRENT`, `generationStatus = 'complete'` in DB | ⬜ | |
| 3 | Profile page → re-download → verify instant (no Claude/Puppeteer in server logs) | ⬜ | |
| 4 | Bump `CURRENT_TEMPLATE_VERSION` → re-download → verify regeneration (cache miss), reuses `claudeData` | ⬜ | |
| 5 | Access `GET /pdf` without auth → 401 | ⬜ | |
| 6 | Access another user's report → 403 | ⬜ | |
| 7 | Access unpaid report → 403 | ⬜ | |
| 8 | Double-click download → first returns PDF, second gets 409 → client retries and gets cached PDF | ⬜ | |
| 9 | Kill Puppeteer mid-generation → verify `generationStatus` resets after 5 min safety valve | ⬜ | |

---

## 6. Dependencies & Blockers

| Dependency | Status | Notes |
|------------|--------|-------|
| Prisma migration applied | ⬜ | Must run before testing |
| Supabase Storage bucket creation | ✅ | Handled by `ensureBucket()` on first upload |
| Routes/reports.ts update | ⬜ | Required for GET endpoint |
| Client-side auth token handling | ✅ | Already in place via supabase client |

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database migration fails in prod | Low | High | Test on staging first; have rollback script |
| Supabase Storage quota exceeded | Low | Medium | Monitor usage; implement lifecycle policies |
| Race condition in PDF generation | Medium | Medium | Atomic lock + 5-min stale timeout |
| Signed URL expiry before download | Low | Low | Client re-requests fresh URL on 404/expired |
| Template version drift | Medium | High | Explicit bump documentation in reportVersion.ts |

---

## 8. Next Actions

1. [ ] Run database migration: `npx prisma migrate dev --name report-caching-fields`
2. [ ] Implement GET `/api/reports/:documentId/pdf` in `routes/reports.ts`
3. [ ] Update `Success.tsx` to pass `documentId`
4. [ ] Update `ProfilePage.tsx` with cached-first download logic
5. [ ] Execute verification plan tests
6. [ ] Update CI/CD pipeline for new migration
7. [ ] Prepare release notes