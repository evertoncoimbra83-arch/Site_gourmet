import { useProfileLogic } from "./profile/logic/ProfileLogic";
import { ProfileView } from "./profile/view/ProfileView";
import { SEO } from "@/components/SEO";

export default function Profile() {
  const vm = useProfileLogic();
  return <ProfileView vm={vm} />;
}
