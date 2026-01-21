// clinte/src/components/ProducctCard.tsx

import { Button } from "@/components/ui/button";

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    image: string;
    kcal?: number | null;
    tags?: string[];
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      
      {/* IMAGEM */}
      <div className="relative aspect-square bg-muted rounded-t-xl overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      {/* CONTEÚDO */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-base font-semibold leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* TAGS + KCAL */}
        {(product.tags?.length || product.kcal) && (
          <div className="flex flex-wrap gap-1">
            {product.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}

            {product.kcal && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {product.kcal} kcal
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <Button
          variant="accent"
          size="sm"
          className="mt-3 w-full"
        >
          Escolher opções
        </Button>
      </div>
    </div>
  );
}
