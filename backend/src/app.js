import express from "express";
import { routes } from "./routes/index.js";
import {
  corsMiddleware,
  helmetMiddleware,
  rateLimitMiddleware,
  requestLoggerMiddleware,
  sanitizeRequestMiddleware
} from "./middlewares/securityMiddleware.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

export const app = express();

// Always trust one proxy hop (NGINX reverse proxy in all environments)
app.set("trust proxy", 1);

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
app.use(express.json({ limit: "5mb" }));
app.use(sanitizeRequestMiddleware);
app.use(requestLoggerMiddleware);

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada."
  });
});

app.use(errorMiddleware);
