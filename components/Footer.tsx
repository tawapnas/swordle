import { useTranslations } from "next-intl";

// Site-wide footer: copyright on the left, contact/social icons on the right.
// Server component — pure render, no client state.
export default function Footer() {
  const t = useTranslations("Site");
  const tBrand = useTranslations("Brand");
  const year = new Date().getFullYear();
  return (
    <footer className="shrink-0 border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
        <p className="text-sm text-ink-soft">
          © {year} {tBrand("orgName")}. {t("rightsReserved")}
        </p>
        <div className="flex items-center gap-3">
          <a
            href="mailto:hello@swordle.app"
            aria-label={t("emailUs")}
            className="p-1.5 text-ink-soft transition hover:bg-line hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <EmailIcon />
          </a>
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noreferrer noopener"
            aria-label={t("facebook")}
            className="p-1.5 text-ink-soft transition hover:bg-line hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <FacebookIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}

function EmailIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9v-2.89h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.77l-.44 2.89h-2.33V22c4.78-.75 8.44-4.89 8.44-9.94Z" />
    </svg>
  );
}
