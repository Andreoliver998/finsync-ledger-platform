export default function PersonalizedAnalysisProfileCard({ profile = {} }) {
  const hasProfile = Boolean(
    profile.preferredName
    || profile.fullName
    || profile.primaryBank
    || profile.documentMasked
  );

  if (!hasProfile) {
    return (
      <div className="card ledger-analytics-card">
        <div className="dash-section-title">
          <span>Perfil do titular</span>
        </div>
        <p className="ledger-executive-narrative">
          O tratamento personalizado ainda não foi configurado. Enquanto isso, a leitura do extrato permanece neutra.
        </p>
      </div>
    );
  }

  const toneLabel = {
    DIRECT: "Direto",
    DIDACTIC: "Didático",
    EXECUTIVE: "Executivo",
    CONSULTIVE: "Consultivo"
  }[profile.analysisTone] || "Consultivo";

  return (
    <div className="card ledger-analytics-card">
      <div className="dash-section-title">
        <span>Perfil do titular</span>
      </div>
      <div className="ledger-quality-grid" style={{ marginTop: ".2rem" }}>
        <div><span>Nome preferido</span><strong>{profile.preferredName || "Não configurado"}</strong></div>
        <div><span>Banco principal</span><strong>{profile.primaryBank || "Não informado"}</strong></div>
        <div><span>Tom</span><strong>{toneLabel}</strong></div>
        <div><span>Documento</span><strong>{profile.documentMasked || "Mascarado sob demanda"}</strong></div>
        <div><span>Tratamento</span><strong>{profile.showPersonalizedTreatment ? "Personalizado" : "Neutro"}</strong></div>
      </div>
    </div>
  );
}
