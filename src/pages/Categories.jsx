import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Archive, ArrowLeft, FolderOpen, Plus } from 'lucide-react';
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
import { useAllCategories } from '@/hooks/useBudgetData';
import CategorySection from '@/components/categories/CategorySection';
import CategoryEditorModal from '@/components/categories/CategoryEditorModal';
import CategoryActionSheet from '@/components/categories/CategoryActionSheet';
import { GlassCard, PageHeader, SectionCard, TonePill } from '@/components/shared/Premium';

export default function Categories() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categories = [] } = useAllCategories();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [defaultType, setDefaultType] = useState('expense');

  const [actionTarget, setActionTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const isSettingsRoute = location.pathname.startsWith('/settings');

  const openNew = (type) => {
    setEditingCategory(null);
    setDefaultType(type);
    setEditorOpen(true);
  };

  const openAddSub = (parent) => {
    setEditingCategory({ type: parent.type, parent_id: parent.id, _preseed: true });
    setDefaultType(parent.type);
    setEditorOpen(true);
  };

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['all-categories'] });
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
      refreshCategories();
    } catch (error) {
      console.error('Category save failed:', error);
      toast.error(error.message || 'Could not save category');
    }
  };

  const handleArchive = async (category) => {
    try {
      await categoriesApi.update(category.id, { is_archived: !category.is_archived });
      refreshCategories();
      toast.success(category.is_archived ? 'Category restored' : 'Category archived');
    } catch (error) {
      console.error('Category archive failed:', error);
      toast.error(error.message || 'Could not update category');
    }
  };

  const handleDelete = async (category) => {
    try {
      await categoriesApi.delete(category.id);
      refreshCategories();
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 pt-4 pb-nav sm:px-6 sm:pt-5 lg:pt-6">
      <PageHeader
        title="Categories"
        description="Group your money by Income, Expenses, Savings, and Debt."
        icon={FolderOpen}
        actions={
          <div className="flex items-center gap-2">
            {isSettingsRoute && (
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl" onClick={() => navigate('/settings')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {archivedCategories.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchived((value) => !value)}
                className="rounded-2xl"
              >
                <Archive className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{showArchived ? 'Hide archived' : 'Archived'}</span>
                <span>{archivedCategories.length}</span>
              </Button>
            )}
          </div>
        }
      />

      <GlassCard tone="analytics" className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <TonePill tone="income">Income</TonePill>
          <TonePill tone="expense">Expenses</TonePill>
          <TonePill tone="savings">Savings</TonePill>
          <TonePill tone="debt">Debt</TonePill>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Categories stay connected to transactions and budget allocations, so archiving is usually safer than deleting.
        </p>
      </GlassCard>

      <div className="space-y-4">
        <CategorySection
          type="income"
          label="Income"
          categories={activeCategories}
          defaultExpanded
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />
        <CategorySection
          type="expense"
          label="Expenses"
          categories={activeCategories}
          defaultExpanded
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />
        <CategorySection
          type="savings"
          label="Savings"
          categories={activeCategories}
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />
        <CategorySection
          type="debt"
          label="Debt"
          categories={activeCategories}
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />

        {showArchived && archivedCategories.length > 0 && (
          <SectionCard title="Archived" icon={Archive} tone="default" bodyClassName="p-2">
            <div className="space-y-1">
              {archivedCategories.map((category) => (
                <div key={category.id} className="group flex items-center gap-3 rounded-2xl px-3 py-3 opacity-80 transition hover:bg-foreground/[0.04] dark:hover:bg-secondary/70">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${category.color || '#888'}18` }}
                  >
                    <span className="text-xs font-semibold text-muted-foreground">{category.name?.[0]}</span>
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground line-through">
                    {category.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleArchive(category)}
                    className="rounded-xl px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(category)}
                    className="rounded-xl px-2 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <Button
        onClick={() => openNew('expense')}
        className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-2xl p-0 shadow-md sm:bottom-28 sm:right-8"
        size="icon"
        aria-label="Add category"
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
            ? { ...editingCategory, name: '', icon: 'tag', color: '#0078D4' }
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
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent. Any transactions or budget allocations linked to this category will lose their category reference.
              Consider archiving instead to preserve historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                handleArchive(deleteTarget);
                setDeleteTarget(null);
              }}
              className="rounded-2xl"
            >
              <Archive className="h-3.5 w-3.5" />
              Archive Instead
            </Button>
            <AlertDialogAction
              onClick={() => handleDelete(deleteTarget)}
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
