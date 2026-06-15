export function buildReferralInviteUrl(referralCode: string) {
  const encodedReferralCode = encodeURIComponent(referralCode);
  const configuredBaseUrl = import.meta.env.VITE_PUBLIC_APP_URL;
  const browserOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const baseUrl = (configuredBaseUrl || browserOrigin).replace(/\/$/, "");

  return `${baseUrl}/convite/${encodedReferralCode}`;
}
