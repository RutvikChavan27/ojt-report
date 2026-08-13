import { useRef } from "react";
import {
  FiChevronRight,
  FiCreditCard,
  FiHome,
  FiInfo,
  FiSmartphone,
  FiTruck,
} from "react-icons/fi";

export type PaymentMethod = "cod" | "card" | "netbanking" | "upi";

export type CardDetails = {
  name: string;
  /** Digits and spaces as typed; only digits are ever validated. */
  number: string;
  /** MM/YY. */
  expiry: string;
  cvv: string;
};

export type PaymentState = {
  /** null until one is chosen — nothing is preselected on purpose. */
  method: PaymentMethod | null;
  card: CardDetails;
  bank: string;
  upiId: string;
};

export const EMPTY_PAYMENT: PaymentState = {
  method: null,
  card: { name: "", number: "", expiry: "", cvv: "" },
  bank: "",
  upiId: "",
};

const METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: "cod", label: "Cash on delivery", icon: <FiTruck size={15} /> },
  { id: "card", label: "Credit / debit card", icon: <FiCreditCard size={15} /> },
  { id: "netbanking", label: "Net banking", icon: <FiHome size={15} /> },
  { id: "upi", label: "UPI", icon: <FiSmartphone size={15} /> },
];

/** The five shown as shortcuts; the rest live in the dropdown. */
const POPULAR_BANKS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra"];

const OTHER_BANKS = [
  "Bank of Baroda",
  "Canara Bank",
  "IDBI Bank",
  "IndusInd Bank",
  "Punjab National Bank",
  "Union Bank of India",
  "Yes Bank",
];

/** Human label for a method, used on the confirmation screen. */
export function methodLabel(method: PaymentMethod | null): string {
  if (!method) return "";
  return METHODS.find((entry) => entry.id === method)?.label ?? method;
}

/**
 * The Luhn checksum every card number carries. It catches typos and made-up
 * numbers, which is all a client can honestly check — whether the card exists
 * and has funds is a question only an issuer can answer.
 */
function luhnValid(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Visa/Mastercard/Amex/RuPay from the leading digits, for the card face. */
function cardBrand(digits: string): string | null {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^(60|65|81|82|508)/.test(digits)) return "RuPay";
  return null;
}

/** Groups digits into fours as they are typed. */
function formatCardNumber(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Inserts the slash so the field reads MM/YY without the user typing it. */
function formatExpiry(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** True when MM/YY is a real month that has not passed. */
function expiryValid(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const year = 2000 + Number(match[2]);
  // Cards stay valid through the last day of their expiry month.
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth >= now;
}

/**
 * Whatever is wrong with the current selection, or null when it is complete.
 * Called on submit rather than on every keystroke, so half-typed input is not
 * flagged as an error while the user is still in the field.
 */
export function validatePayment(state: PaymentState): string | null {
  if (!state.method) return "Select a payment method to place your order.";

  if (state.method === "cod") return null;

  if (state.method === "card") {
    const digits = state.card.number.replace(/\D/g, "");
    if (!state.card.name.trim()) return "Enter the name printed on the card.";
    if (!digits) return "Enter your card number.";
    if (!luhnValid(digits)) return "That card number is not valid.";
    if (!expiryValid(state.card.expiry))
      return "Enter a valid expiry date as MM/YY.";
    const cvvLength = cardBrand(digits) === "Amex" ? 4 : 3;
    if (!new RegExp(`^\\d{${cvvLength}}$`).test(state.card.cvv))
      return `Enter the ${cvvLength}-digit CVV from the back of the card.`;
    return null;
  }

  if (state.method === "netbanking") {
    if (!state.bank) return "Choose your bank to continue.";
    return null;
  }

  // UPI IDs are handle@provider, both sides required.
  if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(state.upiId.trim()))
    return "Enter a valid UPI ID, like name@bank.";
  return null;
}

type PaymentMethodsProps = {
  state: PaymentState;
  onChange: (next: PaymentState) => void;
  /** Shown in the cash-on-delivery copy, e.g. "₹1,750 + $99". */
  amountLabel: string;
};

/**
 * The payment step: a tab rail of methods beside the selected method's form.
 *
 * Nothing here is charged and nothing is transmitted — there is no payment
 * provider wired up. Card fields live in component state for the length of the
 * visit and are never written to storage or sent anywhere.
 */
function PaymentMethods({ state, onChange, amountLabel }: PaymentMethodsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (method: PaymentMethod) => onChange({ ...state, method });

  const setCard = (field: keyof CardDetails, value: string) =>
    onChange({ ...state, card: { ...state.card, [field]: value } });

  /** Arrow keys move between tabs, which is what a tablist is expected to do. */
  const handleTabKeys = (event: React.KeyboardEvent, index: number) => {
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const back = event.key === "ArrowUp" || event.key === "ArrowLeft";
    if (!forward && !back) return;

    event.preventDefault();
    const next =
      (index + (forward ? 1 : -1) + METHODS.length) % METHODS.length;
    select(METHODS[next].id);
    tabsRef.current[next]?.focus();
  };

  /** Which tab takes the tab stop while nothing is chosen yet. */
  const selectedIndex = METHODS.findIndex((entry) => entry.id === state.method);
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  const digits = state.card.number.replace(/\D/g, "");
  const brand = cardBrand(digits);

  return (
    <div className="grid gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
      {/* Rail: a column on desktop, a scrolling row on narrow screens. */}
      <div
        role="tablist"
        aria-label="Payment method"
        aria-orientation="vertical"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-col sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {METHODS.map((entry, index) => {
          const active = state.method === entry.id;
          return (
            <button
              key={entry.id}
              ref={(node) => {
                tabsRef.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`payment-tab-${entry.id}`}
              aria-selected={active}
              aria-controls={`payment-panel-${entry.id}`}
              tabIndex={index === tabStop ? 0 : -1}
              onClick={() => select(entry.id)}
              onKeyDown={(event) => handleTabKeys(event, index)}
              className={`flex flex-shrink-0 items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {entry.icon}
                {entry.label}
              </span>
              <FiChevronRight
                size={14}
                className={active ? "opacity-100" : "opacity-0"}
              />
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`payment-panel-${state.method ?? "none"}`}
        aria-labelledby={
          state.method ? `payment-tab-${state.method}` : undefined
        }
        className="min-w-0 rounded-xl border border-gray-200 bg-white p-5"
      >
        {/* Nothing preselected, so the panel starts as a prompt rather than
            defaulting to a method the buyer never actually picked. */}
        {!state.method && (
          <>
            <h3 className="text-sm font-bold text-gray-900">
              Choose a payment method
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Pick one from the list to continue. The order cannot be placed
              until a method is selected.
            </p>
          </>
        )}

        {state.method === "cod" && (
          <>
            <h3 className="text-sm font-bold text-gray-900">
              Cash on delivery
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Pay {amountLabel} in cash when the order reaches you. Please keep
              the exact amount ready — the courier may not carry change.
            </p>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5 text-xs leading-relaxed text-gray-500">
              <FiInfo size={13} className="mt-0.5 flex-shrink-0" />
              Nothing is charged now. This is the only method that needs no
              payment gateway, so it is the one that behaves exactly as it would
              in production.
            </p>
          </>
        )}

        {state.method === "card" && (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-900">
                Credit / debit card
              </h3>
              {brand && (
                <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {brand}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-gray-500">
                  Name on card <span className="text-gray-900">*</span>
                </span>
                <input
                  type="text"
                  value={state.card.name}
                  onChange={(event) => setCard("name", event.target.value)}
                  required
                  autoComplete="off"
                  className={inputClass}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-gray-500">
                  Card number <span className="text-gray-900">*</span>
                </span>
                <input
                  type="text"
                  value={state.card.number}
                  onChange={(event) =>
                    setCard("number", formatCardNumber(event.target.value))
                  }
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0000 0000 0000 0000"
                  className={`${inputClass} tracking-wide`}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500">
                  Expiry (MM/YY) <span className="text-gray-900">*</span>
                </span>
                <input
                  type="text"
                  value={state.card.expiry}
                  onChange={(event) =>
                    setCard("expiry", formatExpiry(event.target.value))
                  }
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="MM/YY"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500">
                  CVV <span className="text-gray-900">*</span>
                </span>
                <input
                  type="password"
                  value={state.card.cvv}
                  onChange={(event) =>
                    setCard("cvv", event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="•••"
                  className={inputClass}
                />
              </label>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5 text-xs leading-relaxed text-gray-500">
              <FiInfo size={13} className="mt-0.5 flex-shrink-0" />
              Checked for format only, in your browser. Nothing is sent anywhere,
              nothing is stored, and no card is charged — there is no payment
              provider behind this build. Do not enter a real card.
            </p>
          </>
        )}

        {state.method === "netbanking" && (
          <>
            <h3 className="text-sm font-bold text-gray-900">Net banking</h3>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {POPULAR_BANKS.map((bank) => {
                const active = state.bank === bank;
                return (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => onChange({ ...state, bank })}
                    aria-pressed={active}
                    className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                    }`}
                  >
                    {bank}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-gray-500">
                Select from other banks
              </span>
              <select
                value={POPULAR_BANKS.includes(state.bank) ? "" : state.bank}
                onChange={(event) =>
                  onChange({ ...state, bank: event.target.value })
                }
                className={inputClass}
              >
                <option value="">Choose a bank</option>
                {OTHER_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </label>

            {state.bank && (
              <p className="mt-3 text-xs font-semibold text-gray-900">
                Selected: {state.bank}
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5 text-xs leading-relaxed text-gray-500">
              <FiInfo size={13} className="mt-0.5 flex-shrink-0" />
              In production you would be redirected to your bank to authorise the
              payment. There is no gateway here, so nothing is charged.
            </p>
          </>
        )}

        {state.method === "upi" && (
          <>
            <h3 className="text-sm font-bold text-gray-900">UPI</h3>

            <label className="mt-4 block">
              <span className="text-xs font-semibold text-gray-500">
                UPI ID <span className="text-gray-900">*</span>
              </span>
              <input
                type="text"
                value={state.upiId}
                onChange={(event) =>
                  onChange({ ...state, upiId: event.target.value })
                }
                required
                autoComplete="off"
                placeholder="name@bank"
                className={inputClass}
              />
            </label>

            <p className="mt-4 flex items-start gap-2 rounded-lg bg-black/[0.03] px-3 py-2.5 text-xs leading-relaxed text-gray-500">
              <FiInfo size={13} className="mt-0.5 flex-shrink-0" />
              In production your UPI app would raise a collect request. There is
              no gateway here, so nothing is charged.
            </p>
          </>
        )}

      </div>
    </div>
  );
}

/** Shared input styling, matching the address form's fields. */
const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";

export default PaymentMethods;
