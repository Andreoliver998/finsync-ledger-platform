const BANK_SIGNATURES = [
  {
    bank: "Nubank",
    filenamePatterns: [/nubank/i],
    mandatoryHeaders: [["date", "title", "amount"]],
    headerKeywords: ["title"],
    delimiterHint: ","
  },
  {
    bank: "Inter",
    filenamePatterns: [/\binter\b/i],
    mandatoryHeaders: [
      ["historico", "debito", "credito"],
      ["lançamento", "debito", "credito"]
    ],
    headerKeywords: ["historico", "lancamento"],
    delimiterHint: ";"
  },
  {
    bank: "C6 Bank",
    filenamePatterns: [/\bc6\b/i, /c6bank/i],
    mandatoryHeaders: [["data", "estabelecimento", "valor"]],
    headerKeywords: ["estabelecimento"],
    delimiterHint: ";"
  },
  {
    bank: "Neon",
    filenamePatterns: [/\bneon\b/i],
    mandatoryHeaders: [],
    headerKeywords: ["neon"],
    delimiterHint: ";"
  },
  {
    bank: "Caixa Econômica",
    filenamePatterns: [/\bcaixa\b/i, /\bcef\b/i],
    mandatoryHeaders: [["dependencia", "balancete"], ["numero do documento", "dependencia"]],
    headerKeywords: ["dependencia", "balancete"],
    delimiterHint: ";"
  },
  {
    bank: "Banco do Brasil",
    filenamePatterns: [/banco.?do.?brasil/i, /extrato.?bb/i],
    mandatoryHeaders: [["credito (r$)", "debito (r$)"], ["credito", "debito", "saldo"]],
    headerKeywords: ["credito (r$)", "debito (r$)"],
    delimiterHint: ";"
  },
  {
    bank: "Santander",
    filenamePatterns: [/santander/i],
    mandatoryHeaders: [],
    headerKeywords: ["santander"],
    delimiterHint: ";"
  },
  {
    bank: "Itaú",
    filenamePatterns: [/ita[uú]/i],
    mandatoryHeaders: [["cheque/doc", "saidas", "entradas"]],
    headerKeywords: ["cheque/doc", "saidas"],
    delimiterHint: ";"
  },
  {
    bank: "Bradesco",
    filenamePatterns: [/bradesco/i],
    mandatoryHeaders: [["numero do documento", "valor (r$)"]],
    headerKeywords: ["valor (r$)"],
    delimiterHint: ";"
  }
];

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export class CSVNormalizerService {
  static detectBank(fileName = "", headers = []) {
    const normalizedName = normalize(fileName);
    const normalizedHeaders = headers.map(normalize);

    for (const sig of BANK_SIGNATURES) {
      if (sig.filenamePatterns.some((p) => p.test(normalizedName))) {
        return { bank: sig.bank, confidence: "high", source: "filename" };
      }
    }

    for (const sig of BANK_SIGNATURES) {
      for (const required of sig.mandatoryHeaders) {
        const normalizedRequired = required.map(normalize);
        const allMatch = normalizedRequired.every((req) =>
          normalizedHeaders.some((h) => h.includes(req))
        );
        if (allMatch) {
          return { bank: sig.bank, confidence: "high", source: "headers" };
        }
      }
    }

    for (const sig of BANK_SIGNATURES) {
      if (sig.headerKeywords.length > 0) {
        const matches = sig.headerKeywords.filter((kw) =>
          normalizedHeaders.some((h) => h.includes(normalize(kw)))
        );
        if (matches.length >= Math.ceil(sig.headerKeywords.length * 0.6)) {
          return { bank: sig.bank, confidence: "medium", source: "headers_partial" };
        }
      }
    }

    return { bank: null, confidence: "none", source: null };
  }

  static getFileMetadata(fileName, headers = []) {
    const { bank, confidence, source } = this.detectBank(fileName, headers);
    return {
      detectedBank: bank,
      bankConfidence: confidence,
      detectionSource: source,
      isKnownBank: bank !== null
    };
  }

  static suggestDelimiter(fileName = "") {
    if (/nubank/i.test(fileName)) return ",";
    return ";";
  }
}
