import { createIntake } from "../services/intake.service.js";
import { intakeCreateResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createIntakeController = asyncHandler(async (req, res) => {
  const lead = await createIntake(req.body, req.user, getAuditContext(req));

  sendResponse(
    res,
    intakeCreateResponseSchema,
    {
      message: "Intake submitted successfully",
      lead,
    },
    201
  );
});
