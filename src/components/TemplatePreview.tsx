import { cn } from '@/lib/utils';
import { TEMPLATE_PREVIEW_STYLES } from '@/lib/invoice';

interface TemplatePreviewProps {
  template: 'simple' | 'elegant' | 'corporate';
  isSelected?: boolean;
}

const TemplatePreview = ({ template, isSelected }: TemplatePreviewProps) => {
  const styles = TEMPLATE_PREVIEW_STYLES[template || 'simple'];

  return (
    <div className={cn(
      "w-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-primary transition-all duration-150",
      isSelected ? "shadow-neo-accent -translate-y-0.5" : "shadow-neo hover:shadow-neo-accent hover:-translate-y-0.5 active:translate-y-0"
    )}>
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header */}
        <div className={cn("p-2", styles.header)}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-white/30" />
              <div className={cn("w-8 h-1.5 rounded", styles.headerText, "bg-current opacity-80")} />
            </div>
            <div className="text-right">
              <div className={cn("w-6 h-1 rounded bg-current opacity-60", styles.headerText)} />
              <div className={cn("w-10 h-1.5 rounded mt-0.5 bg-current", styles.headerText)} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-2 space-y-2">
          {/* Info */}
          <div className="flex justify-between">
            <div className="space-y-0.5">
              <div className="w-8 h-1 bg-gray-200 rounded" />
              <div className="w-12 h-1.5 bg-gray-300 rounded" />
            </div>
            <div className="space-y-0.5 text-right">
              <div className="w-6 h-1 bg-gray-200 rounded ml-auto" />
              <div className="w-10 h-1 bg-gray-200 rounded ml-auto" />
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded">
            <div className="bg-gray-100 p-1">
              <div className="flex justify-between">
                <div className="w-8 h-1 bg-gray-300 rounded" />
                <div className="w-6 h-1 bg-gray-300 rounded" />
              </div>
            </div>
            <div className="p-1 space-y-1">
              <div className="flex justify-between">
                <div className="w-10 h-1 bg-gray-200 rounded" />
                <div className="w-6 h-1 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="w-8 h-1 bg-gray-200 rounded" />
                <div className="w-5 h-1 bg-gray-200 rounded" />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-1">
            <div className="space-y-0.5">
              <div className="flex justify-between gap-2">
                <div className="w-6 h-1 bg-gray-200 rounded" />
                <div className="w-8 h-1 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between gap-2 pt-0.5 border-t border-gray-200">
                <div className="w-6 h-1.5 bg-gray-400 rounded" />
                <div className={cn("w-10 h-1.5 rounded", styles.accent)} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-1.5 border-t border-gray-200">
          <div className="w-16 h-1 bg-gray-300 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
