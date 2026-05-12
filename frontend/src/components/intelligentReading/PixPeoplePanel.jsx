import TransactionLink from "../financial/TransactionLink.jsx";

function fmtCur(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export default function PixPeoplePanel({
  pixAnalysis = {},
  peopleAnalysis = {},
  onOpenPix,
  onOpenPerson
}) {
  return (
    <div className="ledger-analytics-layout">
      <div className="card ledger-analytics-card">
        <div className="dash-section-title"><span>PIX e transferências pessoais</span></div>
        <div className="ledger-quality-grid">
          <div><span>PIX enviado</span><strong>{fmtCur(pixAnalysis.totalPixSent || 0)}</strong></div>
          <div><span>PIX recebido</span><strong>{fmtCur(pixAnalysis.totalPixReceived || 0)}</strong></div>
          <div><span>Total enviado a pessoas</span><strong>{fmtCur(peopleAnalysis.totalSent || 0)}</strong></div>
          <div><span>Total recebido de pessoas</span><strong>{fmtCur(peopleAnalysis.totalReceived || 0)}</strong></div>
        </div>
        <div className="insight-action-row" style={{ marginBottom: "1rem" }}>
          <button className="insight-link-btn" type="button" onClick={() => onOpenPix?.()}>
            Abrir busca PIX
          </button>
        </div>
        {pixAnalysis.largestPix && (
          <TransactionLink transactionId={pixAnalysis.largestPix.id} transaction={pixAnalysis.largestPix} className="transaction-block-link" showPreview>
            <div className="ledger-insight-card">
              <span className="badge badge-blue">maior pix</span>
              <strong>{pixAnalysis.largestPix.description || "PIX em destaque"}</strong>
              <p>{fmtCur(pixAnalysis.largestPix.amount)} · {pixAnalysis.largestPix.direction === "IN" ? "recebido" : "enviado"}</p>
            </div>
          </TransactionLink>
        )}
        <div className="ledger-ranking-table">
          {(pixAnalysis.people || []).slice(0, 6).map((item) => (
            <div className="ledger-ranking-row" key={`pix-${item.name}`}>
              <strong>{item.name}</strong>
              <span>{item.count} movimentações PIX</span>
              <span className="mono">{fmtCur(item.total || 0)}</span>
              <div className="insight-action-row">
                <button className="insight-link-btn" type="button" onClick={() => onOpenPerson?.(item.name)}>
                  Analisar pessoa
                </button>
              </div>
            </div>
          ))}
          {(peopleAnalysis.topPeople || []).slice(0, 6).map((item) => (
            <div className="ledger-ranking-row" key={`person-${item.name}`}>
              <strong>{item.name}</strong>
              <span>{item.count} relações</span>
              <span className="mono">{fmtCur((item.sent || 0) + (item.received || 0))}</span>
              <div className="insight-action-row">
                <button className="insight-link-btn" type="button" onClick={() => onOpenPerson?.(item.name)}>
                  Analisar pessoa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
