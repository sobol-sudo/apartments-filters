import { apartmentsItems } from "~/entities/apartment/mock";

// The catalogue is small and fully client-filterable, so the endpoint returns
// it whole and the browser does the filtering and sorting.
export default defineEventHandler(() => apartmentsItems);
