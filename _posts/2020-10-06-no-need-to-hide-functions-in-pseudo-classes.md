---
layout: post
title:  "You don't need to hide your functions in pseudo classes"
date:   2020-10-06 09:34:55 +0200
tags:   TypeScript JavaScript Code-Smell
---

## Java programmer's habits won't die?

Recently I stumbled about the following TypeScript module:

```typescript
class SomethingUtils {
  public static doSomething() {
    // implementation
  };
}

export default SomethingUtils;
```
`doSomething` was the only "method" in this "class".
Actually, I wouldn’t call `SomethingUtils` a class,
because there are no instance variables 
and it only serves as container for the `doSomething` function.

In programming languages like Java such travesty is needed because you can’t define a function outside of a class.
In languages like TypeScript his unnecessary class wrapper is distracting and clutters up your code.
It's shorter and more idiomatic to write
```typescript
  export function doSomething() {
    // implementation
  };
```

This also unclutters the call site of the function because `SomethingUtils.doSomething()` becomes a more succinct `doSomething()`.

Another variant of this functions-as-method-travesty is the following "class" I found:

```typescript
export interface FullName {
  firstName: string;
  lastName: string;
}

class FullNameConverter {
  private readonly delimiter = '_';

  serializeFullName(firstName: string, lastName: string): string {
    return [firstName, lastName].join(this.delimiter);
  }

  parseFullName(serializedFullName: string): FullName {
    const [firstName, lastName] = serializedFullName.split(this.delimiter);
    return { firstName, lastName };
  }
}

export default FullNameConverter;
```

At call-site it's used like this:
```typescript
const fullName =  new FullNameConverter().parseFullName('marco_stahl');
```

or like this
```typescript
const flc = new FullNameConverter();
const fullName = flc.parseFullName('kaja_stahl');
```

I don't know about you, but for me a simple
```typescript
const fullName = parseFullName('kaja_stahl');
```
is at least equally readable and more succinct.

The required implementation code is also shorter and at least equally understandable:
```typescript
export interface FullName {
  firstName: string;
  lastName: string;
}

const DELIMITER = '_';

export function serializeFullName(firstName: string, lastName: string): string {
  return [firstName, lastName].join(DELIMITER);
}

export function parseFullName(serializedFullName: string): FullName {
  const [firstName, lastName] = serializedFullName.split(DELIMITER);
  return { firstName, lastName };
}
```

## Advantages of using simple functions instead of pseudo classes

* More succinct implementation code
* More succinct call-site code
* Less confusion because programmers seeing a class might expect a real class with some instance variables or something other more complex going on
* Less confusion caused by the strange behavior of `this` in JavaScript
* Can be more succinct and less error-prone composed (for example `fullNamesSerialized.map(parseFullName)`) without problems resulting from `this` usage
* Can be better minimized by JavaScript minimizers
* A little bit faster

## Disadvantages of using simple functions instead of pseudo classes

* Java programmers might be confused.

## Object-Oriented Alternative
If you really insist in doing Object-oriented programming, I would recommend to create (or look for) real classes and attach the code to them.
Maybe the `doSomething` from our first example belongs actually somewhere else?
Maybe `FullName` should be a class instead of just an interface. Suddenly there’s a logical place to put the methods and the result is pretty succinct:

```typescript
const DELIMITER = '_';

export default class FullName {
  constructor(public firstName: string, public lastName: string) {}

  serialize(): string {
    return [this.firstName, this.lastName].join(DELIMITER);
  }

  static parse(serializedFullName: string): FullName {
    const [firstName, lastName] = serializedFullName.split(DELIMITER);
    return new FullName(firstName, lastName);
  }
}
```

The effort on call-site is also less than in the original implementation, because there’s no artificial pseudo class:
```typescript
const fullName = FullName.parse('kaja_stahl');
```

```typescript
const fullNameSerialized = fullName.serialize();
```
