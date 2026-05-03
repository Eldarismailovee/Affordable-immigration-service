const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";
const AUTH_TOKEN_KEY = "immigration-auth-token";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

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
  return request("/pricing/calculate", {
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

export async function getCurrentUser() {
  return request("/auth/me");
}

export async function generateAgreementPreview(payload) {
  return request("/agreement/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitIntake(payload) {
  return request("/intake", {
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
  return request(`/onboarding/${leadId}`);
}

export async function generateOnboardingPacketForLead(leadId) {
  return request(`/onboarding/${leadId}/generate`, {
    method: "POST",
  });
}
export async function getAdminLeadDetail(leadId) {
  return request(`/admin/leads/${leadId}`);
}

export async function getAgreementByLead(leadId) {
  return request(`/agreement/${leadId}`);
}

export async function generateAgreementForLead(leadId) {
  return request(`/agreement/${leadId}/generate`, {
    method: "POST",
  });
}

export async function syncLeadToDocketwise(leadId) {
  return request(`/docketwise/${leadId}/sync`, {
    method: "POST",
  });
}

export function getAgreementPdfUrl(leadId) {
  return `${API_URL}/agreement/${leadId}/pdf`;
}

export function getOnboardingPdfUrl(leadId) {
  return `${API_URL}/onboarding/${leadId}/pdf`;
}

async function openAuthenticatedPdf(path) {
  const token = getAuthToken();
  const popup = window.open("", "_blank");
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

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
  return openAuthenticatedPdf(`/agreement/${leadId}/pdf`);
}

export function openOnboardingPdf(leadId) {
  return openAuthenticatedPdf(`/onboarding/${leadId}/pdf`);
}

export async function updatePaymentStatus(leadId, status) {
  return request(`/payments/${leadId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getSiteSettings() {
  return request("/site-settings");
}

export async function updateSiteSettings(payload) {
  return request("/site-settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/uploads/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed");
  }

  return data;
}
