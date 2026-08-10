import mongoose, { Schema, type InferSchemaType } from "mongoose";

const productSchema = new Schema(
  {
    /** Stable slug used as the public id (e.g. "seersucker-shirt"). */
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    rating: { type: Number, required: true },
    /** Path relative to the API host, e.g. "/images/product-slim-fit-tee.jpg". */
    image: { type: String, required: true },
    brand: { type: String, required: true },
    color: { type: String, required: true },
    variantCount: { type: Number },
    gender: { type: String, enum: ["Men", "Women"], required: true },
    /** Preserves the original hand-authored ordering. */
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export type ProductDoc = InferSchemaType<typeof productSchema>;

export const Product = mongoose.model("Product", productSchema);
