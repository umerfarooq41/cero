import { useState } from 'react';
import { Plus, Archive } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';

import { useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/budgetData';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useCategories } from '@/hooks/useBudgetData';
import CategorySection from '@/components/categories/CategorySection';
import CategoryEditorModal from '@/components/categories/CategoryEditorModal';
import CategoryActionSheet from '@/components/categories/CategoryActionSheet';
import { usePageEntrance } from '@/hooks/usePageTransition';

export default function Categories() {
  const scope = usePageEntrance();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [defaultType, setDefaultType] = useState('expense');

  const [actionTarget, setActionTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const openNew = (type) => {
    setEditingCategory(null);
    setDefaultType(type);
    setEditorOpen(true);
  };

  const openAddSub = (parent) => {
    setEditingCategory({
      type: parent.type,
      parent_id: parent.id,
      _preseed: true,
    });

    setDefaultType(parent.type);
    setEditorOpen(true);
  };

  const handleSave = async (data, existingId) => {
    try {
      if (existingId) {
        await categoriesApi.update(existingId, data);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(data);
        toast.success('Category created');
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      console.error('Category save failed:', error);
      toast.error(error.message || 'Could not save category');
    }
  };

  const handleArchive = async (cat) => {
    try {
      await categoriesApi.update(cat.id, {
        is_archived: !cat.is_archived,
      });

      queryClient.invalidateQueries({ queryKey: ['categories'] });

      toast.success(cat.is_archived ? 'Category restored' : 'Category archived');
    } catch (error) {
      console.error('Category archive failed:', error);
      toast.error(error.message || 'Could not update category');
    }
  };

  const handleDelete = async (cat) => {
    try {
      await categoriesApi.delete(cat.id);

      queryClient.invalidateQueries({ queryKey: ['categories'] });

      setDeleteTarget(null);

      toast.success('Category deleted');
    } catch (error) {
      console.error('Category delete failed:', error);
      toast.error(error.message || 'Could not delete category');
    }
  };

  const activeCategories = categories.filter((c) => !c.is_archived);
  const archivedCategories = categories.filter((c) => c.is_archived);

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        className="animate-child"
        title="Categories"
        subtitle="Organize income, expenses, savings, and debt"
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 lg:py-8">
        {archivedCategories.length > 0 && (
          <div className="mb-4 flex justify-end animate-child">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((p) => !p)}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived
                ? 'Hide archived'
                : `Archived (${archivedCategories.length})`}
            </Button>
          </div>
        )}

        <div className="animate-child space-y-4">
          <CategorySection
            type="income"
            label="Income"
            categories={activeCategories}
            defaultExpanded={true}
            onAction={setActionTarget}
            onAddSub={openAddSub}
            onAddNew={openNew}
          />

          <CategorySection
            type="expense"
            label="Expenses"
            categories={activeCategories}
            defaultExpanded={true}
            onAction={setActionTarget}
            onAddSub={openAddSub}
            onAddNew={openNew}
          />

          <CategorySection
            type="savings"
            label="Savings"
            categories={activeCategories}
            defaultExpanded={false}
            onAction={setActionTarget}
            onAddSub={openAddSub}
            onAddNew={openNew}
          />

          <CategorySection
            type="debt"
            label="Debt"
            categories={activeCategories}
            defaultExpanded={false}
            onAction={setActionTarget}
            onAddSub={openAddSub}
            onAddNew={openNew}
          />

          {showArchived && archivedCategories.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm opacity-75">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                <Archive className="h-3.5 w-3.5 text-muted-foreground" />

                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Archived
                </h3>
              </div>

              <div className="divide-y divide-border/50">
                {archivedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="group flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-xl opacity-50"
                      style={{
                        backgroundColor: `${cat.color || '#888'}18`,
                      }}
                    >
                      <span className="text-xs text-muted-foreground">
                        {cat.name?.[0]}
                      </span>
                    </div>

                    <span className="flex-1 text-sm text-muted-foreground line-through">
                      {cat.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleArchive(cat)}
                      className="rounded px-2 py-1 text-xs font-medium text-primary opacity-0 transition-all hover:bg-primary/10 group-hover:opacity-100"
                    >
                      Restore
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(cat)}
                      className="rounded px-2 py-1 text-xs font-medium text-destructive opacity-0 transition-all hover:bg-destructive/10 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => openNew('expense')}
          className="animate-child fixed bottom-24 right-5 z-50 h-14 w-14 rounded-2xl p-0 shadow-lg shadow-primary/25 lg:bottom-6"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>

        <CategoryEditorModal
          open={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSave}
          parentCategories={activeCategories}
          initialType={editingCategory?._preseed ? editingCategory.type : defaultType}
          editingCategory={
            editingCategory?._preseed
              ? {
                  ...editingCategory,
                  name: '',
                  icon: 'tag',
                  color: '#0078D4',
                }
              : editingCategory
          }
        />

        <CategoryActionSheet
          category={actionTarget}
          open={!!actionTarget}
          onClose={() => setActionTarget(null)}
          onEdit={(cat) => {
            setEditingCategory(cat);
            setDefaultType(cat.type);
            setEditorOpen(true);
          }}
          onArchive={handleArchive}
          onDelete={(cat) => setDeleteTarget(cat)}
        />

        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete "{deleteTarget?.name}"?
              </AlertDialogTitle>

              <AlertDialogDescription>
                This is permanent. Any transactions or budget allocations linked
                to this category will lose their category reference. Consider
                archiving instead to preserve historical data.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>

              <Button
                variant="outline"
                onClick={() => {
                  handleArchive(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="gap-1.5"
              >
                <Archive className="h-3.5 w-3.5" />
                Archive Instead
              </Button>

              <AlertDialogAction
                onClick={() => handleDelete(deleteTarget)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}