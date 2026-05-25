import { useEffect } from 'react';

const SITE_NAME = 'CyberDev';

const setMetaTag = (key, value, property = false) => {
  if (!value) return null;

  const selector = property ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    if (property) {
      tag.setAttribute('property', key);
    } else {
      tag.setAttribute('name', key);
    }
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', value);
  return tag;
};

const Seo = ({
  title,
  description,
  url = window.location.href,
  image = '/dk_portfolio_logo_light.svg',
  type = 'website',
  schema,
}) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    const existingCanonical = document.head.querySelector('link[rel="canonical"]');
    const canonical = existingCanonical || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', url);
    if (!existingCanonical) {
      document.head.appendChild(canonical);
    }

    const tags = [
      setMetaTag('description', description),
      setMetaTag('og:title', title, true),
      setMetaTag('og:description', description, true),
      setMetaTag('og:type', type, true),
      setMetaTag('og:url', url, true),
      setMetaTag('og:image', image, true),
      setMetaTag('twitter:card', 'summary_large_image'),
      setMetaTag('twitter:title', title),
      setMetaTag('twitter:description', description),
      setMetaTag('twitter:image', image),
    ].filter(Boolean);

    const schemaScriptId = 'portfolio-schema-jsonld';
    let schemaScript = document.head.querySelector(`script#${schemaScriptId}`);

    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = schemaScriptId;
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    }

    return () => {
      document.title = previousTitle;
      tags.forEach((tag) => tag?.remove?.());
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
      if (!existingCanonical && canonical.parentNode) {
        canonical.parentNode.removeChild(canonical);
      }
    };
  }, [title, description, url, image, type, schema]);

  return null;
};

export default Seo;