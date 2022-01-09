# Cloning an object

I saw recently a couple of snippets on LinkedIn where authors suggested golden standards for cloning an object. What set me off was suggesting `JSON.parse(JSON.stringify(object))` not only as a somewhat good solution but a solution at all. This is wrong on more than one level. I even unfollowed one guy because of that: I wrote to him in comments twice that this is not a good suggestion and why this is not a good suggestion, but then, I saw it for the third time. After that I decided that he’s simply building outreach on LinkedIn and is not really interested in accuracy in his posts.

Without any further ado, I’ll dig into not only cloning objects (shallow and deep) but also how object work in JavaScript in my opinion.

## The first danger of JSON.stringify -> JSON.parse

But first, what I already responded in LinkedIn a couple of times.

The first danger of stringifing to JSON and then parsing it back to an object is that information might be lost. What information? `undefined` properties will be removed from an object, same as functions, and a Date object will become a string.

```javascript
const object = {
    value1: undefined,
    value2: function helloWorld() {
        console.log('Hello world');
    },
    value3: new Date('2022 02 22'),
};

const clone = JSON.parse(JSON.stringify(object));
```

The value of `clone` will be:

```javascript
{
    value3: '2022-02-21T23:00:00.000Z',
}
```

This operation is not symmetric and reversable. And those are not the only cases when data would lost or distorted, just some of the most obvious examples.

Can you still use it in any situation? Actually, yes, if you have 100% that you’ll be cloning data that comes as a JSON in the first place (e.g., payload of the request). If this is your code, you might be certain of that (for instance, you know you are not going to enrich it on the way with any type that is lost during stringification). In any other case, just don’t.

## How objects work in JavaScript

Before I dive deeper into cloning objects, let’s discuss object itself because it might not work in JavaScript as you think it does.

My own rule of thumb is that every single object in JavaScript is flat and has one level. Okay, you might ask, but what about nested objects, like the following?

```javascript
const object = {
    foo: {
        bar: 'baz,
    },
};
```

The mental model for that is, in fact, that we have nested objects there. And for JSON (JavaScript Object Notation) it kind of is. But that is not how JavaScript operates. While primitive values are copied when assigned, objects will be passed as references. So, what rather happens above is closer to this:

```javascript
const fooValue = {
    bar: 'baz',
};

const object = {
    foo: fooValue,
};
```

If I would now change the value of `fooValue.bar`, that would also affect `object.foo`. That’s because they point to the same entity in the memory. It’s just coincidentally stored in another object.

## Shallow-cloning

Let’s take a look at most popular technique for shallow-cloning an object:

```javascript
const object = {
    answer: 42,
    foo: {
        bar: 'baz',
    },
};

const shallowClone = { ...object };
```

Now, while I can change `object.answer` without affecting `shallowClone.answer`, that is not true for `object.foo`.

That is not a case against shallow-cloning. It might be exactly what you need because you have object of primitives (or you very strictly don’t mutate an object that you received as an argument in your function). Unlike JSON.stringify->JSON.parse, this will not mess up the prototype of an object and/or lose any data.

## Deep-cloning

Due to the above, sometimes a deep clone of an object has to be done. That is not an easy thing (though, there is a huge change on the horizon, but let’s leave that for Bonus B), so a function has to be written.

Let’s write quickly something simple and discuss it:

```javascript
function deepClone(object) {
    const clone = Array.isArray(object) ? [] : {};

    for (const prop in Object.keys(object)) {
        // an array is a special case of an object,
        // so we can iterate over it’s props like that

        if (prop && typeof prop == 'object') {
            // this will handle both objects and arrays
            clone[prop] = deepClone(object[prop]);
        } else {
            // while the rest will be re-assigned
            clone[prop] = object[prop];
        }
    }

    return clone;
}
```

This is based on a solution that I found recently. On the surface, it looks fine. It covers objects and arrays, will go as deep as needed, will not lose _undefined_ or functions. (There could be a concern about hitting stack overflow, but let’s leave that out for now.) However, what about Date object? Let’s see.

```javascript
deepClone(new Date('2022 02 22')); // {}
```

An empty object. And what about an instance of Map?

```javascript
deepClone(new Map([['key-1', 'value-1']])); // {}
```

Same. As we can see, just looking a bit deeper under the surface, there are many more cases. If we wanted to be more robust we would have to add more ifs and cases: for Date, Map, Set, etc. But then, WeakMap and WeakSet don’t have iterators, so it’s not possible to recover their values. And then there are all the custom classes in your project that only you know. Or the guy that left six months ago and haven’t documented that.

## Summary

To not drag it any longer, there is no universal way of deep-cloning an object, that’s why it wasn’t provided till now. When copying any data, only you will know what you need and only you’ll be able to provide a solution for you: it might be JSON.stringify/parse, it might be shallow-cloning, or some custom, more or less elaborate deep-cloning.

Sadly, that cannot be put into a neat image to be shared on LinkedIn.

---

## Bonus A: Recursive reference

Something that happens none to rarely, at least in my professional life, but can theoretically happen: a recursive reference! When a property inside an object (or inside an object inside and object) has a reference to itself.

```javascript
const object = {
    foo: 'bar',
    baz: 42,
};

object.self = object;

JSON.stringify(object);

// Uncaught TypeError: Converting circular structure to JSON
//     --> starting at object with constructor 'Object'
//     --- property 'self' closes the circle
```

Also, running this in our function `deepClone` will cause stack overflow (if the implementation is recursive, like above) or time out (if you settled for a loop inside).

In theory, this will work:

```javascript
const object = {
    foo: 'bar',
    baz: 42,
};

object.self = object;

const clone = { ...object };
```

But now there’s another problem because something that was intended to be a self reference points to a completely different object!

And good luck with tracking this (I suppose, an instance of Map could be used to that end).

To reiterate the conclusion from the summary, cloning any data structure is always custom because there is no universal shape of the data.

## Bonus B: The light at the end of the tunnel

All that being said, as of January 2022, there is upcoming method that will provide a deep clone respecting self-reference: [`structuredClone`](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone). How deep it will go with Date, Map, Set, and others (including custom classes :D), remains to be seen because there is a very limited support and I don’t have Firefox installed, so I won’t check now.