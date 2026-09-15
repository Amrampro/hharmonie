import { useState, FormEvent } from 'react';
import { theme } from '../../config/theme';
import { Button } from '../Button';
import { BlogPost } from '../../lib/supabase';

interface BlogFormProps {
  blog?: BlogPost;
  onSubmit: (data: Partial<BlogPost>) => Promise<void>;
  onCancel: () => void;
}

export function BlogForm({ blog, onSubmit, onCancel }: BlogFormProps) {
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    slug: blog?.slug || '',
    excerpt: blog?.excerpt || '',
    content: blog?.content || '',
    author: blog?.author || '',
    image_url: blog?.image_url || '',
    published: blog?.published ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.slug || !formData.content || !formData.author) {
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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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
          Titre <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => {
            setFormData({
              ...formData,
              title: e.target.value,
              slug: formData.slug || generateSlug(e.target.value),
            });
          }}
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
          Slug <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
          Auteur <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
          Extrait
        </label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          rows={3}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border.light}`,
            ...theme.body.base,
            resize: 'vertical',
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
          Contenu <span style={{ color: theme.colors.status.error }}>*</span>
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={10}
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
            checked={formData.published}
            onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Publié
        </label>
      </div>

      <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : blog ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
