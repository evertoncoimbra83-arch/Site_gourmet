import { AdminMediaView } from "./adminMedia/view/AdminMediaView"; // Ajuste o path se necessário

export default function AdminMediaManager() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <AdminMediaView />
    </div>
  );
}