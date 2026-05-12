import { z } from "zod";
import { BankConnectionService } from "../services/BankConnectionService.js";
import { PluggyService } from "../services/PluggyService.js";
import { HttpError } from "../utils/httpError.js";

const bankConnectionSchema = z.object({
  itemId: z.string().min(1),
  institution: z.string().min(1).optional(),
  status: z.string().min(1).optional()
});

const pluggyIdParamSchema = z.object({
  itemId: z.string().trim().min(1).max(128)
});

const accountIdParamSchema = z.object({
  accountId: z.string().trim().min(1).max(128)
});

const transactionsQuerySchema = z.object({
  from: z.string().trim().max(40).optional(),
  to: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().positive().max(1000).optional(),
  pageSize: z.coerce.number().int().positive().max(500).optional()
}).passthrough();

export class OpenFinanceController {
  static async createConnectToken(req, res, next) {
    try {
      const connectToken = await PluggyService.createConnectToken(req.user.id);
      res.status(201).json({ success: true, data: connectToken });
    } catch (error) {
      next(error);
    }
  }

  static async listConnections(req, res, next) {
    try {
      const connections = await BankConnectionService.listUserConnections(req.user.id);
      res.json({ success: true, data: connections });
    } catch (error) {
      next(error);
    }
  }

  static async saveConnection(req, res, next) {
    try {
      const data = bankConnectionSchema.parse(req.body);
      const item = await PluggyService.fetchItemById(data.itemId);

      if (item.clientUserId !== req.user.id) {
        throw new HttpError(403, "Item Pluggy não pertence ao usuário autenticado.");
      }

      const connection = await BankConnectionService.createOrUpdateConnection({
        userId: req.user.id,
        provider: "pluggy",
        itemId: data.itemId,
        institution: data.institution || item.connector?.name,
        status: data.status || "CONNECTED"
      });

      res.status(201).json({ success: true, data: connection });
    } catch (error) {
      next(error);
    }
  }

  static async getAccounts(req, res, next) {
    try {
      const { itemId } = pluggyIdParamSchema.parse(req.params);
      await BankConnectionService.findUserConnection(req.user.id, itemId);
      const accounts = await PluggyService.fetchAccountsByItemId(itemId);
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req, res, next) {
    try {
      const { accountId } = accountIdParamSchema.parse(req.params);
      const query = transactionsQuerySchema.parse(req.query);
      const account = await PluggyService.fetchAccountById(accountId);

      if (!account?.itemId) {
        throw new HttpError(404, "Conta Open Finance não encontrada.");
      }

      await BankConnectionService.findUserConnection(req.user.id, account.itemId);

      const transactions = await PluggyService.fetchTransactionsByAccountId(accountId, query);
      res.json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }

  static async getCreditCards(req, res, next) {
    try {
      const { itemId } = pluggyIdParamSchema.parse(req.params);
      await BankConnectionService.findUserConnection(req.user.id, itemId);
      const creditCards = await PluggyService.fetchCreditCardsByItemId(itemId);
      res.json({ success: true, data: creditCards });
    } catch (error) {
      next(error);
    }
  }
}
