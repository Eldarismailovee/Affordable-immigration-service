import { createDocketwiseLead } from "../services/docketwise.service.js";

export function createDocketwiseController(req, res) {
  const result = createDocketwiseLead(req.body);
  res.status(201).json(result);
}