import React from "react";
import AdminAnalyticsView from "./adminAnalytics/view/AdminAnalyticsView";

/**
 * 👑 AdminAnalytics Page Wrapper
 * Este componente atua como a entrada da rota, permitindo que a View
 * se preocupe apenas com a lógica de BI e Analytics.
 */
export default function AdminAnalytics() {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <AdminAnalyticsView />
    </div>
  );
}