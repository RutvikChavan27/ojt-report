import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiChevronUp,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import AuthForm from "../../components/common/AuthForm";
import PaymentMethods, {
  EMPTY_PAYMENT,
  methodLabel,
  validatePayment,
  type PaymentState,
} from "./PaymentMethods";
import { useAuth } from "../../store/AuthContext";
import { useCart } from "../../store/CartContext";

type CheckoutProps = {
  /** Back to the bag. */
  onBack: () => void;
  /** Where the confirmation screen sends you afterwards. */
  onContinueShopping: () => void;
};

/** Formats a price with the currency the item was added in. */
const money = (currency: string, amount: number) =>
  `${currency}${amount.toLocaleString("en-IN")}`;

type Address = {
  name: string;
  mobile: string;
  house: string;
  street: string;
  locality: string;
  pincode: string;
  city: string;
  state: string;
};

const EMPTY_ADDRESS: Address = {
  name: "",
  mobile: "",
  house: "",
  street: "",
  locality: "",
  pincode: "",
  city: "",
  state: "",
};

/**
 * Two pages: collect the address, then review it. Paying is not a third page —
 * it opens the payment section on the review page.
 */
type Step = "address" | "review";

/** Four days out, matching the estimate shown in the bag. */
function deliveryEstimate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** One line of address text, skipping the parts left blank. */
function formatAddress(address: Address): string {
  const street = [address.house, address.street, address.locality]
    .filter(Boolean)
    .join(", ");
  return `${street}, ${address.city}, ${address.state}, ${address.pincode}`;
}

/**
 * Checkout in three steps: sign in if there is no session, collect a delivery
 * address, then confirm delivery and payment.
 *
 * The address is held in component state only — there is no orders table and no
 * payment provider behind this, so nothing here is persisted or charged. The
 * confirmation screen is a UI state, not a record of a real order, and cash on
 * delivery is the only method offered because it is the only one that needs no
 * gateway.
 */
function Checkout({ onBack, onContinueShopping }: CheckoutProps) {
  const { user, loading } = useAuth();
  const { items, count, totals, clear } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [payment, setPayment] = useState<PaymentState>(EMPTY_PAYMENT);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [paidWith, setPaidWith] = useState("");
  const [reference, setReference] = useState("");

  /** Only delivery collapses — payment is always the live part of this page. */
  const [deliveryOpen, setDeliveryOpen] = useState(true);

  const estimate = deliveryEstimate();

  const setField = (field: keyof Address) => (value: string) =>
    setAddress((current) => ({ ...current, [field]: value }));

  /** Address step: browser validation gates this, then on to review. */
  const handleAddressSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setStep("review");
  };


  /**
   * Validate the chosen method, then finish. The card fields are dropped along
   * with the rest of the payment state so nothing sensitive lingers behind the
   * confirmation screen.
   */
  const handlePlaceOrder = (event: React.FormEvent) => {
    event.preventDefault();

    const problem = validatePayment(payment);
    if (problem) {
      // Raised as a dialog: the button is in the right-hand column and the
      // payment panel in the left, so an inline message can land off screen.
      setPaymentError(problem);
      return;
    }

    setPaymentError(null);
    setPaidWith(methodLabel(payment.method));
    setReference(`TH${Date.now().toString(36).toUpperCase().slice(-6)}`);
    setPayment(EMPTY_PAYMENT);
    setPlaced(true);
    clear();
  };

  /** Wrapper so every step shares the page's gutters and back link. */
  const shell = (
    children: React.ReactNode,
    back?: { label: string; onClick: () => void },
  ) => (
    <section className="pb-20 pt-8">
      {/* Capped and centred, unlike the bag: a checkout is a form to work down,
          and full-bleed rows put the labels and their inputs a screen apart. */}
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        {back && (
          <button
            type="button"
            onClick={back.onClick}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            <FiArrowLeft size={16} />
            {back.label}
          </button>
        )}
        {children}
      </div>
    </section>
  );

  /** "Checkout · N items" — the same header on both steps. */
  const header = (
    <div className="flex items-baseline gap-2.5 border-b border-gray-200 pb-4">
      <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
        Checkout
      </h1>
      <span className="text-sm text-gray-500">
        {count} {count === 1 ? "item" : "items"}
      </span>
    </div>
  );

  // Checked before the empty-bag guard: placing the order empties the bag.
  if (placed) {
    return shell(
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-black/[0.03] px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white">
          <FiCheck size={24} />
        </span>
        <h1 className="mt-5 text-xl font-black tracking-tight text-gray-900">
          Order placed
        </h1>
        {/* inline-grid inside a centred parent: the block sits in the middle of
            the card while the values still line up in their own column. */}
        <dl className="mt-5 inline-grid grid-cols-[auto_auto] gap-x-5 gap-y-2 text-left text-sm">
          <dt className="font-bold text-gray-900">Reference ID</dt>
          <dd className="text-gray-500">{reference}</dd>

          <dt className="font-bold text-gray-900">Arriving by</dt>
          <dd className="text-gray-500">{estimate}</dd>

          <dt className="font-bold text-gray-900">Payment Mode</dt>
          <dd className="text-gray-500">{paidWith}</dd>
        </dl>
        <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-gray-400">
          Delivering to {address.name}, {formatAddress(address)}
        </p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-bold text-white transition hover:bg-black"
        >
          Continue shopping
          <FiChevronRight size={15} />
        </button>
      </div>,
    );
  }

  if (items.length === 0) {
    return shell(
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-black/[0.03] px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-900">
          <FiShoppingBag size={22} />
        </span>
        <h1 className="mt-5 text-lg font-black tracking-tight text-gray-900">
          Nothing to check out
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your bag is empty.</p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-bold text-white transition hover:bg-black"
        >
          Start shopping
          <FiChevronRight size={15} />
        </button>
      </div>,
      { label: "Back to bag", onClick: onBack },
    );
  }

  // Waiting on /me: showing the login step here would flash it at a signed-in
  // user on every refresh of the checkout page.
  if (loading) {
    return shell(
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-3xl bg-gray-200" />
        <div className="h-96 animate-pulse rounded-3xl bg-gray-200" />
      </div>,
      { label: "Back to bag", onClick: onBack },
    );
  }

  /* ------------------------------------------------------- step 1: sign in */
  if (!user) {
    return shell(
      <div className="grid overflow-hidden rounded-3xl border border-gray-200 lg:grid-cols-2">
        {/* Left: brand panel. Shows the actual bag rather than stock artwork,
            so it doubles as a reminder of what is being ordered. */}
        <div className="flex flex-col justify-between gap-8 bg-gray-900 p-8 text-white sm:p-10">
          <div>
            <span className="text-lg font-black tracking-tight">THREAD</span>
            <h2 className="mt-8 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              One step left.
              <br />
              Sign in to place your order.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-300">
              Your bag is saved on this device. Signing in lets us attach the
              order to your account.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              In your bag · {count} {count === 1 ? "item" : "items"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="h-16 w-13 overflow-hidden rounded-lg bg-white/10"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
              {items.length > 5 && (
                <div className="flex h-16 w-13 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                  +{items.length - 5}
                </div>
              )}
            </div>
          </div>

          <ul className="space-y-2.5 text-sm text-gray-300">
            <li className="flex items-center gap-2.5">
              <FiShield size={15} className="flex-shrink-0" />
              Buyer protection on every order
            </li>
            <li className="flex items-center gap-2.5">
              <FiLock size={15} className="flex-shrink-0" />
              Password stored hashed, never in plain text
            </li>
          </ul>
        </div>

        {/* Right: the shared auth form. No onSuccess navigation needed — the
            session lands in context and this same page renders step 2. */}
        <div className="bg-white p-8 sm:p-10">
          <h1 className="text-xl font-black tracking-tight text-gray-900">
            Login / Signup
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Continue to your delivery address.
          </p>

          <div className="mt-6">
            <AuthForm onSuccess={() => undefined} />
          </div>
        </div>
      </div>,
      { label: "Back to bag", onClick: onBack },
    );
  }

  const savingsLines = totals.filter((total) => total.savings > 0);

  /** "₹1,750 + $99" — one label, since a mixed bag has no single total. */
  const totalLabel = totals
    .map((total) => money(total.currency, total.payable))
    .join(" + ");

  /** Shared by both steps; only the button at the foot differs. */
  const summary = (foot: React.ReactNode) => (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/[0.03]">
        <h2 className="border-b border-gray-200 px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-500">
          Order Summary
        </h2>

        <dl className="space-y-3 px-5 py-4">
          {totals.map((total) => (
            <div key={total.currency} className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">
                  {totals.length > 1
                    ? `Bag total (${total.currency})`
                    : "Bag total"}{" "}
                  <span className="text-gray-400">
                    ({total.itemCount} {total.itemCount === 1 ? "item" : "items"})
                  </span>
                </dt>
                <dd className="font-semibold text-gray-900">
                  {money(total.currency, total.mrp)}
                </dd>
              </div>
              {total.savings > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Discount</dt>
                  <dd className="font-semibold text-gray-900">
                    −{money(total.currency, total.savings)}
                  </dd>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between text-sm">
            <dt className="text-gray-500">Delivery</dt>
            <dd className="font-semibold text-gray-900">Free</dd>
          </div>

          <div className="flex items-baseline justify-between border-t border-gray-200 pt-3">
            <dt className="text-sm font-black text-gray-900">Total payable</dt>
            <dd className="text-lg font-black text-gray-900">{totalLabel}</dd>
          </div>
        </dl>

        <div className="px-5 pb-5">
          {foot}

          {savingsLines.length > 0 && (
            <p className="mt-3 text-center text-xs font-semibold text-gray-900">
              You are saving{" "}
              {savingsLines
                .map((total) => money(total.currency, total.savings))
                .join(" + ")}
            </p>
          )}

          {totals.length > 1 && (
            <p className="mt-3 text-xs leading-relaxed text-gray-400">
              This bag mixes currencies, so totals are shown separately rather
              than combined.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Quality assured", icon: <FiShield size={15} /> },
          { label: "Secure payment", icon: <FiLock size={15} /> },
          { label: "Easy returns", icon: <FiRefreshCw size={15} /> },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-black/[0.03] px-2 py-3 text-center text-gray-900"
          >
            {badge.icon}
            <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500">
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );

  /* --------------------------------------------- step 3: review and pay */
  if (step === "review") {
    return shell(
      <>
        {header}

        <form
          onSubmit={handlePlaceOrder}
          className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8"
        >
          <div className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/[0.03]">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3.5">
                <h2 className="text-xs font-bold uppercase tracking-wide text-gray-900">
                  Address (1)
                </h2>
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="text-xs font-bold uppercase tracking-wide text-gray-900 underline decoration-gray-400 underline-offset-2 transition hover:decoration-gray-900"
                >
                  Change
                </button>
              </div>

              <dl className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[80px_1fr]">
                <dt className="font-bold text-gray-900">Home</dt>
                <dd className="text-gray-600">
                  <span className="font-bold text-gray-900">{address.name}.</span>{" "}
                  {formatAddress(address)}
                </dd>
                <dt className="font-bold text-gray-900">Mobile</dt>
                <dd className="text-gray-600">{address.mobile}</dd>
              </dl>
            </div>

            {/* Delivery mode. Folds away once payment opens, so the section
                being worked on is the one in view. */}
            <Section
              title="Delivery mode selection"
              open={deliveryOpen}
              onToggle={() => setDeliveryOpen((open) => !open)}
            >
              {/* One mode, so it is a statement rather than a choice — a radio
                  group of one would only pretend to offer an alternative. */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-900 bg-white px-4 py-3">
                <span className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-gray-900">
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-gray-900 text-white">
                    <FiCheck size={11} />
                  </span>
                  Standard delivery
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  In 4 days · Free
                </span>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                <p className="border-b border-gray-200 bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-900">
                  Standard delivery{" "}
                  <span className="font-semibold text-gray-500">
                    ({count} {count === 1 ? "item" : "items"})
                  </span>
                </p>
                <div className="flex flex-wrap gap-4 bg-white px-4 py-4">
                  {items.map((item) => (
                    <div key={item.id} className="w-20">
                      <div className="h-25 w-20 overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] font-bold text-gray-900">
                        {estimate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Not collapsible, so no disclosure arrow: this is the one part of
                the page that always has to be filled in. */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/[0.03]">
              <h2 className="border-b border-gray-200 px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-gray-900">
                Payment
              </h2>
              <div className="px-5 py-4">
                <PaymentMethods
                  state={payment}
                  onChange={(next) => {
                    setPayment(next);
                    // The message belonged to the previous selection.
                    setPaymentError(null);
                  }}
                  amountLabel={totalLabel}
                />
              </div>
            </div>
          </div>

          {/* One label for every method — the button places the order however
              it is being paid for, so naming the method here would only be a
              second thing to keep in sync with the tab rail. */}
          {summary(
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black"
            >
              Place Order
              <FiChevronRight size={16} />
            </button>,
          )}
        </form>

        {/* Outside the form, so its dismiss button can never submit anything */}
        {paymentError && (
          <AlertDialog
            message={paymentError}
            onClose={() => setPaymentError(null)}
          />
        )}
      </>,
      { label: "Back to bag", onClick: onBack },
    );
  }

  /* ------------------------------------------------------ step 2: address */
  return shell(
    <>
      {header}

      {/* One form spanning both columns, so the summary's button can submit the
          address fields and get the browser's required-field validation. */}
      <form
        onSubmit={handleAddressSubmit}
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8"
      >
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/[0.03]">
            <div className="flex items-baseline justify-between gap-3 border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-gray-900">
                Add address
              </h2>
              <span className="truncate text-xs text-gray-400">
                Signed in as {user.email}
              </span>
            </div>

            {/* Grouped the way the fields are actually filled in — a flat grid
                of eight boxes reads as a wall rather than a form. */}
            <fieldset className="px-5 pt-4">
              <legend className="text-sm font-bold text-gray-900">
                Contact details
              </legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  required
                  value={address.name}
                  onChange={setField("name")}
                  autoComplete="name"
                  placeholder={user.name}
                />
                <Field
                  label="Mobile number"
                  required
                  value={address.mobile}
                  onChange={setField("mobile")}
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  title="10 digits"
                  placeholder="10 digits"
                />
              </div>
            </fieldset>

            <fieldset className="mt-5 border-t border-gray-200 px-5 pb-5 pt-4">
              <legend className="text-sm font-bold text-gray-900">Address</legend>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field
                  label="House / Flat no, Floor"
                  value={address.house}
                  onChange={setField("house")}
                  autoComplete="address-line2"
                />
                <Field
                  label="Address"
                  required
                  value={address.street}
                  onChange={setField("street")}
                  autoComplete="address-line1"
                />
                <Field
                  label="Locality / Town"
                  value={address.locality}
                  onChange={setField("locality")}
                  autoComplete="address-level3"
                />
                <Field
                  label="Pincode"
                  required
                  value={address.pincode}
                  onChange={setField("pincode")}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  title="6 digits"
                  placeholder="6 digits"
                />
                <Field
                  label="City"
                  required
                  value={address.city}
                  onChange={setField("city")}
                  autoComplete="address-level2"
                />
                <Field
                  label="State"
                  required
                  value={address.state}
                  onChange={setField("state")}
                  autoComplete="address-level1"
                />
              </div>
            </fieldset>

            <p className="flex items-center gap-2 border-t border-gray-200 px-5 py-3.5 text-xs text-gray-500">
              <FiTruck size={13} className="flex-shrink-0" />
              Estimated delivery by{" "}
              <span className="font-semibold text-gray-900">{estimate}</span>
            </p>
          </div>
        </div>

        {summary(
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black"
          >
            Checkout
            <FiChevronRight size={16} />
          </button>,
        )}
      </form>
    </>,
    { label: "Back to bag", onClick: onBack },
  );
}

type AlertDialogProps = {
  message: string;
  onClose: () => void;
};

/**
 * A small modal for a refused action. `alertdialog` rather than `dialog`: it is
 * telling the buyer something went wrong, not asking them for anything, so
 * screen readers should announce it immediately.
 */
function AlertDialog({ message, onClose }: AlertDialogProps) {
  const dismissRef = useRef<HTMLButtonElement>(null);

  // Focus the only control, so Enter or Space dismisses without reaching first.
  useEffect(() => {
    dismissRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="checkout-alert-message"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm animate-[modal-in_0.25s_ease-out] overflow-hidden rounded-3xl bg-white px-7 pb-7 pt-8 text-center shadow-2xl"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white">
          <FiAlertCircle size={22} />
        </span>

        <p
          id="checkout-alert-message"
          className="mt-4 text-base font-bold leading-snug text-gray-900"
        >
          {message}
        </p>

        <button
          ref={dismissRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-gray-900 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-black"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

type SectionProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

/** A collapsible card, used for the delivery and payment blocks. */
function Section({ title, open, onToggle, children }: SectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-900">
          {title}
        </h2>
        <span className="text-gray-500">
          {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-5 py-4">{children}</div>
      )}
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric";
  pattern?: string;
  title?: string;
};

/** One labelled text input, styled to match the auth form's inputs. */
function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  autoComplete,
  inputMode,
  pattern,
  title,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-500">
        {label}
        {required && <span className="text-gray-900"> *</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        title={title}
        className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
      />
    </label>
  );
}

export default Checkout;
