import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { theme } from '../config/theme';
import { ProductImage } from '../lib/types';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  isNew?: boolean;
}

export function ProductImageGallery({ images, productName, isNew }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.text.light,
          fontFamily: theme.typography.fontFamily.body,
        }}
      >
        Pas d'image
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: theme.spacing.md,
        }}
      >
        {isNew && (
          <span
            style={{
              position: 'absolute',
              top: theme.spacing.md,
              left: theme.spacing.md,
              backgroundColor: theme.colors.primary.main,
              color: theme.colors.text.inverse,
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: theme.typography.fontFamily.body,
              zIndex: 10,
            }}
          >
            Nouveau
          </span>
        )}

        <img
          src={images[selectedImageIndex].image_url}
          alt={images[selectedImageIndex].alt_text || productName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              style={{
                position: 'absolute',
                left: theme.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: theme.borderRadius.full,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: theme.shadow.md,
                transition: theme.transition.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              }}
              aria-label="Image précédente"
            >
              <ChevronLeft size={24} color={theme.colors.text.primary} />
            </button>

            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: theme.spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: theme.borderRadius.full,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: theme.shadow.md,
                transition: theme.transition.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              }}
              aria-label="Image suivante"
            >
              <ChevronRight size={24} color={theme.colors.text.primary} />
            </button>

            <div
              style={{
                position: 'absolute',
                bottom: theme.spacing.md,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: theme.spacing.xs,
              }}
            >
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  style={{
                    width: selectedImageIndex === index ? 24 : 8,
                    height: 8,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor:
                      selectedImageIndex === index
                        ? theme.colors.primary.main
                        : 'rgba(255, 255, 255, 0.7)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: theme.transition.fast,
                  }}
                  aria-label={`Voir image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(80px, 1fr))`,
            gap: theme.spacing.sm,
          }}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              style={{
                aspectRatio: '1',
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.md,
                overflow: 'hidden',
                border: `2px solid ${
                  selectedImageIndex === index ? theme.colors.primary.main : theme.colors.border.light
                }`,
                cursor: 'pointer',
                padding: 0,
                transition: theme.transition.fast,
              }}
              onMouseEnter={(e) => {
                if (selectedImageIndex !== index) {
                  e.currentTarget.style.borderColor = theme.colors.primary.light;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedImageIndex !== index) {
                  e.currentTarget.style.borderColor = theme.colors.border.light;
                }
              }}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${productName} - Image ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
