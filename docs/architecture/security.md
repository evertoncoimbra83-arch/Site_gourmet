# Arquitetura de Segurança — Gourmet Saudável

Este documento resume a infraestrutura de segurança de dados e rede da plataforma.

---

## 🎯 Objetivo
Proteger as transações dos usuários, impedir o vazamento de informações de identificação pessoal (PII), e mitigar vetores de ataque comuns na web (como CSRF e DDoS).

---

## 📁 Arquivos Principais
* [security-middleware.ts](file:///f:/Site_React/server/_core/security-middleware.ts) — Configurações de headers HTTP (Helmet), proteção CSRF e logs de requisições suspensas.
* [rateLimit.ts](file:///f:/Site_React/server/security/rateLimit.ts) — Limitadores de requisições por IP no Express.
* [encryption.ts](file:///f:/Site_React/server/encryption.ts) — Funções de criptografia simétrica (AES-256-GCM) e hashing cego.
* [orders.ts (Storefront)](file:///f:/Site_React/server/routers/storefront/orders.ts) — Endpoints públicos que impõem ownership de dados.

---

## 🟢 Estado Atual
* **Proteção CSRF**: Mapeado via double-submit cookie.
* **Criptografia PII**: Nomes, CPFs e telefones são armazenados criptografados. A busca exata é feita por hashing cego no banco (`documentIndex`, `phoneIndex`).
* **Ownership**: Apenas o dono do pedido consegue visualizar os detalhes dele ou baixar notas de entrega.
* **Rate Limits**: Limitadores ativos no Express para impedir brute force nos endpoints de auth, login e checkout.

---

## 🚨 Riscos Conhecidos
* **Bypass Local de Rate Limit**: O limitador pula verificações de localhost/IPs locais para viabilizar desenvolvimento, o que exige cautela na configuração do proxy de produção (certificar-se de passar o header `X-Forwarded-For` de forma íntegra).

---

## 🔮 Próximos Passos
* Implementar auditorias de integridade periódicas nos dados criptografados para identificar possíveis chaves corrompidas.
* Integrar auditoria dinâmica contra vazamento de metadados no Express (remoção de cabeçalhos redundantes).
