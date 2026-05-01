import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LabelProductionPanel } from "../../adminLabelEditor/components/LabelProductionPanel";

interface OrderItem {
  id: string | number;
  quantity: number;
  dish_name?: string;
  dishName?: string;
  name?: string;
  options?: string | Record<string, unknown>;
  parsedOptions?: Record<string, unknown>;
  packageItems?: Record<string, unknown>[];
  [key: string]: unknown;
}

interface Props {
  open: boolean;
  onClose: () => void;
  item: OrderItem | null;
  order: Record<string, unknown> | null;
}

export function PrintLabelSheet({ open, onClose, item, order }: Props) {
  const labelOrder = React.useMemo(() => {
    if (!item) return order;
    return {
      ...(order ?? {}),
      items: [item],
    };
  }, [item, order]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full p-0 focus:outline-none sm:max-w-xl"
      >
        <LabelProductionPanel
          order={labelOrder}
          item={item}
          showFullPageLink
          className="h-full"
        />
      </SheetContent>
    </Sheet>
  );
}
