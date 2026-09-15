import { useState, FormEvent } from 'react';
import { theme } from '../../config/theme';
import { Button } from '../Button';

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

interface FAQFormProps {
  faq?: FAQ;
  onSubmit: (data: Partial<FAQ>) => Promise<void>;
  onCancel: () => void;
}

export function FAQForm({ faq, onSubmit, onCancel }: FAQFormProps) {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || '',
    order: faq?.order || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.question || !formData.answer) {
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
          Question <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <input
          type="text"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
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
          Réponse <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <textarea
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          rows={6}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg, marginBottom: theme.spacing.xl }}>
        <div>
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

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: theme.spacing.sm,
              ...theme.body.base,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Ordre d'affichage
          </label>
          <input
            type="number"
            min="0"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
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

      <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : faq ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
