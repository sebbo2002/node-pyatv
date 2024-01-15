/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';

export default function deepEqual(a: any, b: any): boolean {

    // primitive
    const aPrimitive: boolean = isPrimitive(a);
    const bPrimitive: boolean = isPrimitive(b);
    if (aPrimitive && bPrimitive) {
        return isPrimitiveEqual(a, b);
    }
    if (aPrimitive || bPrimitive) {
        return false;
    }

    // array
    const aArray: boolean = Array.isArray(a);
    const bArray: boolean = Array.isArray(b);
    if (aArray && bArray) {
        return isArrayEqual(a, b);
    }
    if (aArray || bArray) {
        // if only a or b is an array, they can't be the same
        return false;
    }

    // object
    const aObject: boolean = typeof a === 'object';
    const bObject: boolean = typeof b === 'object';
    if (aObject && bObject) {
        return isObjectEqual(a, b);
    }
    if (aObject || bObject) {
        // if only a or b is an object, they can't be the same
        return false;
    }

    return false;
}

export function isPrimitive(e: any): boolean {
    return e !== Object(e);
};

export function isPrimitiveEqual(a: any, b: any): boolean {
    return a === b;
}

export function isArrayEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) {
        // if there are different number of elements, the arrays can't be the same
        return false;
    }

    // check if every element of a has a counter part in b
    for (let i: number = 0; i < a.length; i++) {
        // look at a[i]
        for (let j: number = 0; j < b.length; j++) {
            // now search for a matching element in b
            if (deepEqual(a[i], b[j]) === true) {
                // there is our matching element
                // delete element so it is not matched twice
                b.splice(j, 1);
                // go on with a[i + 1]
                break;
            }
            if (j === b.length - 1) {
                // if the for loop got so far, there was no match for a[i] in b
                return false;
            }
        }
    }

    return true;
}

export function isObjectEqual(a: object, b: object): boolean {
    // check if the same keys are present
    const aKeys: string[] = Object.keys(a);
    const bKeys: string[] = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
        // if there are different number of keys, the objects can't be the same
        return false;
    }
    for (const k of aKeys) {
        if (bKeys.includes(k) === false) {
            return false;
        }
    }

    // check if content is the same
    for (const k of aKeys) {
        if (deepEqual(a[k], b[k]) === false) {
            return false;
        }
    }
        
    // both object have the same content
    return true;
}