import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Invoice } from './invoice';
import { InvoiceView } from '@/components/InvoiceView';
import { toast } from '@/hooks/use-toast';

export const downloadInvoicePDF = async (invoice: Invoice, existingElement?: HTMLElement | null) => {
  try {
    toast({ title: 'Generating PDF...', description: 'Tunggu bentar ya' });

    let elementToCapture = existingElement;
    let container: HTMLDivElement | null = null;
    let root: any = null;

    if (!elementToCapture) {
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.zIndex = '-9999';
      container.style.background = '#ffffff';
      document.body.appendChild(container);

      root = createRoot(container);
      root.render(React.createElement(InvoiceView, { invoice }));

      // Wait for rendering and image load
      await new Promise((resolve) => setTimeout(resolve, 350));
      elementToCapture = (container.firstElementChild as HTMLElement) || container;
    }

    const canvas = await html2canvas(elementToCapture, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    if (root && container) {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${invoice.invoiceNumber}.pdf`);

    toast({ title: 'Mantap!', description: 'PDF berhasil didownload' });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    toast({ title: 'Oops!', description: 'Gagal generate PDF', variant: 'destructive' });
  }
};
