import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import swiftLogo from "@/public/swift-logo.png";

// Site-wide top bar: centered Swift mark + wordmark on a white card, with a
// 5-band rainbow stripe below. Mirrors the Swift Coding Club Thailand layout
// the design references.
export default function Header() {
  const t = useTranslations("Brand");
  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-2 py-1 transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Image
            src={swiftLogo}
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-auto"
          />
          <span className="text-md font-normal tracking-tight text-ink">
            {t("orgName")}
          </span>
        </Link>
      </div>
      {/* Rainbow stripe — solid bands, no blending. */}
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{
          background:
            "linear-gradient(to right, #ff7a18 0 20%, #c026d3 20% 40%, #4f46e5 40% 60%, #0ea5e9 60% 80%, #22c55e 80% 100%)",
        }}
      />
    </header>
  );
}
