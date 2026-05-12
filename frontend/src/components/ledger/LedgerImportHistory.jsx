function formatDate(value) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}

export default function LedgerImportHistory({ imports = [], loading = false, onRefresh, onDelete }) {
  return (
    <section className="card ledger-panel">
      <div className="ledger-panel-head">
        <div>
          <div className="section-num">Fluxo 05</div>
          <h2>Histórico de importações</h2>
          <p className="ledger-muted">
            Rastreabilidade por arquivo, status, duplicidades evitadas e contagem de linhas importadas.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onRefresh}>
          Atualizar
        </button>
      </div>

      <div className="ledger-history-list">
        {loading ? (
          <div className="ledger-empty">Carregando histórico...</div>
        ) : imports.length === 0 ? (
          <div className="ledger-empty">Nenhuma importação registrada ainda.</div>
        ) : imports.map((item) => (
          <article className="ledger-history-item" key={item.id}>
            <div>
              <strong>{item.fileName}</strong>
              <small>{formatDate(item.createdAt)} · {item.provider || "MANUAL_UPLOAD"} · {item.status}</small>
            </div>
            <div className="ledger-history-stats">
              <span>{item.importedRows} importadas</span>
              <span>{item.duplicatedRows} duplicadas</span>
              <span>{item.errorRows} com conflito</span>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => onDelete(item)}>
              Excluir
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
