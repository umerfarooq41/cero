import React, { useState, useEffect, useRef } from 'react';
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
  // Blues / Teals
  '#276FE4',
  '#16AAFE',
  '#5FCEF3',
  '#18D1C8',
  '#1B8989',
  '#2898BB',

  // Soft neutrals
  '#8CBC95',
  '#9CB3C7',
  '#6F979F',
  '#54887C',

  // Greens
  '#72AA00',
  '#38C17D',
  '#3BA40E',

  // Browns / Earth
  '#634E4A',
  '#A85539',
  '#A58F85',

  // Yellow / Orange
  '#EEB82D',
  '#FFB800',
  '#FF8B00',
  '#FF6D10',
  '#F84C00',

  // Reds
  '#FB2C2C',
  '#E40335',
  '#B1003B',

  // Pinks
  '#E98ABE',
  '#F39AB5',
  '#FA5C8C',
  '#E33BA3',

  // Purples
  '#B393EA',
  '#8C7EF0',
  '#6970ED',
  '#8845F5',
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'New Category'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-2xl app-card-surface-soft backdrop-blur-xl">
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
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            <Input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Groceries"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                    'py-2 px-2 rounded-lg text-xs font-medium transition-all capitalize',
                    type === item
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:bg-accent'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredParents.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Parent optional
              </label>

              <Select
                value={parentId || 'none'}
                onValueChange={(value) =>
                  setParentId(value === 'none' ? '' : value)
                }
              >
                <SelectTrigger>
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
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Color
            </label>

            <div className="grid grid-cols-10 gap-2 rounded-xl app-card-surface-soft p-2 backdrop-blur-xl">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={cn(
                    'app-color-swatch',
                    color === item
                      ? 'is-selected' : ''
                  )}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Icon
            </label>

            <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-2 max-h-52 overflow-y-auto p-2 rounded-xl app-card-surface-soft backdrop-blur-xl">
              {iconNames.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setIcon(item)}
                  className={cn(
                    'app-icon-choice', icon === item && 'is-selected'
                  )}
                  title={item}
                >
                  <CategoryIcon
                    icon={item}
                    color={icon === item ? color : '#888'}
                    size="sm"
                    bare
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 border-t border-border/50 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}