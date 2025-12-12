import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="bg-white border-l-4 border-l-bridge-blue shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full">
            <div className="grid gap-1">
              {title && <ToastTitle className="text-bridge-blue font-bold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-gray-600 font-medium">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-gray-400 hover:text-gray-600" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
