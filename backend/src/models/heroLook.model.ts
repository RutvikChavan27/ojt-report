import mongoose, { Schema, type InferSchemaType } from "mongoose";

const heroLookSchema = new Schema(
  {
    /** Path relative to the API host, e.g. "/images/hero-look-1.jpg". */
    src: { type: String, required: true },
    alt: { type: String, required: true },
    gender: { type: String, enum: ["Men", "Women"], required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export type HeroLookDoc = InferSchemaType<typeof heroLookSchema>;

export const HeroLook = mongoose.model("HeroLook", heroLookSchema);
