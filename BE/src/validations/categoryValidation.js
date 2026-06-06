const { validationSuccess, normalizeText } = require("./commonValidation.js");

const normalizeCategoryPayload = (body = {}) =>
  validationSuccess({
    categoryName: normalizeText(body.categoryName),
    slug: normalizeText(body.slug),
    icon: body.icon,
    description: body.description,
    image: body.image,
    order: body.order,
  });

const normalizeCategoryUpdatePayload = (body = {}) => {
  const data = {};

  if (body.categoryName !== undefined) data.categoryName = normalizeText(body.categoryName);
  if (body.slug !== undefined) data.slug = normalizeText(body.slug);
  if (body.icon !== undefined) data.icon = body.icon;
  if (body.description !== undefined) data.description = body.description;
  if (body.image !== undefined) data.image = body.image;
  if (body.order !== undefined) data.order = body.order;

  return validationSuccess(data);
};

module.exports = {
  normalizeCategoryPayload,
  normalizeCategoryUpdatePayload,
};
