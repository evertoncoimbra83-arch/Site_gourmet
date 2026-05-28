import React from "react";

// ✅ CSS do shimmer movido para index.css — ver trecho abaixo
// .shimmer::after { ... } + @keyframes shimmer

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#FBFBFC] py-6 md:py-10 font-sans overflow-hidden">
      <div className="container mx-auto max-w-5xl px-4">

        {/* Header Skeleton */}
        <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            {/* Título: Minha Conta */}
            <div className="h-10 w-64 bg-slate-200 rounded-2xl animate-pulse relative overflow-hidden shimmer" />

            {/* Boas vindas */}
            <div className="flex items-center gap-2">
              <div className="h-3 w-32 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-1 w-1 rounded-full bg-emerald-200" />
            </div>
          </div>

          {/* Card de Pontos */}
          <div className="h-20 w-44 bg-white border border-slate-100 rounded-2xl shadow-sm animate-pulse flex items-center px-4 gap-3">
            <div className="h-10 w-10 bg-slate-100 rounded-xl" />
            <div className="space-y-2">
              <div className="h-2 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-12 bg-slate-200 rounded" />
            </div>
          </div>
        </header>

        {/* Tabs Navigation Skeleton */}
        <div className="bg-slate-100/50 p-1 rounded-2xl md:rounded-full h-14 w-full max-w-2xl mb-8 flex gap-2 animate-pulse">
          <div className="flex-1 bg-white/80 rounded-xl md:rounded-full h-full" />
          <div className="flex-1 bg-transparent rounded-xl md:rounded-full h-full" />
          <div className="flex-1 bg-transparent rounded-xl md:rounded-full h-full" />
          <div className="flex-1 bg-transparent rounded-xl md:rounded-full h-full" />
        </div>

        {/* Main Content Card Skeleton */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded ml-1" />
              <div className="h-14 w-full bg-slate-50 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded ml-1" />
              <div className="h-14 w-full bg-slate-50 rounded-2xl" />
            </div>
            <div className="pt-4">
              <div className="h-14 w-full bg-slate-200 rounded-2xl opacity-50" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}