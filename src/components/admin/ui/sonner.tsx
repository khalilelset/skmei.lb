'use client';

import { Toaster as Sonner, toast } from 'sonner';

function Toaster() {
  return (
    <Sonner
      // Radix modals set pointer-events:none on <body>; toasts must stay clickable on top of them.
      style={{ pointerEvents: 'auto' }}
      position="bottom-right"
      gap={8}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            '!rounded-[14px] !border-0 !bg-white !font-[family-name:var(--font-adm-body)] !text-[#1D1718] !shadow-[0_0_0_1px_rgba(70,30,32,.05),0_2px_4px_rgba(60,24,26,.04),0_14px_28px_-8px_rgba(60,24,26,.12),0_36px_72px_-20px_rgba(60,24,26,.2)]',
          title: '!text-[13.5px] !font-semibold',
          description: '!text-[12.5px] !text-[#6F6567]',
          icon: '!text-current',
          success: '[&_[data-icon]]:!text-[#16A34A]',
          error: '[&_[data-icon]]:!text-[#DC2626]',
          info: '[&_[data-icon]]:!text-[#3D3436]',
          actionButton: '!bg-[#DC2626] !text-white !rounded-[8px]',
        },
      }}
    />
  );
}

export { Toaster, toast };
