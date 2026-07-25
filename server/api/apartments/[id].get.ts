import { apartmentsItems } from "~/entities/apartment/mock";

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, "id"));

  const apartment = Number.isInteger(id)
    ? apartmentsItems.find((item) => item.id === id)
    : undefined;

  // A real 404 rather than a 200 with an empty body: the detail page renders a
  // not-found state from it, and crawlers get the truth.
  if (!apartment) {
    throw createError({
      statusCode: 404,
      statusMessage: "Apartment not found",
    });
  }

  return apartment;
});
