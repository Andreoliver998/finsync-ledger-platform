export default function TransactionExplanationColumn({ item }) {
  return (
    <div
      style={{ flexDirection: "column", alignItems: "flex-start", gap: ".2rem" }}
      title={item.classificationReason || item.explanation || ""}
    >
      <strong style={{ fontSize: ".74rem" }}>{item.explanation || "Sem explicação"}</strong>
    </div>
  );
}
