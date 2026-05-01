// client/src/pages/adminLabelEditor/print-engine/index.ts
//
// Barrel que expoe o motor de impressao para o adminLabelEditor.
// LabelEditorStation e LabelProductionPanel importam daqui.
//
// Observacao: este workspace ja possui a pasta `print-engine/`, entao no
// Windows nao e possivel criar um arquivo irmao `print-engine.ts`. O import
// `../print-engine` resolve este `index.ts`.

export { useLabelLogic } from "../../adminOrders/components/orderDrawer/print/logic/useLabelLogic";
export { generateZPLForBatch } from "../../adminOrders/components/orderDrawer/print/logic/ZplGenerator";
export type {
  ZebraDPI,
  ZebraPhysicalConfig,
} from "../../adminOrders/components/orderDrawer/print/logic/ZplGenerator";
export { useZebraUSB as useZebraTransport } from "../../adminOrders/components/orderDrawer/print/hooks/useZebraUSB";
export {
  buildTemplateLibrary,
  type ActiveLabelTemplate,
  type AdminLabelTemplate,
  type PrintLabelElement,
} from "./templates";
export type {
  Accompaniment,
  FlatLabel,
  MealOption,
  NutritionData,
  OrderData,
  OrderItem,
  ParsedOptions,
} from "./logic";
