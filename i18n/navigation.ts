import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware wrappers around next/navigation. Import these instead of the
// raw next/navigation primitives so locale stays in the URL automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
