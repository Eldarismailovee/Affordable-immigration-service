export function sendConfirmationEmail(email) {
  return {
    success: true,
    email,
    message: "Email service stub",
  };
}

export function sendPasswordResetEmail(email, token) {
  return {
    success: true,
    email,
    token,
    message: "Password reset email service stub",
  };
}

export function sendEmailVerificationEmail(email, token) {
  return {
    success: true,
    email,
    token,
    message: "Email verification service stub",
  };
}
