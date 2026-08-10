import { useState } from "react";
import {
  FiArrowRight,
  FiInstagram,
  FiTwitter,
  FiYoutube,
} from "react-icons/fi";
import Logo from "../common/Logo";

const SHOP_LINKS = [
  { label: "Men", href: "#men" },
  { label: "Women", href: "#women" },
  { label: "New This Week", href: "#new" },
  { label: "Collections", href: "#collections" },
];

const HELP_LINKS = [
  { label: "FAQs", href: "#" },
  { label: "Shipping", href: "#" },
  { label: "Returns", href: "#" },
  { label: "Contact Us", href: "#" },
];

function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="mt-10 border-t border-gray-300">
      {/* Newsletter band */}
      <div className="border-b border-gray-200">
        <div className="mx-auto flex w-full flex-col items-center gap-6 px-6 py-14 text-center sm:px-10 lg:px-16">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Join the drop list
          </h2>
          <p className="max-w-md text-sm text-gray-500">
            First look at new arrivals, restocks, and the occasional
            surprise discount. No spam.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (email.trim()) setSubscribed(true);
            }}
            className="flex w-full max-w-md items-center gap-2 rounded-full border border-gray-300 bg-transparent p-1.5"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              {subscribed ? "Subscribed" : "Subscribe"}
              <FiArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto w-full px-6 py-14 sm:px-10 lg:px-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />

            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
              Everyday essentials with a considered edge — designed to move
              with you, not against you.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
              >
                <FiInstagram size={15} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
              >
                <FiTwitter size={15} />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-400 hover:text-gray-900"
              >
                <FiYoutube size={15} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              Shop
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-600">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="transition hover:text-gray-900">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              Help
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-600">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="transition hover:text-gray-900">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
              Visit
            </h3>
            <p className="mt-5 text-sm leading-6 text-gray-600">
              12 Market Street
              <br />
              Studio 4B
              <br />
              Mon–Sat, 10am–7pm
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto flex w-full flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-gray-500 sm:flex-row sm:px-10 lg:px-16">
          <p>© 2024 Thread. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-gray-900">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
