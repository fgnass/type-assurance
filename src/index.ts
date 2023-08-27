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

export type TypeFromSchema<T> = T extends StringConstructor
  ? string
  : T extends NumberConstructor
  ? number
  : T extends BooleanConstructor
  ? boolean
  : T extends ReadonlyArray<Schema>
  ? { [P in keyof T]: TypeFromSchema<T[P]> }
  : T extends { [key: string]: Schema }
  ? { -readonly [P in keyof T]: TypeFromSchema<T[P]> }
  : T extends new (...args: any) => infer R
  ? R
  : T extends (v: unknown) => v is infer R
  ? R
  : T;

function isConstructor(fn: unknown): fn is new (...args: any) => any {
  return typeof fn === "function" && fn.prototype?.constructor === fn;
}

export function is<const T extends Schema>(
  value: unknown,
  schema: T
): value is TypeFromSchema<T> {
  if (schema === String) return typeof value === "string";
  if (schema === Number) return typeof value === "number";
  if (schema === Boolean) return typeof value === "boolean";
  if (Array.isArray(schema)) {
    if (!Array.isArray(value)) return false;
    if (!schema.length) return true;
    if (schema.length > 1) {
      // tuple
      return (
        value.length === schema.length &&
        value.every((v, i) => is(v, schema[i]))
      );
    } else {
      return value.every((v) => is(v, schema[0]));
    }
  }
  if (typeof schema === "object" && schema) {
    if (!value || typeof value !== "object") return false;
    // @ts-ignore
    return Object.keys(schema).every((k) => is(value[k], schema[k]));
  }
  if (typeof schema === "function") {
    if (isConstructor(schema)) {
      return value instanceof schema;
    } else {
      return schema(value);
    }
  }

  return value === schema;
}

export function union(...schemas: Schema[]) {
  return (v: unknown) => schemas.some((schema) => is(v, schema));
}

export function optional(schema: Schema) {
  return union(schema, undefined);
}

export function assert<T extends Schema>(
  value: unknown,
  schema: T
): asserts value is TypeFromSchema<T> {
  if (!is(value, schema)) {
    throw new TypeError();
  }
}
