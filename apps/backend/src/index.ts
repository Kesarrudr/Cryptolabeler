import express from "express";
import cors from "cors";
import Version1 from "./version/v1";

export const JWT_SECRET = "howstrongheis";
export const Worker_JWT_SECTET = "howgoodisthisandstrong";
export const TOTAL_DECEMIALS = 1000_000;

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 6969;

app.use("/", Version1);

app.listen(PORT, () => {
  console.log(`server is running on the port:${PORT}`);
});
