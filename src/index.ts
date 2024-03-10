/**
 * Symbol to mark properties as optional.
 */
const OPTIONAL = Symbol("optional");

/**
 * Runtime type definition.
 */
export type Schema =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ReadonlyArray<Schema>
  | { [prop: string]: Schema }
  | (new (...args: any) => any)
  | ((v: unknown) => boolean)
  | string
  | number
  | boolean
  | null
  | undefined;

/**
 * Type to get the actual type from a schema.
 */
export type TypeFromSchema<T> = T extends StringConstructor
  ? string
  : T extends NumberConstructor
  ? number
  : T extends BooleanConstructor
  ? boolean
  : T extends ReadonlyArray<Schema>
  ? { [P in keyof T]: TypeFromSchema<T[P]> }
  : T extends { [key: string]: Schema }
  ? Expand<OptionalProps<T> & RequiredProps<T>>
  : T extends new (...args: any) => infer R
  ? R
  : T extends (v: unknown) => v is infer R
  ? R
  : T;

/**
 * Recursively expand mapped types for better readability.
 * See https://github.com/microsoft/TypeScript/issues/47980
 */
type Expand<T> = T extends unknown ? { [K in keyof T]: Expand<T[K]> } : never;

/**
 * Extract only the optional props of a schema.
 */
type OptionalProps<T> = {
  -readonly [K in keyof T as T[K] extends { [OPTIONAL]: true }
    ? K
    : never]?: TypeFromSchema<T[K]>;
};

/**
 * Extract only the required props of a schema.
 */
type RequiredProps<T> = {
  -readonly [K in keyof T as T[K] extends { [OPTIONAL]: true }
    ? never
    : K]: TypeFromSchema<T[K]>;
};

/**
 * Type guard to check if a value is a constructor function.
 *
 * NOTE: There is no way to tell wether a constructable function is intended
 * to be called as constructor. This guard therefore checks if the function
 * name starts with an uppercase letter.
 */
function isConstructor(fn: unknown): fn is new (...args: any) => any {
  return (
    typeof fn === "function" &&
    fn.prototype?.constructor === fn &&
    fn.name.charAt(0) === fn.name.charAt(0).toUpperCase()
  );
}

/**
 * Type guard to check if a value is compatible with a given schema.
 */
export function is<const T extends Schema>(
  value: unknown,
  schema: T
): value is TypeFromSchema<T> {
  return diff(value, schema).length === 0;
}

/**
 * Compares a value to a schema and returns all property paths
 * where the data does not match the specified type.
 */
export function diff<const T extends Schema>(
  value: unknown,
  schema: T,
  path = "value"
): Array<string> {
  const t = (v: boolean) => (v ? [] : [path]);
  if (schema === String) return t(typeof value === "string");
  if (schema === Number) return t(typeof value === "number");
  if (schema === Boolean) return t(typeof value === "boolean");
  if (Array.isArray(schema)) {
    if (!Array.isArray(value)) return t(false);
    if (!schema.length) return t(true);
    if (schema.length > 1) {
      // tuple
      const mismatch = value.flatMap((v, i) =>
        diff(v, schema[i], `${path}[${i}]`)
      );
      if (mismatch.length) return mismatch;
      return t(value.length === schema.length);
    } else {
      return value.flatMap((v, i) => diff(v, schema[0], `${path}[${i}]`));
    }
  }
  if (typeof schema === "object" && schema) {
    if (!value || typeof value !== "object") return t(false);
    return Object.keys(schema).flatMap((k) =>
      //@ts-ignore
      diff(value[k], schema[k], `${path}.${k}`)
    );
  }
  if (typeof schema === "function") {
    if (isConstructor(schema)) {
      return t(value instanceof schema);
    } else {
      return t(schema(value));
    }
  }
  return t(value === schema);
}

/**
 * Creates a type guard that checks if a value matches the given schema.
 */
export function typeGuard<const T extends Schema>(schema: T) {
  return (value: unknown): value is TypeFromSchema<T> => is(value, schema);
}

/**
 * Creates a type guard that checks if a value matches any of the given schemas.
 */
export function union<T extends Schema[]>(...schemas: T) {
  return (v: unknown): v is TypeFromSchema<T[number]> =>
    schemas.some((schema) => is(v, schema));
}

/**
 * Creates a type guard that checks if a value either matches the given schema or is undefined.
 * The returned function is marked with the `OPTIONAL` symbol – when used as value inside an
 * object, the property will become optional.
 */
export function optional<T extends Schema>(schema: T) {
  const guard = union(schema, undefined);
  (guard as any).optional = true;
  return guard as typeof guard & { [OPTIONAL]: true };
}

/**
 * Type guard that always returns `true`. Can be used to create schemas
 * where the type of a property does not matter.
 */
export function unknown(v: unknown): v is unknown {
  return true;
}

/**
 * Asserts that a value matches a given schema.
 * @throws TypeError if the value does not match the schema.
 */
export function assert<T extends Schema>(
  value: unknown,
  schema: T
): asserts value is TypeFromSchema<T> {
  const mismatch = diff(value, schema);
  if (mismatch.length) {
    throw new TypeError(`${mismatch[0]} does not match the schema.`);
  }
}
