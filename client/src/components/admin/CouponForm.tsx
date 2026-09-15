import { useState, FormEvent } from 'react';
import { theme } from '../../config/theme';
import { Button } from '../Button';

interface Coupon {
  id?: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount?: number;
  max_uses?: number;
  valid_until: string;
  active: boolean;
}

interface CouponFormProps {
  coupon?: Coupon;
  onSubmit: (data: Partial<Coupon>) => Promise<void>;
  onCancel: () => void;
}

export function CouponForm({ coupon, onSubmit, onCancel }: CouponFormProps) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discount_type: coupon?.discount_type || 'percentage' as 'percentage' | 'fixed',
    discount_value: coupon?.discount_value || 0,
    min_purchase_amount: coupon?.min_purchase_amount || 0,
    max_uses: coupon?.max_uses || null,
    valid_until: coupon?.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : '',
    active: coupon?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code || !formData.discount_value || !formData.valid_until) {
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

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code });
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
          Code du coupon <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            style={{
              flex: 1,
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.light}`,
              ...theme.body.base,
            }}
            required
          />
          <Button type="button" variant="secondary" onClick={generateCode}>
            Générer
          </Button>
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
          Type de réduction <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <select
          value={formData.discount_type}
          onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.light}`,
            ...theme.body.base,
            backgroundColor: theme.colors.background.primary,
          }}
          required
        >
          <option value="percentage">Pourcentage (%)</option>
          <option value="fixed">Montant fixe (€)</option>
        </select>
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
          Valeur de la réduction <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max={formData.discount_type === 'percentage' ? 100 : undefined}
          value={formData.discount_value}
          onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.light}`,
            ...theme.body.base,
          }}
          required
        />
        {formData.discount_type === 'percentage' && (
          <p style={{ ...theme.body.small, color: theme.colors.text.secondary, marginTop: theme.spacing.xs }}>
            Maximum 100%
          </p>
        )}
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
            Montant minimum d'achat (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.min_purchase_amount}
            onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.light}`,
              ...theme.body.base,
            }}
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
            Nombre d'utilisations max
          </label>
          <input
            type="number"
            min="1"
            value={formData.max_uses || ''}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border.light}`,
              ...theme.body.base,
            }}
            placeholder="Illimité"
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
          Valide jusqu'au <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <input
          type="date"
          value={formData.valid_until}
          onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
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
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Actif
        </label>
      </div>

      <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : coupon ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
