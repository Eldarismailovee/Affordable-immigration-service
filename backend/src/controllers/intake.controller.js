import { createIntake } from "../services/intake.service.js";
import { intakeCreateResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createIntakeController = asyncHandler(async (req, res) => {
  const lead = await createIntake(req.body, req.user);

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
