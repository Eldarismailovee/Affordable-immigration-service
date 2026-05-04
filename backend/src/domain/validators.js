import { z } from "zod";
import {
  ADMIN_AUDIT_METHODS,
  AGREEMENT_STATUSES,
  BOOKING_STATUSES,
  CONSULTATION_TYPES,
  DOCKETWISE_STATUSES,
  DOCUMENT_STATUSES,
  IMAGE_UPLOAD_MIME_TYPES,
  LANGUAGE_MODES,
  LEAD_STATUSES,
  PACKAGE_TYPES,
  PAYMENT_PREFERENCES,
  PAYMENT_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "../constants/domain.js";

export const uuidSchema = z.uuid();
export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const leadStatusSchema = z.enum(LEAD_STATUSES);
export const packageTypeSchema = z.enum(PACKAGE_TYPES);
export const consultationTypeSchema = z.enum(CONSULTATION_TYPES);
export const agreementStatusSchema = z.enum(AGREEMENT_STATUSES);
export const documentStatusSchema = z.enum(DOCUMENT_STATUSES);
export const bookingStatusSchema = z.enum(BOOKING_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const docketwiseStatusSchema = z.enum(DOCKETWISE_STATUSES);
export const paymentPreferenceSchema = z.enum(PAYMENT_PREFERENCES);
export const languageModeSchema = z.enum(LANGUAGE_MODES);
export const adminAuditMethodSchema = z.enum(ADMIN_AUDIT_METHODS);
export const imageUploadMimeTypeSchema = z.enum(IMAGE_UPLOAD_MIME_TYPES);
