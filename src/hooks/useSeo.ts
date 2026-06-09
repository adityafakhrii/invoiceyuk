import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description?: string;
  noindex?: boolean;
}

export const useSeo = ({ title, description, noindex }: SeoProps) => {
  useEffect(() => {
    // Set title
    document.title = title.includes('InvoiceYuk') ? title : `${title} | InvoiceYuk`;

    // Set description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // Set robots meta tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      } else {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        metaRobots.setAttribute('content', 'index, follow');
        document.head.appendChild(metaRobots);
      }
    }
  }, [title, description, noindex]);
};
