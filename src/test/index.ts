import tap from "tap";
import {
  TypeFromSchema,
  assert,
  diff,
  is,
  optional,
  record,
  typeGuard,
  union,
  unknown,
} from "../index.js";

tap.test("string", async (t) => {
  const s: unknown = "s";
  const isString = is(s, String);
  if (isString) {
    s.startsWith("s");
  }
  t.ok(isString);
});

tap.test("number", async (t) => {
  const s: unknown = 42;
  const isNumber = is(s, Number);
  if (isNumber) {
    s.toFixed(2);
  }
  t.ok(isNumber);
});

tap.test("boolean", async (t) => {
  const s: unknown = true;
  t.ok(is(s, Boolean));
});

tap.test("object", async (t) => {
  const obj: unknown = { name: "aaa", count: 1 };
  const matches = is(obj, { name: String, count: Number });
  if (matches) {
    obj.name.charAt(0);
    obj.count.toFixed(2);
  }
  t.ok(matches);
});

tap.test("null", async (t) => {
  const v: unknown = null;
  t.ok(is(v, null));
  t.notOk(is(v, { name: String }));
});

tap.test("undefined", async (t) => {
  const v: unknown = undefined;
  t.ok(is(v, undefined));
  t.notOk(is(v, null));
});

tap.test("nested object", async (t) => {
  const obj = JSON.parse(`{ "post": { "id": 23 } }`);
  const matches = is(obj, { post: { id: Number } });
  if (matches) {
    obj.post.id.toFixed(2);
  }
  t.ok(matches);
});

tap.test("instance", async (t) => {
  const d: unknown = new Date();
  const matches = is(d, Date);
  if (matches) {
    d.getTime();
  }
  t.ok(matches);
});

tap.test("class instance", async (t) => {
  class Foo {
    bar = 42;
  }
  const foo: unknown = new Foo();
  const matches = is(foo, Foo);
  if (matches) {
    foo.bar;
  }
  t.ok(matches);
});

tap.test("array", async (t) => {
  const a: unknown = [1, 2, 3];
  const matches = is(a, [Number]);
  if (matches) {
    a.map((n) => n.toFixed(2));
  }
  t.ok(matches);
});

tap.test("array item type mismatch", async (t) => {
  const a: unknown = ["a", "b", "c"];
  const matches = is(a, [Number]);
  t.notOk(matches);
});

tap.test("not an array", async (t) => {
  const a: unknown = { 0: "a", 1: "b" };
  const matches = is(a, [String]);
  t.notOk(matches);
});

tap.test("mixed array", async (t) => {
  const a: unknown = ["a", 1, true];
  const matches = is(a, []);
  t.ok(matches);
});

tap.test("tuple", async (t) => {
  const a: unknown = ["A", 2, new Date()];
  const matches = is(a, [String, Number, Date]);
  if (matches) {
    a[0].charAt(0);
    a[1].toFixed(2);
    a[2].getTime();
  }
  t.ok(matches);
  t.notOk(is(a, [String, Number, String]));
});

tap.test("unsupported schema", async (t) => {
  const matches = is("", Symbol() as any);
  t.notOk(matches);
});

tap.test("arrow function", async (t) => {
  t.ok(is("foo", (v: unknown) => typeof v === "string"));
  t.notOk(is("foo", (v: unknown) => typeof v === "number"));
});

tap.test("function declaration", async (t) => {
  function isArray(v: unknown): v is Array<any> {
    return Array.isArray(v);
  }
  t.ok(is([], isArray));
});

tap.test("Array", async (t) => {
  t.ok(is([], Array));
  t.ok(is(["abc", 123], Array));
  t.notOk(is({}, Array));
});

tap.test("Array.isArray", async (t) => {
  t.ok(is([], Array.isArray));
  t.ok(is(["abc", 123], Array.isArray));
  t.notOk(is({}, Array.isArray));
});

tap.test("unknown", async (t) => {
  t.ok(is(23, unknown));
  t.ok(is("abc", unknown));
  t.ok(is([], unknown));
  t.ok(is({}, unknown));
  t.ok(is(undefined, unknown));
  t.ok(is(null, unknown));
});

tap.test("union", async (t) => {
  const a: unknown = { foo: "bar" };
  const b: unknown = { foo: 42 };
  t.ok(is(a, { foo: union(String, Number) }));
  t.ok(is(b, { foo: union(String, Number) }));
  t.notOk(is(a, { foo: union(Boolean, Number) }));
  const isStringOrNumber: (v: unknown) => v is string | number = union(
    String,
    Number
  );
  t.ok(is(23, isStringOrNumber));
  t.ok(is("hello", isStringOrNumber));
  t.notOk(is(false, isStringOrNumber));
});

tap.test("optional", async (t) => {
  const a: unknown = { foo: "foo" };
  const b: unknown = { foo: undefined };
  const c: unknown = {};
  t.ok(is(a, { foo: optional(String) }));
  t.ok(is(b, { foo: optional(String) }));
  t.ok(is(c, { foo: optional(String) }));

  const isStringOrUndefined: (v: unknown) => v is string | undefined =
    optional(String);

  t.ok(is("hello", isStringOrUndefined));
  t.ok(is(undefined, isStringOrUndefined));
  t.notOk(is(23, isStringOrUndefined));
});

tap.test("literal", async (t) => {
  const a: unknown = "foo";
  t.ok(is(a, "foo"));
  t.ok(is(a, union("foo", "bar")));
  t.notOk(is(a, "bar"));
});

tap.test("object with literal", async (t) => {
  const obj: unknown = { name: "aaa", count: 1 };
  const matches = is(obj, { name: "aaa", count: Number });
  if (matches) {
    obj.name.charAt(0);
    obj.count.toFixed(2);
  }
  t.ok(matches);
});

tap.test("assert", async (t) => {
  const obj: unknown = { foo: "foo" };
  assert(obj, { foo: String });
  t.throws(() => {
    assert(obj, { foo: Number });
  }, TypeError);
});

tap.test("TypeFromSchema", async (t) => {
  let s: TypeFromSchema<string> = "foo";
  //@ts-expect-error
  s = 23;

  let i: TypeFromSchema<number> = 23;
  //@ts-expect-error
  i = "foo";

  const isStringOrNumber = union(String, Number);
  let x: TypeFromSchema<typeof isStringOrNumber> = 23;
  x = "foo";

  //@ts-expect-error
  x = false;

  const fooSchema = {
    required: {
      value: String,
    },
    optional: optional(String),
  } as const;

  type Foo = TypeFromSchema<typeof fooSchema>;
  let foo: Foo = {
    required: {
      value: "",
    },
  };
  foo.optional = "foo";

  //@ts-expect-error
  foo.optional = 23;
});

tap.test("typeGuard", async (t) => {
  const isString = typeGuard(String);
  t.ok(isString("foo"));
  t.notOk(isString(23));

  let isNumber: (v: unknown) => v is number;
  isNumber = typeGuard(Number);
  t.ok(isNumber(23));

  //@ts-expect-error
  isNumber = isString;
});

tap.test("diff", async (t) => {
  t.match(diff("abc", Number), ["value"]);
  t.match(diff({ num: "aaa", val: "bbb" }, { num: Number, val: String }), [
    "value.num",
  ]);
});

tap.test("deeply nested schemas", async (t) => {
  const schema = {
    level1: optional({
      level2: {
        level3: {
          level4: {
            level5: {
              level6: {
                level7: {
                  level8: {
                    level9: {
                      level10: {
                        value: String,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  };
  type S = TypeFromSchema<typeof schema>;
  const value: S = {};
  t.ok(is(value, schema));
});

tap.test("record", async (t) => {
  const obj: unknown = { foo: "foo" };
  assert(obj, record(String, String));
  t.throws(() => {
    assert(obj, record(String, Number));
  }, TypeError);
});

tap.test("nested record", async (t) => {
  // Define schemas
  const recordSchema = record(String, unknown);
  type UnknownRecord = TypeFromSchema<typeof recordSchema>;

  const TestSchema = {
    record: recordSchema,
  };
  type Test = TypeFromSchema<typeof TestSchema>;

  // Test empty record
  const s: UnknownRecord = {};
  t.ok(is(s, recordSchema), "empty record should be valid");

  // Test nested record in object
  const test: Test = {
    record: s,
  };
  t.ok(is(test, TestSchema), "object with record should be valid");

  // Test with actual data
  const populatedTest: Test = {
    record: {
      key1: "string",
      key2: 42,
      key3: { nested: true },
    },
  };
  t.ok(
    is(populatedTest, TestSchema),
    "object with populated record should be valid"
  );
});
