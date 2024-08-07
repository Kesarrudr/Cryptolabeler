import asyncHandler from "../utils/async.handler";
import type { Request, Response } from "express";

const HealthCheck = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      message: "Server is running ",
    });
  } catch (error) {
    console.log("errro", error);
    res.status(500).json({
      message: "Server is down",
    });
  }
});

export default HealthCheck;
