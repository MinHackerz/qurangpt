'use client';

export default function TextSizeStyles() {
  return (
    <style jsx global>{`
      /* Text Size: Small (Default base) */
      [data-text-size="small"] .responsive-text-ayah {
        font-size: 1.5rem; /* 2xl */
        line-height: 2rem;
      }
      [data-text-size="small"] .responsive-text-body {
        font-size: 1rem; /* base */
        line-height: 1.5rem;
      }
      [data-text-size="small"] .responsive-text-title {
        font-size: 0.875rem; /* sm */
        line-height: 1.25rem;
      }
      [data-text-size="small"] .responsive-text-lg {
        font-size: 1.125rem; /* lg */
        line-height: 1.75rem;
      }

      /* Text Size: Medium */
      [data-text-size="medium"] .responsive-text-ayah {
        font-size: 1.875rem; /* 3xl */
        line-height: 2.25rem;
      }
      [data-text-size="medium"] .responsive-text-body {
        font-size: 1.125rem; /* lg */
        line-height: 1.75rem;
      }
      [data-text-size="medium"] .responsive-text-title {
        font-size: 1rem; /* base */
        line-height: 1.5rem;
      }
      [data-text-size="medium"] .responsive-text-lg {
        font-size: 1.25rem; /* xl */
        line-height: 1.75rem;
      }

      /* Text Size: Large */
      [data-text-size="large"] .responsive-text-ayah {
        font-size: 2.25rem; /* 4xl */
        line-height: 2.5rem;
      }
      [data-text-size="large"] .responsive-text-body {
        font-size: 1.25rem; /* xl */
        line-height: 1.75rem;
      }
      [data-text-size="large"] .responsive-text-title {
        font-size: 1.125rem; /* lg */
        line-height: 1.75rem;
      }
      [data-text-size="large"] .responsive-text-lg {
        font-size: 1.5rem; /* 2xl */
        line-height: 2rem;
      }
      [data-text-size="large"] .responsive-text-hadith {
        font-size: 1.5rem; /* 2xl */
        line-height: 2rem;
      }

      /* Hadith specific sizes */
      [data-text-size="small"] .responsive-text-hadith {
        font-size: 1.125rem; /* lg */
        line-height: 1.75rem;
      }
      [data-text-size="medium"] .responsive-text-hadith {
        font-size: 1.25rem; /* xl */
        line-height: 1.75rem;
      }

      /* Section Heading sizes */
      [data-text-size="small"] .responsive-text-heading {
        font-size: 1.25rem; /* xl */
        line-height: 1.75rem;
      }
      [data-text-size="medium"] .responsive-text-heading {
        font-size: 1.5rem; /* 2xl */
        line-height: 2rem;
      }
      [data-text-size="large"] .responsive-text-heading {
        font-size: 1.875rem; /* 3xl */
        line-height: 2.25rem;
      }
      
      /* Ensure transitions work */
      .responsive-text-ayah,
      .responsive-text-body,
      .responsive-text-title,
      .responsive-text-lg,
      .responsive-text-hadith,
      .responsive-text-heading {
        transition-property: font-size, line-height;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 200ms;
      }
    `}</style>
  );
}
