import OpenFinanceConnect from "../components/OpenFinanceConnect.jsx";
import AppLayout from "../layouts/AppLayout.jsx";

export default function OpenFinancePage() {
  return (
    <AppLayout breadcrumb="Open Finance">
      <OpenFinanceConnect />
    </AppLayout>
  );
}
