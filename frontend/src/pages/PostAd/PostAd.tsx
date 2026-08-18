import { useEffect, useRef, useState } from "react";
import Container from "../../components/layout/Container";
import { Link } from "react-router-dom";
import { FiCheck, FiImage, FiPlus, FiX } from "react-icons/fi";
import {
  createListing,
  fetchCategories,
  uploadListingImages,
  MAX_LISTING_PHOTOS,
} from "../../lib/api";
import { useApi } from "../../hooks/useApi";
import { useConfirm } from "../../store/ConfirmContext";
import BackLink from "../../components/common/BackLink";

/** Matches the server's own cap, so the form refuses before uploading. */
const MAX_PHOTOS = MAX_LISTING_PHOTOS;

/** The conditions the `listing_condition` enum accepts, in the server's wording. */
const CONDITIONS = ["New with tags", "Like new", "Good", "Fair"] as const;
type Condition = (typeof CONDITIONS)[number];

/** Cities to offer. Free text is allowed too, so this is a convenience only. */
const CITY_NAMES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune",
  "Chennai", "Kolkata", "Ahmedabad", "Jaipur",
];

/** `file` is kept so the image can be uploaded on submit. */
type Photo = { id: string; name: string; url: string; file: File };

/**
 * The posting form.
 *
 * Photos are previewed locally from object URLs while the form is filled in,
 * then uploaded on submit — a half-written form must not leave files on the
 * server. Submit is a two-step exchange: upload the photos, then create the
 * listing with the paths that come back.
 *
 * `seller_id` is never sent. The server takes ownership from the session, which
 * is what stops a caller posting an advert in someone else's name.
 */
function PostAd() {
  const { data: categories } = useApi(() => fetchCategories(), []);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [postedId, setPostedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  /* Object URLs hold a reference to the file until revoked, so release them
     when the component goes away or the photos change. */
  useEffect(
    () => () => photos.forEach((photo) => URL.revokeObjectURL(photo.url)),
    [photos],
  );

  const addPhotos = (files: FileList | null) => {
    if (!files) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const accepted = [...files]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, room);

    if (accepted.length === 0) {
      setError("Those files are not images.");
      return;
    }

    setError(null);
    setPhotos((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      })),
    ]);
  };

  const removePhoto = (id: string) =>
    setPhotos((current) => current.filter((photo) => photo.id !== id));

  /**
   * Uploads the photos, then creates the listing with the paths returned.
   *
   * Two calls rather than one multipart submit: the upload endpoint already
   * exists and validates type, size and count on its own, and keeping listing
   * creation as plain JSON means the server never has to parse a file to find
   * out the title was blank.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (photos.length === 0) {
      setError("Add at least one photo — listings without photos rarely sell.");
      return;
    }

    /* Asked after validation, not before: there is no point confirming a form
       that is about to be rejected for a missing photo. */
    const ok = await confirm({
      title: "Post this listing?",
      message: "It will appear in search results straight away. You can edit or delete it afterwards from My listings.",
      confirmLabel: "Post listing",
    });
    if (!ok) return;

    setError(null);
    setSubmitting(true);

    try {
      const uploaded = await uploadListingImages(photos.map((photo) => photo.file));

      const listing = await createListing({
        title,
        description,
        category,
        condition,
        price: Number(price),
        city,
        location: area || undefined,
        images: uploaded.map((image) => image.path),
      });

      setPostedId(listing.id);
    } catch (err) {
      // The server's wording is written to be read, so show it as-is. A 401
      // surfaces here too, which is what an expired session looks like.
      setError(err instanceof Error ? err.message : "Could not post the listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10";
  const label = "text-xs font-semibold text-gray-500";

  if (postedId) {
    return (
      <Container className="py-16" narrow="md">
        <div className="rounded-2xl border border-gray-200 bg-black/[0.03] px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white">
            <FiCheck size={24} />
          </span>
          <h1 className="mt-5 text-xl font-black tracking-tight text-gray-900">
            Your listing is live
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
            It is saved and now appears in search, its category, and your
            listings. You can edit or remove it at any time.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to={`/listing/${postedId}`}
              className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
            >
              View listing
            </Link>
            <Link
              to="/my-listings"
              className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-bold text-gray-900 transition hover:border-gray-900"
            >
              Go to my listings
            </Link>
            <button
              type="button"
              onClick={() => {
                setPostedId(null);
                setPhotos([]);
                setTitle("");
                setDescription("");
                setCategory("");
                setPrice("");
                setCondition("");
                setCity("");
                setArea("");
              }}
              className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-bold text-gray-900 transition hover:border-gray-900"
            >
              Post another
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8" narrow="md">
      <BackLink className="mb-4" />

      <h1 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
        Sell Something
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Add a few clear photos and an honest description — those two things sell
        an item faster than the price.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Photos */}
        <fieldset className="rounded-2xl border border-gray-200 bg-black/[0.03] p-5">
          <legend className="px-1 text-sm font-bold text-gray-900">
            Photos
          </legend>
          <p className="text-xs text-gray-500">
            Up to {MAX_PHOTOS}. The first one is used as the cover.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="h-full w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-gray-900 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label={`Remove ${photo.name}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-gray-900 transition hover:scale-105"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-gray-900 hover:text-gray-900"
              >
                <FiImage size={20} />
                <span className="text-[11px] font-semibold">Add photo</span>
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              addPhotos(event.target.files);
              // Reset, so picking the same file twice still fires a change.
              event.target.value = "";
            }}
            className="hidden"
          />
        </fieldset>

        {/* Details */}
        <fieldset className="rounded-2xl border border-gray-200 bg-black/[0.03] p-5">
          <legend className="px-1 text-sm font-bold text-gray-900">
            Item details
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={label}>
                Title <span className="text-gray-900">*</span>
              </span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={80}
                placeholder="e.g. iPhone 15 128GB"
                className={field}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={label}>
                Description <span className="text-gray-900">*</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={5}
                maxLength={2000}
                placeholder="Condition, age, what is included, why you are selling…"
                className={`${field} resize-y`}
              />
            </label>

            <label className="block">
              <span className={label}>
                Category <span className="text-gray-900">*</span>
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                className={field}
              >
                <option value="">Choose a category</option>
                {(categories ?? []).map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={label}>
                Condition <span className="text-gray-900">*</span>
              </span>
              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value as Condition)
                }
                required
                className={field}
              >
                <option value="">Choose a condition</option>
                {CONDITIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={label}>
                Price (₹) <span className="text-gray-900">*</span>
              </span>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                placeholder="0 for free or negotiable"
                className={field}
              />
            </label>
          </div>
        </fieldset>

        {/* Location */}
        <fieldset className="rounded-2xl border border-gray-200 bg-black/[0.03] p-5">
          <legend className="px-1 text-sm font-bold text-gray-900">
            Location
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>
                City <span className="text-gray-900">*</span>
              </span>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
                className={field}
              >
                <option value="">Choose a city</option>
                {CITY_NAMES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={label}>
                Area <span className="text-gray-900">*</span>
              </span>
              <input
                type="text"
                value={area}
                onChange={(event) => setArea(event.target.value)}
                required
                placeholder="e.g. Kothrud"
                className={field}
              />
            </label>
          </div>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-gray-900 bg-black/[0.03] px-4 py-3 text-sm font-semibold text-gray-900"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black"
        >
          <FiPlus size={16} />
          Post listing
        </button>
      </form>
    </Container>
  );
}

export default PostAd;
