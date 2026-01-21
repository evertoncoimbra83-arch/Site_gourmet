# 📚 Media Library - Sistema de Gerenciamento de Imagens

## Visão Geral

A **Media Library** é um sistema centralizado de gerenciamento de imagens do Gourmet Saudável. Todas as imagens do site são armazenadas no S3 através desta biblioteca, garantindo organização, performance e facilidade de uso.

---

## ✨ Funcionalidades

### 1. Upload de Imagens
- Upload via interface web (drag-and-drop ou clique)
- Validação automática de tipo de arquivo (apenas imagens)
- Limite de tamanho: 5MB por arquivo
- Formatos suportados: PNG, JPG, JPEG, GIF
- Conversão automática para base64 e upload para S3
- Geração automática de nomes únicos para evitar conflitos

### 2. Galeria Visual
- Visualização em grid responsivo (3-4 colunas)
- Preview de todas as imagens enviadas
- Indicador visual de imagem selecionada
- Informações de cada imagem (nome original, tamanho)
- Ações rápidas (deletar, selecionar)

### 3. Integração com Formulários
- Modal reutilizável (`MediaLibraryModal`)
- Botão "Galeria" em todos os campos de imagem
- Preview da imagem selecionada
- Campo de URL como alternativa (aceita URLs externas)

---

## 🎯 Onde a Media Library é Usada

### ✅ Métodos de Pagamento
**Localização:** `/admin/metodos-pagamento`

**Uso:** Upload de logos das bandeiras de cartão (Alelo, Ticket, VR, Pluxee, Ben, Verocard)

**Como usar:**
1. Acesse o painel de métodos de pagamento
2. Clique em "Editar" ou "Adicionar Novo"
3. No campo "Logo da Bandeira", clique no botão "Galeria"
4. Faça upload de uma nova imagem ou selecione uma existente
5. A imagem será exibida no checkout

**Resultado:** Logos das bandeiras aparecem no checkout, melhorando a experiência do usuário.

---

### ✅ Fotos de Pratos
**Localização:** `/admin/pratos`

**Uso:** Upload de fotos dos pratos do cardápio

**Como usar:**
1. Acesse o gerenciamento de pratos
2. Clique em "Novo Prato" ou edite um existente
3. No campo "Imagem do Prato", clique no ícone de imagem
4. Faça upload de uma foto profissional do prato
5. A imagem será exibida na listagem de produtos

**Dicas:**
- Use fotos de alta qualidade (mínimo 800x800px)
- Fundo branco ou neutro funciona melhor
- Iluminação natural realça as cores dos alimentos
- Mantenha proporção quadrada para melhor visualização

---

### ⏳ Imagens de Categorias (Em Breve)
**Localização:** `/admin/categorias`

**Uso:** Upload de imagens representativas para cada categoria

**Implementação:**
- Backend já preparado com campo `imageUrl` na tabela `categories`
- Rotas tRPC criadas: `admin.dishes.updateCategoryImage`
- Aguardando interface de gerenciamento de categorias

---

### ⏳ Banners e Promoções (Futuro)
**Uso potencial:**
- Banners da página inicial
- Imagens de campanhas promocionais
- Destaques de produtos
- Imagens de blog/conteúdo

---

## 🔧 Estrutura Técnica

### Backend

**Arquivo:** `server/media-library.ts`

**Funções principais:**
```typescript
// Upload de imagem para S3
uploadImage(data: {
  file: Buffer | Uint8Array;
  originalFilename: string;
  mimeType: string;
  uploadedBy: number;
}): Promise<MediaLibraryItem>

// Listar todas as imagens
listMediaLibrary(): Promise<MediaLibraryItem[]>

// Buscar imagem por ID
getMediaById(id: number): Promise<MediaLibraryItem | null>

// Deletar imagem
deleteMedia(id: number): Promise<{ success: boolean }>
```

**Rotas tRPC:**
- `media.list` - Listar imagens (admin)
- `media.get` - Buscar imagem por ID (admin)
- `media.upload` - Fazer upload (admin)
- `media.delete` - Deletar imagem (admin)

---

### Frontend

**Componente:** `client/src/components/MediaLibraryModal.tsx`

**Props:**
```typescript
interface MediaLibraryModalProps {
  open: boolean;              // Controla visibilidade do modal
  onClose: () => void;        // Callback ao fechar
  onSelect: (url: string) => void;  // Callback ao selecionar imagem
  selectedUrl?: string;       // URL da imagem atualmente selecionada
}
```

**Exemplo de uso:**
```tsx
import MediaLibraryModal from "@/components/MediaLibraryModal";

function MyForm() {
  const [imageUrl, setImageUrl] = useState("");
  const [showGallery, setShowGallery] = useState(false);

  return (
    <>
      <Input 
        value={imageUrl} 
        placeholder="URL da imagem"
        readOnly 
      />
      <Button onClick={() => setShowGallery(true)}>
        <Image className="h-4 w-4" />
      </Button>
      
      <MediaLibraryModal
        open={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={(url) => setImageUrl(url)}
        selectedUrl={imageUrl}
      />
    </>
  );
}
```

---

### Banco de Dados

**Tabela:** `media_library`

**Estrutura:**
```sql
CREATE TABLE media_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,           -- Nome único gerado
  original_filename VARCHAR(255) NOT NULL,  -- Nome original do arquivo
  url VARCHAR(500) NOT NULL,                -- URL pública no S3
  file_key VARCHAR(500) NOT NULL,           -- Chave do arquivo no S3
  mime_type VARCHAR(100) NOT NULL,          -- Tipo MIME (image/png, image/jpeg)
  file_size INT NOT NULL,                   -- Tamanho em bytes
  uploaded_by INT NOT NULL,                 -- ID do usuário que fez upload
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📊 Estatísticas Atuais

**Imagens na biblioteca:** 6 logos de bandeiras

**Logos cadastrados:**
1. Alelo (PNG) - 9.5 KB
2. Ticket (JPG) - 9.7 KB
3. VR (JPG) - 15 KB
4. Pluxee (PNG) - 14 KB
5. Ben (JPG) - 4.8 KB
6. Verocard (PNG) - 9.4 KB

**Total de espaço usado:** ~62 KB

---

## 🚀 Próximos Passos

### Curto Prazo
1. ✅ Integrar com formulário de pratos (concluído)
2. ⏳ Criar interface de gerenciamento de categorias
3. ⏳ Adicionar campo de imagem ao cadastro de categorias
4. ⏳ Permitir múltiplas imagens por prato (galeria)

### Médio Prazo
1. Sistema de tags/categorias para organizar imagens
2. Busca e filtros na galeria
3. Edição básica de imagens (crop, resize)
4. Otimização automática de imagens (compressão, WebP)

### Longo Prazo
1. Versionamento de imagens
2. CDN para melhor performance
3. Análise de uso (imagens não utilizadas)
4. Backup automático

---

## 💡 Boas Práticas

### Para Administradores

1. **Nomeação de arquivos:** Use nomes descritivos antes do upload (ex: `alelo-logo.png`, `frango-grelhado.jpg`)

2. **Organização:** Mantenha apenas imagens em uso ativas na biblioteca

3. **Qualidade:** Priorize qualidade sobre tamanho (até 5MB é aceitável)

4. **Consistência:** Use o mesmo estilo de foto para todos os pratos (fundo, iluminação, ângulo)

### Para Desenvolvedores

1. **Sempre use a Media Library:** Não faça upload direto para S3 ou use URLs externas sem necessidade

2. **Validação:** O componente já valida tipo e tamanho, não é necessário validação adicional

3. **Preview:** Sempre mostre preview da imagem selecionada para melhor UX

4. **Fallback:** Tenha um placeholder para quando não houver imagem

---

## 🔒 Segurança

- ✅ Upload restrito a usuários admin
- ✅ Validação de tipo de arquivo no frontend e backend
- ✅ Limite de tamanho (5MB) para evitar sobrecarga
- ✅ Nomes de arquivo aleatórios para evitar enumeração
- ✅ URLs públicas mas não enumeráveis
- ⚠️ Deleção não remove do S3 (para evitar quebrar links existentes)

---

## 📞 Suporte

Para dúvidas ou problemas com a Media Library:
1. Verifique se o usuário tem permissão de admin
2. Confirme que o arquivo é uma imagem válida
3. Verifique o tamanho do arquivo (máximo 5MB)
4. Consulte os logs do servidor para erros de upload

---

**Última atualização:** 05 de Dezembro de 2024  
**Versão:** 1.0.0  
**Status:** ✅ Produção
