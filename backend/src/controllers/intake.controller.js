import { createIntake } from "../services/intake.service.js";

export async function createIntakeController(req, res, next) {
  try {
    const lead = await createIntake(req.body);

    res.status(201).json({
      message: "Intake submitted successfully",
      lead,
    });
  } catch (error) {
    next(error);
  }
}