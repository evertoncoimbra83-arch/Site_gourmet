# Mapa de Migração: WordPress para Gourmet (Fase 1)

Este documento mapeia a origem e o destino dos dados dos clientes durante a migração do WooCommerce.

## 1. De: WordPress (WooCommerce) -> Para: Gourmet
| Campo Origem (WP JSON) | Campo Destino (Drizzle) | Tabela Destino | Tratamento Aplicado |
| :--- | :--- | :--- | :--- |
| `old_id` | `user_id_legacy` | `auth_users` | Convertido para String |
| `email` | `email` | `auth_users` / `users` | Lowercase total |
| `name` | `name` | `users` | Encriptado AES-256-GCM |
| `contact.document` | `customer_document` | `users` | Apenas números + Encriptado |
| `contact.document` | `customer_document_hash` | `users` | SHA-256(PII_PEPPER + clean_doc) |
| `contact.phone` | `phone` | `users` | Apenas números + Encriptado |
| `contact.phone` | `phone_last4` | `users` | `slice(-4)` do telefone original |
| `registered` | `created_at` | `users` | Convertido para JS Date Object |

## 2. Lógica de Endereços
O WordPress armazena o endereço como meta-dados do usuário. No Gourmet, o primeiro endereço importado é definido como:
- **Label:** "Principal" (Encriptado)
- **isDefault:** `true` (boolean)
- **ID:** CUID2 gerado no momento da inserção.

## 3. Credenciais Temporárias
Como as senhas do WordPress (MD5/Phpass) são incompatíveis com o sistema atual, todos os usuários migrados receberam o hash de:
**Senha Padrão:** `migracao123`
*Recomenda-se disparar um e-mail de "Esqueci minha senha" para a base após a virada do site.*