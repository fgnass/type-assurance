# 🛡️ type-assurance

![npm bundle size](https://deno.bundlejs.com/badge?q=type-assurance)

Super [lightweight](https://bundlephobia.com/package/type-assurance) TypeScript library to perform type checks at runtime.

- Does only one thing: runtime type checking
- Provides type guards and type assertions
- Intuitive schema definition based on language literals
- 100% test coverage

## Example

Let's start with a simple example:

```ts
import { assert } from "type-assurance";

const userSchema = {
  name: String;
  email: String;
};

const user = await api.getUser(23);

// Throw if types don't match
assert(user, userSchema);

// The compiler now knows the type ...
console.log(user.name);
```

We can also infer a static TypeScript type from the runtime schema:

```ts
import { TypeFromSchema } from "type-assurance";

type User = TypeFromSchema<typeof userSchema>;
```

This yields the same type as if we had written it by hand:

```ts
type User = {
  name: string;
  email: string;
};
```

Sometimes all you need is a quick inline type-check. Use `is` instead of `assert` which acts as a type-guard:

```ts
import { is } from "type-assurance";

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
  // has the expected shape and the compiler
  // now knows about the types...
}
```

## Installation

You can install the package from [npm](npmjs.com/package/type-assurance):

```
npm install type-assurance
```

🦕 The package is also published under https://deno.land/x/typeassurance for use with Deno.

## Usage

The package exports the following main functions:

- `is(value, schema)` – returns `true` if the value matches the schema. The return type is a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) that narrows the type down to the one described by the schema.
- `assert(value, schema)` – throws a `TypeError` if the value does not match the schema. It is an [assertion function](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions) that narrows the type down to the one described by the schema.
- `typeGuard(schema)` – returns a function that can be used as type guard for the given schema.

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
import { typeGuard } from "type-assurance";

const isUser = typeGuard({
  post: {
    id: Number,
    author: {
      name: String,
    },
  },
});

const data = JSON.parse(`{
  "post": {
    "id": 23,
    "author": {
      "name": "Felix"
    }
  }
}`);

if (isUser(data)) {
  // data.post.author.name is a string ✅
}
```

### Instances

You can use constructor functions as schema to check if an object is an instance of that type:

```ts
assert(data, {
  now: Date,
  pattern: RegExp,
});
```

This also works for classes:

```ts
class Person {
  constructor(public name: string) {
  }
}

const data: unknown = {
  user: new Person("Felix");
}

if (is(data, { user: Person })) {
  // data.user is a Person
};
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
assert(data, [Number]);
// data is of type number[]
```

### Tuples

For tuples, provide an array with more than one item:

```ts
assert(value, [Number, String, Boolean]);
// value[0] is a number
// value[1] is a string
// value[2] is a boolean
```

### Custom type guards

You can also use type guard functions as (nested) schemas:

```ts
/**
 * Type guard to test if the given value is SomeFancyType.
 */
function isSomeFancyType(v: unknown): v is SomeFancyType {
  // custom check goes here ...
}

assert(data, {
  id: Number,
  body: isSomeFancyType,
});
```

### Literals

Finally, specific strings, numbers or boolean values are treated as [literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types):

```ts
const personSchema = {
  type: "person",
  name: String
} as const;

const dogSchema = {
  type: "dog",
  name: String,
  breed: String,
}

if (is(data, dog)) {
  console.log(data.name "is a cute", data.breed);
}
```

### Record Types

It's also possible to use `record` passing the type for the key and value:

```ts
assert(value, record(String, String));
// value.foo is a string
```

### Union Types

The package exports a `union` function to check if a value is of either of the given types:

```ts
import { union } from "type-assurance";

const taskSchema = {
  title: String,
  status: union("pending", "active", "done"),
};
```

### Optional properties

You can use the `optional` helper for properties that aren't required:

```ts
import { optional } from "type-assurance";

const personSchema = {
  name: String
  address: optional(String)
};
```

### Infer the type from a schema

You can convert a runtime schema into a static type:

```ts
import { TypeFromSchema } from "type-assurance";

const PersonSchema = {
  name: String;
  age: Number;
}

type Person = TypeFromSchema<typeof PersonSchema>;

```

# License

MIT
