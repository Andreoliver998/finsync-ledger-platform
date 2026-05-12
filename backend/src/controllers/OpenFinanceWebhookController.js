import { BankConnectionService } from "../services/BankConnectionService.js";
import { HttpError } from "../utils/httpError.js";

const SUPPORTED_PLUGGY_EVENTS = new Set([
  "item/created",
  "item/updated",
  "item/error",
  "transactions/created",
  "transactions/updated",
  "transactions/deleted"
]);

function extractPluggyEvent(payload) {
  return payload.event || payload.type || payload.eventType;
}

function extractPluggyItemId(payload) {
  return payload.itemId || payload.item?.id || payload.data?.itemId || payload.data?.item?.id;
}

export class OpenFinanceWebhookController {
  static async handlePluggyWebhook(req, res, next) {
    try {
      const payload = req.body;

      if (!payload || typeof payload !== "object") {
        throw new HttpError(400, "Payload de webhook inválido.");
      }

      const event = extractPluggyEvent(payload);
      const itemId = extractPluggyItemId(payload);

      if (!event || !SUPPORTED_PLUGGY_EVENTS.has(event)) {
        return res.status(202).json({
          success: true,
          message: "Evento Pluggy recebido e ignorado."
        });
      }

      if ((event === "item/created" || event === "item/updated") && itemId) {
        await BankConnectionService.markConnectionStatus(itemId, "CONNECTED");
      }

      if (event === "item/error" && itemId) {
        await BankConnectionService.markConnectionStatus(itemId, "ERROR");
      }

      if (event.startsWith("transactions/")) {
        // TODO: importar ou reconciliar transações de forma idempotente em job assíncrono.
        // Este webhook não grava transações ainda para evitar duplicidade e preservar a lógica financeira existente.
      }

      return res.json({
        success: true,
        message: "Webhook Pluggy processado."
      });
    } catch (error) {
      next(error);
    }
  }
}
