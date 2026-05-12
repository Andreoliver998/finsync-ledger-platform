import { useCallback, useEffect, useMemo, useState } from "react";
import { PluggyConnect } from "react-pluggy-connect";
import { api, getStoredJwt } from "../services/api.js";

function getConnectToken(responseData) {
  return responseData?.connectToken || responseData?.data?.connectToken || null;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Não foi possível concluir a operação."
  );
}

export default function OpenFinanceConnect() {
  const [connectToken, setConnectToken] = useState(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [isSavingConnection, setIsSavingConnection] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [connections, setConnections] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  const hasJwt = useMemo(() => Boolean(getStoredJwt()), []);

  const listConnections = useCallback(async () => {
    if (!getStoredJwt()) {
      return;
    }

    setIsLoadingConnections(true);

    try {
      const response = await api.get("/open-finance/connections");
      const responseConnections = response.data?.data || response.data?.connections || [];
      setConnections(Array.isArray(responseConnections) ? responseConnections : []);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    listConnections();
  }, [listConnections]);

  async function handleOpenConnect() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!getStoredJwt()) {
      setErrorMessage("Sessão não encontrada. Faça login antes de conectar um banco.");
      return;
    }

    setIsLoadingToken(true);

    try {
      const response = await api.post("/open-finance/connect-token");
      const token = getConnectToken(response.data);

      if (!token) {
        throw new Error("Token temporário do Pluggy não retornado pelo backend.");
      }

      setConnectToken(token);
      setIsConnectOpen(true);
    } catch (error) {
      setConnectToken(null);
      setIsConnectOpen(false);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoadingToken(false);
    }
  }

  async function handleConnectSuccess(itemData) {
    const itemId = itemData?.item?.id;
    const institution = itemData?.item?.connector?.name || "Banco conectado";
    const status = "CONNECTED";

    if (!itemId) {
      setErrorMessage("A Pluggy não retornou o itemId da conexão.");
      return;
    }

    setIsSavingConnection(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.post("/open-finance/connections", {
        itemId,
        institution,
        status
      });

      setSuccessMessage("Banco conectado com sucesso.");
      setIsConnectOpen(false);
      setConnectToken(null);
      await listConnections();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSavingConnection(false);
    }
  }

  function handleConnectClose() {
    setIsConnectOpen(false);
    setConnectToken(null);
  }

  return (
    <main className="open-finance-page">
      <section className="open-finance-shell" aria-labelledby="open-finance-title">
        <div className="open-finance-header">
          <div>
            <p className="open-finance-eyebrow">Open Finance</p>
            <h1 id="open-finance-title">Conexões bancárias</h1>
          </div>

          <button
            className="primary-action"
            type="button"
            onClick={handleOpenConnect}
            disabled={isLoadingToken || isSavingConnection}
          >
            {isLoadingToken ? "Preparando..." : "Conectar banco"}
          </button>
        </div>

        {!hasJwt && (
          <div className="status-message status-message-warning">
            Sessão JWT não encontrada no navegador.
          </div>
        )}

        {errorMessage && <div className="status-message status-message-error">{errorMessage}</div>}
        {successMessage && <div className="status-message status-message-success">{successMessage}</div>}
        {isSavingConnection && (
          <div className="status-message status-message-neutral">Salvando conexão bancária...</div>
        )}

        <div className="connection-list-panel">
          <div className="connection-list-header">
            <h2>Conexões salvas</h2>
            <button
              className="secondary-action"
              type="button"
              onClick={listConnections}
              disabled={isLoadingConnections}
            >
              {isLoadingConnections ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {connections.length > 0 ? (
            <ul className="connection-list">
              {connections.map((connection) => (
                <li className="connection-item" key={connection.id || connection.itemId}>
                  <div>
                    <strong>{connection.institution || "Banco conectado"}</strong>
                    <span>{connection.itemId}</span>
                  </div>
                  <span className="connection-status">{connection.status || "CONNECTED"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">
              {isLoadingConnections ? "Carregando conexões..." : "Nenhuma conexão bancária encontrada."}
            </p>
          )}
        </div>
      </section>

      {isConnectOpen && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={import.meta.env.DEV}
          theme="dark"
          language="pt"
          onSuccess={handleConnectSuccess}
          onClose={handleConnectClose}
        />
      )}
    </main>
  );
}
