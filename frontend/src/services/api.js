const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

let accessToken = null;

export function getAuthToken() {
  return accessToken;
}

export function setAuthToken(token) {
  accessToken = token || null;
}

export function clearAuthToken() {
  accessToken = null;
}

function buildJsonHeaders(options = {}) {
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };
}

async function parseJsonResponse(response) {
  return response.json().catch(() => ({}));
}

export async function refreshSession() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    clearAuthToken();
    return null;
  }

  setAuthToken(data.token);
  return data;
}

async function refreshAuthTokens() {
  const result = await refreshSession();
  return result?.token ?? null;
}

async function request(path, options = {}) {
  const { skipRefresh = false, ...fetchOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: buildJsonHeaders(fetchOptions),
    ...fetchOptions,
  });

  if (response.status === 401 && !skipRefresh) {
    const refreshedToken = await refreshAuthTokens();

    if (refreshedToken) {
      return request(path, { ...fetchOptions, skipRefresh: true });
    }
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const validationDetails = Array.isArray(data.errors)
      ? data.errors
          .map((item) => `${item.path || "field"}: ${item.message}`)
          .join("; ")
      : "";

    const error = new Error(
      validationDetails
        ? `${data.message || "Request failed"}: ${validationDetails}`
        : data.message || "Request failed"
    );
    error.details = data.errors || [];
    throw error;
  }

  return data;
}

export async function calculatePricing(payload) {
  return request("/public/pricing/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return request("/auth/logout", {
    method: "POST",
    skipRefresh: true,
  });
}

export async function requestPasswordReset(email) {
  return request("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipRefresh: true,
  });
}

export async function confirmPasswordReset(payload) {
  return request("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
    skipRefresh: true,
  });
}

export async function requestEmailVerification() {
  return request("/auth/email-verification/request", {
    method: "POST",
  });
}

export async function confirmEmailVerification(token) {
  return request("/auth/email-verification/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
    skipRefresh: true,
  });
}

export async function getCurrentUser() {
  return request("/auth/me");
}

export async function generateAgreementPreview(payload) {
  return request("/account/agreement/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitIntake(payload) {
  return request("/account/intake", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAdminLeads() {
  return request("/admin/leads");
}

export async function getAccountLeads() {
  return request("/account/leads");
}

export async function getAdminUsers() {
  return request("/admin/users");
}

export async function updateAdminUserRole(userId, role) {
  return request(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function getOnboardingPacket(leadId) {
  return request(`/account/onboarding/${leadId}`);
}

export async function generateOnboardingPacketForLead(leadId) {
  return request(`/admin/onboarding/${leadId}/generate`, {
    method: "POST",
  });
}
export async function getAdminLeadDetail(leadId) {
  return request(`/admin/leads/${leadId}`);
}

export async function getAgreementByLead(leadId) {
  return request(`/account/agreement/${leadId}`);
}

export async function generateAgreementForLead(leadId) {
  return request(`/admin/agreement/${leadId}/generate`, {
    method: "POST",
  });
}

export async function syncLeadToDocketwise(leadId) {
  return request(`/admin/docketwise/${leadId}/sync`, {
    method: "POST",
  });
}

export function getAgreementPdfUrl(leadId) {
  return `${API_URL}/account/agreement/${leadId}/pdf`;
}

export function getOnboardingPdfUrl(leadId) {
  return `${API_URL}/account/onboarding/${leadId}/pdf`;
}

async function openAuthenticatedPdf(path) {
  const popup = window.open("", "_blank");

  async function fetchPdf() {
    return fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  }

  let response = await fetchPdf();

  if (response.status === 401 && (await refreshAuthTokens())) {
    response = await fetchPdf();
  }

  if (!response.ok) {
    if (popup) {
      popup.close();
    }

    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to open PDF");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  if (popup) {
    popup.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function openAgreementPdf(leadId) {
  return openAuthenticatedPdf(`/account/agreement/${leadId}/pdf`);
}

export function openOnboardingPdf(leadId) {
  return openAuthenticatedPdf(`/account/onboarding/${leadId}/pdf`);
}

export async function updatePaymentStatus(leadId, status) {
  return request(`/admin/payments/${leadId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getSiteSettings() {
  return request("/public/site-settings");
}

export async function logCookieConsent(payload) {
  return request("/public/cookie-consent", {
    method: "POST",
    body: JSON.stringify(payload),
    skipRefresh: true,
  });
}

export async function updateSiteSettings(payload) {
  return request("/admin/site-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  async function sendUpload() {
    return fetch(`${API_URL}/admin/uploads/image`, {
      method: "POST",
      credentials: "include",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
    });
  }

  let response = await sendUpload();

  if (response.status === 401 && (await refreshAuthTokens())) {
    response = await sendUpload();
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed");
  }

  return data;
}
