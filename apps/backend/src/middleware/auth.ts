import jwt from "jsonwebtoken";
import asyncHandler from "../utils/async.handler";

const AuthMiddleware = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.header("authorization") ?? "";
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET!);
    //TODO:
    //@ts-ignore
    if (decoded.userId) {
      //@ts-ignore
      req.userId = decoded.userId;
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

export { AuthMiddleware };
