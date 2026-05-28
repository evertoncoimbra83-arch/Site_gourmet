import React from "react";
import { useParams } from "react-router-dom"; // ✅ Removidos Routes e Route que não estavam em uso
import { useProfileLogic } from "./profile/logic/ProfileLogic";
import { ProfileView } from "./profile/view/ProfileView";
import { SEO } from "@/components/SEO";

/**
 * Este componente atua como um "Layout" para as páginas de perfil.
 * Ele captura o subcaminho (ex: 'pedidos') de /perfil/* usando o hook useParams.
 */
export default function Profile() {
  // Captura o que vem depois de /perfil/ (ex: "pedidos" ou "dados")
  const params = useParams();
  
  // O "*" corresponde ao que foi definido no RoutesConfig (path: "/perfil/*")
  const subroute = params["*"] || "dashboard"; 

  // A lógica do perfil decide o que carregar baseado na string da subrota
  const vm = useProfileLogic(subroute);

  return (
    <>
      <SEO title="Meu Perfil | Gourmet Saudável" noindex />
      
      {/* A ProfileView recebe a 'vm' (ViewModel). 
          Dentro dela, você deve renderizar o conteúdo condicionalmente:
          ex: {vm.subroute === 'pedidos' ? <Orders /> : <Dashboard />}
      */}
      <ProfileView vm={vm} />
    </>
  );
}