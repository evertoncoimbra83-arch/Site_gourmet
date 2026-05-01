// client/src/pages/adminSettings/components/tabs/StoreTab.tsx
import React, { ComponentProps } from "react";
import { CompanyInfoForm } from "../CompanyInfoForm";
import { AreaShell } from "../AreaShell";
import { ShortcutGrid } from "../ShortcutGrid";
import { settingsAreas } from "../../config/settingsAreas";

const area = settingsAreas[0];

interface StoreTabProps {
  companyTab: {
    state: ComponentProps<typeof CompanyInfoForm>["state"];
    actions: ComponentProps<typeof CompanyInfoForm>["actions"];
  };
}

export function StoreTab({ companyTab }: StoreTabProps) {
  return (
    <AreaShell area={area}>
      <CompanyInfoForm state={companyTab.state} actions={companyTab.actions} />
      <ShortcutGrid shortcuts={area.shortcuts || []} />
    </AreaShell>
  );
}