import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // Supondo que você tenha componentes de Card

// Defina a interface para as props do produto
interface Product {
  id: string;
  name: string;
  price: string;
  image?: string;
  tags?: string[];
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

export function ProductCarousel({ title, products }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={scrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={scrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 px-4">
          {products.map((product) => (
            <div key={product.id} className="flex-[0_0_80%] sm:flex-[0_0_45%] md:flex-[0_0_30%] lg:flex-[0_0_22%] min-w-0">
              <Card className="h-full">
                <div className="aspect-square bg-muted relative">
                  {product.image ? (
                     <img src={product.image} alt={product.name} className="object-cover w-full h-full rounded-t-lg" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                   <div className="flex flex-wrap gap-1">
                    {product.tags?.map(tag => (
                        <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <div className="font-bold text-primary">{product.price}</div>
                  <Button className="w-full mt-2" size="sm">Adicionar</Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}