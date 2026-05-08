import { useState } from 'react';
import { Plus, Archive } from 'lucide-react';
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

export default function Categories() {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [defaultType, setDefaultType] = useState('expense');

  const [actionTarget, setActionTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // Open creator for a specific type
  const openNew = (type) => {
    setEditingCategory(null);
    setDefaultType(type);
    setEditorOpen(true);
  };

  // Open creator pre-set with a parent
  const openAddSub = (parent) => {
    setEditingCategory({ type: parent.type, parent_id: parent.id, _preseed: true });
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
      await categoriesApi.update(cat.id, { is_archived: !cat.is_archived });
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

  const activeCategories = categories.filter(c => !c.is_archived);
  const archivedCategories = categories.filter(c => c.is_archived);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28 lg:py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build your budget structure</p>
        </div>
        {archivedCategories.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(p => !p)}
            className="gap-1.5 text-muted-foreground text-xs"
          >
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? 'Hide archived' : `Archived (${archivedCategories.length})`}
          </Button>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <CategorySection
          type="income" label="Income"
          categories={activeCategories}
          defaultExpanded={true}
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />
        <CategorySection
          type="expense" label="Expenses"
          categories={activeCategories}
          defaultExpanded={true}
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />
        <CategorySection
          type="savings" label="Savings"
          categories={activeCategories}
          defaultExpanded={false}
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />
        <CategorySection
          type="debt" label="Debt"
          categories={activeCategories}
          defaultExpanded={false}
          onAction={setActionTarget}
          onAddSub={openAddSub}
          onAddNew={openNew}
        />

        {/* Archived section */}
        {showArchived && archivedCategories.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden opacity-75">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Archived</h3>
            </div>
            <div className="divide-y divide-border/50">
              {archivedCategories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center opacity-50"
                    style={{ backgroundColor: (cat.color || '#888') + '18' }}>
                    <span className="text-xs text-muted-foreground">{cat.name?.[0]}</span>
                  </div>
                  <span className="text-sm text-muted-foreground flex-1 line-through">{cat.name}</span>
                  <button
                    onClick={() => handleArchive(cat)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-primary font-medium px-2 py-1 rounded hover:bg-primary/10 transition-all"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-destructive font-medium px-2 py-1 rounded hover:bg-destructive/10 transition-all"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <Button
        onClick={() => openNew('expense')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-lg shadow-primary/25 p-0"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Editor Modal */}
      <CategoryEditorModal
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingCategory(null); }}
        onSave={handleSave}
        parentCategories={activeCategories}
        initialType={editingCategory?._preseed ? editingCategory.type : defaultType}
        editingCategory={editingCategory?._preseed ? { ...editingCategory, name: '', icon: 'tag', color: '#0078D4' } : editingCategory}
      />

      {/* Action Sheet */}
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent. Any transactions or budget allocations linked to this category will lose their category reference.
              Consider archiving instead to preserve historical data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => { handleArchive(deleteTarget); setDeleteTarget(null); }}
              className="gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
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
