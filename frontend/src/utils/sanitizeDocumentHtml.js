const ALLOWED_DOCUMENT_TAGS = new Set([
  "B",
  "BR",
  "DIV",
  "EM",
  "H1",
  "H2",
  "H3",
  "HR",
  "I",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "UL",
]);

function sanitizeNode(node, documentRef) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  if (!ALLOWED_DOCUMENT_TAGS.has(node.tagName)) {
    node.replaceWith(documentRef.createTextNode(node.textContent || ""));
    return;
  }

  for (const attribute of [...node.attributes]) {
    node.removeAttribute(attribute.name);
  }

  for (const child of [...node.childNodes]) {
    sanitizeNode(child, documentRef);
  }
}

export function sanitizeDocumentHtml(html) {
  if (typeof DOMParser === "undefined") {
    return "";
  }

  const parser = new DOMParser();
  const documentRef = parser.parseFromString(String(html || ""), "text/html");

  for (const child of [...documentRef.body.childNodes]) {
    sanitizeNode(child, documentRef);
  }

  return documentRef.body.innerHTML;
}
