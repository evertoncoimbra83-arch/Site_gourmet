// client/src/pages/Home.tsx
import { useEffect, useState } from "react";
import { trpc } from "@/_core/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import ProductDrawer from "./products/view/ProductDrawer";
import PackageDrawer from "./packages/view/PackageDrawer";
import { HomeAnnouncementBanner } from "./home/components/HomeAnnouncementBanner";
import { HomeCategories } from "./home/components/HomeCategories";
import { HomeFaq } from "./home/components/HomeFaq";
import { HomeHero } from "./home/components/HomeHero";
import { HomeHowItWorks } from "./home/components/HomeHowItWorks";
import { HomeLoyaltySection } from "./home/components/HomeLoyaltySection";
import { HomeNutritionistBanner } from "./home/components/HomeNutritionistBanner";
import { HomePackages } from "./home/components/HomePackages";
import { HomeShowcases } from "./home/components/HomeShowcases";
import { useHomeCep } from "./home/hooks/useHomeCep";
import { useHomeSeoSchemas } from "./home/hooks/useHomeSeoSchemas";
import type {
  FeaturedAnnouncement,
  HomeCategory,
  PackageItem,
  ShowcaseData,
  StoreSettingsLike,
} from "./home/types";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null
  );

  const { data: showcases, isLoading: isShowcasesLoading } =
    trpc.store.getShowcases.useQuery();
  const { data: storeSettings } =
    trpc.store.public.getPublicSettings.useQuery();
  const { data: packages, isLoading: isPackagesLoading } =
    trpc.store.packages.list.useQuery();
  const { data: categoriesData } = trpc.public.dishes.categories.useQuery(
    undefined,
    { staleTime: 1000 * 60 * 30 }
  );
  const { data: featuredAnnouncement, refetch: refetchFeaturedAnnouncement } =
    trpc.announcements.getFeatured.useQuery();

  useEffect(() => {
    refetchFeaturedAnnouncement();
  }, [isAuthenticated, refetchFeaturedAnnouncement]);

  const settings = storeSettings as StoreSettingsLike | undefined;
  const isEmergency = !!settings?.emergencyMode;
  const schemas = useHomeSeoSchemas(settings);
  const { cepInput, checkingCep, cepStatus, handleCepChange, handleCheckCep } =
    useHomeCep();

  return (
    <div
      className={cn(
        "min-h-screen overflow-x-hidden bg-[#FBFBFC] text-slate-900 pb-20 transition-all duration-500",
        settings?.accessibility?.highContrast && "contrast-125 saturate-150",
        settings?.accessibility?.dyslexicFont && "font-dyslexic"
      )}
    >
      <SEO
        title="Marmitas Fitness, Low Carb e Congeladas Saudáveis"
        description="Marmitas saudáveis, fitness e low carb ultracongeladas com sabor de comida caseira. Entregas em Jundiaí e região. Monte seu prato ou kit do seu jeito!"
        path="/"
        schemaMarkup={schemas}
      />

      {featuredAnnouncement && (
        <HomeAnnouncementBanner
          announcement={featuredAnnouncement as FeaturedAnnouncement}
        />
      )}

      <HomeHero
        isEmergency={isEmergency}
        cepInput={cepInput}
        checkingCep={checkingCep}
        cepStatus={cepStatus}
        onCepChange={handleCepChange}
        onCheckCep={handleCheckCep}
      />

      <HomeCategories
        categories={categoriesData as HomeCategory[] | undefined}
      />

      <HomeShowcases
        showcases={showcases as ShowcaseData[] | undefined}
        isLoading={isShowcasesLoading}
        onSelectDish={setSelectedDishId}
      />

      <HomePackages
        packages={packages as PackageItem[] | undefined}
        isLoading={isPackagesLoading}
        isEmergency={isEmergency}
        onSelectPackage={setSelectedPackageId}
      />

      <HomeLoyaltySection isAuthenticated={isAuthenticated} />
      <HomeHowItWorks />
      <HomeNutritionistBanner />
      <HomeFaq />

      <ProductDrawer
        dishId={selectedDishId}
        onClose={() => setSelectedDishId(null)}
      />
      <PackageDrawer
        packageId={selectedPackageId}
        onClose={() => setSelectedPackageId(null)}
      />
    </div>
  );
}
