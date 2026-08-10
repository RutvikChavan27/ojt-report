import { Router } from "express";
import { getProducts } from "../controllers/listing.controller";
import { getCategories, getHeroLooks } from "../controllers/catalog.controller";
import { getDashboardData } from "../controllers/dashboard.controller";

const router = Router();

// Individual resources (also used by the Shop page / reusable elsewhere)
router.get("/products", getProducts);
router.get("/categories", getCategories);
router.get("/hero-looks", getHeroLooks);

// Convenience aggregate for the Dashboard home page
router.get("/dashboard", getDashboardData);

export default router;
