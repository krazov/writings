# Non-`new` constructors

## Original idea

Two weeks ago, [RMiguelRivero](https://github.com/RMiguelRivero) showed me the following piece of code:

```javascript
class Person {
    static child(name) {
        return new this(name);
    }

    constructor(name) {
        this.name = name;
    }
}
```

The idea was to instantiate class without using `new`. My first reaction was that this should be rather `return new Person(name)` because static methods don’t bind inner `this`. But in JavaScript `this` is purely contextual and depends on a call site. So when called like `Person.child('Karl')`, inner `this` is `Person` which is a (constructor) function with all the `static` properties attached to it, as to any other object.

The reasoning here was that if someone extends `Person` then `child` method will not be tightly coupled with the original _class_[1]. The next step was:

```javascript
class Teacher extends Person {
    constructor(name, subject) {
        super(name);
        this.subject = subject;
    }
}
```

And console:

```javascript
new Teacher('Trevor', 'arts'); // Teacher { name: "Trevor", subject: "arts" }
Teacher.child('Trevor', 'arts'); // Teacher { name: "Trevor", subject: undefined }
```

A very neat call itself. However, as we can see, `child` static method took the right constructor but `subject` property has not been set. Turns out, we’re not passing all the params in the `child`. Let’s fix this.

## Fixing `child`

```javascript
class Person {
    static child(...args) {
        return new this(...args);
    }

    constructor(name) {
        this.name = name;
    }
}

class Teacher extends Person {
    constructor(name, subject) {
        super(name);
        this.subject = subject;
    }
}
```

Test run:

```javascript
new Teacher('Trevor', 'arts'); // Teacher { name: "Trevor", subject: "arts" }
Teacher.child('Trevor', 'arts'); // Teacher { name: "Trevor", subject: "arts" }
```

Bingo.

## Bulletproofing (a little)

I didn’t trust this `this`, just in case someone called it out of order. Imagine following cases:

```javascript
Teacher.child.call(null, 'Jeffrey', 'maths'); // Uncaught TypeError: this is not a constructor
Teacher.child.call({}, 'Jeffrey', 'maths'); // Uncaught TypeError: this is not a constructor
```

What `Teacher.child` tried to do internally was `new null('Jeffrey', 'maths')` and `new ({})('Jeffrey', 'maths')` [_sic!_]. So I modified it:

```javascript
class Person {
    static child(...args) {
        try {
            return new this(...args);
        } catch(error) {
            return new Person(...args);
        }
    }

    constructor(name) {
        this.name = name;
    }
}

class Teacher extends Person {
    constructor(name, subject) {
        super(name);
        this.subject = subject;
    }
}
```

And test:

```javascript
Teacher.child.call(null, 'Jeffrey', 'maths'); // Person { name: "Jeffrey" }
```

`try` block failed so in `catch` clause we returned original _class_[1]. It might seems that this is not what is expected but it’s not `Person`’s _class_[1] responsibility to cather for what extendings _classes_[1] are doing. That is the tricky part of extending classes: it’s extender’s risk. If developer creating `Teacher` wanted this method to behave differently, they’d have to the themselves. The gorilla, banana problem[2].

## `of`

This whole thing reminded me of `Array.of`.

But let’s start with a history. Due to inconsistence of `Array`’s constructor, if we call constructor with one param which would happen to be of `number` type, then it will be assumed to be intended array’s length.

```javascript
new Array(1, 2, 3); // [1, 2, 3]
new Array('10'); // ["10"]
// but
new Array(10); // [] (empty) but with `length` of `10`[3]
```

JavaScript has to be compatibile to its beginning, in case somebody in 1997 decided to depend on this incosistency or—more seriously—in case a popular library had been developed based on this behaviour. Change now would break pages that was working before. This is, by the way, one of the reason why `typeof null` will always be `object`, despite being a known spec’s error.

In order to address this issue of `Array` and at the same time stay faithful to original implementation, `of` method was introduced.

```javascript
Array.of(1, 2, 3); // [1, 2, 3]
Array.of('10'); // ["10"]
// and
Array.of(10); // [10]
// and even
Array.of.call(null, 10); // [10]
```

Pretty consistent behaviour. Turns out, we implemented `of` in `Person`.

## The biggest problem of _class_[1]

The biggest problem of _classes_[1] in JavaScript is they have to be instantiated with `new` keyword. This is a very tight coupling with implementation. Anyone who will import our _class_[1] will have to use `new` (many times it will be us). That is not a problem until something new comes or we find that there is more optimal solution. Now, everyone who was using this _class_[1], will have to go over the code and change it.

What I like about `of` is that the following pieces of code are interchangable:

```javascript
export class ObjectX {
    static of(...args) {
        try {
            return new this(...args);
        } catch(error) {
            return new ObjectX(...args);
        }
    }
    }

    // the rest
}
export default ObjectX;
```

```javascript
export const objectX = (...args) => { /* logic behind creating an object */ };
export const ObjectX = {
    of: (...args) => objectX(...args),
    // other static methods
};
export default ObjectX;
```

Despite different details of implementation, they have consistent interfaces they can be called with. However, only the first one would be possible to extend with `extends`.

## Summary

While I find JavaScript’s _class_ a neat way to describe arbitrary data structures coupled with methods to handle them, it’s not always the best choice. Method `of` is one of possible solutions to loosen otherwise tight coupling.

---

The pieces of the code with `Person` and `Teacher` put together can be found [here](../snippets/non-new-constructors.js).

---

[1] **Notice!** There are no classes in JavaScript.

[2] To quote [Joe Armstrong](https://twitter.com/joeerl):

>I think the lack of reusability comes in object-oriented languages, not functional languages. Because the problem with object-oriented languages is they’ve got all this implicit environment that they carry around with them. You wanted a banana but what you got was a gorilla holding the banana and the entire jungle.

[3] Calling `new Array(10).forEach(item => console.log(item))` will return nothing because `forEach` goes over actual elements, ignoring `length`. Same as functional methods, like `map`, `filter`, `reduce`, etc. But `for (let array = new Array(10), i = 0; i < array.length; i++) { console.log(array[1]); }` we’d get 10 x `undefined`.