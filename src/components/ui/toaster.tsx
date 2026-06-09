import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        let resolvedVariant = variant;
        if (!resolvedVariant || resolvedVariant === 'default') {
          const isSuccess = 
            (title && /berhasil|sukses|mantap|selamat/i.test(title.toString())) ||
            (description && /berhasil|sukses|mantap|selamat/i.test(description.toString()));
          if (isSuccess) {
            resolvedVariant = 'success';
          }
        }

        return (
          <Toast key={id} variant={resolvedVariant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle className="text-sm font-black uppercase tracking-wider">{title}</ToastTitle>}
              {description && <ToastDescription className="text-xs font-semibold opacity-90">{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
