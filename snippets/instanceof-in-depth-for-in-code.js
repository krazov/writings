// the code below is wrapped in block to scope variables
// otherwise, it’s not possible to re-run snippet in devtools’ console
// without refreshing

console.clear();
{
    console.log('Iterating with `for..in` over two types of arrays');
    console.groupCollapsed('Proper array');
    const array = [];

    array.push(42);
    array.push(63);

    for (const item in array) {
        if (array.hasOwnProperty(item)) {
            console.log(`${item}: ${array[item]}`);
        }
    }
    console.groupEnd();

    console.groupCollapsed('Object.create(Array.prototype)');
    const pseudo = Object.create(Array.prototype);

    pseudo.push(42);
    pseudo.push(63);

    for (const item in pseudo) {
        if (pseudo.hasOwnProperty(item)) {
            console.log(`${item}: ${pseudo[item]}`);
        }
    }
    console.groupEnd();
}
