'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Archive, Trash2, X, CheckCircle2 } from 'lucide-react';
import { adminService, type AdminCategoryItem } from '@/services/admin.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    description: '',
    isActive: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function handleOpenCreate() {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      icon: '🏔️',
      description: '',
      isActive: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat: AdminCategoryItem) {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '',
      description: cat.description || '',
      isActive: cat.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, {
          name: formData.name,
          icon: formData.icon,
          description: formData.description,
          isActive: formData.isActive,
        });
      } else {
        await adminService.createCategory({
          name: formData.name,
          slug: formData.slug || undefined,
          icon: formData.icon || undefined,
          description: formData.description || undefined,
        });
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleArchiveOrDelete(cat: AdminCategoryItem) {
    const isReferenced = cat.packagesCount > 0;
    const confirmMessage = isReferenced
      ? `Category "${cat.name}" is referenced by ${cat.packagesCount} package(s). It cannot be permanently deleted. Archive/deactivate it instead?`
      : `Are you sure you want to permanently delete category "${cat.name}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const result = await adminService.archiveOrDeleteCategory(cat.id);
      alert(result.message || 'Operation successful.');
      await loadCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-700" /> Travel Categories & Taxonomy
          </h1>
          <p className="text-xs text-slate-500">
            Configure marketplace categories, enforce slug constraints, and manage referential integrity.
          </p>
        </div>
        <Button variant="accent" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
          Add Category
        </Button>
      </div>

      {/* Grid of Categories */}
      {loading ? (
        <LoadingState label="Loading travel categories..." />
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Categories Configured</h3>
          <p className="text-xs text-slate-500 mt-1">Click &ldquo;Add Category&rdquo; above to create your first taxonomy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm space-y-3 transition-all ${
                cat.isActive ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {cat.icon || '🏷️'}
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      {cat.name}
                      {!cat.isActive && <Badge variant="neutral" size="sm">ARCHIVED</Badge>}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">/{cat.slug}</p>
                  </div>
                </div>
                <Badge variant={cat.packagesCount > 0 ? 'brand' : 'neutral'}>
                  {cat.packagesCount} Packages
                </Badge>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-600 line-clamp-2">{cat.description}</p>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[10px] text-slate-400 font-medium">
                  Status: {cat.isActive ? 'Active in search' : 'Hidden from public'}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenEdit(cat)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                    leftIcon={cat.packagesCount > 0 ? <Archive className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => handleArchiveOrDelete(cat)}
                  >
                    {cat.packagesCount > 0 ? 'Archive' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Travel Category' : 'Create New Category'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure taxonomy parameters and search filter visibility.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hill Stations & Treks"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. hill-stations (auto-generated if empty)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Icon Emoji or Short Text</label>
                <input
                  type="text"
                  placeholder="e.g. 🏔️ or 🏖️"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary shown on category exploration cards..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm"
                />
              </div>

              {editingCategory && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="isActiveCheckbox" className="font-semibold text-slate-700">
                    Category is Active (Visible on marketplace navigation)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
