import { useEffect, useMemo, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { AdminPageHeader, Panel } from '../../components/admin/AdminUi.jsx';
import { ImageManager } from '../../components/admin/ImageManager.jsx';
import { Button, Checkbox, ConfirmDialog, ErrorState, Field, Input, Notice, Select, Skeleton, Textarea } from '../../components/ui/index.js';
import { StockBadge } from '../../components/product/StockBadge.jsx';
import { adminService, catalogService } from '../../services/index.js';
import { productSchema } from '../../lib/adminValidation.js';
import { variantStockStatus } from '../../lib/inventory.js';
import { slugify, cn } from '../../lib/format.js';
import { formatPrice } from '../../lib/money.js';
import { toast } from '../../stores/uiStores.js';

const blank = {
  name: '', slug: '', brandId: '', categoryId: '', subcategoryId: '', shortDescription: '', description: '',
  benefitsText: '', keyIngredients: [], directions: '', ingredients: '', specifications: [], faqs: [],
  concerns: [], attributes: [], images: [], isNew: true, isBestseller: false, isFeatured: false,
  status: 'draft', lowStockThreshold: 5, variantLabel: '',
  variants: [{ name: 'Default', sku: '', price: '', compareAtPrice: '', costPrice: '', stock: 0, discontinued: false, swatch: '' }],
};

const toForm = (p) => ({
  ...blank,
  ...p,
  subcategoryId: p.subcategoryId ?? '',
  variantLabel: p.variantLabel ?? '',
  benefitsText: (p.benefits || []).join('\n'),
  variants: p.variants.map((v) => ({ ...v, compareAtPrice: v.compareAtPrice ?? '', costPrice: v.costPrice ?? '', swatch: v.swatch ?? '', image: v.image ?? '' })),
});

// The schema works on the API shape; the form keeps benefits as text for easier editing.
const formSchema = productSchema;
const toPayload = ({ benefitsText, ...v }) => ({ ...v, benefits: benefitsText.split('\n').map((s) => s.trim()).filter(Boolean) });
const resolver = (values, ctx, opts) => zodResolver(formSchema)(toPayload(values), ctx, opts);

function ArrayRows({ fields, onRemove, render, addLabel, onAdd, empty }) {
  return (
    <div className="space-y-3">
      {fields.length === 0 && empty && <p className="text-[13px] text-taupe">{empty}</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="flex items-start gap-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">{render(i)}</div>
          <button type="button" onClick={() => onRemove(i)} className="icon-btn mt-0.5 text-rosewood" aria-label="Remove row">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      ))}
      <Button variant="quiet" size="sm" onClick={onAdd}>
        <Plus aria-hidden className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

export default function ProductEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: product, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'product', id], queryFn: () => adminService.product(id), enabled: !isNew });
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminService.categories });
  const { data: filters } = useQuery({ queryKey: ['filters'], queryFn: catalogService.getFilters });
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(null);

  const form = useForm({ resolver, defaultValues: blank, mode: 'onBlur' });
  const { register, control, handleSubmit, reset, setValue, setError, formState } = form;
  const { errors, isDirty } = formState;
  const variants = useFieldArray({ control, name: 'variants', keyName: '_key' });
  const keyIngredients = useFieldArray({ control, name: 'keyIngredients' });
  const specifications = useFieldArray({ control, name: 'specifications' });
  const faqs = useFieldArray({ control, name: 'faqs' });

  // Reset only once the select options exist, otherwise the browser drops unknown values.
  const optionsReady = Boolean(filters) && categories.length > 0;
  useEffect(() => {
    if (product && optionsReady) reset(toForm(product));
  }, [product, optionsReady, reset]);

  const [name, categoryId, variantLabel, watchedVariants, threshold] = useWatch({ control, name: ['name', 'categoryId', 'variantLabel', 'variants', 'lowStockThreshold'] });
  const category = categories.find((c) => c.id === categoryId);
  useEffect(() => {
    if (isNew && name && !formState.dirtyFields.slug) setValue('slug', slugify(name));
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  const showSwatch = /shade|colou?r|stone/i.test(variantLabel || '');

  // Warn before leaving with unsaved edits.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => isDirty && !saving && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const submit = (status) =>
    handleSubmit(async (values) => {
      setServerError(null);
      setSaving(status);
      // `values` is already the resolver's parsed API payload (benefits as an array).
      const payload = { ...values, status };
      try {
        const saved = isNew ? await adminService.createProduct(payload) : await adminService.updateProduct(id, payload);
        qc.invalidateQueries({ queryKey: ['admin'] });
        ['products', 'product', 'home', 'related', 'products-by-ids'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
        reset(toForm(saved));
        toast.success(isNew ? 'Product created' : 'Changes saved', { description: `${saved.name} · ${saved.status}` });
        if (isNew) navigate(`/admin/products/${saved.id}`, { replace: true });
      } catch (e) {
        if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setError(k, { message }));
        setServerError(e.message);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setSaving(null);
      }
    }, () => {
      setServerError('Please fix the highlighted fields.');
      toast.error('Some fields need attention');
    })();

  const margin = useMemo(() => (v) => (v.price > 0 && v.costPrice !== '' && v.costPrice != null ? Math.round(((v.price - v.costPrice) / v.price) * 100) : null), []);

  if (!isNew && isLoading) return <Skeleton className="h-[70vh]" />;
  if (!isNew && error) return <ErrorState error={error} onRetry={refetch} />;

  const status = product?.status ?? 'draft';

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      <Link to="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] link-underline">
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" /> Products
      </Link>
      <AdminPageHeader
        title={isNew ? 'New product' : product.name}
        description={isNew ? 'Saved as a draft until you publish it.' : `Status: ${status}${isDirty ? ' · unsaved changes' : ''}`}
        actions={
          <>
            {!isNew && product.status === 'published' && (
              <Button variant="ghost" size="sm" href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden className="h-3.5 w-3.5" /> View in shop
              </Button>
            )}
            <Button variant="quiet" onClick={() => submit(isNew || status === 'published' ? 'draft' : status)} loading={saving === 'draft' || saving === 'archived'}>
              {status === 'published' && !isNew ? 'Unpublish & save' : 'Save draft'}
            </Button>
            <Button onClick={() => submit('published')} loading={saving === 'published'}>
              {status === 'published' && !isNew ? 'Save changes' : 'Publish'}
            </Button>
          </>
        }
      />
      {serverError && (
        <Notice tone="error" className="mb-6">
          {serverError}
        </Notice>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" error={errors.name?.message} className="sm:col-span-2">
                <Input {...register('name')} />
              </Field>
              <Field label="URL handle" hint={`/product/${form.getValues('slug') || 'your-handle'}`} error={errors.slug?.message} className="sm:col-span-2">
                <Input {...register('slug')} />
              </Field>
              <Field label="Brand" error={errors.brandId?.message}>
                <Select placeholder="Choose brand" {...register('brandId')}>
                  {filters?.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category" error={errors.categoryId?.message}>
                <Select placeholder="Choose category" {...register('categoryId', { onChange: () => setValue('subcategoryId', '') })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subcategory" optional error={errors.subcategoryId?.message}>
                <Select placeholder={category ? 'None' : 'Choose a category first'} disabled={!category} {...register('subcategoryId')}>
                  {category?.subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Short description" hint="One sentence shown on cards and in search results." error={errors.shortDescription?.message} className="sm:col-span-2">
                <Input maxLength={200} {...register('shortDescription')} />
              </Field>
              <Field label="Description" hint="Describe texture, ingredients and use. Avoid medical or unverified efficacy claims." error={errors.description?.message} className="sm:col-span-2">
                <Textarea rows={5} {...register('description')} />
              </Field>
            </div>
          </Panel>

          <Panel title="Media">
            <Controller name="images" control={control} render={({ field }) => <ImageManager value={field.value} onChange={field.onChange} error={errors.images?.message} />} />
          </Panel>

          <Panel title="Pricing, variants & inventory" description="Inventory is tracked per variant. Use “Default” for single-option products.">
            <Field label="Variant label" optional hint="e.g. Size, Shade, Colour. Leave empty for single-option products." className="mb-5 max-w-xs">
              <Input {...register('variantLabel')} />
            </Field>
            <div className="space-y-4">
              {variants.fields.map((f, i) => {
                const v = watchedVariants?.[i] ?? {};
                const st = variantStockStatus({ stock: Number(v.stock), discontinued: v.discontinued }, Number(threshold) || 0);
                const m = margin({ price: Number(v.price), costPrice: v.costPrice === '' ? null : Number(v.costPrice) });
                const e = errors.variants?.[i] ?? {};
                return (
                  <fieldset key={f._key} className="border border-line p-4">
                    <legend className="flex items-center gap-2 px-1 text-[12.5px] font-medium">
                      Variant {i + 1} <StockBadge status={st} />
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                      <Field label="Name" error={e.name?.message} className="lg:col-span-2">
                        <Input {...register(`variants.${i}.name`)} />
                      </Field>
                      <Field label="SKU" error={e.sku?.message} className="lg:col-span-2">
                        <Input className="uppercase" {...register(`variants.${i}.sku`)} />
                      </Field>
                      <Field label="Stock" hint={!isNew && product?.variants?.some((pv) => pv.id === v.id) ? 'Changes are logged' : undefined} error={e.stock?.message}>
                        <Input type="number" min="0" step="1" inputMode="numeric" {...register(`variants.${i}.stock`)} />
                      </Field>
                      {showSwatch ? (
                        <Field label="Swatch" optional>
                          <Input type="color" className="!px-1" {...register(`variants.${i}.swatch`)} />
                        </Field>
                      ) : (
                        <div className="hidden lg:block" />
                      )}
                      <Field label="Price (USD)" error={e.price?.message} className="lg:col-span-2">
                        <Input type="number" min="0" step="0.01" inputMode="decimal" {...register(`variants.${i}.price`)} />
                      </Field>
                      <Field label="Compare-at" optional hint="Only for genuine reductions." error={e.compareAtPrice?.message} className="lg:col-span-2">
                        <Input type="number" min="0" step="0.01" inputMode="decimal" {...register(`variants.${i}.compareAtPrice`)} />
                      </Field>
                      <Field label="Cost" optional hint={m != null ? `Margin ${m}%` : 'Not shown to customers'} error={e.costPrice?.message} className="lg:col-span-2">
                        <Input type="number" min="0" step="0.01" inputMode="decimal" {...register(`variants.${i}.costPrice`)} />
                      </Field>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <Checkbox label="Discontinued — cannot be purchased or restocked" {...register(`variants.${i}.discontinued`)} />
                      {variants.fields.length > 1 && (
                        <button type="button" onClick={() => variants.remove(i)} className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-rosewood">
                          <Trash2 aria-hidden className="h-3.5 w-3.5" /> Remove variant
                        </button>
                      )}
                    </div>
                  </fieldset>
                );
              })}
              {errors.variants?.message && <p className="field-error">{errors.variants.message}</p>}
              <Button
                variant="quiet"
                size="sm"
                onClick={() => variants.append({ name: '', sku: '', price: watchedVariants?.[0]?.price ?? '', compareAtPrice: '', costPrice: '', stock: 0, discontinued: false, swatch: '' })}
              >
                <Plus aria-hidden className="h-3.5 w-3.5" /> Add variant
              </Button>
            </div>
          </Panel>

          <Panel title="Product details">
            <div className="space-y-6">
              <Field label="Benefits" hint="One per line." optional>
                <Textarea rows={4} {...register('benefitsText')} />
              </Field>
              <div>
                <p className="field-label">Key ingredients</p>
                <ArrayRows
                  fields={keyIngredients.fields}
                  onRemove={keyIngredients.remove}
                  onAdd={() => keyIngredients.append({ name: '', purpose: '' })}
                  addLabel="Add ingredient"
                  render={(i) => (
                    <>
                      <Input aria-label="Ingredient" placeholder="Ingredient" {...register(`keyIngredients.${i}.name`)} aria-invalid={errors.keyIngredients?.[i]?.name ? 'true' : undefined} />
                      <Input aria-label="Purpose" placeholder="What it does (cosmetic function)" {...register(`keyIngredients.${i}.purpose`)} />
                    </>
                  )}
                />
              </div>
              <Field label="How to use" optional>
                <Textarea rows={3} {...register('directions')} />
              </Field>
              <Field label="Full ingredients (INCI)" optional>
                <Textarea rows={3} {...register('ingredients')} />
              </Field>
              <div>
                <p className="field-label">Specifications</p>
                <ArrayRows
                  fields={specifications.fields}
                  onRemove={specifications.remove}
                  onAdd={() => specifications.append({ label: '', value: '' })}
                  addLabel="Add specification"
                  render={(i) => (
                    <>
                      <Input aria-label="Label" placeholder="Label, e.g. Size" {...register(`specifications.${i}.label`)} />
                      <Input aria-label="Value" placeholder="Value, e.g. 30 ml" {...register(`specifications.${i}.value`)} />
                    </>
                  )}
                />
              </div>
              <div>
                <p className="field-label">FAQs</p>
                <ArrayRows
                  fields={faqs.fields}
                  onRemove={faqs.remove}
                  onAdd={() => faqs.append({ q: '', a: '' })}
                  addLabel="Add question"
                  render={(i) => (
                    <>
                      <Input aria-label="Question" placeholder="Question" {...register(`faqs.${i}.q`)} />
                      <Input aria-label="Answer" placeholder="Answer" {...register(`faqs.${i}.a`)} />
                    </>
                  )}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Visibility">
            <div className="space-y-3">
              <p className="text-[13.5px]">
                Current status: <strong className="font-medium capitalize">{isNew ? 'new (unsaved)' : status}</strong>
              </p>
              {!isNew && status !== 'archived' && (
                <Button variant="ghost" size="sm" className="!px-0" onClick={() => submit('archived')}>
                  Archive product
                </Button>
              )}
              {!isNew && status === 'archived' && <p className="text-[13px] text-taupe">Archived products are hidden from the shop. Save as draft or publish to restore.</p>}
              <div className="space-y-2.5 border-t border-line pt-4">
                <Checkbox label="Feature on homepage & listings" {...register('isFeatured')} />
                <Checkbox label="Mark as new arrival" {...register('isNew')} />
                <Checkbox label="Mark as bestseller" {...register('isBestseller')} />
              </div>
            </div>
          </Panel>
          <Panel title="Inventory rules">
            <Field label="Low-stock threshold" hint="Shoppers see “Only X left” at or below this level." error={errors.lowStockThreshold?.message}>
              <Input type="number" min="0" step="1" {...register('lowStockThreshold')} />
            </Field>
          </Panel>
          <Panel title="Skin concerns">
            <div className="space-y-2">
              {filters?.concerns.map((c) => (
                <Checkbox key={c.id} label={c.name} value={c.id} {...register('concerns')} />
              ))}
            </div>
          </Panel>
          <Panel title="Attributes">
            <div className="space-y-2">
              {filters?.attributes.map((a) => (
                <Checkbox key={a.id} label={a.name} value={a.id} {...register('attributes')} />
              ))}
            </div>
          </Panel>
          {!isNew && (
            <Panel title="Summary">
              <dl className="space-y-1.5 text-[13px]">
                {product.variants.map((v) => (
                  <div key={v.id} className={cn('flex justify-between gap-2', v.discontinued && 'text-taupe line-through')}>
                    <dt className="truncate">{v.name}</dt>
                    <dd className="tabular-nums">
                      {formatPrice(v.price)} · {v.stock} in stock
                    </dd>
                  </div>
                ))}
              </dl>
              <Link to={`/admin/inventory?q=${encodeURIComponent(product.variants[0].sku.split('-').slice(0, 3).join('-'))}`} className="mt-3 inline-block text-[12px] font-medium uppercase tracking-[0.12em] link-underline">
                Inventory history
              </Link>
            </Panel>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Leave without saving?"
        description="You have unsaved changes to this product. They will be lost if you leave this page."
        confirmLabel="Discard changes"
      />
    </form>
  );
}
