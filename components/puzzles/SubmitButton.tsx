import { useTranslations } from "next-intl";
import Spinner from "@/components/Spinner";

// Shared submit button for every puzzle type. While the answer is in flight
// (`submitting`) it shows a spinner + "Checking…" and is disabled, so the player
// gets immediate feedback that their tap registered.
export default function SubmitButton({
  onClick,
  disabled,
  submitting,
}: {
  onClick: () => void;
  /** Disabled for reasons other than submitting (e.g. nothing selected yet). */
  disabled: boolean;
  submitting: boolean;
}) {
  const t = useTranslations("Game");
  return (
    <button
      type="button"
      disabled={disabled || submitting}
      onClick={onClick}
      aria-busy={submitting}
      className="flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-base font-bold text-white shadow-sm transition active:translate-y-px active:bg-brand-dark disabled:opacity-40"
    >
      {submitting && <Spinner className="text-white" />}
      {submitting ? t("submitting") : t("submit")}
    </button>
  );
}
