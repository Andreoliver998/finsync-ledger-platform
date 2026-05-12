import { useEffect, useState } from "react";
import LedgerColumnMapping from "../components/ledger/LedgerColumnMapping.jsx";
import LedgerDuplicateWarning from "../components/ledger/LedgerDuplicateWarning.jsx";
import LedgerImportHistory from "../components/ledger/LedgerImportHistory.jsx";
import LedgerImportSummary from "../components/ledger/LedgerImportSummary.jsx";
import LedgerPreviewTable from "../components/ledger/LedgerPreviewTable.jsx";
import LedgerUploadBox from "../components/ledger/LedgerUploadBox.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  confirmLedgerCsvImport,
  deleteLedgerImport,
  listLedgerImports,
  previewLedgerCsv
} from "../services/ledgerImportApi.js";

const INITIAL_FORM = {
  fileName: "",
  fileContent: "",
  provider: "MANUAL_UPLOAD",
  bank: "",
  accountName: ""
};

export default function LedgerImport() {
  const toast = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [bankAutoDetected, setBankAutoDetected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [confirming, setConfirming] = useState(false);

  async function loadHistory() {
    setLoadingHistory(true);

    try {
      const result = await listLedgerImports({ limit: 20 });
      setHistory(result.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível carregar o histórico de importações.");
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handlePreview() {
    setLoadingPreview(true);

    try {
      const data = await previewLedgerCsv({
        ...form,
        source: "CSV_UPLOAD",
        mapping
      });

      setPreview(data);
      setMapping(data.suggestedMapping || {});

      if (!form.bank && data.detectedBank) {
        setForm((current) => ({ ...current, bank: data.detectedBank }));
        setBankAutoDetected({ bank: data.detectedBank, confidence: data.bankConfidence });
        const conf = data.bankConfidence === "high" ? "confiança alta" : "confiança média";
        toast.info(`Banco detectado: ${data.detectedBank} (${conf}). Corrija no campo se necessário.`, 6000);
      } else {
        setBankAutoDetected(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível processar o CSV.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);

    try {
      const result = await confirmLedgerCsvImport({
        ...form,
        source: "CSV_UPLOAD",
        mapping
      });

      const imported = result?.importedTransactions ?? 0;
      toast.success(`Importação concluída — ${imported} transação${imported !== 1 ? "ões" : ""} importada${imported !== 1 ? "s" : ""}.`);
      setPreview(null);
      setForm(INITIAL_FORM);
      setMapping({});
      setBankAutoDetected(null);
      await loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível concluir a importação.");
    } finally {
      setConfirming(false);
    }
  }

  async function handleDelete(item) {
    const shouldDelete = window.confirm(`Excluir o lote "${item.fileName}" e suas transações importadas?`);

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteLedgerImport(item.id);
      toast.success("Lote removido com sucesso.");
      await loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Não foi possível remover a importação.");
    }
  }

  return (
    <AppLayout breadcrumb="Conciliação por arquivos">
      <div className="ledger-page anim-fade-in">
        <div className="manual-header">
          <div>
            <h1 className="dash-page-title">Conciliação por arquivos</h1>
            <p className="dash-page-sub">
              Importe extratos CSV, previna duplicidades e alimente o dashboard financeiro com rastreabilidade por lote.
            </p>
          </div>
        </div>


        <LedgerUploadBox
          loading={loadingPreview}
          fileName={form.fileName}
          fileSource={form.provider}
          bank={form.bank}
          accountName={form.accountName}
          onFileSelected={({ fileName, fileContent }) => setForm((current) => ({ ...current, fileName, fileContent }))}
          onMetaChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
          onPreview={handlePreview}
        />

        <LedgerColumnMapping
          headers={preview?.headers || []}
          mapping={mapping}
          onChange={(field, value) => setMapping((current) => ({ ...current, [field]: value }))}
        />

        <LedgerDuplicateWarning summary={preview?.summary} />
        <LedgerPreviewTable rows={preview?.previewRows || []} />
        <LedgerImportSummary
          summary={preview?.summary}
          onConfirm={handleConfirm}
          confirming={confirming}
          ready={Boolean(preview)}
        />

        <LedgerImportHistory
          imports={history}
          loading={loadingHistory}
          onRefresh={loadHistory}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
