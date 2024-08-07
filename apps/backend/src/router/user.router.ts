import { Router } from "express";
import {
  CreateTask,
  PresignedUrl,
  TaskDetails,
  UserSignin,
} from "../controller/user";
import { AuthMiddleware } from "../middleware/auth";

const router = Router();

router.route("/signin").post(UserSignin);
router.route("/presignedUrl").get(AuthMiddleware, PresignedUrl);
router.route("/task").post(AuthMiddleware, CreateTask);
router.route("/task").get(AuthMiddleware, TaskDetails);

export default router;
