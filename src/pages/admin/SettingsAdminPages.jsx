import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { AdminPageHeader, Panel, Thumb } from '../../components/admin/AdminUi.jsx';
import { Button, Checkbox, ConfirmDialog, ErrorState, Field, Input, Notice, Select, Skeleton, Textarea } from '../../components/ui/index.js';
import { adminService } from '../../services/index.js';
import { shippingSettingsSchema, storeSettingsSchema } from '../../lib/adminValidation.js';
import { governorateName } from '../../constants/lebanon.js';
import { toast } from '../../stores/uiStores.js';
import { IS_DEMO } from '../../config/env.js';
import { useCartStore } from '../../stores/cartStore.js';

const invalidateStore = (qc) => {
  qc.invalidateQueries({ queryKey: ['admin'] });
  ['store-settings', 'home', 'cart-quote'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
};

// ───────────────────────────── Shipping
export function ShippingPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminService.settings });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(shippingSettingsSchema) });
  const { fields } = useFieldArray({ control, name: 'zones', keyName: '_key' });
  useEffect(() => {
    if (data) reset({ freeShippingThreshold: data.shipping.freeShippingThreshold ?? '', zones: data.shipping.zones });
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      const s = await adminService.updateShipping(values);
      reset({ freeShippingThreshold: s.shipping.freeShippingThreshold ?? '', zones: s.shipping.zones });
      invalidateStore(qc);
      toast.success('Shipping settings saved');
    } catch (e) {
      toast.error('Could not save', { description: e.message });
    }
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <AdminPageHeader
        title="Shipping"
        description="Delivery fees by governorate. Totals are always recalculated on the server at checkout."
        actions={
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Delivery zones" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="table-base min-w-[620px]">
              <thead>
                <tr>
                  <th scope="col">Governorate</th>
                  <th scope="col">Fee (USD)</th>
                  <th scope="col">Typical timing shown to customers</th>
                  <th scope="col">Deliver here</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => (
                  <tr key={f._key}>
                    <td className="font-medium">
                      {governorateName(f.governorate)}
                      <input type="hidden" {...register(`zones.${i}.governorate`)} />
                    </td>
                    <td className="w-32">
                      <label className="sr-only" htmlFor={`fee-${i}`}>
                        Fee for {governorateName(f.governorate)}
                      </label>
                      <Input id={`fee-${i}`} type="number" min="0" step="0.5" className="!min-h-[38px]" {...register(`zones.${i}.fee`)} aria-invalid={errors.zones?.[i]?.fee ? 'true' : undefined} />
                    </td>
                    <td>
                      <label className="sr-only" htmlFor={`est-${i}`}>
                        Timing for {governorateName(f.governorate)}
                      </label>
                      <Input id={`est-${i}`} placeholder="Leave empty if not guaranteed" className="!min-h-[38px]" {...register(`zones.${i}.estimate`)} />
                    </td>
                    <td>
                      <input type="checkbox" className="h-4 w-4 accent-espresso" aria-label={`Deliver to ${governorateName(f.governorate)}`} {...register(`zones.${i}.enabled`)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Complimentary delivery">
            <Field label="Free delivery from (USD)" optional hint="Order subtotal after discounts. Leave empty to always charge delivery." error={errors.freeShippingThreshold?.message}>
              <Input type="number" min="0" step="1" {...register('freeShippingThreshold')} />
            </Field>
          </Panel>
          <Notice tone="info">Only show a delivery timing you can reliably meet. Empty timings are never displayed to customers.</Notice>
        </div>
      </div>
    </form>
  );
}

// ───────────────────────────── Store settings
export function SettingsPage() {
  const qc = useQueryClient();
  const clearCart = useCartStore((s) => s.clear);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminService.settings });
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(storeSettingsSchema) });
  const announcements = useFieldArray({ control, name: 'store.announcements' });
  useEffect(() => {
    if (data) reset({ store: data.store, payments: data.payments });
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      const s = await adminService.updateStoreSettings(values);
      reset({ store: s.store, payments: s.payments });
      invalidateStore(qc);
      toast.success('Store settings saved');
    } catch (e) {
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setError(k, { message }));
      toast.error('Could not save', { description: e.message });
    }
  };

  const resetDemo = async () => {
    setResetting(true);
    try {
      await adminService.resetDemo();
      clearCart();
      qc.clear();
      toast.success('Demo data restored');
      window.location.assign('/');
    } finally {
      setResetting(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const announcementsData = announcements.fields;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <AdminPageHeader
        title="Store settings"
        actions={
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Store & contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name" error={errors.store?.name?.message}>
              <Input {...register('store.name')} />
            </Field>
            <Field label="Support email" error={errors.store?.supportEmail?.message}>
              <Input type="email" {...register('store.supportEmail')} />
            </Field>
            <Field label="Support phone" optional error={errors.store?.supportPhone?.message}>
              <Input {...register('store.supportPhone')} />
            </Field>
            <Field label="WhatsApp number" optional hint="International format, digits only (e.g. 96170123456)." error={errors.store?.whatsappNumber?.message}>
              <Input inputMode="numeric" {...register('store.whatsappNumber')} />
            </Field>
            <Field label="Instagram URL" optional error={errors.store?.instagramUrl?.message}>
              <Input {...register('store.instagramUrl')} />
            </Field>
            <Field label="Instagram handle" optional error={errors.store?.instagramHandle?.message}>
              <Input {...register('store.instagramHandle')} />
            </Field>
          </div>
        </Panel>
        <Panel title="Announcement bar">
          <div className="space-y-2">
            {announcementsData.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <label className="sr-only" htmlFor={`ann-${i}`}>
                  Announcement {i + 1}
                </label>
                <Input id={`ann-${i}`} {...register(`store.announcements.${i}`)} />
                <button type="button" className="icon-btn text-rosewood" onClick={() => announcements.remove(i)} aria-label={`Remove announcement ${i + 1}`}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            ))}
            {announcementsData.length < 4 && (
              <Button size="sm" variant="quiet" onClick={() => announcements.append('')}>
                <Plus aria-hidden className="h-3.5 w-3.5" /> Add message
              </Button>
            )}
            <p className="field-hint">Rotates every few seconds. Keep claims factual (no invented deadlines or discounts).</p>
          </div>
        </Panel>
        <Panel title="Payment methods">
          <div className="space-y-6">
            {['cod', 'manual'].map((k) => (
              <fieldset key={k} className="space-y-3 border-b border-line pb-5 last:border-0 last:pb-0">
                <legend className="mb-2 text-[13px] font-medium">{k === 'cod' ? 'Cash on delivery' : 'Manual payment (e.g. Whish, OMT, bank transfer)'}</legend>
                <Checkbox label="Offer at checkout" {...register(`payments.${k}.enabled`)} />
                <Field label="Label shown to customers" error={errors.payments?.[k]?.label?.message}>
                  <Input {...register(`payments.${k}.label`)} />
                </Field>
                <Field label="Description" error={errors.payments?.[k]?.description?.message}>
                  <Textarea rows={2} {...register(`payments.${k}.description`)} />
                </Field>
              </fieldset>
            ))}
            <Notice tone="info">Online card payments are not enabled. When added, they must go through a certified payment provider (hosted fields or redirect) — card data must never touch this application.</Notice>
          </div>
        </Panel>
        <Panel title="Policies & storefront">
          <div className="space-y-4">
            <Field label="Returns policy summary" error={errors.store?.returnsPolicy?.message}>
              <Textarea rows={5} {...register('store.returnsPolicy')} />
            </Field>
            <Checkbox label="Show exact remaining quantity for low-stock items" description="e.g. “Only 3 left in stock”. Always truthful — based on live inventory." {...register('store.showLowStockCount')} />
          </div>
        </Panel>
      </div>
      {IS_DEMO && (
        <Panel title="Demo data" className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-espresso-soft">Restore the original sample catalogue, orders, customers and settings. Everything created in this browser will be removed.</p>
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              <RotateCcw aria-hidden className="h-4 w-4" /> Reset demo data
            </Button>
          </div>
        </Panel>
      )}
      <ConfirmDialog open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={resetDemo} loading={resetting} title="Reset all demo data?" description="Products, inventory, orders, accounts and settings return to their original sample state. You will be signed out." confirmLabel="Reset demo data" />
    </form>
  );
}

// ───────────────────────────── Homepage content
export function ContentPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin', 'content'], queryFn: adminService.content });
  const { data: products } = useQuery({ queryKey: ['admin', 'products', { pageSize: 100, status: 'published' }], queryFn: () => adminService.products({ pageSize: 100, status: 'published', sort: 'name' }) });
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (data) setContent(structuredClone(data));
  }, [data]);

  if (isLoading || !content) return <Skeleton className="h-96" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const dirty = JSON.stringify(content) !== JSON.stringify(data);
  const setHero = (k, v) => setContent((c) => ({ ...c, hero: { ...c.hero, [k]: v } }));
  const setBanner = (i, patch) => setContent((c) => ({ ...c, promoBanners: c.promoBanners.map((b, x) => (x === i ? { ...b, ...patch } : b)) }));
  const setCollection = (i, patch) => setContent((c) => ({ ...c, featuredCollections: c.featuredCollections.map((b, x) => (x === i ? { ...b, ...patch } : b)) }));
  const productName = (id) => products?.items.find((p) => p.id === id);

  const save = async () => {
    setErr(null);
    if (!content.hero.title.trim()) return setErr('The hero needs a headline.');
    setSaving(true);
    try {
      await adminService.updateContent(content);
      qc.invalidateQueries({ queryKey: ['admin', 'content'] });
      qc.invalidateQueries({ queryKey: ['home'] });
      toast.success('Homepage updated');
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Homepage"
        description="Hero, editorial banners and featured collections."
        actions={
          <>
            <Button variant="quiet" disabled={!dirty} onClick={() => setContent(structuredClone(data))}>
              Discard
            </Button>
            <Button onClick={save} loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </>
        }
      />
      {err && (
        <Notice tone="error" className="mb-6">
          {err}
        </Notice>
      )}
      <div className="space-y-6">
        <Panel title="Hero">
          <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Eyebrow">
                <Input value={content.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} />
              </Field>
              <Field label="Image URL">
                <Input value={content.hero.image} onChange={(e) => setHero('image', e.target.value)} />
              </Field>
              <Field label="Headline" className="sm:col-span-2">
                <Input value={content.hero.title} onChange={(e) => setHero('title', e.target.value)} />
              </Field>
              <Field label="Supporting text" className="sm:col-span-2">
                <Textarea rows={3} value={content.hero.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} />
              </Field>
              <Field label="Primary button label">
                <Input value={content.hero.primaryCta.label} onChange={(e) => setHero('primaryCta', { ...content.hero.primaryCta, label: e.target.value })} />
              </Field>
              <Field label="Primary button link">
                <Input value={content.hero.primaryCta.href} onChange={(e) => setHero('primaryCta', { ...content.hero.primaryCta, href: e.target.value })} />
              </Field>
            </div>
            <img src={content.hero.image} alt="Hero preview" className="aspect-[4/5] w-full bg-linen object-cover" />
          </div>
        </Panel>

        <Panel title="Editorial banners">
          <div className="space-y-6">
            {content.promoBanners.map((b, i) => (
              <div key={b.id} className="grid gap-4 border-b border-line pb-6 last:border-0 last:pb-0 lg:grid-cols-[1fr_220px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Eyebrow">
                    <Input value={b.eyebrow} onChange={(e) => setBanner(i, { eyebrow: e.target.value })} />
                  </Field>
                  <Field label="Title">
                    <Input value={b.title} onChange={(e) => setBanner(i, { title: e.target.value })} />
                  </Field>
                  <Field label="Body" className="sm:col-span-2">
                    <Textarea rows={2} value={b.body} onChange={(e) => setBanner(i, { body: e.target.value })} />
                  </Field>
                  <Field label="Button label">
                    <Input value={b.cta.label} onChange={(e) => setBanner(i, { cta: { ...b.cta, label: e.target.value } })} />
                  </Field>
                  <Field label="Button link">
                    <Input value={b.cta.href} onChange={(e) => setBanner(i, { cta: { ...b.cta, href: e.target.value } })} />
                  </Field>
                  <Field label="Image URL" className="sm:col-span-2">
                    <Input value={b.image} onChange={(e) => setBanner(i, { image: e.target.value })} />
                  </Field>
                  <Checkbox label="Show on homepage" checked={b.isActive} onChange={(e) => setBanner(i, { isActive: e.target.checked })} />
                </div>
                <img src={b.image} alt="" className="aspect-[16/10] w-full bg-linen object-cover" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Featured collections">
          <div className="grid gap-6 lg:grid-cols-2">
            {content.featuredCollections.map((c, i) => (
              <div key={c.id} className="space-y-3 border border-line p-4">
                <Field label="Title">
                  <Input value={c.title} onChange={(e) => setCollection(i, { title: e.target.value })} />
                </Field>
                <Field label="Description">
                  <Textarea rows={2} value={c.description} onChange={(e) => setCollection(i, { description: e.target.value })} />
                </Field>
                <div>
                  <p className="field-label">Products (first four are shown)</p>
                  <ol className="space-y-1.5">
                    {c.productIds.map((id, x) => {
                      const p = productName(id);
                      return (
                        <li key={id} className="flex items-center gap-2 border border-line bg-ivory px-2 py-1.5 text-[13.5px]">
                          <Thumb src={p?.images[0]} size={24} />
                          <span className="min-w-0 flex-1 truncate">{p?.name ?? 'Unpublished product'}</span>
                          <button type="button" className="icon-btn h-7 w-7" disabled={x === 0} aria-label="Move up" onClick={() => setCollection(i, { productIds: c.productIds.map((v, k) => (k === x - 1 ? id : k === x ? c.productIds[x - 1] : v)) })}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="icon-btn h-7 w-7" disabled={x === c.productIds.length - 1} aria-label="Move down" onClick={() => setCollection(i, { productIds: c.productIds.map((v, k) => (k === x + 1 ? id : k === x ? c.productIds[x + 1] : v)) })}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="icon-btn h-7 w-7 text-rosewood" aria-label={`Remove ${p?.name ?? 'product'}`} onClick={() => setCollection(i, { productIds: c.productIds.filter((v) => v !== id) })}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  <label className="sr-only" htmlFor={`add-${c.id}`}>
                    Add product to {c.title}
                  </label>
                  <Select id={`add-${c.id}`} className="mt-2 !min-h-[38px] text-[13.5px]" value="" onChange={(e) => e.target.value && setCollection(i, { productIds: [...c.productIds, e.target.value] })} placeholder="Add a product…">
                    {products?.items
                      .filter((p) => !c.productIds.includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </Select>
                </div>
                <Checkbox label="Show on homepage" checked={c.isActive} onChange={(e) => setCollection(i, { isActive: e.target.checked })} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
