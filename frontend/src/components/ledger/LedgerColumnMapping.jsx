const MAPPING_FIELDS = [
  { key: "date", label: "Data" },
  { key: "postedAt", label: "Data de compensação" },
  { key: "description", label: "Descrição" },
  { key: "amount", label: "Valor" },
  { key: "balanceAfter", label: "Saldo" },
  { key: "type", label: "Tipo" },
  { key: "documentNumber", label: "Documento" },
  { key: "category", label: "Categoria" },
  { key: "paymentMethod", label: "Forma de pagamento" },
  { key: "externalId", label: "ID externo" },
  { key: "counterpartyName", label: "Contraparte" },
  { key: "counterpartyDocument", label: "CPF/CNPJ contraparte" }
];

export default function LedgerColumnMapping({ headers = [], mapping = {}, onChange }) {
  if (!headers.length) {
    return null;
  }

  return (
    <section className="card ledger-panel">
      <div className="ledger-panel-head">
        <div>
          <div className="section-num">Fluxo 02</div>
          <h2>Mapeamento sugerido</h2>
          <p className="ledger-muted">
            Revise as colunas detectadas antes de confirmar a importação.
          </p>
        </div>
      </div>

      <div className="ledger-mapping-grid">
        {MAPPING_FIELDS.map((field) => (
          <div className="input-group" key={field.key}>
            <label className="input-label">{field.label}</label>
            <select
              className="input"
              value={mapping[field.key] || ""}
              onChange={(event) => onChange(field.key, event.target.value)}
            >
              <option value="">Não mapear</option>
              {headers.map((header) => (
                <option key={`${field.key}:${header}`} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
