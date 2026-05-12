/*
  Camada preparada para integrações bancárias futuras.

  Recomendação:
  - Usar Open Finance, APIs oficiais e fluxo consentido.
  - Nunca pedir ou armazenar senha do banco do usuário.
  - Nunca automatizar login bancário por scraping sem autorização.
*/

export class BankIntegrationService {
  static async importTransactionsFromProvider({ provider, accessToken }) {
    if (!provider || !accessToken) {
      throw new Error("Provider e accessToken são obrigatórios.");
    }

    return {
      provider,
      imported: 0,
      message: "Integração bancária ainda não implementada. Camada reservada para Open Finance/API oficial."
    };
  }
}
