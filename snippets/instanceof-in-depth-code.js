// the code below is wrapped in block to scope variables
// otherwise, it’s not possible to re-run snippet in devtools’ console
// without refreshing

console.clear();

// Chapter 1: `instanceof` lies
{
    console.groupCollapsed('Chapter 1: `instanceof` lies');

    class MyArray extends Array {}
    const myArray = new MyArray();

    console.log('class MyArray extends Array {}', MyArray);
    console.log('const myArray = new MyArray();', myArray);

    console.log('myArray instanceof MyArray', myArray instanceof MyArray);
    console.log('myArray instanceof Array', myArray instanceof Array);
    console.log('myArray instanceof Object', myArray instanceof Object);

    console.groupEnd();
}

// Chapter 2: The case of Array
{
    console.groupCollapsed('Chapter 2: The case of Array');

    const array = []; // []
    const notArray = Object.create(Array.prototype); // Array {}

    console.log('const array = [];', array);
    console.log('const notArray = Object.create(Array.prototype);', notArray);

    console.log('array instanceof Array', array instanceof Array);
    console.log('notArray instanceof Array', notArray instanceof Array);

    array.push(42);
    notArray.push(63);

    console.log('array.push(42)', array);
    console.log('notArray.push(63)', notArray);

    console.log('array.concat([63])', array.concat([63]));
    console.log('array.concat(notArray)', array.concat(notArray));

    console.log('but...')

    console.log('[...array, ...notArray]', [...array, ...notArray])

    console.log('array’s keys:', Object.keys(array));
    console.log('notArray’s keys:', Object.keys(notArray));

    console.log('Array.isArray(array)', Array.isArray(array));
    console.log('Array.isArray(notArray)', Array.isArray(notArray));

    console.groupEnd();
}

// Chapter 3: Clean object
{
    console.groupCollapsed('Chapter 3: Clean object');

    const cleanObject = Object.create(null);
    console.log('const cleanObject = Object.create(null);', cleanObject);

    console.log('typeof object:', typeof cleanObject);
    console.log('object instanceof Object', cleanObject instanceof Object);

    console.groupEnd();
}

// Chapter 4: Spawnlings of `Object.create`
{
    console.groupCollapsed('Chapter 4: Spawnlings of `Object.create`');
    const prototype = {
        print() {
            console.log('I am printing');
        }
    };
    console.log(`const prototype = {
    print() {
        console.log('I am printing');
    }
};`)

    const object = Object.create(prototype);
    console.log('const object = Object.create(prototype);', object);

    console.log('object.print():');
    object.print(); // "I am printing"

    try {
        object instanceof prototype; // Uncaught TypeError: Right-hand side of 'instanceof' is not an object
    } catch(error) {
        console.error('object instanceof prototype //', error);
    }

    console.log('however,');
    console.log('object instanceof Object', object instanceof Object)

    console.groupEnd();
}

// Chapter 5: Method behind the method
{
    console.groupCollapsed('Chapter 5: Method behind the method');

    class MyArray extends Array {
        static [Symbol.hasInstance](instance) {
            return Array.isArray(instance);
        }
    }

    console.log(`class MyArray extends Array {
    static [Symbol.hasInstance](instance) {
        return Array.isArray(instance);
    }
}`, MyArray);

    console.log('[] instanceof MyArray', [] instanceof MyArray);
    console.log('MyArray[Symbol.hasInstance]([])', MyArray[Symbol.hasInstance]([]))

    const prototype = {
        print() {
            console.log('I am printing');
        },
        [Symbol.hasInstance](instance) {
            return Object.getPrototypeOf(instance) == prototype;
        },
    };

    console.log('adjustment of prototype from chapter 4:');
    console.log(`const prototype = {
    print() {
        console.log('I am printing');
    },
    [Symbol.hasInstance](instance) {
        return Object.getPrototypeOf(instance) == prototype;
    },
};`, prototype);

    const object = Object.create(prototype);
    console.log('const object = Object.create(prototype)', object);

    console.log('object.print():');
    object.print();
    console.log('object instanceof prototype', object instanceof prototype);
    console.log('object instanceof Object', object instanceof Object);

    console.groupEnd();
}

// Chapter 6: Run-time interfaces
{
    console.groupCollapsed('Chapter 6: Run-time interfaces');

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

    console.log(`const LinkedListItem = {
    [Symbol.hasInstance](item) {
        return item.hasOwnProperty('value')
            && item.hasOwnProperty('next')
            && (
                item.next === null
                || item.next instanceof LinkedListItem
            );
    },
};`, LinkedListItem);

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

    console.log('item1', item1);
    console.log('item2', item2);
    console.log('somethingElse', somethingElse);

    console.log('item1 instanceof LinkedListItem', item1 instanceof LinkedListItem);
    console.log('item2 instanceof LinkedListItem', item2 instanceof LinkedListItem);
    console.log('somethingElse instanceof LinkedListItem', somethingElse instanceof LinkedListItem);
}