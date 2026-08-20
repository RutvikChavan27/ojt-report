import { FiMapPin } from "react-icons/fi";
import { CITY_NAMES } from "../../data/marketplace";

type LocationSelectorProps = {
  value: string | null;
  onChange: (city: string | null) => void;
  className?: string;
};

/**
 * City picker. City-level only — the brief rules out map views and radius
 * search, so there is nothing finer to offer and pretending otherwise would
 * imply a precision the data does not have.
 */
function LocationSelector({
  value,
  onChange,
  className = "",
}: LocationSelectorProps) {
  return (
    <label
      className={`flex items-center gap-2 rounded-full border border-taupe bg-mist px-3.5 py-2 transition-all duration-200 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 ${className}`}
    >
      <FiMapPin size={16} className="flex-shrink-0 text-charcoal-400" />
      <span className="sr-only">Location</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="min-w-0 flex-1 bg-transparent text-sm text-charcoal-900 outline-none"
      >
        <option value="">All India</option>
        {CITY_NAMES.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LocationSelector;
