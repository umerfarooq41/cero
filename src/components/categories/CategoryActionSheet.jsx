import React from 'react';
import { Pencil, Archive, Trash2, ArchiveRestore } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CategoryIcon from '@/components/shared/CategoryIcon';

export default function CategoryActionSheet({ category, open, onClose, onEdit, onArchive, onDelete }) {
  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <CategoryIcon icon={category.icon} color={category.color} size="md" />
            <div>
              <DialogTitle className="text-base">{category.name}</DialogTitle>
              {category.parent_id && (
                <p className="text-xs text-muted-foreground mt-0.5">Subcategory</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1 py-1">
          <button
            onClick={() => { onEdit(category); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Edit Category</span>
          </button>

          <button
            onClick={() => { onArchive(category); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
          >
            {category.is_archived
              ? <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
              : <Archive className="w-4 h-4 text-muted-foreground" />
            }
            <span className="text-sm font-medium">
              {category.is_archived ? 'Unarchive' : 'Archive Category'}
            </span>
          </button>

          <button
            onClick={() => { onDelete(category); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Delete Category</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}