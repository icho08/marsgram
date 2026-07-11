import { validationResult } from "express-validator";
import { NextFunction, Response } from "express";
import { AuthReq } from "../types.js";

export const handleInputErrors = (req: AuthReq, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
  } else {
    next();
  }
};
