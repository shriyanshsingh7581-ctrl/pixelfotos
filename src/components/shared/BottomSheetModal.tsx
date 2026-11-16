import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = 'md:max-w-xl',
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/55 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bottom-sheet-enter w-full ${maxWidthClass} rounded-t-[28px] md:rounded-[24px] liquid-glass overflow-hidden flex flex-col max-h-[88dvh] md:max-h-[85vh]`}
      >
        {/* Native Android/iOS Drag Handle on Mobile */}
        <div className="md:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-zinc-400/50 dark:bg-white/25" />
        </div>

        {/* Sticky Sheet Header */}
        <div className="px-5 py-3.5 md:px-6 md:py-4 border-b border-black/10 dark:border-white/12 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            {subtitle && (
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#B58E24] dark:text-[#D4AF37] truncate">
                {subtitle}
              </p>
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-300 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6 md:py-5">{children}</div>

        {/* Sticky Bottom Action Bar */}
        {footer && (
          <div
            className="px-5 py-3.5 md:px-6 border-t border-black/10 dark:border-white/12 bg-white/80 dark:bg-[#121318]/90 backdrop-blur-xl shrink-0"
            style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
