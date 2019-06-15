// the code below is wrapped in block to scope variables
// otherwise, it’s not possible to re-run snippet in devtools console
// without refreshing
{
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

	console.log(new Teacher('Trevor', 'arts'));
    console.log(Teacher.child('Trevor', 'arts'));

	console.log(Teacher.child.call({}, 'Jeffrey', 'maths'));
	console.log(Teacher.child.call(null, 'Jeffrey', 'maths'));
}