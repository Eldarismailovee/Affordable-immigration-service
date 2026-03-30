import { createBookingRequest } from "../services/booking.service.js";

export function createBookingController(req, res) {
  const result = createBookingRequest(req.body);
  res.status(201).json(result);
}