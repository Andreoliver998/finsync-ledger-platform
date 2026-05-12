import { useCallback, useEffect, useRef, useState } from "react";
import { api, getStoredJwt } from "../services/api.js";
import { syncConnection } from "../services/financialSyncApi.js";

/*
  State machine:
    idle → fetching_token → open → saving → success → idle
                          ↘ error ↗
*/

function extractConnectToken(data) {
  return data?.connectToken ?? data?.data?.connectToken ?? null;
}

function extractPayload(data) {
  return data?.data ?? data;
}

function extractError(err) {
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.message ??
    "Operação não concluída."
  );
}

export function useOpenFinance() {
  const [status, setStatus]           = useState("idle");
  const [connectToken, setConnectToken] = useState(null);
  const [connections, setConnections]   = useState([]);
  const [error, setError]               = useState("");
  const [lastSaved, setLastSaved]       = useState(null);
  const [syncingConnectionId, setSyncingConnectionId] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");
  const abortRef = useRef(null);

  /* ── Fetch existing connections ──────────────────────────── */
  const loadConnections = useCallback(async () => {
    setStatus(s => (s === "idle" || s === "success" ? "idle" : s));
    try {
      const res  = await api.get("/open-finance/connections");
      const list = res.data?.data ?? res.data?.connections ?? res.data ?? [];
      setConnections(Array.isArray(list) ? list : []);
    } catch (err) {
      setConnections([]);
    }
  }, []);

  const syncBankConnection = useCallback(async (connectionId) => {
    if (!connectionId || syncingConnectionId) {
      return null;
    }

    setError("");
    setSyncMessage("");
    setSyncingConnectionId(connectionId);

    try {
      const result = await syncConnection(connectionId);
      setSyncMessage("Sincronização concluída com sucesso.");
      await loadConnections();
      return result;
    } catch (err) {
      setError(extractError(err));
      setStatus("error");
      return null;
    } finally {
      setSyncingConnectionId(null);
    }
  }, [loadConnections, syncingConnectionId]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  /* ── Step 1: Get connect token from backend ──────────────── */
  const startConnect = useCallback(async () => {
    setError("");

    if (!getStoredJwt()) {
      setError("Sessão não encontrada. Faça login antes de conectar um banco.");
      setStatus("error");
      return;
    }

    setStatus("fetching_token");
    try {
      const res   = await api.post("/open-finance/connect-token");
      const token = extractConnectToken(res.data);
      if (!token) throw new Error("connectToken não retornado pelo backend.");
      setConnectToken(token);
      setStatus("open");
    } catch (err) {
      setError(extractError(err));
      setStatus("error");
    }
  }, []);

  /* ── Step 2: PluggyConnect onSuccess → save to backend ───── */
  const handlePluggySuccess = useCallback(async (itemData) => {
    const itemId      = itemData?.item?.id;
    const institution = itemData?.item?.connector?.name ?? "Banco conectado";
    const status      = "CONNECTED";

    if (!itemId) {
      setError("Pluggy não retornou o ID da conexão.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setError("");

    try {
      const res  = await api.post("/open-finance/connections", { itemId, institution, status });
      const saved = extractPayload(res.data);

      let syncResult = null;

      if (saved?.id) {
        syncResult = await syncConnection(saved.id);
      }

      setLastSaved({ itemId, institution, ...saved });
      setSyncMessage(
        syncResult
          ? `Banco sincronizado: ${syncResult.accountsCount ?? 0} conta(s) e ${syncResult.transactionsCount ?? 0} transação(ões).`
          : "Banco conectado com sucesso."
      );
      setStatus("success");
      await loadConnections();
    } catch (err) {
      setError(extractError(err));
      setStatus("error");
    }
  }, [loadConnections]);

  /* ── Close / cancel Pluggy widget ────────────────────────── */
  const handlePluggyClose = useCallback(() => {
    setConnectToken(null);
    setStatus("idle");
  }, []);

  /* ── Reset error state ────────────────────────────────────── */
  const dismissError = useCallback(() => {
    setError("");
    setStatus("idle");
  }, []);

  /* ── Dismiss success ──────────────────────────────────────── */
  const dismissSuccess = useCallback(() => {
    setStatus("idle");
    setLastSaved(null);
  }, []);

  return {
    /* state */
    status,          /* "idle"|"fetching_token"|"open"|"saving"|"success"|"error" */
    connectToken,
    connections,
    error,
    lastSaved,
    syncingConnectionId,
    syncMessage,

    /* derived booleans */
    isLoadingToken: status === "fetching_token",
    isSaving:       status === "saving",
    isOpen:         status === "open",
    isSuccess:      status === "success",
    isError:        status === "error",
    isBusy:         ["fetching_token", "saving"].includes(status),

    /* actions */
    startConnect,
    handlePluggySuccess,
    handlePluggyClose,
    dismissError,
    dismissSuccess,
    loadConnections,
    syncBankConnection,
  };
}
