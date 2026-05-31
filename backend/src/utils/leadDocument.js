import { assertLeadAccess } from "../services/access.service.js";
import { renderHtmlToPdfBuffer } from "../services/pdf.service.js";

export async function loadLeadDocument(leadId, user, findDocument, notFoundError) {
  await assertLeadAccess(user, leadId);
  const document = await findDocument(leadId);

  if (!document) {
    throw notFoundError();
  }

  return document;
}

export async function renderLeadDocumentPdf(document, defaultTitle) {
  return renderHtmlToPdfBuffer({
    title: document.title || defaultTitle,
    html: document.html_content,
  });
}
