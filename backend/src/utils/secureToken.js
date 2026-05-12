import crypto from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function deriveKey() {
  return crypto.createHash("sha256").update(env.tokenEncryptionSecret).digest();
}

export function encryptSecret(plainText) {
  if (!plainText) {
    return null;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(value) {
  if (!value) {
    return null;
  }

  const [ivValue, tagValue, payloadValue] = String(value).split(".");

  if (!ivValue || !tagValue || !payloadValue) {
    return value;
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    deriveKey(),
    Buffer.from(ivValue, "base64")
  );

  decipher.setAuthTag(Buffer.from(tagValue, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(payloadValue, "base64")),
    decipher.final()
  ]).toString("utf8");
}
