import { useState } from 'react';
import { Archive, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import CategoryActionSheet from '@/components/categories/CategoryActionSheet';
import CategoryEditorModal from '@/components/categories/CategoryEditorModal';
import CategorySection from '@/components/categories/CategorySection';
import { Button } from '@/components/ui/button';
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
import { categoriesApi } from '@/lib/budgetData';
import { useCategories } from '@/hooks/useBudgetData';

export default function ManageCategoriesPanel() {
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

  const handleArchive = async (category) => {
    try {
      await categoriesApi.update(category.id, {
        is_archived: !category.is_archived,
      });

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(category.is_archived ? 'Category restored' : 'Category archived');
    } catch (error) {
      console.error('Category archive failed:', error);
      toast.error(error.message || 'Could not update category');
    }
  };

  const handleDelete = async (category) => {
    try {
      await categoriesApi.delete(category.id);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
      toast.success('Category deleted');
    } catch (error) {
      console.error('Category delete failed:', error);
      toast.error(error.message || 'Could not delete category');
    }
  };

  const activeCategories = categories.filter((category) => !category.is_archived);
  const archivedCategories = categories.filter((category) => category.is_archived);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Budget structure</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage income, expense, savings, and debt categories. Planned amounts belong in Monthly Plan.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {archivedCategories.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowArchived((value) => !value)}
              className="gap-1.5 rounded-xl text-xs text-muted-foreground"
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? 'Hide archived' : `Archived (${archivedCategories.length})`}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => openNew('expense')}
            className="gap-2 rounded-xl text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="space-y-4">
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
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl opacity-75">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Archived
              </h3>
            </div>

            <div className="divide-y divide-border/50">
              {archivedCategories.map((category) => (
                <div key={category.id} className="group flex items-center gap-3 px-4 py-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl opacity-50"
                    style={{ backgroundColor: `${category.color || '#888'}18` }}
                  >
                    <span className="text-xs text-muted-foreground">
                      {category.name?.[0]}
                    </span>
                  </div>

                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through">
                    {category.name}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleArchive(category)}
                    className="rounded px-2 py-1 text-xs font-medium text-primary opacity-0 transition-all hover:bg-primary/10 group-hover:opacity-100"
                  >
                    Restore
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(category)}
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
        onEdit={(category) => {
          setEditingCategory(category);
          setDefaultType(category.type);
          setEditorOpen(true);
        }}
        onArchive={handleArchive}
        onDelete={(category) => setDeleteTarget(category)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent. Any transactions or budget allocations linked to this category will lose their category reference. Consider archiving instead to preserve historical data.
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
    </div>
  );
}
