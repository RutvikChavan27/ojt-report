import { Router } from "express";
import { getProducts } from "../controllers/listing.controller";
import { getCategories, getHeroLooks } from "../controllers/catalog.controller";
import { getDashboardData } from "../controllers/dashboard.controller";
import { getSearchResults } from "../controllers/search.controller";
import {
  getListingById,
  getListingCategories,
  getListings,
  getListingSearch,
} from "../controllers/marketplace.controller";

const router = Router();

// Marketplace listings (the 100k searchable table).
router.get("/search/listings", getListingSearch);
router.get("/listings", getListings);
router.get("/listings/:id", getListingById);
router.get("/listing-categories", getListingCategories);

// Individual resources (also used by the Shop page / reusable elsewhere)
router.get("/products", getProducts);
router.get("/categories", getCategories);
router.get("/hero-looks", getHeroLooks);
router.get("/search", getSearchResults);

// Convenience aggregate for the Dashboard home page
router.get("/dashboard", getDashboardData);

export default router;
