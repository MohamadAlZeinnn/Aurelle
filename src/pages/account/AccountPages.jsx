import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Checkbox, ConfirmDialog, EmptyState, ErrorState, Field, Input, Modal, Notice, Skeleton } from '../../components/ui/index.js';
import { AddressFields, PhoneInput } from '../../components/account/AddressFields.jsx';
import { OrderCard } from '../../components/order/OrderParts.jsx';
import { OrderDetailView } from '../../components/order/OrderDetailView.jsx';
import { PasswordInput, passwordProps } from './AuthPages.jsx';
import { useMyOrder, useMyOrders } from '../../hooks/queries.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useAuthStore } from '../../stores/authStore.js';
import { toast } from '../../stores/uiStores.js';
import { accountService, orderService } from '../../services/index.js';
import { addressSchema, changePasswordSchema, profileSchema } from '../../lib/validation.js';
import { governorateName } from '../../constants/lebanon.js';
import { formatDate } from '../../lib/format.js';
import { formatLebanesePhone } from '../../lib/phone.js';

const localPhone = (p) => (p ? p.replace(/^\+961/, '0').replace(/^0(7|8)/, '$1') : '');

function PageTitle({ children, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-[1.7rem]">{children}</h2>
      {action}
    </div>
  );
}

export function AccountOverview() {
  usePageMeta({ title: 'Your account', noindex: true });
  const user = useAuthStore((s) => s.user);
  const { data: orders, isLoading } = useMyOrders();
  const address = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
  const active = orders?.filter((o) => !['delivered', 'cancelled', 'returned'].includes(o.status)) ?? [];
  return (
    <div className="space-y-10">
      <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
        {[
          ['Orders placed', orders?.length ?? '—'],
          ['In progress', active.length],
          ['Member since', formatDate(user.createdAt, { day: undefined })],
        ].map(([label, value]) => (
          <div key={label} className="bg-porcelain p-5">
            <p className="text-[12px] uppercase tracking-[0.14em] text-taupe">{label}</p>
            <p className="mt-2 font-display text-[1.6rem]">{value}</p>
          </div>
        ))}
      </div>
      <section>
        <PageTitle
          action={
            <Link to="/account/orders" className="text-[12px] font-medium uppercase tracking-[0.14em] link-underline">
              All orders
            </Link>
          }
        >
          Recent orders
        </PageTitle>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : orders?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.slice(0, 2).map((o) => (
              <OrderCard key={o.id} order={o} to={`/account/orders/${o.reference}`} />
            ))}
          </div>
        ) : (
          <EmptyState compact icon={Package} title="No orders yet" description="When you place an order, you can follow it here." action={<Button to="/shop">Start shopping</Button>} />
        )}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow mb-3">Default address</p>
          {address ? (
            <p className="text-[14px] leading-relaxed">
              {address.building}, {address.street}
              <br />
              {address.city}, {governorateName(address.governorate)}
            </p>
          ) : (
            <p className="text-[14px] text-taupe">No saved address yet.</p>
          )}
          <Link to="/account/addresses" className="mt-4 inline-block text-[12px] font-medium uppercase tracking-[0.14em] link-underline">
            Manage addresses
          </Link>
        </div>
        <div className="card p-5">
          <p className="eyebrow mb-3">Contact details</p>
          <p className="text-[14px] leading-relaxed">
            {user.email}
            <br />
            {formatLebanesePhone(user.phone)}
          </p>
          <Link to="/account/profile" className="mt-4 inline-block text-[12px] font-medium uppercase tracking-[0.14em] link-underline">
            Edit profile
          </Link>
        </div>
      </section>
    </div>
  );
}

export function OrdersPage() {
  usePageMeta({ title: 'Your orders', noindex: true });
  const { data: orders, isLoading, error, refetch } = useMyOrders();
  return (
    <div>
      <PageTitle>Orders</PageTitle>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !orders.length ? (
        <EmptyState compact icon={Package} title="No orders yet" description="Orders you place while signed in appear here. Guest orders can be followed from the tracking page." action={<Button to="/track-order" variant="secondary">Track a guest order</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} to={`/account/orders/${o.reference}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetailPage() {
  const { reference } = useParams();
  usePageMeta({ title: `Order ${reference}`, noindex: true });
  const { data: order, isLoading, error, refetch } = useMyOrder(reference);
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    try {
      const updated = await orderService.cancelMyOrder(reference);
      qc.setQueryData(['my-order', reference], updated);
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success('Your order has been cancelled');
      setConfirm(false);
    } catch (e) {
      toast.error('We could not cancel this order', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState error={error} onRetry={error.status === 404 ? undefined : refetch} title={error.status === 404 ? 'Order not found' : undefined} />;

  return (
    <div>
      <Link to="/account/orders" className="text-[12px] font-medium uppercase tracking-[0.14em] link-underline">
        ← All orders
      </Link>
      <h2 className="mb-6 mt-4 font-display text-[1.9rem]">Order {order.reference}</h2>
      <OrderDetailView
        order={order}
        actions={
          order.status === 'pending' && (
            <div className="border-t border-line pt-6">
              <p className="text-[13.5px] text-taupe">Changed your mind? You can cancel while your order is still pending.</p>
              <Button variant="quiet" size="sm" className="mt-3" onClick={() => setConfirm(true)}>
                Cancel order
              </Button>
            </div>
          )
        }
      />
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={cancel} loading={busy} title="Cancel this order?" confirmLabel="Cancel order" description={`Order ${order.reference} will be cancelled and the items released. This cannot be undone.`} />
    </div>
  );
}

export function ProfilePage() {
  usePageMeta({ title: 'Profile', noindex: true });
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { fullName: user.fullName, email: user.email, phone: localPhone(user.phone), marketingOptIn: user.marketingOptIn } });
  const onSubmit = async (values) => {
    try {
      const updated = await accountService.updateProfile(values);
      setUser(updated);
      reset({ ...values });
      toast.success('Profile updated');
    } catch (e) {
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setError(k, { message }));
      else toast.error('Could not save your profile', { description: e.message });
    }
  };
  return (
    <div className="max-w-xl">
      <PageTitle>Profile</PageTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Full name" error={errors.fullName?.message}>
          <Input autoComplete="name" {...register('fullName')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Mobile number" error={errors.phone?.message}>
          <PhoneInput {...register('phone')} />
        </Field>
        <Checkbox label="Receive the monthly LUMA letter" {...register('marketingOptIn')} />
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </div>
  );
}

export function PasswordPage() {
  usePageMeta({ title: 'Password', noindex: true });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });
  const onSubmit = async (values) => {
    try {
      await accountService.changePassword(values);
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated', { description: 'Other devices have been signed out.' });
    } catch (e) {
      if (e.fieldErrors) Object.entries(e.fieldErrors).forEach(([k, message]) => setError(k, { message }));
      else toast.error('Could not update password', { description: e.message });
    }
  };
  return (
    <div className="max-w-xl">
      <PageTitle>Password</PageTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Current password" error={errors.currentPassword?.message}>
          <PasswordInput autoComplete="current-password" {...passwordProps(register, 'currentPassword')} />
        </Field>
        <Field label="New password" hint="At least 8 characters, with a letter and a number." error={errors.newPassword?.message}>
          <PasswordInput autoComplete="new-password" {...passwordProps(register, 'newPassword')} />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          <PasswordInput autoComplete="new-password" {...passwordProps(register, 'confirmPassword')} />
        </Field>
        <Button type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}

const emptyAddress = { label: '', governorate: '', district: '', city: '', street: '', building: '', floor: '', landmark: '', instructions: '', isDefault: false };

function AddressForm({ address, onClose }) {
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(addressSchema), defaultValues: address ? { ...emptyAddress, ...address } : emptyAddress });
  const [error, setError] = useState(null);
  const onSubmit = async (values) => {
    try {
      const user = address ? await accountService.updateAddress(address.id, values) : await accountService.addAddress(values);
      setUser(user);
      toast.success(address ? 'Address updated' : 'Address saved');
      onClose();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 px-5 py-6 sm:px-7">
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Label" optional hint="e.g. Home, Office, Mum’s place" error={errors.label?.message}>
        <Input {...register('label')} />
      </Field>
      <AddressFields register={register} control={control} errors={errors} setValue={setValue} />
      <Checkbox label="Use as my default address" {...register('isDefault')} />
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="quiet" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save address
        </Button>
      </div>
    </form>
  );
}

export function AddressesPage() {
  usePageMeta({ title: 'Addresses', noindex: true });
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      setUser(await accountService.deleteAddress(deleting.id));
      toast.show('Address removed');
      setDeleting(null);
    } catch (e) {
      toast.error('Could not remove address', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageTitle
        action={
          <Button size="sm" variant="secondary" onClick={() => setEditing('new')}>
            <Plus aria-hidden className="h-3.5 w-3.5" /> Add address
          </Button>
        }
      >
        Addresses
      </PageTitle>
      {!user.addresses.length ? (
        <EmptyState compact icon={MapPin} title="No saved addresses" description="Save an address to check out faster next time." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {user.addresses.map((a) => (
            <li key={a.id} className="card flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{a.label || 'Address'}</p>
                {a.isDefault && <span className="text-[11px] uppercase tracking-[0.14em] text-sage">Default</span>}
              </div>
              <p className="mt-2 flex-1 text-[14px] leading-relaxed text-espresso-soft">
                {a.building}
                {a.floor && `, floor ${a.floor}`}
                <br />
                {a.street}
                <br />
                {a.city}, {a.district}, {governorateName(a.governorate)}
                {a.landmark && (
                  <>
                    <br />
                    Near {a.landmark}
                  </>
                )}
              </p>
              <div className="mt-4 flex gap-4 border-t border-line pt-3 text-[12px] font-medium uppercase tracking-[0.12em]">
                <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1.5 hover:text-bronze">
                  <Pencil aria-hidden className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" onClick={() => setDeleting(a)} className="inline-flex items-center gap-1.5 text-rosewood hover:opacity-80">
                  <Trash2 aria-hidden className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add an address' : 'Edit address'} size="lg">
        {editing && <AddressForm address={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title="Remove this address?" confirmLabel="Remove" description={deleting ? `${deleting.label || 'This address'} will be removed from your account.` : ''} />
    </div>
  );
}
