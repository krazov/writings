# `instanceof` in depth

## `instanceof` lies

[Eric Elliott](https://twitter.com/_ericelliott) repeats very often that `instanceof` lies. What would be expected is that running `object instanceof MyObject` will return `true` if `object`’s type is of `MyObject`. However, this doesn’t work like that in JavaScript. What is checked instead is if anywhere on the prototypes chain of `object` there is `MyClass`.

```javascript
class MyArray extends Array {}

const myArray = new MyArray();

// now

myArray instanceof MyArray; // true
myArray instanceof Array; // true
myArray instanceof Object; // true
```

Seems to be fine. The problem are false positives.

## The case of Array

JavaScript doesn’t have actual arrays, like other languages. Array is just a kind of object, coming with the set of methods in its own prototype. It has its literal in syntax (`[]`) but that’s about it. One of the common complaints is that `typeof [] == 'object'`, not `'array'`.

For a moment I was using `instanceof Array` to check if something is an array but this can be tricky, as well. Consider the following,

```javascript
const array = []; // []
const notArray = Object.create(Array.prototype); // Array {}

array instanceof Array; // true
notArray instanceof Array; // also true
```

Does it behave like an array? Let’s see.

```javascript
array.push(42); // [42]
notArray.push(43); // [43] <-- though, more accurate would be: Array { 0: 43, length: 1 }
```

Are the objects compatible?

```javascript
array.concat([43]); // [42, 43]
array.concat(notArray); // [42, Array(1)], or: [42, Array { 0: 43, length: 1 }]

// but

[...array, ...notArray]; // [42, 43], more here: [1]
```

Another difference are the keys. Object created with `Object.create` will have `length` enumerable. This might be dangerous if someone tried to _iterate_ it with `for..in` loop. `notArray` object would behave differently[2].

```javascript
Object.keys(array); // ["0"]
Object.keys(notArray); // ["0", "length"]
```

Because there were challenges with recognising array, static method `Array.isArray` has been added. Let’s see how our pseudo-array is doing here.

```javascript
Array.isArray(array); // true
Array.isArray(notArray); // false
```

After all, the only case that `instanceof` is really useful is if we want to use a method that is present on the desired prototype. Nothing about being actual instance. But then again, JavaScript tends to have its own way of dealing with instances.

## Clean object

Due to well-known error in the specs that were submitted in 1997, `typeof null == 'object'` (it was meant to be `'null'`). For that reason [I was considering for a while](https://twitter.com/krazov/status/811505703558975489) using `object instanceof Object` instead of `object !== null && typeof object == 'object'`[3]. I wrote then:

>Is there any catch here? Can this be used safely?

Now I can reply to myself that yes, there is a catch. It is possible to create an object that will be object and at the same time it will fail to give true to `object instanceof Object`.

```javascript
const cleanObject = Object.create(null); // {} with absolutely no properties

typeof cleanObject; // 'object'
cleanObject instanceof Object; // false
```

I still haven’t found any use for this, as usually there is no harm in and downside of having `Object.prototype` on the chain. In this case, `instanceof` would work as a measure to check if we can safely use default properties of `Object.prototype` which confirms conclusion from the previous section.

## Spawnlings of `Object.create`

If `object instanceof ArbitraryClass` goes up the chain of prototypes to check if our left-hand side (`object`) has right-hand side (`ArbitraryClass`) on its prototype chain, then is it possible to use it with results of `Object.create`?

```javascript
const prototype = {
    print() {
        console.log('I am printing');
    }
};

const object = Object.create(prototype); // {}

object.print(); // "I am printing"
object instanceof prototype; // Uncaught TypeError: Right-hand side of 'instanceof' is not an object

// however,

object instanceof Object; // true
```

No, it’s not possible.

## Method behind the method

And yet, there is no magic or incoherency of the behaviour. `instanceof` is simply calling a method defined as a class static method hidden behind `Symbol.hasInstance`.

```javascript
class MyArray extends Array {
    static [Symbol.hasInstance](instance) {
        return Array.isArray(instance);
    }
}

[] instanceof MyArray; // true
```

In other codelines, what we’re calling is this:

```javascript
MyArray[Symbol.hasInstance]([]); // true
```

That’s why the spawnling of `Object.create` identified itself as an instance of `Object` but not our prototype. Let’s fix it.

```javascript
const proto = {
    print() {
        console.log('I am printing');
    },
    [Symbol.hasInstance](instance) {
        return Object.getPrototypeOf(instance) == proto;
    },
};

const object = Object.create(proto);

object.print(); // "I am printing"
object instanceof proto; // true
object instanceof Object; // true
```

## Run-time interfaces

This allowed me to realise that in fact `instanceof` is not bound to so-called classes in JavaScript.

```javascript
const LinkedListItem = {
    [Symbol.hasInstance](item) {
        return item.hasOwnProperty('value')
            && item.hasOwnProperty('next')
            && (
                item.next === null
                || item.next instanceof LinkedListItem
            );
    },
};

const item1 = {
    value: 42,
    next: null,
};

const item2 = {
    value: 63,
    next: null,
};

item1.next = item2;

const somethingElse = {
    name: 'Geoffrey',
};

item1 instanceof LinkedListItem; // true
item2 instanceof LinkedListItem; // true
somethingElse instanceof LinkedListItem; // false
```

Upon seeing this, [my team mate, Riccardo,](https://twitter.com/riccardop87) said—as more aware user of TypeScript—those are run-time interfaces. JavaScript itself doesn’t have a concept of interface but it’s actually a different name for ducktyping.

The function above could be written like this in TypeScript:

```typescript
interface LinkedListItem {
    value: any;
    next: null | LinkedListItem;
};
```

Interfaces are a fantastic tool to describe a shape of object, that is what fields and what types of values should they have to be deemed valid. This is my single favourite feature from TypeScript, that I otherwise don’t hold high, and the worst thing is they are gone after transpilation. With `Symbol.hasInstance` we could probably incorporate `instanceof` syntax, if it’s not so useful as its promise, anyway.

But maybe it’s better to forget about it, along with other operators (like `in`) and explicitly use functions. I still haven’t decided.

---

The pieces of the code from the article put together can be found [here](../snippets/instanceof-in-depth-code.js).

---

## Footnotes

[1] The reason why `[...array, ...notArray]` worked, while `concat` didn’t, is that array spreading is internally using `Symbol.iterator` method which happens to be on the Array’s prototype. But this is a story for another time.

[2] Example: [here](../snippets/instanceof-in-depth-for-in-code.js).

[3] Shorter version: `object && typeof object == 'object'` because `null` will validate to falsy value and `typeof` will do the rest.