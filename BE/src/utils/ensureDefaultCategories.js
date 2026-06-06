const Category = require("../models/Category.js");
const { DEFAULT_CATEGORIES } = require("./defaultCategories.js");

const ensureDefaultCategories = async () => {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      Category.updateOne(
        { slug: category.slug },
        {
          $set: {
            categoryName: category.categoryName,
            slug: category.slug,
            order: category.order,
            isActive: true,
          },
        },
        { upsert: true },
      ),
    ),
  );
};

module.exports = {
  ensureDefaultCategories,
};
