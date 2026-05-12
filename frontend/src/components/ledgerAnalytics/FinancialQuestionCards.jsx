export default function FinancialQuestionCards({ data = {} }) {
  const items = Object.values(data || {});

  return (
    <div className="ledger-question-grid">
      {items.map((item) => (
        <div className="card ledger-analytics-card" key={item.question}>
          <div className="dash-section-title">
            <span>{item.question}</span>
          </div>
          <p className="ledger-executive-narrative">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}
