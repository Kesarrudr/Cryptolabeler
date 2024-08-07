import { Router } from "express";
import HealthCheck from "../controller/healthcheck.controller";

const router = Router();

router.route("/").get(HealthCheck);

export default router;
