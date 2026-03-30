const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function calculatePricing(payload) {
  return request("/pricing/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

  const response = await fetch(`${API_URL}/uploads/image`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Image upload failed");
  }

  return data;
}
