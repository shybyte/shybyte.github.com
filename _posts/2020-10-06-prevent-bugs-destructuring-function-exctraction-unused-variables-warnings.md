---
layout: post
title:  "How to prevent bugs by using Array Destructuring, Unused Variables Warnings and Radical Function Extraction"
date:   2020-10-06 08:34:55 +0200
tags:   TypeScript JavaScript Code-Smell
---


## An "Obvious" Bug
Recently I stumbled about the following code:

```typescript
function parseFullName(fullName: string): FullName {
  const strings = fullName.split('_');
  return {
    firstName: Buffer.from(strings[0], 'base64').toString('utf-8'),
    lastName: Buffer.from(strings[0], 'base64').toString('utf-8'),
  };
}
```

(Actually the code wasn't about personal names, but I changed the domain to protect the innocent.)

This function has a bug.<br>
And if you take your time, you’ll eventually spot the bug.<br>
You’ll spot the bug, even without an explanation about the purpose of the function.

Hints:
* The returned `lastName` has the same value as the returned `firstName`.
* From the split input string `fullName` assigned the array `strings` only the first element is used.

Conclusion: The `lastName` should probably be based on a different index in the `strings` array. 

By looking at the surrounding code, it turned out that the `lastName` can be found on index 1.

When I see such an "obvious" bug, I always wonder: 
How could this bug happen?
And how can we prevent such a bug in the future?

## How to prevent such an "obvious" bug?

Most developers tend to answer reflexively:
* Developers should be less stupid and more careful
* More (automated) tests
* Code reviews

These answers aren’t completely wrong but a bit unimaginative, boring and they ignore the following facts:
* Even the best and most careful developers create "obvious" bugs. Maybe they’re stressed or distracted. Maybe they have a bad day. Maybe humans in general are just faulty beings and we should be grown up to accept and to deal with it. 
* (Automated) tests and code reviews have a (potentially high) cost in development and maintenance effort.

So the real interesting question for me is how to prevent such bugs with minimal costs.
Maybe by using simple rules and existing technology. If spotting the bug needs no domain knowledge, could a computer spot it?

When I look at the code I see two general problems:
1. The expression `Buffer.from(strings[0], 'base64').toString('utf-8')` is duplicated two times, violating the [DRY](http://wiki.c2.com/?DontRepeatYourself)-principle a little bit.
2. The second element of the array `strings` is unused, but the computer can't know that and therefore don't warn us.

General I think that copy/pasting/modifying short expressions is often better than over-abstracting and premature function extraction. However, in this case the bug might have happened because the important index was hidden inside of the distracting duplicated expression.
So let's extract it:


```typescript
function parseFullName(fullName: string): FullName {
  const strings = fullName.split('_');
  return {
    firstName: decodeBase64(strings[0]),
    lastName: decodeBase64(strings[0]),
  };
}

function decodeBase64(base64EncodedString: string) {
  return Buffer.from(base64EncodedString, 'base64').toString('utf-8');
}
```

Suddenly the forgotten usage of the second array element catches the eye more easily than before.
But how can we reliable prevent it to be forgotten?

I would like to propose the following rule:

> **If an array is semantically a tuple, then think about destructuring it instead of accessing its elements with a constant index.**

The array `strings` (smelly name?) is actually not an array of arbitrary strings but a tuple of a base64-encoded `firstName` and a base-64-encoded `lastName`.
So let's write this down:

```typescript
const [firstNameBase64, lastNameBase64] = fullName.split('_');
```

Now it becomes nearly impossible to make the original bug, because your code would look like this:

```typescript
function parseFullName(fullName: string): FullName {
  const [firstNameBase64, lastNameBase64] = fullName.split('_');
  return {
    firstName: decodeBase64(firstNameBase64),
    lastName: decodeBase64(firstNameBase64),
  };
}
```
And finally:
**With the right settings, your compiler (or linter) will warn you about the unused variable `lastNameBase64` so you can't forget to use it**.

In TypeScript this setting is called *noUnusedLocals*.

## Conclusion

* Radical extraction of functions (to avoid duplicated code) can make bugs more obvious.
* Destructuring of tupel-like arrays can make bugs more obvious. If an array is semantically a tuple, then think about destructuring it instead of accessing its elements with a constant index.
* Warnings or compile errors about unused variables can prevent bugs.

## Further Thoughts

* Detecting code duplication automatically by a tool [for example jscpd](https://github.com/kucherenko/jscpd/tree/master/packages/jscpd) sounds like a good idea, but leads in my experience to many false complains. This is especially the case when the limit of maximal duplication is set very low, which would be needed in our case.
* Is assigning the same complex expression to different attributes a code smell? Sounds easy to automate as a linter rule and would have caught our bug.
* Should we consider indexed array access as a code smell? Especially when it's indexed by a constant? At least outside of numerical code?
* Would a linter rule help to detected places where we should favor array destructuring? https://eslint.org/docs/rules/prefer-destructuring isn’t doing exactly what we want, but only works for direct assignments. However, it should be easy to develop a rule that does what we want. But would it be useful or produce too many false complains?
* An even "drier" version of this function could look like this:
    ```typescript
    function parseFullName(fullName: string): FullName {
        const [firstName, lastName] = fullName.split('_').map(decodeBase64);
        return { firstName, lastName };
    }
    ```
