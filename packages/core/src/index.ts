/**
 * @sigurjs/core — errors as values.
 *
 * - {@link Result} — extract the value, extract the error, or return upstream
 * - {@link sure} — unsure (throwing) function → Result-returning function
 * - {@link ResultAsync} — await to a {@link Result}
 *
 * @packageDocumentation
 */
export {
  Err,
  ErrResult,
  Ok,
  OkResult,
  Result,
} from "./result.ts";
export { ResultAsync } from "./result-async.ts";
export { type SureOptions, sure, toError } from "./sure.ts";
