import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

async function bootstrap() {
  try {
    await prisma.$connect();

    app.listen(env.port, env.host, () => {
      logger.info(`${env.appName} iniciado.`, {
        host: env.host,
        port: env.port,
        nodeEnv: env.nodeEnv,
        healthPath: "/api/health"
      });
    });
  } catch (error) {
    logger.error("Erro ao iniciar o servidor.", {
      message: error.message,
      stack: env.isProduction ? undefined : error.stack
    });
    process.exit(1);
  }
}

bootstrap();
