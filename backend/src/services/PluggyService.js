import { PluggyClient } from "pluggy-sdk";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const OPEN_FINANCE_PRODUCTS = ["ACCOUNTS", "CREDIT_CARDS", "TRANSACTIONS"];

function sanitizePluggyError(error) {
  const statusCode = error?.statusCode || error?.response?.status || 502;

  if (statusCode === 401 || statusCode === 403) {
    return new HttpError(502, "Falha de autenticação com o provedor Open Finance.");
  }

  if (statusCode === 404) {
    return new HttpError(404, "Recurso Open Finance não encontrado.");
  }

  return new HttpError(502, "Não foi possível concluir a operação Open Finance.");
}

export class PluggyService {
  static client = null;

  static getClient() {
    if (!env.enablePluggy) {
      throw new HttpError(503, "Open Finance via Pluggy está desativado neste ambiente.");
    }

    if (!env.pluggyClientId || !env.pluggyClientSecret) {
      throw new HttpError(500, "Credenciais Pluggy não configuradas no backend.");
    }

    if (!this.client) {
      this.client = new PluggyClient({
        clientId: env.pluggyClientId,
        clientSecret: env.pluggyClientSecret
      });
    }

    return this.client;
  }

  static async createConnectToken(userId) {
    try {
      const options = {
        clientUserId: userId,
        avoidDuplicates: true,
        products: OPEN_FINANCE_PRODUCTS,
        includeSandbox: env.pluggyIncludeSandbox
      };

      if (env.pluggyWebhookUrl) {
        options.webhookUrl = env.pluggyWebhookUrl;
      }

      if (env.pluggyOauthRedirectUrl) {
        options.oauthRedirectUri = env.pluggyOauthRedirectUrl;
      }

      // Integração externa: o connectToken é temporário e deve ser usado somente no frontend para abrir o Pluggy Connect.
      const token = await this.getClient().createConnectToken(undefined, options);

      return {
        connectToken: token.accessToken,
        provider: env.openFinanceProvider,
        expiresInMinutes: 30
      };
    } catch (error) {
      throw sanitizePluggyError(error);
    }
  }

  static async fetchAccountsByItemId(itemId) {
    try {
      return this.getClient().fetchAccounts(itemId);
    } catch (error) {
      throw sanitizePluggyError(error);
    }
  }

  static fetchAccounts(itemId) {
    return this.fetchAccountsByItemId(itemId);
  }

  static async fetchItemById(itemId) {
    try {
      return this.getClient().fetchItem(itemId);
    } catch (error) {
      throw sanitizePluggyError(error);
    }
  }

  static fetchItem(itemId) {
    return this.fetchItemById(itemId);
  }

  static async fetchAccountById(accountId) {
    try {
      return this.getClient().fetchAccount(accountId);
    } catch (error) {
      throw sanitizePluggyError(error);
    }
  }

  static async fetchTransactionsByAccountId(accountId, filters = {}) {
    try {
      return this.getClient().fetchTransactions(accountId, filters);
    } catch (error) {
      throw sanitizePluggyError(error);
    }
  }

  static fetchTransactions(accountId, options = {}) {
    return this.fetchTransactionsByAccountId(accountId, options);
  }

  static async updateItem(itemId) {
    try {
      const client = this.getClient();

      if (typeof client.updateItem !== "function") {
        return null;
      }

      return client.updateItem(itemId);
    } catch (error) {
      throw sanitizePluggyError(error);
    }
  }

  static async fetchCreditCardsByItemId(itemId) {
    try {
      const creditAccounts = await this.getClient().fetchAccounts(itemId, "CREDIT");
      const results = creditAccounts?.results || [];

      return {
        ...creditAccounts,
        results: results.filter((account) => account.type === "CREDIT" || account.subtype === "CREDIT_CARD")
      };
    } catch (error) {
      throw sanitizePluggyError(error);
    }
  }
}
