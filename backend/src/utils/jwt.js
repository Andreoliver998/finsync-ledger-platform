import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_ALGORITHM = "HS256";

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.jwtExpiresIn,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: [JWT_ALGORITHM],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });
}
