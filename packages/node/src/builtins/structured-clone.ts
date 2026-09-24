import { sure } from "@sigur/core";

/**
 * Result-returning {@link globalThis.structuredClone}.
 *
 * **Why wrap:** cloning throws (`DataCloneError` / `TypeError`) for functions,
 * DOM nodes, and other non-structured-cloneable values. Wrapping yields `Result`
 * instead of try/catch at every call site.
 */
export const structuredClone = sure(globalThis.structuredClone);
