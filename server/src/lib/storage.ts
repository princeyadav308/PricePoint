/**
 * PDF Storage Utilities
 *
 * Manages PDF generation caching using Supabase Storage.
 * PDFs are stored in a private bucket and served via 15-minute signed URLs.
 *
 * IMPORTANT: Uses the SERVICE ROLE key (not anon key) because:
 * - The anon key cannot create buckets or upload to private buckets (RLS blocks it)
 * - Storage operations are server-side only and never exposed to clients
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// ── Service-role Supabase client (storage-only) ──────────────
// Separate from the anon-key client in lib/supabase.ts which is used for auth validation.
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
}

if (!serviceRoleKey) {
    logger.warn('Missing SUPABASE_SERVICE_ROLE_KEY — PDF storage caching will be disabled');
}

const storageClient = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
          auth: {
              autoRefreshToken: false,
              persistSession: false,
          },
      })
    : null;

/** Name of the private Supabase Storage bucket for generated PDFs. */
export const REPORTS_BUCKET = 'Pricepoint Reports';

/**
 * Ensure the reports bucket exists (private). Safe to call repeatedly.
 * Since the bucket was created manually via the Supabase dashboard,
 * this just verifies it exists and logs a warning if not.
 */
export async function ensureBucket(): Promise<void> {
    if (!storageClient) {
        logger.warn('Storage client not initialized (missing service role key), skipping bucket check');
        return;
    }

    logger.info(`Verifying bucket '${REPORTS_BUCKET}' exists`);
    const { data: buckets, error: listError } = await storageClient
        .storage
        .listBuckets();

    if (listError) {
        logger.error('Failed to list storage buckets', listError);
        throw listError;
    }

    const exists = buckets?.some(b => b.name === REPORTS_BUCKET);
    if (exists) {
        logger.info(`Bucket '${REPORTS_BUCKET}' verified`);
        return;
    }

    // Bucket doesn't exist — try to create it with the service role key
    logger.warn(`Bucket '${REPORTS_BUCKET}' not found, attempting to create`);
    const { error: createError } = await storageClient.storage.createBucket(REPORTS_BUCKET, {
        public: false,
        allowedMimeTypes: ['application/pdf'],
    });

    if (createError) {
        logger.error(`Failed to create bucket '${REPORTS_BUCKET}'`, createError);
        throw createError;
    }

    logger.info(`Created private bucket '${REPORTS_BUCKET}'`);
}

/**
 * Upload a generated PDF to the private reports bucket.
 *
 * @param documentId - The report document ID (used as part of the storage path)
 * @param verificationHash - Hash used to verify report integrity
 * @param pdfBuffer - The raw PDF binary data
 * @returns The storage path of the uploaded file
 */
export async function uploadPdf(
    documentId: string,
    verificationHash: string | null,
    pdfBuffer: Buffer | Uint8Array
): Promise<string> {
    if (!storageClient) {
        throw new Error('Storage client not initialized (missing SUPABASE_SERVICE_ROLE_KEY)');
    }

    const fileName = `${documentId}-${verificationHash || 'nofile'}.pdf`;
    const storagePath = `reports/${fileName}`;

    logger.info('Uploading PDF to storage', {
        documentId,
        storagePath,
        fileSize: pdfBuffer.length,
    });

    const { data, error } = await storageClient.storage
        .from(REPORTS_BUCKET)
        .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
        });

    if (error) {
        logger.error('Failed to upload PDF to storage', error, { documentId, storagePath });
        throw error;
    }

    logger.info('PDF uploaded successfully', { documentId, storagePath });
    return data.path;
}

/**
 * Generate a short-lived signed URL for a PDF in the private reports bucket.
 *
 * @param storagePath - The storage path of the PDF (as returned by uploadPdf)
 * @param expiresInSeconds - TTL for the signed URL (default 900 = 15 minutes)
 * @returns A signed URL valid for the specified duration
 */
export async function getSignedPdfUrl(
    storagePath: string,
    expiresInSeconds = 900
): Promise<string> {
    if (!storageClient) {
        throw new Error('Storage client not initialized (missing SUPABASE_SERVICE_ROLE_KEY)');
    }

    logger.debug('Generating signed URL for PDF', { storagePath, expiresInSeconds });

    const { data, error } = await storageClient.storage
        .from(REPORTS_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
        logger.error('Failed to generate signed URL', error, { storagePath });
        throw error;
    }

    return data.signedUrl;
}
