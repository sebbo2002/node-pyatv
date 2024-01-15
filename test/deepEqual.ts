'use strict';

import assert from 'assert';
import deepEqual, { isArrayEqual, isObjectEqual, isPrimitive, isPrimitiveEqual } from '../src/lib/deepEqual.js';


describe('deep equal', function () {
    describe('isPrimitive()', function () {
        it('should detect primitives', function () {
            assert.strictEqual(true, isPrimitive(true));
            assert.strictEqual(true, isPrimitive(false));
            assert.strictEqual(true, isPrimitive(0));
            assert.strictEqual(true, isPrimitive(42));
            assert.strictEqual(true, isPrimitive(1.23));
            assert.strictEqual(true, isPrimitive(undefined));
            assert.strictEqual(true, isPrimitive(null));
            assert.strictEqual(true, isPrimitive('string'));
        });
        it('should detect non-primitives', function () {
            assert.strictEqual(false, isPrimitive([]));
            assert.strictEqual(false, isPrimitive([0, 1, 2]));
            assert.strictEqual(false, isPrimitive({}));
            assert.strictEqual(false, isPrimitive({test: 42}));
            assert.strictEqual(false, isPrimitive({test: [0, 1, 2]}));
            assert.strictEqual(false, isPrimitive([{test: 42}]));
        });
    });

    describe('isPrimitiveEqual()', function () {
        it('should compare primitives correct', function () {
            assert.strictEqual(true, isPrimitiveEqual(true, true));
            assert.strictEqual(true, isPrimitiveEqual(false, false));
            assert.strictEqual(false, isPrimitiveEqual(false, true));
            assert.strictEqual(false, isPrimitiveEqual(true, false));
            assert.strictEqual(true, isPrimitiveEqual('string', 'string'));
            assert.strictEqual(false, isPrimitiveEqual('string1', 'string2'));
            assert.strictEqual(false, isPrimitiveEqual(true, 'true'));
            assert.strictEqual(false, isPrimitiveEqual(false, 'false'));
            assert.strictEqual(false, isPrimitiveEqual(42, '42'));
            assert.strictEqual(true, isPrimitiveEqual(42, 42));
            assert.strictEqual(false, isPrimitiveEqual(42, 1));
            assert.strictEqual(false, isPrimitiveEqual(true, 1));
            assert.strictEqual(false, isPrimitiveEqual(false, 0));
            assert.strictEqual(false, isPrimitiveEqual(undefined, 'undefined'));
            assert.strictEqual(true, isPrimitiveEqual(undefined, undefined));
            assert.strictEqual(false, isPrimitiveEqual(null, 'null'));
            assert.strictEqual(true, isPrimitiveEqual(null, null));
        });
    });

    describe('isArrayEqual()', function () {
        it('should compare arrays correct', function () {
            assert.strictEqual(true, isArrayEqual([], []));

            assert.strictEqual(false, isArrayEqual([], [1]));
            assert.strictEqual(false, isArrayEqual([1], []));

            assert.strictEqual(false, isArrayEqual([1], [1, 2]));
            assert.strictEqual(false, isArrayEqual([1, 2], [1]));

            assert.strictEqual(true, isArrayEqual([1], [1]));
            assert.strictEqual(true, isArrayEqual([1, 2], [1, 2]));
            assert.strictEqual(true, isArrayEqual([1, 2], [2, 1]));
            assert.strictEqual(true, isArrayEqual([1, 2, 3, 4], [4, 2, 1, 3]));

            assert.strictEqual(false, isArrayEqual([1], [0]));
            assert.strictEqual(false, isArrayEqual([1, 2], [0, 2]));
            assert.strictEqual(false, isArrayEqual([1, 1, 2], [2, 1, 2]));
            assert.strictEqual(false, isArrayEqual([1, 2, 3, 4], [4, 2, 1, 42]));
        });
    });

    describe('isObjectEqual()', function () {
        it('should compare objects correct', function () {
            assert.strictEqual(true, isObjectEqual({}, {}));

            assert.strictEqual(true, isObjectEqual({test: 42}, {test: 42}));
            assert.strictEqual(true, isObjectEqual({test: 42, test2: 10}, {test: 42, test2: 10}));
            assert.strictEqual(true, isObjectEqual({test: 42, test2: 10}, {test: 42, test2: 10}));

            assert.strictEqual(false, isObjectEqual({test: 42}, {}));
            assert.strictEqual(false, isObjectEqual({test: 42, test2: 10}, {test2: 11}));
            assert.strictEqual(false, isObjectEqual({test: 42, test2: 10}, {test: 42, test2: 10, test3: -5}));

            assert.strictEqual(false, isObjectEqual({test: 42}, {test: 43}));
            assert.strictEqual(false, isObjectEqual({test: 42, test2: 10}, {test: 42, test2: 11}));
            assert.strictEqual(false, isObjectEqual({test: 42, test2: 10}, {test: 42, test3: 10}));
        });
    });

    describe('deepEqual()', function () {
        it('should compare primitives correct', function () {
            assert.strictEqual(true, deepEqual(true, true));
            assert.strictEqual(true, deepEqual(false, false));
            assert.strictEqual(false, deepEqual(false, true));
            assert.strictEqual(false, deepEqual(true, false));
            assert.strictEqual(true, deepEqual('string', 'string'));
            assert.strictEqual(false, deepEqual('string1', 'string2'));
            assert.strictEqual(false, deepEqual(true, 'true'));
            assert.strictEqual(false, deepEqual(false, 'false'));
            assert.strictEqual(false, deepEqual(42, '42'));
            assert.strictEqual(true, deepEqual(42, 42));
            assert.strictEqual(false, deepEqual(42, 1));
            assert.strictEqual(false, deepEqual(true, 1));
            assert.strictEqual(false, deepEqual(false, 0));
            assert.strictEqual(false, deepEqual(undefined, 'undefined'));
            assert.strictEqual(true, deepEqual(undefined, undefined));
            assert.strictEqual(false, deepEqual(null, 'null'));
            assert.strictEqual(true, deepEqual(null, null));
        });

        it('should compare arrays correct', function () {
            assert.strictEqual(true, deepEqual([], []));

            assert.strictEqual(false, deepEqual([], [1]));
            assert.strictEqual(false, deepEqual([1], []));

            assert.strictEqual(false, deepEqual([1], [1, 2]));
            assert.strictEqual(false, deepEqual([1, 2], [1]));

            assert.strictEqual(true, deepEqual([1], [1]));
            assert.strictEqual(true, deepEqual([1, 2], [1, 2]));
            assert.strictEqual(true, deepEqual([1, 2], [2, 1]));
            assert.strictEqual(true, deepEqual([1, 2, 3, 4], [4, 2, 1, 3]));

            assert.strictEqual(false, deepEqual([1], [0]));
            assert.strictEqual(false, deepEqual([1, 2], [0, 2]));
            assert.strictEqual(false, deepEqual([1, 1, 2], [2, 1, 2]));
            assert.strictEqual(false, deepEqual([1, 2, 3, 4], [4, 2, 1, 42]));
        });

        it('should compare objects correct', function () {
            assert.strictEqual(true, deepEqual({}, {}));

            assert.strictEqual(true, deepEqual({test: 42}, {test: 42}));
            assert.strictEqual(true, deepEqual({test: 42, test2: 10}, {test: 42, test2: 10}));
            assert.strictEqual(true, deepEqual({test: 42, test2: 10}, {test: 42, test2: 10}));

            assert.strictEqual(false, deepEqual({test: 42}, {}));
            assert.strictEqual(false, deepEqual({test: 42, test2: 10}, {test2: 11}));
            assert.strictEqual(false, deepEqual({test: 42, test2: 10}, {test: 42, test2: 10, test3: -5}));

            assert.strictEqual(false, deepEqual({test: 42}, {test: 43}));
            assert.strictEqual(false, deepEqual({test: 42, test2: 10}, {test: 42, test2: 11}));
            assert.strictEqual(false, deepEqual({test: 42, test2: 10}, {test: 42, test3: 10}));
        });

        it('should compare complex object correct', function () {
            assert.strictEqual(true, deepEqual(
                {
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        model: 'EQE',
                        hp: 500
                    },
                    car2: {
                        manufacture: 'Audi',
                        model: 'A6',
                        hp: 230
                    }
                },
                {
                    car2: {
                        model: 'A6',
                        hp: 230,
                        manufacture: 'Audi'
                    },
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        hp: 500,
                        model: 'EQE'
                    },
                }
            ));

            assert.strictEqual(true, deepEqual(
                {
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        seats: [
                            { id: 0, heating: true },
                            { id: 1, heating: true },
                            { id: 4, heating: false },
                            { id: 2, heating: true },
                            { id: 3, heating: true }
                        ],
                        model: 'EQE',
                        hp: 500
                    },
                    car2: {
                        manufacture: 'Audi',
                        model: 'A6',
                        hp: 230
                    }
                },
                {
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        model: 'EQE',
                        hp: 500,
                        seats: [
                            { id: 0, heating: true },
                            { id: 1, heating: true },
                            { id: 2, heating: true },
                            { id: 3, heating: true },
                            { id: 4, heating: false }
                        ]
                    },
                    car2: {
                        manufacture: 'Audi',
                        model: 'A6',
                        hp: 230
                    }
                }
            ));

            assert.strictEqual(false, deepEqual(
                {
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        model: 'EQE',
                        hp: 500
                    },
                    car2: {
                        manufacture: 'Audi',
                        model: 'A6'
                    }
                },
                {
                    car2: {
                        model: 'A6',
                        hp: 230,
                        manufacture: 'Audi'
                    },
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        hp: 500,
                        model: 'EQE'
                    },
                }
            ));

            assert.strictEqual(false, deepEqual(
                {
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        model: 'EQE',
                        hp: 499
                    },
                    car2: {
                        manufacture: 'Audi',
                        model: 'A6',
                        hp: 230
                    }
                },
                {
                    car2: {
                        model: 'A6',
                        hp: 230,
                        manufacture: 'Audi'
                    },
                    car1: {
                        manufacture: 'Mercedes-Benz',
                        hp: 500,
                        model: 'EQE'
                    },
                }
            ));
        });
    });
});
