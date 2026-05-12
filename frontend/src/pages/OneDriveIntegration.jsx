import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import {
  disconnectOneDrive,
  getOneDriveAuthUrl,
  getOneDriveStatus,
  listOneDriveFiles,
  syncOneDriveNow
} from "../services/ledgerImportApi.js";

export default function OneDriveIntegration() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [filesData, setFilesData] = useState({ files: [], folders: {} });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [statusResponse, filesResponse] = await Promise.all([
        getOneDriveStatus(),
        listOneDriveFiles()
      ]);

      setStatus(statusResponse);
      setFilesData(filesResponse);
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível carregar o status do OneDrive.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oneDriveState = params.get("onedrive");

    if (!oneDriveState) {
      return;
    }

    if (oneDriveState === "connected") {
      setMessage("Conta Microsoft conectada com sucesso.");
      loadData();
    }

    if (oneDriveState === "error") {
      setError("Não foi possível concluir a autenticação Microsoft.");
    }

    navigate("/onedrive", { replace: true });
  }, [location.search, navigate]);

  async function handleConnect() {
    setConnecting(true);
    setError("");
    try {
      const response = await getOneDriveAuthUrl();
      window.location.href = response.authUrl;
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível iniciar a autenticação Microsoft.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError("");

    try {
      const response = await syncOneDriveNow();
      setMessage(
        response.message ||
        `Sincronização concluída. Importados: ${response.importedFiles}, ignorados: ${response.ignoredFiles}, erros: ${response.erroredFiles}.`
      );
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setError("");

    try {
      await disconnectOneDrive();
      setMessage("Conta OneDrive desconectada com sucesso.");
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.message || "Não foi possível desconectar a conta.");
    }
  }

  return (
    <AppLayout breadcrumb="OneDrive">
      <div className="ledger-page anim-fade-in">
        <div className="manual-header">
          <div>
            <h1 className="dash-page-title">Integração OneDrive</h1>
            <p className="dash-page-sub">
              Central principal de sincronização automática de extratos via Microsoft Graph e OAuth2.
            </p>
          </div>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" type="button" onClick={handleConnect} disabled={connecting}>
              {connecting ? "Abrindo Microsoft..." : "Conectar OneDrive"}
            </button>
            <button className="btn btn-primary" type="button" onClick={handleSync} disabled={syncing}>
              {syncing ? "Sincronizando..." : "Sincronizar agora"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={loadData}>
              Listar arquivos
            </button>
            <button className="btn btn-ghost" type="button" onClick={handleDisconnect}>
              Desconectar
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-green">{message}</div>}

        <section className="card ledger-panel">
          <div className="ledger-panel-head">
            <div>
              <div className="section-num">OneDrive</div>
              <h2>Status da integração</h2>
            </div>
          </div>

          {loading ? (
            <div className="ledger-empty">Carregando status...</div>
          ) : (
            <div className="ledger-od-grid">
              <div className="stat-card">
                <div className="stat-label">Status</div>
                <div className="stat-value">{status?.status || (status?.connected ? "CONNECTED" : "DISCONNECTED")}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Última sincronização</div>
                <div className="stat-value" style={{ fontSize: "1rem" }}>{status?.lastSyncAt || "Ainda não executada"}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Conectado</div>
                <div className="stat-value">{status?.connected ? "SIM" : "NÃO"}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Conta Microsoft</div>
                <div className="stat-value" style={{ fontSize: "1rem" }}>{status?.displayName || status?.email || "Não conectada"}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pasta monitorada</div>
                <div className="stat-value" style={{ fontSize: "1rem" }}>{status?.folderPath || "/FinSync-Ledger/Entrada"}</div>
              </div>
            </div>
          )}
        </section>

        <section className="card ledger-panel">
          <div className="ledger-panel-head">
            <div>
              <div className="section-num">Pastas</div>
              <h2>Estrutura padrão</h2>
            </div>
          </div>
          <div className="ledger-folder-list">
            {Object.entries(filesData?.folders || {}).map(([key, value]) => (
              <div className="ledger-folder-item" key={key}>
                <strong>{key}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card ledger-panel">
          <div className="ledger-panel-head">
            <div>
              <div className="section-num">Arquivos</div>
              <h2>Fila detectada</h2>
            </div>
          </div>
          {filesData?.files?.length ? (
            <div className="ledger-history-list">
              {filesData.files.map((file) => (
                <article className="ledger-history-item" key={file.id}>
                  <div>
                    <strong>{file.name}</strong>
                    <small>{file.lastModifiedDateTime || "-"} · {file.webUrl || "-"}</small>
                  </div>
                  <div className="ledger-history-stats">
                    <span>{file.size} bytes</span>
                    <span>{file.status}</span>
                    <span>{file.origin}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ledger-empty">
              Nenhum arquivo CSV detectado na pasta monitorada.
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
