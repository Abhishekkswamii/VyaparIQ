"use strict";

const { Storage } = require("@google-cloud/storage");

const BUCKET_NAME = "vyapariq-invoices";
const PROJECT_ID  = process.env.GCLOUD_PROJECT || "vyapariq";

let _storage;
function getStorage() {
  if (!_storage) _storage = new Storage({ projectId: PROJECT_ID });
  return _storage;
}

/**
 * Upload a PDF buffer to GCS.
 * Returns { storagePath, publicUrl }
 */
async function uploadInvoicePdf(userId, orderId, pdfBuffer) {
  const storagePath = `invoices/${userId}/${orderId}/invoice.pdf`;
  const bucket = getStorage().bucket(BUCKET_NAME);
  const file   = bucket.file(storagePath);

  await file.save(pdfBuffer, {
    metadata: { contentType: "application/pdf" },
    resumable: false,
  });

  return {
    storagePath,
    fileSize: pdfBuffer.length,
  };
}

/**
 * Stream a GCS file directly to an Express response object.
 * Caller must set headers before calling.
 */
function streamInvoice(storagePath, res) {
  const file = getStorage().bucket(BUCKET_NAME).file(storagePath);
  return new Promise((resolve, reject) => {
    const stream = file.createReadStream();
    stream.on("error", reject);
    stream.on("end",   resolve);
    stream.pipe(res);
  });
}

/**
 * Check whether a file exists in GCS.
 */
async function invoiceExists(storagePath) {
  const [exists] = await getStorage().bucket(BUCKET_NAME).file(storagePath).exists();
  return exists;
}

module.exports = { uploadInvoicePdf, streamInvoice, invoiceExists };
