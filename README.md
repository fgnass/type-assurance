# 🛡️ type-assurance

![npm bundle size](https://img.shields.io/bundlephobia/min/type-assurance)

Super lightweight (< 1KB) TypeScript library to perform type checks at runtime.

- [x] Tired of writing long expressions to narrow your types?
- [x] You don't want to blow up your bundle size by adding some huge validation library?
- [x] Your type checks should be easy to understand by anyone reading your code?

If you've ticked any of the boxes above, take a look at the following example to see what `type-assurance` has to offer:

## Example

Let's assume we've got some data from a remote source. With the following runtime check we can make sure that the data has the expected shape and at the same time let the TypeScript compiler infer the correct typings:

```ts
if (
  is(data, {
    body: {
      posts: [
        {
          id: Number,
          title: String,
        },
      ],
    },
  })
) {
  // We can now be certain that the given data
  // has the expected shape and the TypeScript
  // compiler now knows the correct types...
}
```

## Usage

The package exports the following main functions:

- `is(value, schema)` – returns `true` if the value matches the schema. The return type is a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) that narrows the type down to the one described by the schema.
- `assert(value, schema)` – throws a `TypeError` if the value does not match the schema. It is an [assertion function](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions) that narrows the type down to the one described by the schema.

The schema that is passed to both these functions looks like an example or blueprint of the expected type. It can be a deeply nested object or just a single value.

### Primitives

You can use `String`, `Number` or `Boolean` as schema for primitive types:

```ts
is(42, Number); // ✅ true
is("42", Number); // ❌ false
is("foo", String); // ✅ true
```

This isn't particularly helpful on its own, but it makes sense when used to describe more complex shapes.

### Objects

To specify objects, use an object where each value is again a schema:

```ts
const data = JSON.parse(`{
  "post": {
    "id": 23,
    "author": {
      "name": "Felix"
    }
  }
}`);

if (is(data, { post: { author: { name: String } } })) {
  // data.post.author.name is a string ✅
}
```

### Instances

You can use constructor functions as schema to check if an object is an instance of that type:

```ts
const data: unknown = {
  now: new Date(),
  pattern: /2023/,
}

if (is(data, { now: Date, pattern: RegExp)) {
  now.toISOString().match(pattern);
}
```

This also works for classes:

```ts
class Foo {
  bar = 42;
}

const obj: unknown = new Foo();

if (is(obj, Foo)) {
  // obj.bar is a number
}
```

> **NOTE**: In the very unlikely case that you want to test for `String`, `Number` or `Boolean` _objects_, you have to use a function instead:

```ts
is("foo", String); // ✅ true
is(new String("foo"), String); // ❌ false
is(new String("foo"), (s) => s instanceof String); // ✅ true
```

### Arrays

To specify an array of a certain type, wrap that type in an array:

```ts
const value = JSON.parse(`[1,2,3,4]`);
if (is(value, [Number])) {
  // value is of type number[]
}
```

### Tuples

For tuples, provide a read-only array of schemas using `as const`:

```ts
const value = JSON.parse(`[42, "hello", false]`);

if (is(value, [Number, String, Boolean] as const)) {
  // value[0] is a number
  // value[1] is a string
  // value[2] is a boolean
}
```

### Custom type guards

You can also use type guard functions as (nested) schemas:

```ts
type Person = { name: string; age: number };

/**
 * Type guard to test if the given value is a Person.
 */
function isPerson(v: unknown): v is Person {
  return is(v, { name: String, age: number });
}

assert(family, {
  mom: isPerson,
  dad: isPerson,
  kids: [isPerson],
});
```

### Literals

Finally, specific strings, numbers or boolean values are treated as [literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types):

```ts
const tasks = JSON.parse(`[
  { "name": "First", "status": "active" },
  { "name": "Second", "status": "pending" }
]`);

is(tasks[0], { name: String, status: "pending" }); // ❌ false
is(tasks[1], { name: String, status: "pending" }); // ✅ true
```

### Union Types

The package exports a `union` function to check if a value is of either of the given types:

```ts
import { assert, union } from "type-assurance";

assert(task, { status: union("pending", "active", "done") });

assert(person, { age: union(Number, null))});
```

# License

MIT
