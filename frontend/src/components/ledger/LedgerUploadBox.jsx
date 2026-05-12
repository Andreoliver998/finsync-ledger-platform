import { useRef, useState } from "react";
import { useToast } from "../../context/ToastContext.jsx";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

async function readFile(file, toast) {
  if (!/\.csv$/i.test(file.name)) {
    toast.error("Selecione um arquivo .csv válido.");
    return null;
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.error("O arquivo excede o limite de 2 MB.");
    return null;
  }
  const fileContent = await file.text();
  return { fileName: file.name, fileContent };
}

export default function LedgerUploadBox({
  loading = false,
  fileName = "",
  fileSource = "MANUAL_UPLOAD",
  bank = "",
  accountName = "",
  onFileSelected,
  onMetaChange,
  onPreview
}) {
  const toast = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await readFile(file, toast);
    if (result) onFileSelected(result);
    event.target.value = "";
  }

  function onDragEnter(e) {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  async function onDrop(e) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const result = await readFile(file, toast);
    if (result) onFileSelected(result);
  }

  return (
    <section className="card ledger-panel">
      <div className="ledger-panel-head">
        <div>
          <div className="section-num">Fluxo 01</div>
          <h2>Entrada de extrato</h2>
          <p className="ledger-muted">
            Arraste um CSV para a área abaixo ou clique para selecionar. O banco é detectado automaticamente.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={onPreview} disabled={loading || !fileName}>
          {loading ? "Processando..." : "Ler arquivo"}
        </button>
      </div>

      <div className="ledger-upload-grid">
        <label
          className={`ledger-upload-dropzone${isDragOver ? " drag-over" : ""}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} hidden />
          <span className="ledger-upload-title">
            {isDragOver ? "Solte o arquivo aqui" : "Upload CSV"}
          </span>
          <span className="ledger-upload-sub">
            {fileName
              ? `📄 ${fileName}`
              : isDragOver
                ? "Arquivo .csv detectado"
                : "Arraste e solte ou clique para selecionar"}
          </span>
        </label>

        <div className="ledger-upload-fields">
          <div className="input-group">
            <label className="input-label">Origem</label>
            <select
              className="input"
              value={fileSource}
              onChange={(event) => onMetaChange("provider", event.target.value)}
            >
              <option value="MANUAL_UPLOAD">Upload manual</option>
              <option value="ONEDRIVE">OneDrive</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Banco</label>
            <input
              className="input"
              value={bank}
              onChange={(event) => onMetaChange("bank", event.target.value)}
              placeholder="Detectado automaticamente"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Conta</label>
            <input
              className="input"
              value={accountName}
              onChange={(event) => onMetaChange("accountName", event.target.value)}
              placeholder="Ex.: Conta Corrente PJ"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
