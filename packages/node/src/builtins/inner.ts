/**
 * Package-internal access to the native object behind a wrapper.
 *
 * Wrappers keep the native instance in a private `#inner` field for delegation.
 * `#` fields are invisible outside the declaring class, so sibling builtins
 * (`fetch`, `from`, `toNative*`) cannot read them. This module holds one
 * WeakMap keyed by the wrapper instance; constructors call {@link registerInner},
 * and siblings call {@link unwrap}. Not re-exported from `@sigur/node` — there
 * is no public `.native` escape hatch.
 */

const inners = new WeakMap<object, object>();

/** @internal Register native behind a wrapper (`#inner` stays for in-class use). */
export function registerInner(wrapper: object, native: object): void {
  inners.set(wrapper, native);
}

/** @internal Package use only — not part of the public entry. */
export function unwrap<T extends object>(wrapper: object): T {
  const native = inners.get(wrapper);

  if (native === undefined) {
    throw new TypeError("unwrap failed");
  }

  return native as T;
}
