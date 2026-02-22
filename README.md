# Custom Programming Language Interpreter

A custom programming language interpreter built with TypeScript, featuring a lexer, parser, and runtime environment with support for variables, functions, objects, and control flow.

## Features

### Language Constructs

- **Variables**: Mutable (`let`) and immutable (`const`) variable declarations
- **Functions**: First-class functions with closures and return statements
- **Objects**: Object literals with property access (dot notation and computed)
- **Control Flow**: If-else statements with expression-based conditions
- **Operators**: 
  - Arithmetic: `+`, `-`, `*`, `/`, `%`
  - Comparison: `<`, `>`, `<=`, `>=`, `==`, `!=`
  - Logical: `&&`, `||`, `!`

### Built-in Functions

- `print(...args)` - Output values to console
- `time()` - Get current timestamp (Note: declared as `tine` in environment.ts - typo)
- Boolean constants: `true`, `false`
- Null constant: `null`

## Project Structure

```
.
├── ast.ts                    # Abstract Syntax Tree node definitions
├── lexer.ts                  # Tokenization of source code
├── parser.ts                 # Parsing tokens into AST
├── main.ts                   # Entry point (REPL and file execution)
└── runtime/
    ├── environment.ts        # Variable scope and environment management
    ├── interpreter.ts        # AST evaluation dispatcher
    ├── values.ts            # Runtime value type definitions
    └── eval/
        ├── expressions.ts   # Expression evaluation logic
        └── statements.ts    # Statement evaluation logic
```

## Getting Started

### Prerequisites

- Node.js
- TypeScript

### Installation

```bash
npm install
```

### Running Programs

**Execute a file:**
```bash
ts-node main.ts <filename>
```

**Start REPL:**
```bash
ts-node main.ts
```

In the REPL, type `exit` or press Ctrl+D to quit.

## Language Syntax

### Variable Declaration

```javascript
let x = 10;
const PI = 3.14159;
let name;  // defaults to null
```

### Functions

```javascript
fn add(a, b) {
    return a + b;
}

fn greet(name) {
    print("Hello", name);
}

let result = add(5, 3);
```

### Objects

```javascript
let person = {
    name: "Alice",
    age: 30
};

// Property access
print(person.name);
print(person["age"]);

// Shorthand syntax
let x = 5;
let obj = { x };  // equivalent to { x: x }
```

### Control Flow

```javascript
if x > 10 {
    print("x is greater than 10");
} else {
    print("x is 10 or less");
}

// Conditions support logical operators
if x > 5 && x < 15 {
    print("x is between 5 and 15");
}
```

### Operators

**Arithmetic:**
```javascript
let sum = 5 + 3;
let diff = 10 - 4;
let product = 6 * 7;
let quotient = 20 / 4;
let remainder = 17 % 5;
```

**Comparison:**
```javascript
let isGreater = 5 > 3;      // returns 1 (true)
let isEqual = 10 == 10;     // returns 1 (true)
let notEqual = 5 != 3;      // returns 1 (true)
```

**Logical:**
```javascript
let bothTrue = 1 && 1;      // returns 1
let eitherTrue = 0 || 1;    // returns 1
```

### Member Access

```javascript
let obj = { x: { y: 10 } };

// Dot notation
let val = obj.x.y;

// Computed access
let key = "x";
let val2 = obj[key];
```

## Example Programs

### Factorial Function

```javascript
fn factorial(n) {
    if n <= 1 {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}

print(factorial(5));  // Output: 120
```

### Fibonacci Sequence

```javascript
fn fibonacci(n) {
    if n <= 1 {
        return n;
    } else {
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}

print(fibonacci(7));  // Output: 13
```

### Object Manipulation

```javascript
let user = {
    name: "Bob",
    score: 0
};

fn incrementScore(user, points) {
    user.score = user.score + points;
}

incrementScore(user, 10);
print(user.score);  // Output: 10
```

## Implementation Details

### Truthiness

Values are evaluated as truthy/falsy in conditions:
- `0` is falsy
- Non-zero numbers are truthy
- `null` is falsy
- `true` is truthy, `false` is falsy
- Objects and functions are truthy

### Return Values

- Comparison operators return `1` for true, `0` for false
- Functions without explicit return statements return `null`
- The `return` statement exits function execution immediately

### Scoping

- Functions create new scopes (closures supported)
- Variables are looked up in current scope, then parent scopes
- Constants cannot be reassigned after declaration

## Known Issues

- Variable `tine` should be `time` in environment.ts
- Semicolons are required after most statements
- Error handling could be improved (some errors call `process.exit()`)
- Limited type checking at runtime

## Future Enhancements

- [ ] String type and string operations
- [ ] Array/list data structure
- [ ] For/while loops
- [ ] Better error messages with line numbers
- [ ] Type checking
- [ ] Standard library expansion
- [ ] Import/module system

## License

This project is for educational purposes.
