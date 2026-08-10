import mongoose, { Schema, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    label: { type: String, required: true },
    /** Path relative to the API host, e.g. "/images/category-women-tops.jpg". */
    image: { type: String, required: true },
    gender: { type: String, enum: ["Men", "Women"], required: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export type CategoryDoc = InferSchemaType<typeof categorySchema>;

export const Category = mongoose.model("Category", categorySchema);
