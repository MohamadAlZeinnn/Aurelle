import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

/** Confirmation for destructive or irreversible actions. */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', loading = false, children }) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="quiet" onClick={onClose} disabled={loading}>
            Keep as is
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="px-5 py-5 text-[14.5px] leading-relaxed text-espresso-soft sm:px-7">
        {description && <p>{description}</p>}
        {children}
      </div>
    </Modal>
  );
}
