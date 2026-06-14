// shared/utils/assets.ts
import { resolveImageUrl } from "./image-url";

export {
  getImageFallback,
  isCloudinaryUrl,
  isLegacyFilename,
  isLegacyImageReference,
  isLocalUploadUrl,
  normalizeImageUrlForStorage,
} from "./image-url";

export function normalizeImageUrl(path: string | null | undefined): string {
  return resolveImageUrl(path, "generic");
}
