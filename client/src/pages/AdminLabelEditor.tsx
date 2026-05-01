import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AdminLabelEditorView from "./adminLabelEditor/view/AdminLabelEditorview";

export default function AdminLabelEditorPage() {
  const { id, orderId } = useParams<{ id?: string; orderId?: string }>();
  const { pathname } = useLocation();

  const isProduction = pathname.includes("/production");
  const labelId = id && !isProduction ? parseInt(id, 10) : undefined;

  return (
    <AdminLabelEditorView
      initialId={Number.isFinite(labelId) ? labelId : undefined}
      initialMode={isProduction ? "production" : "design"}
      orderId={orderId}
    />
  );
}
