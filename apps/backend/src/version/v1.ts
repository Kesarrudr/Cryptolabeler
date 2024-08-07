import { Router } from "express";
import HealthCheckRouter from "../router/heathcheck.route";
import UserRouter from "../router/user.router";
import WorkerRouter from "../router/worker.router";

const router = Router();

router.use("/api/v1/health", HealthCheckRouter);
router.use("/api/v1/user", UserRouter);
router.use("/api/v1/worker", WorkerRouter);
export default router;
