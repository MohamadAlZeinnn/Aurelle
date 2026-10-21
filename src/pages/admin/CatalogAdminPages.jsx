import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2, FolderTree, Tags } from 'lucide-react';
import { AdminPageHeader, AdminTable, Thumb } from '../../components/admin/AdminUi.jsx';
import { Badge, Button, Checkbox, ConfirmDialog, EmptyState, Field, Input, Modal, Notice, Select, Textarea } from '../../components/ui/index.js';
import { adminService } from '../../services/index.js';
import { categorySchema, couponSchema } from '../../lib/adminValidation.js';
import { slugify, formatDate } from '../../lib/format.js';
import { formatPrice } from '../../lib/money.js';
import { toast } from '../../stores/uiStores.js';

function useCrud(key, { create, update, remove }, labels) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: [key === 'categories' ? 'categories' : 'cart-quote'] });
  };
  return {
    save: async (item, values) => {
      const result = item ? await update(item.id, values) : await create(values);
      invalidate();
      toast.success(item ? `${labels.one} updated` : `${labels.one} created`);
      return result;
    },
    remove: useMutation({
      mutationFn: (id) => remove(id),
      onSuccess: () => {
        invalidate();
        toast.success(`${labels.one} deleted`);
      },
      onError: (e) => toast.error(`Could not delete ${labels.one.toLowerCase()}`, { description: e.message }),
    }),
  };
}

// ───────────────────────────── Categories
function CategoryForm({ category, onClose, save }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: category ?? { name: '', slug: '', tagline: '', image: '', sortOrder: 10, isActive: true, subcategories: [] },
  });
  const subs = useFieldArray({ control, name: 'subcategories', keyName: '_key' });
  const [name, slug] = useWatch({ control, name: ['name', 'slug'] });
  const onSubmit = async (values) => {
    try {
      await save(category, values);
      onClose();
    } catch (e) {
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setError(k, { message }));
      setError('root', { message: e.message });
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 px-5 py-6 sm:px-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <Input {...register('name', { onBlur: () => !category && !dirtyFields.slug && setValue('slug', slugify(name || '')) })} />
        </Field>
        <Field label="URL handle" hint={`/shop/${slug || '…'}`} error={errors.slug?.message}>
          <Input {...register('slug')} />
        </Field>
        <Field label="Tagline" optional error={errors.tagline?.message} className="sm:col-span-2">
          <Textarea rows={2} {...register('tagline')} />
        </Field>
        <Field label="Image URL" optional error={errors.image?.message}>
          <Input {...register('image')} />
        </Field>
        <Field label="Sort order" error={errors.sortOrder?.message}>
          <Input type="number" min="0" {...register('sortOrder')} />
        </Field>
      </div>
      <Checkbox label="Visible in the shop" {...register('isActive')} />
      <fieldset>
        <legend className="field-label">Subcategories</legend>
        <div className="space-y-2">
          {subs.fields.map((f, i) => (
            <div key={f._key} className="flex gap-2">
              <Input aria-label="Subcategory name" placeholder="Name" {...register(`subcategories.${i}.name`, { onBlur: (e) => !f.id && setValue(`subcategories.${i}.slug`, slugify(e.target.value)) })} />
              <Input aria-label="Subcategory handle" placeholder="handle" {...register(`subcategories.${i}.slug`)} aria-invalid={errors.subcategories?.[i]?.slug ? 'true' : undefined} />
              <button type="button" onClick={() => subs.remove(i)} className="icon-btn text-rosewood" aria-label="Remove subcategory">
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          ))}
          <Button variant="quiet" size="sm" onClick={() => subs.append({ name: '', slug: '' })}>
            <Plus aria-hidden className="h-3.5 w-3.5" /> Add subcategory
          </Button>
        </div>
      </fieldset>
      {errors.root && <Notice tone="error">{errors.root.message}</Notice>}
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="quiet" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save category
        </Button>
      </div>
    </form>
  );
}

export function CategoriesPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminService.categories });
  const crud = useCrud('categories', { create: adminService.createCategory, update: adminService.updateCategory, remove: adminService.deleteCategory }, { one: 'Category' });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Organise the catalogue and storefront navigation."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden className="h-4 w-4" /> Add category
          </Button>
        }
      />
      <AdminTable
        loading={isLoading}
        error={error}
        onRetry={refetch}
        rows={data}
        caption="Categories"
        empty={<EmptyState compact icon={FolderTree} title="No categories yet" />}
        columns={[
          {
            key: 'n',
            header: 'Category',
            cell: (c) => (
              <div className="flex items-center gap-3">
                <Thumb src={c.image} size={32} />
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-[12px] text-taupe">/shop/{c.slug}</p>
                </div>
              </div>
            ),
          },
          { key: 's', header: 'Subcategories', cell: (c) => <span className="text-espresso-soft">{c.subcategories.map((s) => s.name).join(', ') || '—'}</span> },
          { key: 'p', header: 'Products', align: 'right', cell: (c) => c.productCount },
          { key: 'o', header: 'Order', align: 'right', cell: (c) => c.sortOrder, hideOnCard: true },
          { key: 'v', header: 'Status', cell: (c) => <Badge tone={c.isActive ? 'sage' : 'neutral'}>{c.isActive ? 'Visible' : 'Hidden'}</Badge> },
          {
            key: 'a',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (c) => (
              <div className="flex justify-end gap-0.5">
                <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button type="button" className="icon-btn h-8 w-8 text-rosewood" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ),
          },
        ]}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New category' : 'Edit category'} size="lg">
        {editing && <CategoryForm category={editing === 'new' ? null : editing} onClose={() => setEditing(null)} save={crud.save} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="Categories that still contain products cannot be deleted. Move their products first, or hide the category instead."
        confirmLabel="Delete category"
        loading={crud.remove.isPending}
        onConfirm={() => crud.remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  );
}

// ───────────────────────────── Coupons
// Coupon validity is stored as whole calendar days (UTC boundaries) and shown the same way.
const toLocalDate = (iso) => (iso ? iso.slice(0, 10) : '');
const couponStatus = (c) => {
  const now = Date.now();
  if (!c.isActive) return ['Inactive', 'neutral'];
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return ['Expired', 'neutral'];
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return ['Scheduled', 'slate'];
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return ['Limit reached', 'amber'];
  return ['Active', 'sage'];
};
const describeCoupon = (c) => (c.type === 'percent' ? `${c.value}% off` : c.type === 'fixed' ? `${formatPrice(c.value)} off` : 'Free delivery');

function CouponForm({ coupon, onClose, save, categories }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: coupon
      ? { ...coupon, startsAt: toLocalDate(coupon.startsAt), endsAt: toLocalDate(coupon.endsAt), maxDiscount: coupon.maxDiscount ?? '', usageLimit: coupon.usageLimit ?? '', perCustomerLimit: coupon.perCustomerLimit ?? '' }
      : { code: '', description: '', type: 'percent', value: 10, minSubtotal: 0, maxDiscount: '', categoryIds: [], startsAt: toLocalDate(new Date().toISOString()), endsAt: '', usageLimit: '', perCustomerLimit: 1, isActive: true },
  });
  const type = useWatch({ control, name: 'type' });
  const onSubmit = async (values) => {
    try {
      await save(coupon, { ...values, startsAt: `${values.startsAt}T00:00:00.000Z`, endsAt: `${values.endsAt}T23:59:59.000Z` });
      onClose();
    } catch (e) {
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setError(k, { message }));
      setError('root', { message: e.message });
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 px-5 py-6 sm:px-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" error={errors.code?.message}>
          <Input className="uppercase tracking-[0.08em]" {...register('code')} />
        </Field>
        <Field label="Type" error={errors.type?.message}>
          <Select {...register('type')}>
            <option value="percent">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
            <option value="free_shipping">Free delivery</option>
          </Select>
        </Field>
        {type !== 'free_shipping' && (
          <Field label={type === 'percent' ? 'Percent' : 'Amount (USD)'} error={errors.value?.message}>
            <Input type="number" min="0" step={type === 'percent' ? '1' : '0.01'} {...register('value')} />
          </Field>
        )}
        {type === 'percent' && (
          <Field label="Maximum discount (USD)" optional error={errors.maxDiscount?.message}>
            <Input type="number" min="0" step="0.01" {...register('maxDiscount')} />
          </Field>
        )}
        <Field label="Minimum subtotal (USD)" error={errors.minSubtotal?.message}>
          <Input type="number" min="0" step="0.01" {...register('minSubtotal')} />
        </Field>
        <Field label="Customer-facing description" optional error={errors.description?.message}>
          <Input {...register('description')} placeholder="e.g. 10% off your order." />
        </Field>
        <Field label="Starts" error={errors.startsAt?.message}>
          <Input type="date" {...register('startsAt')} />
        </Field>
        <Field label="Ends" error={errors.endsAt?.message}>
          <Input type="date" {...register('endsAt')} />
        </Field>
        <Field label="Total uses allowed" optional hint="Leave empty for unlimited." error={errors.usageLimit?.message}>
          <Input type="number" min="1" {...register('usageLimit')} />
        </Field>
        <Field label="Uses per customer" optional hint="Matched by email or phone." error={errors.perCustomerLimit?.message}>
          <Input type="number" min="1" {...register('perCustomerLimit')} />
        </Field>
      </div>
      <fieldset>
        <legend className="field-label">Limit to categories (optional)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <Checkbox key={c.id} label={c.name} value={c.id} {...register('categoryIds')} />
          ))}
        </div>
      </fieldset>
      <Checkbox label="Active" {...register('isActive')} />
      {errors.root && <Notice tone="error">{errors.root.message}</Notice>}
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="quiet" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save coupon
        </Button>
      </div>
    </form>
  );
}

export function CouponsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: adminService.coupons });
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminService.categories });
  const crud = useCrud('coupons', { create: adminService.createCoupon, update: adminService.updateCoupon, remove: adminService.deleteCoupon }, { one: 'Coupon' });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  return (
    <div>
      <AdminPageHeader
        title="Coupons & promotions"
        description="Codes are validated at checkout against dates, limits, minimum spend and categories."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus aria-hidden className="h-4 w-4" /> New coupon
          </Button>
        }
      />
      <AdminTable
        loading={isLoading}
        error={error}
        onRetry={refetch}
        rows={data}
        caption="Coupons"
        empty={<EmptyState compact icon={Tags} title="No coupons yet" />}
        columns={[
          {
            key: 'c',
            header: 'Code',
            cell: (c) => (
              <div>
                <p className="font-medium tracking-[0.06em]">{c.code}</p>
                <p className="text-[12px] text-taupe">{c.description}</p>
              </div>
            ),
          },
          {
            key: 'd',
            header: 'Discount',
            cell: (c) => (
              <div>
                <p>{describeCoupon(c)}</p>
                <p className="text-[12px] text-taupe">
                  {c.minSubtotal ? `Min. ${formatPrice(c.minSubtotal)}` : 'No minimum'}
                  {c.categoryIds?.length ? ` · ${c.categoryIds.map((id) => categories.find((x) => x.id === id)?.name).filter(Boolean).join(', ')}` : ''}
                </p>
              </div>
            ),
          },
          { key: 'v', header: 'Valid', cell: (c) => <span className="whitespace-nowrap text-espresso-soft">{formatDate(c.startsAt, { timeZone: 'UTC' })} – {formatDate(c.endsAt, { timeZone: 'UTC' })}</span> },
          { key: 'u', header: 'Used', align: 'right', cell: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ''}` },
          {
            key: 's',
            header: 'Status',
            cell: (c) => {
              const [l, t] = couponStatus(c);
              return <Badge tone={t}>{l}</Badge>;
            },
          },
          {
            key: 'a',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (c) => (
              <div className="flex justify-end gap-0.5">
                <button type="button" className="icon-btn h-8 w-8" onClick={() => setEditing(c)} aria-label={`Edit ${c.code}`}>
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button type="button" className="icon-btn h-8 w-8 text-rosewood" onClick={() => setDeleting(c)} aria-label={`Delete ${c.code}`}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ),
          },
        ]}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New coupon' : `Edit ${editing?.code}`} size="lg">
        {editing && <CouponForm coupon={editing === 'new' ? null : editing} onClose={() => setEditing(null)} save={crud.save} categories={categories} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.code}?`}
        description="Codes that have been used on orders cannot be deleted — deactivate them instead to keep reporting accurate."
        confirmLabel="Delete coupon"
        loading={crud.remove.isPending}
        onConfirm={() => crud.remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
      />
    </div>
  );
}
