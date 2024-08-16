import express from "express";
import cors from "cors";
import Version1 from "./version/v1";

import "dotenv/config";

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT ?? 8000;

app.use("/", Version1);

app.listen(PORT, () => {
  console.log(`server is running on the port:${PORT}`);
});
