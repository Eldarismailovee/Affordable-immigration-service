import { createIntake } from "../services/intake.service.js";
import { intakeCreateResponseSchema } from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export async function createIntakeController(req, res, next) {
  try {
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
  } catch (error) {
    next(error);
  }
}
