/**
 * Node.js Test for FilterSystem.updateCounts()
 * Task 3.4: Implement filter count updates
 * Requirements: 6.7, 6.9
 */

// Mock DOM and window object for Node.js environment
global.document = {
    getElementById: () => ({
        innerHTML: '',
        querySelectorAll: () => []
    })
};

global.window = {
    t: (key) => {
        const translations = {
            'tasks.filters.all': 'Tüm Görevler',
            'tasks.filters.running': 'Çalışan',
            'tasks.filters.pending': 'Bekleyen',
            'tasks.filters.failed': 'Hata Alan',
            'tasks.filters.completed': 'Tamamlanan'
        };
        return translations[key] || key;
    }
};

// Load FilterSystem class
const FilterSystem = require('./FilterSystem.js');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, expected, actual) {
    if (condition) {
        console.log(`✓ PASS: ${testName}`);
        testsPassed++;
    } else {
        console.log(`✗ FAIL: ${testName}`);
        console.log(`  Expected: ${JSON.stringify(expected)}`);
        console.log(`  Actual: ${JSON.stringify(actual)}`);
        testsFailed++;
    }
}

console.log('=== FilterSystem.updateCounts() Tests ===\n');

// Test 1: Basic count updates
console.log('Test 1: Basic count updates');
const filter1 = new FilterSystem('test-container-1', () => {});
const tasks1 = [
    { id: 1, status: 'running' },
    { id: 2, status: 'running' },
    { id: 3, status: 'pending' },
    { id: 4, status: 'completed' },
    { id: 5, status: 'failed' }
];
filter1.updateCounts(tasks1);

assert(
    filter1.filters[0].count === 5,
    'All filter count',
    5,
    filter1.filters[0].count
);
assert(
    filter1.filters[1].count === 2,
    'Running filter count',
    2,
    filter1.filters[1].count
);
assert(
    filter1.filters[2].count === 1,
    'Pending filter count',
    1,
    filter1.filters[2].count
);
assert(
    filter1.filters[3].count === 1,
    'Failed filter count',
    1,
    filter1.filters[3].count
);
assert(
    filter1.filters[4].count === 1,
    'Completed filter count',
    1,
    filter1.filters[4].count
);

// Test 2: Failed filter includes timeout
console.log('\nTest 2: Failed filter includes timeout');
const filter2 = new FilterSystem('test-container-2', () => {});
const tasks2 = [
    { id: 1, status: 'failed' },
    { id: 2, status: 'timeout' },
    { id: 3, status: 'failed' },
    { id: 4, status: 'completed' }
];
filter2.updateCounts(tasks2);

assert(
    filter2.filters[3].count === 3,
    'Failed filter counts both failed and timeout',
    3,
    filter2.filters[3].count
);

// Test 3: Empty task array
console.log('\nTest 3: Empty task array');
const filter3 = new FilterSystem('test-container-3', () => {});
filter3.updateCounts([]);

assert(
    filter3.filters[0].count === 0 &&
    filter3.filters[1].count === 0 &&
    filter3.filters[2].count === 0 &&
    filter3.filters[3].count === 0 &&
    filter3.filters[4].count === 0,
    'All counts are 0 for empty array',
    { all: 0, running: 0, pending: 0, failed: 0, completed: 0 },
    {
        all: filter3.filters[0].count,
        running: filter3.filters[1].count,
        pending: filter3.filters[2].count,
        failed: filter3.filters[3].count,
        completed: filter3.filters[4].count
    }
);

// Test 4: Null tasks handling
console.log('\nTest 4: Null tasks handling');
const filter4 = new FilterSystem('test-container-4', () => {});
filter4.updateCounts(null);

assert(
    filter4.filters[0].count === 0,
    'Null tasks handled safely',
    0,
    filter4.filters[0].count
);

// Test 5: Undefined tasks handling
console.log('\nTest 5: Undefined tasks handling');
const filter5 = new FilterSystem('test-container-5', () => {});
filter5.updateCounts(undefined);

assert(
    filter5.filters[0].count === 0,
    'Undefined tasks handled safely',
    0,
    filter5.filters[0].count
);

// Test 6: Dynamic count updates
console.log('\nTest 6: Dynamic count updates');
const filter6 = new FilterSystem('test-container-6', () => {});
let tasks6 = [
    { id: 1, status: 'running' },
    { id: 2, status: 'pending' }
];
filter6.updateCounts(tasks6);
const initialRunningCount = filter6.filters[1].count;

tasks6.push({ id: 3, status: 'running' });
filter6.updateCounts(tasks6);
const newRunningCount = filter6.filters[1].count;

assert(
    newRunningCount === initialRunningCount + 1,
    'Count updates dynamically when tasks change',
    initialRunningCount + 1,
    newRunningCount
);

// Test 7: Multiple status filter (failed + timeout)
console.log('\nTest 7: Multiple status filter configuration');
const filter7 = new FilterSystem('test-container-7', () => {});
const tasks7 = [
    { id: 1, status: 'failed' },
    { id: 2, status: 'timeout' },
    { id: 3, status: 'timeout' },
    { id: 4, status: 'running' }
];
filter7.updateCounts(tasks7);

assert(
    filter7.filters[3].count === 3,
    'Failed filter correctly counts multiple statuses',
    3,
    filter7.filters[3].count
);

// Test 8: Large task array
console.log('\nTest 8: Large task array (100 tasks)');
const filter8 = new FilterSystem('test-container-8', () => {});
const tasks8 = [];
for (let i = 0; i < 100; i++) {
    const statuses = ['running', 'pending', 'completed', 'failed', 'timeout'];
    tasks8.push({ id: i, status: statuses[i % 5] });
}
filter8.updateCounts(tasks8);

assert(
    filter8.filters[0].count === 100,
    'All filter counts 100 tasks',
    100,
    filter8.filters[0].count
);
assert(
    filter8.filters[1].count === 20,
    'Running filter counts 20 tasks',
    20,
    filter8.filters[1].count
);
assert(
    filter8.filters[3].count === 40,
    'Failed filter counts 40 tasks (20 failed + 20 timeout)',
    40,
    filter8.filters[3].count
);

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✓ All tests passed! Task 3.4 implementation is correct.');
    process.exit(0);
} else {
    console.log('\n✗ Some tests failed. Please review the implementation.');
    process.exit(1);
}
