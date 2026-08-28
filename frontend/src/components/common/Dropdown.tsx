import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { FiChevronDown } from "react-icons/fi";

/**
 * The one dropdown look, used everywhere something opens a list of choices —
 * a menu (Categories, the account menu, the searches menu) or a native
 * `<select>` (sort, location, a form's category/condition/city picker).
 *
 * Both share the same trigger chrome: a `cyan-500` border visible at rest
 * (not only once opened or focused), the same light `bg-mist` wash Button's
 * `outline` variant uses, and a chevron. Before this, three different custom
 * menus each hand-rolled their own open/outside-click/Escape handling
 * (verbatim near-duplicates of each other), and native selects were styled
 * two different ways depending on which page they were on — see
 * `DropdownMenu` and `Select` below for the two shapes that replace both.
 */

const TRIGGER_BASE =
  "flex items-center gap-2 rounded-full border border-cyan-500 bg-mist text-sm font-semibold text-charcoal-900 shadow-md shadow-cyan-500/20 transition-all duration-200 ease-out motion-reduce:transform-none";

/** Exported so a trigger that can't be a plain `<button>`/`<label>` (rare) can still match exactly. */
export const dropdownTriggerClassName = (open?: boolean) =>
  `${TRIGGER_BASE} h-11 pl-4 pr-4${open ? " bg-mist-dark" : ""}`;

export type DropdownMenuProps = {
  /** The clickable trigger's own content — an icon, a label, whatever the caller needs; the surrounding chrome and chevron are added here. */
  label: ReactNode;
  /** A leading icon badge, e.g. the grid icon on Categories — kept as its own slot since not every trigger has one. */
  icon?: ReactNode;
  /** The menu's contents, as a function of `close` — so an item's own onClick can dismiss the menu the same way `closeAll` used to. */
  panel: (state: { close: () => void }) => ReactNode;
  /** Extra classes for the panel itself (width, grid layout, ...) — the border/background/shadow/animation stay fixed. */
  panelClassName?: string;
  align?: "left" | "right";
  className?: string;
  "aria-label"?: string;
};

/**
 * A button that opens a positioned panel underneath it — Categories, the
 * account menu, the saved-searches menu.
 *
 * Owns the part that used to be copied three times almost verbatim: open
 * state, closing on an outside click, closing on Escape, and the panel's
 * chrome/entrance animation. What varies per caller (trigger content, panel
 * content, panel width) is everything this component takes as props.
 */
export function DropdownMenu({
  label,
  icon,
  panel,
  panelClassName,
  align = "right",
  className,
  "aria-label": ariaLabel,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={ariaLabel}
        className={dropdownTriggerClassName(open)}
      >
        {icon}
        {label}
        <FiChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 rounded-2xl border border-taupe bg-mist p-2 shadow-xl shadow-charcoal-900/5 animate-[dropdown-in_160ms_ease-out] motion-reduce:animate-none ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName ?? ""}`}
        >
          {panel({ close })}
        </div>
      )}
    </div>
  );
}

/** Shared by every `DropdownMenu` panel's own links/buttons — kept exported so a panel item matches exactly without redeclaring it. */
export const dropdownItemClassName =
  "block rounded-xl px-3 py-2 text-sm text-charcoal-700 transition hover:bg-sand hover:text-charcoal-900";

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> & {
  /** A leading icon (e.g. a location pin) — the wrapper's own slot, not the select's. */
  icon?: ReactNode;
  /** Named distinctly from the native `size` attribute (a character-width hint, not used here). */
  size?: "sm" | "md";
  /** Classes for the wrapping `<label>` — width, responsive display, etc. The border/background/height stay fixed. */
  wrapperClassName?: string;
};

const SELECT_SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-4 text-sm",
};

/**
 * A native `<select>` with the same trigger chrome as `DropdownMenu` — a
 * `<select>` already handles its own open/close and keyboard behaviour, so
 * this only supplies the look, not the interaction logic `DropdownMenu`
 * needs for a custom panel.
 */
export function Select({
  icon,
  size = "md",
  wrapperClassName,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <label
      className={`flex items-center gap-2 rounded-full border border-cyan-500 bg-mist transition-all duration-200 focus-within:ring-2 focus-within:ring-cyan-500/20 ${SELECT_SIZE_CLASSES[size]} ${wrapperClassName ?? ""}`}
    >
      {icon}
      <select
        className={`min-w-0 flex-1 cursor-pointer bg-transparent font-semibold text-charcoal-900 outline-none ${className ?? ""}`}
        {...rest}
      >
        {children}
      </select>
      <FiChevronDown size={14} className="pointer-events-none flex-shrink-0 text-charcoal-400" />
    </label>
  );
}
