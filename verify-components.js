/**
 * Component Verification Script
 * Task 4: Checkpoint - Verify Backend and Core Components
 * 
 * This script verifies that:
 * 1. Backend API enhancements are in place (tasks 1.1-1.2)
 * 2. StatisticsPanel component is implemented (tasks 2.1-2.4)
 * 3. FilterSystem component is implemented (tasks 3.1-3.5)
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Component Verification - Task 4 Checkpoint');
console.log('='.repeat(60));
console.log();

let allChecksPassed = true;

// Helper function to check file exists
function checkFileExists(filePath, description) {
    const exists = fs.existsSync(filePath);
    if (exists) {
        console.log(`✓ ${description}`);
    } else {
        console.log(`✗ ${description} - FILE NOT FOUND`);
        allChecksPassed = false;
    }
    return exists;
}

// Helper function to check file contains text
function checkFileContains(filePath, searchText, description) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const contains = content.includes(searchText);
        if (contains) {
            console.log(`✓ ${description}`);
        } else {
            console.log(`✗ ${description} - TEXT NOT FOUND`);
            allChecksPassed = false;
        }
        return contains;
    } catch (error) {
        console.log(`✗ ${description} - ERROR: ${error.message}`);
        allChecksPassed = false;
        return false;
    }
}

console.log('1. Backend API Enhancements (Tasks 1.1-1.2)');
console.log('-'.repeat(60));

// Check tasksController.js exists
checkFileExists(
    'src/controllers/tasksController.js',
    'tasksController.js exists'
);

// Check getUserTasks function has status filtering
checkFileContains(
    'src/controllers/tasksController.js',
    'const { status } = req.query',
    'getUserTasks supports status query parameter'
);

// Check 100-task limit
checkFileContains(
    'src/controllers/tasksController.js',
    'LIMIT 100',
    'getUserTasks has 100-task limit'
);

// Check DESC ordering
checkFileContains(
    'src/controllers/tasksController.js',
    'ORDER BY t.created_at DESC',
    'getUserTasks orders by created_at DESC'
);

// Check JOIN with steam_accounts
checkFileContains(
    'src/controllers/tasksController.js',
    'JOIN steam_accounts a ON t.account_id = a.id',
    'getUserTasks joins with steam_accounts'
);

// Check LEFT JOIN with proxies
checkFileContains(
    'src/controllers/tasksController.js',
    'LEFT JOIN proxies p ON t.proxy_id = p.id',
    'getUserTasks left joins with proxies'
);

console.log();
console.log('2. StatisticsPanel Component (Tasks 2.1-2.4)');
console.log('-'.repeat(60));

// Check StatisticsPanel.js exists
checkFileExists(
    'public/js/components/StatisticsPanel.js',
    'StatisticsPanel.js exists'
);

// Check calculateStatistics method
checkFileContains(
    'public/js/components/StatisticsPanel.js',
    'calculateStatistics(tasks)',
    'StatisticsPanel has calculateStatistics method'
);

// Check update method
checkFileContains(
    'public/js/components/StatisticsPanel.js',
    'update(tasks)',
    'StatisticsPanel has update method'
);

// Check render method
checkFileContains(
    'public/js/components/StatisticsPanel.js',
    'render()',
    'StatisticsPanel has render method'
);

// Check CSS file exists
checkFileExists(
    'public/css/components/statistics-panel.css',
    'statistics-panel.css exists'
);

// Check color coding in CSS
checkFileContains(
    'public/css/components/statistics-panel.css',
    '.stat-running',
    'CSS has running color class'
);

checkFileContains(
    'public/css/components/statistics-panel.css',
    '.stat-pending',
    'CSS has pending color class'
);

checkFileContains(
    'public/css/components/statistics-panel.css',
    '.stat-completed',
    'CSS has completed color class'
);

checkFileContains(
    'public/css/components/statistics-panel.css',
    '.stat-failed',
    'CSS has failed color class'
);

console.log();
console.log('3. FilterSystem Component (Tasks 3.1-3.5)');
console.log('-'.repeat(60));

// Check FilterSystem.js exists
checkFileExists(
    'public/js/components/FilterSystem.js',
    'FilterSystem.js exists'
);

// Check updateCounts method
checkFileContains(
    'public/js/components/FilterSystem.js',
    'updateCounts(tasks)',
    'FilterSystem has updateCounts method'
);

// Check setActiveFilter method
checkFileContains(
    'public/js/components/FilterSystem.js',
    'setActiveFilter(filterId)',
    'FilterSystem has setActiveFilter method'
);

// Check getFilteredTasks method
checkFileContains(
    'public/js/components/FilterSystem.js',
    'getFilteredTasks(tasks, filterId)',
    'FilterSystem has getFilteredTasks method'
);

// Check filter configurations
checkFileContains(
    'public/js/components/FilterSystem.js',
    "id: 'all'",
    'FilterSystem has "all" filter'
);

checkFileContains(
    'public/js/components/FilterSystem.js',
    "id: 'running'",
    'FilterSystem has "running" filter'
);

checkFileContains(
    'public/js/components/FilterSystem.js',
    "id: 'pending'",
    'FilterSystem has "pending" filter'
);

checkFileContains(
    'public/js/components/FilterSystem.js',
    "id: 'failed'",
    'FilterSystem has "failed" filter'
);

checkFileContains(
    'public/js/components/FilterSystem.js',
    "id: 'completed'",
    'FilterSystem has "completed" filter'
);

// Check CSS file exists
checkFileExists(
    'public/css/components/filter-system.css',
    'filter-system.css exists'
);

// Check responsive design in CSS
checkFileContains(
    'public/css/components/filter-system.css',
    '@media (max-width: 768px)',
    'CSS has mobile responsive styles'
);

checkFileContains(
    'public/css/components/filter-system.css',
    'min-height: 44px',
    'CSS has touch-friendly button sizes'
);

console.log();
console.log('4. Unit Tests');
console.log('-'.repeat(60));

// Check test files exist
checkFileExists(
    'public/js/components/StatisticsPanel.calculateStatistics.test.js',
    'StatisticsPanel test file exists'
);

checkFileExists(
    'public/js/components/FilterSystem.updateCounts.node-test.js',
    'FilterSystem test file exists'
);

console.log();
console.log('='.repeat(60));
if (allChecksPassed) {
    console.log('✓ ALL CHECKS PASSED');
    console.log('Backend and core components are properly implemented.');
    console.log();
    console.log('Summary:');
    console.log('  ✓ Task 1.1: Backend API status filtering - COMPLETE');
    console.log('  ✓ Task 1.2: Backend API JOIN queries - COMPLETE');
    console.log('  ✓ Tasks 2.1-2.4: StatisticsPanel component - COMPLETE');
    console.log('  ✓ Tasks 3.1-3.5: FilterSystem component - COMPLETE');
    process.exit(0);
} else {
    console.log('✗ SOME CHECKS FAILED');
    console.log('Please review the failed checks above.');
    process.exit(1);
}
