import path from "path";
import { fileURLToPath } from "url";
import { writeSensitiveDocumentFile } from "./document-storage.service.js";
import { escapeHtml } from "../utils/htmlEscape.js";
import { renderHtmlToPdfBuffer } from "./pdf.service.js";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DSAR_EXPORT_DIR = path.join(ROOT_DIR, "var", "dsar-exports");

function countRecords(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return value ? 1 : 0;
}

export function buildDsarPdfHtml(exportPayload, { requestId } = {}) {
  const sections = [
    ["Account", exportPayload.user],
    ["Leads", exportPayload.leads],
    ["Intakes", exportPayload.intakes],
    ["Agreements", exportPayload.agreements],
    ["Onboarding packets", exportPayload.onboardingPackets],
    ["Bookings", exportPayload.bookings],
    ["Payments", exportPayload.payments],
    ["Docketwise sync", exportPayload.docketwiseSync],
    ["Privacy requests", exportPayload.dsarRequests],
  ];

  const summaryRows = sections
    .map(
      ([label, data]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${countRecords(data)} record(s)</td></tr>`
    )
    .join("");

  const userLine = exportPayload.user
    ? `${escapeHtml(exportPayload.user.fullName || exportPayload.user.email || "Account")}`
    : "No linked account data";

  return `
    <h1>Personal Data Export Summary</h1>
    <p><strong>Request ID:</strong> ${escapeHtml(requestId || "—")}</p>
    <p><strong>Generated at:</strong> ${escapeHtml(exportPayload.generatedAt || new Date().toISOString())}</p>
    <p><strong>Subject:</strong> ${userLine}</p>
    <p>
      This PDF summarizes categories of personal data held in our systems.
      The canonical machine-readable export is provided separately as JSON.
      Document contents and full intake answers are not reproduced here.
    </p>
    <h2>Data categories</h2>
    <table>
      <thead>
        <tr><th>Category</th><th>Approximate records</th></tr>
      </thead>
      <tbody>${summaryRows}</tbody>
    </table>
    <p style="margin-top:2em;font-size:12px;color:#6b7280;">
      TODO: Have DSAR export presentation reviewed by privacy counsel before production launch.
    </p>
  `;
}

export async function writeDsarPdfToDisk({ requestId, pdfBuffer }) {
  const { filename } = await writeSensitiveDocumentFile({
    directory: DSAR_EXPORT_DIR,
    basename: `${requestId}.pdf`,
    buffer: pdfBuffer,
  });
  return path.join("var", "dsar-exports", filename);
}

export function resolveDsarPdfAbsolutePath(relativePath) {
  if (!relativePath) return null;
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.join(ROOT_DIR, relativePath);
}

export async function renderDsarExportPdf(exportPayload, { requestId }) {
  const html = buildDsarPdfHtml(exportPayload, { requestId });
  return renderHtmlToPdfBuffer({
    title: "Personal Data Export Summary",
    html,
  });
}
