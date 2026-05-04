const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"'`]/g, (char) => HTML_ENTITIES[char]);
}
