import { Link, useNavigate } from "react-router-dom";
import Container from "../../components/layout/Container";
import { FiBookmark, FiHeart, FiList, FiLogOut, FiUser } from "react-icons/fi";
import { MY_LISTINGS } from "../../data/marketplace";
import { useAuth } from "../../store/AuthContext";
import { useSavedListings } from "../../store/SavedListingsContext";
import { useSavedSearches } from "../../store/SavedSearchesContext";
import BackLink from "../../components/common/BackLink";

/**
 * The signed-in user's own page: who they are, and the counts that lead into
 * their listings, saved items and saved searches.
 */
function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { count: savedCount } = useSavedListings();
  const { searches } = useSavedSearches();

  // RequireAuth already guarantees a session; this only satisfies the type.
  if (!user) return null;

  const tiles = [
    {
      to: "/my-listings",
      icon: <FiList size={18} />,
      label: "My listings",
      value: MY_LISTINGS.filter((listing) => listing.status === "active").length,
      caption: "active",
    },
    {
      to: "/saved",
      icon: <FiHeart size={18} />,
      label: "Saved listings",
      value: savedCount,
      caption: "saved",
    },
    {
      to: "/saved-searches",
      icon: <FiBookmark size={18} />,
      label: "Saved searches",
      value: searches.length,
      caption: "tracked",
    },
  ];

  return (
    <Container className="py-8" narrow="md">
      <BackLink className="mb-4" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
            <FiUser size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black tracking-tight text-gray-900">
              {user.name}
            </h1>
            <p className="truncate text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate("/home");
          }}
          className="mt-5 flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-900 transition hover:border-gray-900"
        >
          <FiLogOut size={14} />
          Log out
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.05] text-gray-900">
              {tile.icon}
            </span>
            <p className="mt-3 text-2xl font-black tracking-tight text-gray-900">
              {tile.value}
            </p>
            <p className="text-xs text-gray-400">{tile.caption}</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{tile.label}</p>
          </Link>
        ))}
      </div>
    </Container>
  );
}

export default Profile;
