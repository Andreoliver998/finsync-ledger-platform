import { MerchantExtractionService } from "./MerchantExtractionService.js";

const CATEGORY_RULES = [
  { category: "Salário / receita recorrente", keywords: ["SALARIO", "SALARIO EMPRESA", "FOLHA PAGAMENTO", "HOLERITE", "PROVENTO", "REMUNERACAO", "REMUNERACAO SALARIAL"] },
  { category: "Pix recebido", keywords: ["PIX RECEBIDO", "RECEBIDO PIX", "RECEBIMENTO PIX", "PIX DE", "PIX CREDITO"] },
  { category: "Pix enviado", keywords: ["PIX ENVIADO", "PAGAMENTO PIX", "TRANSF PIX", "PIX PARA", "PIX TRANSFERENCIA"] },
  { category: "Transferência recebida", keywords: ["TRANSFERENCIA RECEBIDA", "TED RECEBIDA", "DOC RECEBIDO", "CREDITO TED", "CREDITO DOC"] },
  { category: "Transferência enviada", keywords: ["TRANSFERENCIA PARA", "TRANSFERENCIA ENVIADA", "TED ENVIADA", "DOC ENVIADO"] },
  { category: "Fatura / cartão", keywords: ["FATURA CARTAO", "PAGTO FATURA", "PAGAMENTO FATURA", "PAGAMENTO CARTAO", "CARTAO CREDITO", "COMPRA CARTAO"] },
  { category: "Assinatura", keywords: ["NETFLIX", "SPOTIFY", "YOUTUBE PREMIUM", "AMAZON PRIME", "DISNEY", "HBO MAX", "APPLE.COM/BILL", "GOOGLE ONE", "ICLOUD", "ADOBE", "MICROSOFT 365", "GLOBOPLAY"] },
  { category: "Mercado", keywords: ["SUPERMERCADO", "MERCADO", "ATACADAO", "ATACAREJO", "ASSAI", "CARREFOUR", "EXTRA", "PAO DE ACUCAR", "MERCEARIA"] },
  { category: "Alimentação", keywords: ["IFOOD", "RESTAURANTE", "LANCHONETE", "PADARIA", "ACOUGUE", "PIZZARIA", "HAMBURGUERIA", "BURGER", "MCDONALDS", "SUBWAY", "KFC", "STARBUCKS"] },
  { category: "Farmácia", keywords: ["FARMACIA", "DROGARIA", "DROGASIL", "ULTRAFARMA", "PACHECO", "PAGUE MENOS", "PANVEL"] },
  { category: "Saúde", keywords: ["HOSPITAL", "CLINICA", "CONSULTA", "LABORATORIO", "MEDICO", "DENTISTA", "UNIMED", "PLANO SAUDE", "EXAME"] },
  { category: "Transporte", keywords: ["UBER", "99", "99TAXI", "CABIFY", "METRO", "ONIBUS", "BILHETE UNICO", "TAXI", "ESTACIONAMENTO", "PEDAGIO"] },
  { category: "Combustível", keywords: ["POSTO", "COMBUSTIVEL", "IPIRANGA", "SHELL", "PETROBRAS", "BR MANIA"] },
  { category: "Educação", keywords: ["ESCOLA", "FACULDADE", "CURSO", "UNIVERSIDADE", "MENSALIDADE", "COLEGIO", "UDEMY", "COURSERA", "ALURA"] },
  { category: "Moradia", keywords: ["ALUGUEL", "CONDOMINIO", "CONTA LUZ", "ENERGIA", "CONTA AGUA", "AGUA E ESGOTO", "INTERNET", "GAS", "SANEAMENTO"] },
  { category: "Contas", keywords: ["BOLETO", "PAGAMENTO BOLETO", "CONVENIO", "TELEFONE", "CELULAR", "VIVO", "TIM", "CLARO", "OI FIBRA"] },
  { category: "Compras online", keywords: ["AMAZON", "MERCADO LIVRE", "AMERICANAS", "MAGALU", "SHOPEE", "ALIEXPRESS", "SHEIN"] },
  { category: "Lazer", keywords: ["CINEMA", "TEATRO", "SHOW", "INGRESSO", "SYMPLA", "HOTEL", "AIRBNB", "BOOKING"] },
  { category: "Tarifa bancária", keywords: ["TARIFA", "CESTA", "TAXA SERVICO", "ANUIDADE", "IOF", "JUROS", "ENCARGO", "MULTA"] },
  { category: "Impostos / taxas", keywords: ["DARF", "GPS", "IPTU", "IPVA", "IRRF", "TRIBUTO", "IMPOSTO", "TAXA"] },
  { category: "Saque", keywords: ["SAQUE", "CAIXA ELETRONICO", "ATM"] },
  { category: "Depósito", keywords: ["DEPOSITO", "DINHEIRO EM CONTA"] },
  { category: "Estorno", keywords: ["ESTORNO", "CHARGEBACK", "DEVOLUCAO", "REEMBOLSO", "CASHBACK", "CASH BACK", "AJUSTE CREDITO"] }
];

const PAYMENT_METHOD_RULES = [
  { method: "PIX", patterns: [/\bpix\b/i] },
  { method: "TED", patterns: [/\bted\b/i] },
  { method: "DOC", patterns: [/\bdoc\b/i] },
  { method: "BOLETO", patterns: [/boleto/i, /codigo de barras/i] },
  { method: "CREDIT", patterns: [/cr[eé]dito/i, /credit/i, /fatura/i, /parcela/i, /\d{1,2}\/\d{1,2}/i] },
  { method: "DEBIT", patterns: [/d[eé]bito/i, /debit/i, /cartao.*deb/i] },
  { method: "CASH", patterns: [/saque/i, /\batm\b/i, /caixa\s*eletron/i] },
  { method: "TRANSFER", patterns: [/transfer[eê]n/i, /\btransf\b/i] }
];

const TRANSACTION_TAGS = [
  { tag: "pix_recebido", patterns: [/pix.*receb/i] },
  { tag: "pix_enviado", patterns: [/pix.*env/i, /pix.*para/i] },
  { tag: "transferencia", patterns: [/transfer[eê]n/i, /\bted\b/i, /\bdoc\b/i] },
  { tag: "tarifa", patterns: [/tarifa/i, /\biof\b/i, /anuidade/i, /juros/i] },
  { tag: "estorno", patterns: [/estorno/i, /reembolso/i, /devolu[cç][aã]o/i, /cashback/i] },
  { tag: "boleto", patterns: [/boleto/i] },
  { tag: "salario", patterns: [/sal[aá]rio/i, /holerite/i, /folha.*pagamento/i] },
  { tag: "assinatura", patterns: [/netflix/i, /spotify/i, /prime/i, /youtube premium/i, /icloud/i, /google one/i] },
  { tag: "fatura_cartao", patterns: [/fatura/i, /cart[aã]o/i] },
  { tag: "saude", patterns: [/farm[aá]cia/i, /hospital/i, /cl[ií]nica/i, /unimed/i] }
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function extractCategoryReason(description, operationType, matchedKeyword, direction) {
  if (matchedKeyword) {
    return `Detectado por palavra-chave: ${matchedKeyword.toLowerCase()}.`;
  }

  if (operationType === "PIX") {
    return direction === "IN" ? "Descrição indica recebimento via Pix." : "Descrição indica envio via Pix.";
  }

  if (operationType === "TRANSFER") {
    return direction === "IN" ? "Descrição indica transferência recebida." : "Descrição indica transferência enviada.";
  }

  return direction === "IN"
    ? "Classificação inferida a partir do sentido de entrada."
    : "Classificação inferida a partir do sentido de saída.";
}

function keepExistingCategory(category) {
  const normalized = normalize(category);
  return Boolean(normalized) && normalized !== "OUTROS" && normalized !== "TRANSFERENCIAS";
}

export class CategoryClassifierService {
  static detectPaymentMethod(description = "") {
    const text = String(description).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const rule of PAYMENT_METHOD_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        return rule.method;
      }
    }
    return null;
  }

  static detectTags(description = "") {
    const text = String(description).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return TRANSACTION_TAGS.filter((rule) => rule.patterns.some((pattern) => pattern.test(text))).map(
      (rule) => rule.tag
    );
  }

  static classify(transaction) {
    return this.classifyFull(transaction).category;
  }

  static classifyFull(transaction = {}) {
    const text = normalize(
      [
        transaction.normalizedDescription,
        transaction.description,
        transaction.counterpartyName,
        transaction.notes
      ]
        .filter(Boolean)
        .join(" ")
    );

    const extraction = MerchantExtractionService.extract(transaction);
    const paymentMethod = transaction.paymentMethod || extraction.paymentMethod || this.detectPaymentMethod(text);
    const tags = Array.from(
      new Set([...(transaction.tags || []), ...this.detectTags(text), ...(extraction.tags || [])])
    );

    let category = keepExistingCategory(transaction.userCategory)
      ? transaction.userCategory
      : keepExistingCategory(transaction.category)
        ? transaction.category
        : null;
    let matchedKeyword = null;

    if (!category) {
      for (const rule of CATEGORY_RULES) {
        const keyword = rule.keywords.find((item) => text.includes(normalize(item)));
        if (keyword) {
          category = rule.category;
          matchedKeyword = keyword;
          break;
        }
      }
    }

    if (!category) {
      if (extraction.operationType === "PIX") {
        category = extraction.direction === "IN" ? "Pix recebido" : "Pix enviado";
      } else if (extraction.operationType === "TRANSFER") {
        category = extraction.direction === "IN" ? "Transferência recebida" : "Transferência enviada";
      } else if (extraction.operationType === "BILL_PAYMENT") {
        category = "Contas";
      } else if (extraction.operationType === "CARD_BILL") {
        category = "Fatura / cartão";
      } else if (extraction.operationType === "DEPOSIT") {
        category = "Depósito";
      } else if (extraction.operationType === "WITHDRAWAL") {
        category = "Saque";
      } else if (extraction.operationType === "REFUND") {
        category = "Estorno";
      } else if (paymentMethod === "DEBIT") {
        category = "Compras";
      } else if (paymentMethod === "CREDIT") {
        category = "Fatura / cartão";
      } else {
        category = extraction.direction === "IN" ? "Receita" : "Outros";
      }
    }

    const confidenceScore = Math.max(
      keepExistingCategory(transaction.userCategory) ? 0.98 : 0,
      matchedKeyword ? 0.94 : 0,
      extraction.confidenceScore || 0
    ) || (category === "Outros" ? 0.42 : 0.58);

    const confidenceLabel = confidenceScore >= 0.85
      ? "detectado"
      : confidenceScore >= 0.65
        ? "provável"
        : "precisa revisar";

    const classificationReason = keepExistingCategory(transaction.userCategory)
      ? "Categoria definida manualmente pelo usuário."
      : extractCategoryReason(text, extraction.operationType, matchedKeyword, extraction.direction);

    return {
      category,
      paymentMethod,
      tags,
      direction: extraction.direction,
      merchantName: extraction.merchantName,
      counterpartyName: transaction.counterpartyName || extraction.counterpartyName || extraction.merchantName || null,
      operationType: extraction.operationType,
      confidenceScore,
      confidenceLabel,
      classificationReason,
      explanation: extraction.explanation || `${confidenceLabel === "detectado" ? "Detectado" : confidenceLabel === "provável" ? "Provável" : "Classificação incerta"} em ${category.toLowerCase()}.`,
      needsReview: confidenceScore < 0.65 || category === "Outros"
    };
  }
}
