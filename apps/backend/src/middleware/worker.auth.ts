import jwt from "jsonwebtoken";
import asyncHandler from "../utils/async.handler";

const WorkerAuthMiddleware = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.header("authorization") ?? "";
    const decoded = jwt.verify(authHeader, process.env.Worker_JWT_SECTET!);
    //TODO:
    //@ts-ignore
    if (decoded.workerId) {
      //@ts-ignore
      req.workerId = decoded.workerId;
      return next();
    } else {
      res.status(403).json({
        message: "You are not logged in",
      });
    }
  } catch (error) {
    res.status(403).json({
      message: "You are not logged in",
    });
    console.log("error", error);
  }
});

export { WorkerAuthMiddleware };
