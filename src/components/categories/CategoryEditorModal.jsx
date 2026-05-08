import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { iconNames } from '@/components/shared/CategoryIcon';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

const COLORS = [
  '#0078D4',
  '#107C10',
  '#C50F1F',
  '#8764B8',
  '#CA5010',
  '#008272',
  '#4F6BED',
  '#69797E',
  '#D83B01',
  '#E3008C',
  '#00B294',
  '#FFB900',
  '#744DA9',
  '#038387',
  '#0099BC',
  '#E83E8C',
  '#00B7C3',
  '#5C2D91',
  '#498205',
  '#A80000',
  '#2D7D9A',
  '#6B7280',
  '#111827',
  '#16A34A',
  '#EA580C',
  '#9333EA',
  '#DB2777',
  '#0891B2',
  '#65A30D',
  '#F59E0B',
];

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export default function CategoryEditorModal({
  open,
  onClose,
  onSave,
  parentCategories = [],
  initialType = 'expense',
  editingCategory = null,
}) {
  const nameRef = useRef(null);

  const [name, setName] = useState('');
  const [type, setType] = useState(initialType);
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState(COLORS[0]);
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingCategory;

  useEffect(() => {
    if (!open) return;

    if (editingCategory) {
      setName(editingCategory.name || '');
      setType(editingCategory.type || initialType);
      setIcon(editingCategory.icon || 'tag');
      setColor(editingCategory.color || COLORS[0]);
      setParentId(editingCategory.parent_id || '');
    } else {
      setName('');
      setType(initialType);
      setIcon('tag');
      setColor(randomColor());
      setParentId('');
    }

    setTimeout(() => nameRef.current?.focus(), 80);
  }, [open, editingCategory, initialType]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);

    try {
      await onSave(
        {
          name: name.trim(),
          type,
          icon,
          color,
          parent_id: parentId && parentId !== 'none' ? parentId : undefined,
        },
        editingCategory?.id
      );

      onClose();
    } finally {
      setSaving(false);
    }
  };

  const filteredParents = parentCategories.filter(
    (category) =>
      category.type === type &&
      !category.parent_id &&
      category.id !== editingCategory?.id
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'New Category'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-secondary/50 p-3">
          <CategoryIcon icon={icon} color={color} size="lg" />

          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {name.trim() || 'Category Name'}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {type}
            </div>
          </div>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Name
            </label>
            <Input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              className="h-11 rounded-2xl bg-secondary/60"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Type
            </label>

            <div className="grid grid-cols-4 gap-1.5">
              {['income', 'expense', 'savings', 'debt'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setType(item);
                    setParentId('');
                  }}
                  className={cn(
                    'rounded-2xl px-2 py-2.5 text-xs font-semibold capitalize transition-all',
                    type === item
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/70 text-muted-foreground hover:bg-accent'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredParents.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Parent optional
              </label>

              <Select
                value={parentId || 'none'}
                onValueChange={(value) =>
                  setParentId(value === 'none' ? '' : value)
                }
              >
                <SelectTrigger className="h-11 rounded-2xl bg-secondary/60">
                  <SelectValue placeholder="None top-level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None top-level</SelectItem>
                  {filteredParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Color
            </label>

            <div className="grid grid-cols-10 gap-2 rounded-2xl border border-border/70 bg-secondary/40 p-2">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={cn(
                    'h-7 w-7 rounded-xl border border-border transition-all',
                    color === item
                      ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Icon
            </label>

            <div className="grid max-h-52 grid-cols-6 gap-2 overflow-y-auto rounded-2xl border border-border/70 bg-secondary/40 p-2 sm:grid-cols-7 md:grid-cols-8">
              {iconNames.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setIcon(item)}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-2xl border transition-all',
                    icon === item
                      ? 'bg-primary/10 border-primary ring-1 ring-primary scale-105'
                      : 'border-transparent hover:bg-accent hover:border-border'
                  )}
                  title={item}
                >
                  <CategoryIcon
                    icon={item}
                    color={icon === item ? color : '#888'}
                    size="sm"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} className="rounded-2xl">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="rounded-2xl">
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
