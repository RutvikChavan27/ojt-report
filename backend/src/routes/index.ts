import { Router } from "express";
import {
  getDashboardData,
  getListingById,
  getListingCategories,
  getListings,
  getListingSearch,
  getSearchSuggestions,
  postListingImages,
} from "../controllers/marketplace.controller";
import {
  getMyListings,
  patchListing,
  postListing,
  postListingRenew,
  postListingSold,
  removeListing,
} from "../controllers/listing.controller";
import { requireAuth, requireListingOwner } from "../middleware/auth.middleware";

/**
 * Marketplace API routes.
 *
 * Everything that reads is open: browsing, searching and opening a listing need
 * no account, so none of it sits behind a guard. Auth lives on its own router
 * at /api/auth.
 *
 * The one write here is the photo upload, which puts files on disk and so needs
 * a session. When create/edit/delete/mark-sold/renew arrive they belong beside
 * it — each behind `requireAuth`, and anything touching an existing listing
 * also behind `requireListingOwner`, which is the server-side form of "only the
 * seller who created a listing may change it".
 */
const router = Router();

// Everything the homepage renders, in one round trip.
router.get("/dashboard", getDashboardData);

// Marketplace listings.
// Before "/search/listings" is irrelevant — distinct paths — but grouped with it
// because both are the search surface.
router.get("/search/suggest", getSearchSuggestions);
router.get("/search/listings", getListingSearch);
router.get("/listings", getListings);
// Before "/listings/:id", or "mine" is read as an id and 404s.
router.get("/listings/mine", requireAuth, getMyListings);
router.get("/listings/:id", getListingById);
router.get("/listing-categories", getListingCategories);

// Photos are uploaded before the listing they will belong to exists, so this
// takes no listing id and only requires a session.
router.post("/listings/images", requireAuth, postListingImages);

/* Writes. Creating needs only a session — seller_id is taken from it, never
   from the body. Everything that touches an existing listing also passes
   requireListingOwner, which answers 403 when the session's user is not the
   listing's seller_id and 404 when the listing does not exist. That middleware
   is the enforcement point; the React buttons are a convenience on top of it. */
router.post("/listings", requireAuth, postListing);
router.patch("/listings/:id", requireAuth, requireListingOwner, patchListing);
router.delete("/listings/:id", requireAuth, requireListingOwner, removeListing);
router.post("/listings/:id/sold", requireAuth, requireListingOwner, postListingSold);
router.post("/listings/:id/renew", requireAuth, requireListingOwner, postListingRenew);

export default router;
