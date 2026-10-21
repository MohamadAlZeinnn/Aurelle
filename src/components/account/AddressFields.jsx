import { forwardRef, useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { Field, Input, Select, Textarea } from '../ui/index.js';
import { GOVERNORATES } from '../../constants/lebanon.js';

/** Lebanese address fields for react-hook-form. District options follow the governorate. */
export function AddressFields({ register, control, errors, setValue, enabledGovernorates, prefix = '' }) {
  const name = (k) => `${prefix}${k}`;
  const governorate = useWatch({ control, name: name('governorate') });
  const district = useWatch({ control, name: name('district') });
  const gov = GOVERNORATES.find((g) => g.id === governorate);

  // Reset an incompatible district; auto-select when the governorate has only one.
  useEffect(() => {
    if (!gov) return;
    if (gov.districts.length === 1 && district !== gov.districts[0]) setValue(name('district'), gov.districts[0], { shouldValidate: Boolean(district) });
    else if (district && !gov.districts.includes(district)) setValue(name('district'), '');
  }, [governorate]); // eslint-disable-line react-hooks/exhaustive-deps

  const err = (k) => errors?.[k]?.message;
  const options = enabledGovernorates ? GOVERNORATES.filter((g) => enabledGovernorates.includes(g.id)) : GOVERNORATES;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Governorate" error={err('governorate')}>
        <Select autoComplete="address-level1" placeholder="Select governorate" {...register(name('governorate'))}>
          {options.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="District" error={err('district')}>
        <Select autoComplete="address-level2" placeholder={gov ? 'Select district' : 'Choose a governorate first'} disabled={!gov} {...register(name('district'))}>
          {gov?.districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="City or area" error={err('city')} className="sm:col-span-2">
        <Input autoComplete="address-level3" placeholder="e.g. Achrafieh, Jounieh, Zahle" {...register(name('city'))} />
      </Field>
      <Field label="Street and area details" error={err('street')} className="sm:col-span-2">
        <Input autoComplete="street-address" placeholder="Street name, neighbourhood" {...register(name('street'))} />
      </Field>
      <Field label="Building" error={err('building')}>
        <Input placeholder="Building name or number" {...register(name('building'))} />
      </Field>
      <Field label="Floor / apartment" optional error={err('floor')}>
        <Input placeholder="e.g. 4th floor, apt 12" {...register(name('floor'))} />
      </Field>
      <Field label="Nearby landmark" optional hint="Helps our courier find you — a shop, school or church nearby." error={err('landmark')} className="sm:col-span-2">
        <Input {...register(name('landmark'))} />
      </Field>
      <Field label="Delivery instructions" optional error={err('instructions')} className="sm:col-span-2">
        <Textarea rows={2} placeholder="e.g. Call when you arrive, leave with the concierge" {...register(name('instructions'))} />
      </Field>
    </div>
  );
}

export const PhoneInput = forwardRef(function PhoneInput(props, ref) {
  return (
    <div className="flex">
      <span className="flex items-center border border-r-0 border-line-strong bg-linen px-3 text-[14px] text-espresso-soft" aria-hidden>
        +961
      </span>
      <Input ref={ref} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="03 123 456" {...props} />
    </div>
  );
});
