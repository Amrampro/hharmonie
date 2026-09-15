import { useState, FormEvent } from 'react';
import { theme } from '../../config/theme';
import { Button } from '../Button';
import { Product } from '../../lib/supabase';

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    image_url: product?.image_url || '',
    category: product?.category || '',
    stock: product?.stock || 0,
    featured: product?.featured ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.description || formData.price <= 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.status.error + '15',
            color: theme.colors.status.error,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.lg,
            ...theme.body.base,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            ...theme.body.base,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          Nom du produit <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.light}`,
            ...theme.body.base,
          }}
          required
        />
      </div>

      <div style={{ marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            ...theme.body.base,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          Description <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.light}`,
            ...theme.body.base,
            resize: 'vertical',
          }}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: theme.spacing.sm,
              ...theme.body.base,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Prix (€) <span style={{ color: theme.colors.status.error }}>*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.light}`,
              ...theme.body.base,
            }}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: theme.spacing.sm,
              ...theme.body.base,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Stock
          </label>
          <input
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.light}`,
              ...theme.body.base,
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            ...theme.body.base,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          Catégorie
        </label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.light}`,
            ...theme.body.base,
          }}
        />
      </div>

      <div style={{ marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            ...theme.body.base,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          URL de l'image
        </label>
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.light}`,
            ...theme.body.base,
          }}
          placeholder="https://..."
        />
      </div>

      <div style={{ marginBottom: theme.spacing.xl }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            cursor: 'pointer',
            ...theme.body.base,
          }}
        >
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Produit en vedette
        </label>
      </div>

      <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : product ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
