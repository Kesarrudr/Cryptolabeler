import { Router } from "express";
import {
  NextTask,
  Payout,
  SubmitTask,
  WorkerBalance,
  WorkerSignin,
} from "../controller/worker";
import { WorkerAuthMiddleware } from "../middleware/worker.auth";

const router = Router();

router.route("/signin").post(WorkerSignin);
router.route("/nextTask").get(WorkerAuthMiddleware, NextTask);
router.route("/submission").post(WorkerAuthMiddleware, SubmitTask);
router.route("/balance").post(WorkerAuthMiddleware, WorkerBalance);
router.route("/payout").post(WorkerAuthMiddleware, Payout);

export default router;
