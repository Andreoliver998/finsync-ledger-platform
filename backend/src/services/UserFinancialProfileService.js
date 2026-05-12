import { prisma } from "../lib/prisma.js";

const DEFAULT_CURRENCY = "BRL";
const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_ANALYSIS_TONE = "CONSULTIVE";

function cleanString(value, maxLength) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function maskDocument(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.length <= 4) {
    return `***${digits}`;
  }

  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function buildNarrativeVariants(builders = {}) {
  return {
    DIRECT: builders.direct,
    DIDACTIC: builders.didactic || builders.consultive || builders.direct,
    EXECUTIVE: builders.executive || builders.direct,
    CONSULTIVE: builders.consultive || builders.didactic || builders.direct
  };
}

export class UserFinancialProfileService {
  static normalizePayload(payload = {}) {
    const rawProfile = payload.userFinancialProfile || {};

    return {
      ...payload,
      currency: cleanString(payload.currency, 3) || DEFAULT_CURRENCY,
      locale: cleanString(payload.locale, 12) || DEFAULT_LOCALE,
      userFinancialProfile: {
        preferredName: cleanString(rawProfile.preferredName, 60),
        fullName: cleanString(rawProfile.fullName, 120),
        documentMasked: maskDocument(rawProfile.documentMasked),
        primaryBank: cleanString(rawProfile.primaryBank, 80),
        financialProfileType: cleanString(rawProfile.financialProfileType, 40),
        analysisTone: cleanString(rawProfile.analysisTone, 20)?.toUpperCase() || DEFAULT_ANALYSIS_TONE,
        currency: cleanString(rawProfile.currency, 3) || cleanString(payload.currency, 3) || DEFAULT_CURRENCY,
        locale: cleanString(rawProfile.locale, 12) || cleanString(payload.locale, 12) || DEFAULT_LOCALE,
        showPersonalizedTreatment: Boolean(rawProfile.showPersonalizedTreatment),
        createdAt: rawProfile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }

  static toPersistencePayload(payload = {}) {
    const normalized = this.normalizePayload(payload);

    return {
      currency: normalized.currency,
      locale: normalized.locale,
      theme: normalized.theme,
      monthlyBudget: normalized.monthlyBudget ?? null,
      alertEmail: normalized.alertEmail,
      alertPush: normalized.alertPush,
      dataSharing: normalized.dataSharing,
      userFinancialProfile: normalized.userFinancialProfile
    };
  }

  static async getContext(userId) {
    const settings = await prisma.appSettings.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });

    const profile = settings.userFinancialProfile || {};
    const preferredName = cleanString(profile.preferredName, 60);
    const showPersonalizedTreatment = Boolean(profile.showPersonalizedTreatment);
    const analysisTone = cleanString(profile.analysisTone, 20)?.toUpperCase() || DEFAULT_ANALYSIS_TONE;
    const locale = cleanString(profile.locale, 12) || cleanString(settings.locale, 12) || DEFAULT_LOCALE;
    const currency = cleanString(profile.currency, 3) || cleanString(settings.currency, 3) || DEFAULT_CURRENCY;

    return {
      settings,
      profile: {
        preferredName,
        fullName: cleanString(profile.fullName, 120),
        documentMasked: maskDocument(profile.documentMasked),
        primaryBank: cleanString(profile.primaryBank, 80),
        financialProfileType: cleanString(profile.financialProfileType, 40),
        analysisTone,
        currency,
        locale,
        showPersonalizedTreatment
      },
      identity: {
        preferredName,
        isPersonalized: Boolean(preferredName && showPersonalizedTreatment)
      }
    };
  }

  static formatCurrency(value, context = {}) {
    return new Intl.NumberFormat(context.profile?.locale || DEFAULT_LOCALE, {
      style: "currency",
      currency: context.profile?.currency || DEFAULT_CURRENCY
    }).format(Number(value || 0));
  }

  static formatDate(value, context = {}) {
    if (!value) {
      return "período não identificado";
    }

    return new Intl.DateTimeFormat(context.profile?.locale || DEFAULT_LOCALE, {
      timeZone: "UTC"
    }).format(new Date(value));
  }

  static buildMessage(context = {}, builders = {}) {
    const variants = buildNarrativeVariants(builders);
    const tone = context.profile?.analysisTone || DEFAULT_ANALYSIS_TONE;
    const name = context.identity?.preferredName;
    const selected = variants[tone] || variants.CONSULTIVE || builders.direct;

    if (!selected) {
      return "";
    }

    const text = typeof selected === "function" ? selected() : selected;
    if (!text) {
      return "";
    }

    if (context.identity?.isPersonalized && name) {
      return `${name}, ${text}`;
    }

    return builders.neutral || text;
  }
}
