import { trpc } from "@/_core/trpc";
import { ProductCard } from "@/components/ProductCard"; // Seu componente de card

export function HomePage() {
  const { data: showcases, isLoading } = trpc.public.showcases.listActive.useQuery();

  if (isLoading) return <div>Carregando vitrines...</div>;

  return (
    <div className="space-y-8 p-4">
      {showcases?.map((showcase) => (
        <section key={showcase.id} className="showcase-section">
          <h2 className="text-2xl font-bold mb-4">{showcase.title}</h2>
          
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {showcase.items?.map((product) => (
              <div key={product.id} className="min-w-[250px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}