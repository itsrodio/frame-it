export const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
]);

const SUPPORTED_IMAGE_EXTENSIONS = /\.(png|jpe?g|svg|webp)$/i;

export interface LoadedDesignImage {
  imageUrl: string;
  fileName: string;
  naturalWidth: number;
  naturalHeight: number;
}

export function isSupportedDesignImage(
  file: File | Blob,
  fileName?: string,
): boolean {
  if (file.type && SUPPORTED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  const name = fileName ?? (file instanceof File ? file.name : undefined) ?? '';
  return SUPPORTED_IMAGE_EXTENSIONS.test(name);
}

export function extractImageFromClipboard(
  clipboardData: DataTransfer | null,
): { file: File | Blob; fileName: string } | null {
  if (!clipboardData) return null;

  if (clipboardData.items) {
    for (const item of Array.from(clipboardData.items)) {
      if (item.kind !== 'file') continue;
      if (
        item.type.startsWith('image/') &&
        (SUPPORTED_IMAGE_MIME_TYPES.has(item.type.toLowerCase()) ||
          item.type === 'image/png')
      ) {
        const file = item.getAsFile();
        if (file) {
          return {
            file,
            fileName: file.name || 'clipboard-image.png',
          };
        }
      }
    }
  }

  if (clipboardData.files) {
    for (const file of Array.from(clipboardData.files)) {
      if (isSupportedDesignImage(file)) {
        return {
          file,
          fileName: file.name || 'clipboard-image.png',
        };
      }
    }
  }

  return null;
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image as data URL'));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
}

export function measureImageDimensions(
  imageUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width || 800,
        height: img.naturalHeight || img.height || 600,
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to decode image dimensions'));
    };
    img.src = imageUrl;
  });
}

export async function readDesignImageFile(
  file: File | Blob,
  explicitName?: string,
): Promise<LoadedDesignImage> {
  const fileName =
    explicitName ??
    (file instanceof File && file.name ? file.name : 'design-mockup.png');

  if (!isSupportedDesignImage(file, fileName)) {
    throw new Error('Unsupported image format');
  }

  const imageUrl = await readFileAsDataUrl(file);
  const { width, height } = await measureImageDimensions(imageUrl);

  return {
    imageUrl,
    fileName,
    naturalWidth: width,
    naturalHeight: height,
  };
}

export function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) return 50;
  return Math.min(100, Math.max(0, Math.round(opacity)));
}

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  return Math.min(4, Math.max(0.1, Math.round(scale * 1000) / 1000));
}

export function calculateFitWidthScale(
  naturalWidth: number,
  viewportWidth: number,
): number {
  if (naturalWidth <= 0 || viewportWidth <= 0) return 1;
  return clampScale(viewportWidth / naturalWidth);
}

export function calculateCenteredX(
  naturalWidth: number,
  scale: number,
  viewportWidth: number,
): number {
  if (naturalWidth <= 0 || viewportWidth <= 0) return 0;
  return Math.round((viewportWidth - naturalWidth * scale) / 2);
}

export interface SmartPlacementInput {
  naturalWidth: number;
  naturalHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
  followScroll: boolean;
  containerRect?: { left: number; top: number; width: number } | null;
}

export function computeSmartDesignPlacement({
  naturalWidth,
  naturalHeight,
  viewportWidth,
  viewportHeight,
  scrollX,
  scrollY,
  followScroll,
  containerRect,
}: SmartPlacementInput): { x: number; y: number; scale: number } {
  const baseY = followScroll ? Math.round(scrollY) : 0;
  const offsetScrollX = followScroll ? scrollX : 0;

  if (naturalWidth <= 0 || viewportWidth <= 0) {
    return { x: 0, y: baseY, scale: 1 };
  }

  // 1. Exact or 2x Retina match with the detected page container
  if (containerRect && containerRect.width > 0) {
    if (Math.abs(naturalWidth - containerRect.width) <= 8) {
      const y =
        naturalHeight < viewportHeight * 0.75 && containerRect.top >= 0
          ? Math.round(containerRect.top + baseY)
          : baseY;
      return {
        x: Math.round(containerRect.left + offsetScrollX),
        y,
        scale: 1,
      };
    }

    if (Math.abs(naturalWidth / 2 - containerRect.width) <= 8) {
      const y =
        naturalHeight / 2 < viewportHeight * 0.75 && containerRect.top >= 0
          ? Math.round(containerRect.top + baseY)
          : baseY;
      return {
        x: Math.round(containerRect.left + offsetScrollX),
        y,
        scale: 0.5,
      };
    }
  }

  // 2. Exact 1x or 2x Retina match with viewport width
  if (Math.abs(naturalWidth - viewportWidth) <= 4) {
    return { x: 0, y: baseY, scale: 1 };
  }

  if (Math.abs(naturalWidth / 2 - viewportWidth) <= 4) {
    return { x: 0, y: baseY, scale: 0.5 };
  }

  // 3. Wider than viewport (typical 2x Figma export like 2880px on 1920px or 1440px screen)
  if (naturalWidth > viewportWidth) {
    if (naturalWidth / 2 <= viewportWidth) {
      return {
        x: calculateCenteredX(naturalWidth, 0.5, viewportWidth),
        y: baseY,
        scale: 0.5,
      };
    }
    return {
      x: 0,
      y: baseY,
      scale: calculateFitWidthScale(naturalWidth, viewportWidth),
    };
  }

  // 4. Narrower than viewport: 1x centered
  return {
    x: calculateCenteredX(naturalWidth, 1, viewportWidth),
    y: baseY,
    scale: 1,
  };
}

export function computeSnapToElementPlacement({
  naturalWidth,
  rect,
  scrollX,
  scrollY,
  followScroll,
}: {
  naturalWidth: number;
  rect: { left: number; top: number; width: number };
  scrollX: number;
  scrollY: number;
  followScroll: boolean;
}): { x: number; y: number; scale: number } {
  const x = Math.round(rect.left + (followScroll ? scrollX : 0));
  const y = Math.round(rect.top + (followScroll ? scrollY : 0));

  if (naturalWidth <= 0 || rect.width <= 0) {
    return { x, y, scale: 1 };
  }

  if (Math.abs(naturalWidth - rect.width) <= 6) {
    return { x, y, scale: 1 };
  }

  if (Math.abs(naturalWidth / 2 - rect.width) <= 6) {
    return { x, y, scale: 0.5 };
  }

  return {
    x,
    y,
    scale: calculateFitWidthScale(naturalWidth, rect.width),
  };
}
