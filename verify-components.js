/**
 * Component Verification Script
 * 
 * This script verifies that all frontend components are properly implemented
 * and accessible.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Frontend Components...\n');

// Component files to check
const components = [
    {
        name: 'TaskTable',
        path: 'public/js/components/TaskTable.js',
        css: 'public/css/components/task-table.css'
    },
    {
        name: 'TaskCreationModal',
        path: 'public/js/components/TaskCreationModal.js',
        css: 'public/css/components/task-creation-modal.css'
    },
    {
        name: 'LogViewerModal',
        path: 'public/js/components/LogViewerModal.js',
        css: 'public/css/components/log-viewer-modal.css'
    }
];

let allPassed = true;

// Check each component
components.forEach(component => {
    console.log(`📦 Checking ${component.name}...`);
    
    // Check JS file
    if (fs.existsSync(component.path)) {
        const content = fs.readFileSync(component.path, 'utf8');
        const size = (content.length / 1024).toFixed(2);
        console.log(`  ✅ JS file exists (${size} KB)`);
        
        // Check for class definition
        if (content.includes(`class ${component.name}`)) {
            console.log(`  ✅ Class definition found`);
        } else {
            console.log(`  ❌ Class definition NOT found`);
            allPassed = false;
        }
        
        // Check for key methods
        const methods = ['constructor', 'render', 'open', 'close'];
        methods.forEach(method => {
            if (content.includes(method)) {
                console.log(`  ✅ Method '${method}' found`);
            }
        });
    } else {
        console.log(`  ❌ JS file NOT found`);
        allPassed = false;
    }
    
    // Check CSS file
    if (fs.existsSync(component.css)) {
        const content = fs.readFileSync(component.css, 'utf8');
        const size = (content.length / 1024).toFixed(2);
        console.log(`  ✅ CSS file exists (${size} KB)`);
    } else {
        console.log(`  ❌ CSS file NOT found`);
        allPassed = false;
    }
    
    console.log('');
});

// Check integration files
console.log('🔗 Checking Integration Files...\n');

const integrationFiles = [
    {
        name: 'Dashboard HTML',
        path: 'public/dashboard.html',
        checks: [
            { pattern: 'TaskTable.js', description: 'TaskTable script import' },
            { pattern: 'TaskCreationModal.js', description: 'TaskCreationModal script import' },
            { pattern: 'LogViewerModal.js', description: 'LogViewerModal script import' },
            { pattern: 'task-table.css', description: 'TaskTable CSS import' },
            { pattern: 'task-creation-modal.css', description: 'TaskCreationModal CSS import' },
            { pattern: 'log-viewer-modal.css', description: 'LogViewerModal CSS import' },
            { pattern: 'taskTableContainer', description: 'Task table container' },
            { pattern: 'createTaskBtn', description: 'Create task button' }
        ]
    },
    {
        name: 'Tasks Page JS',
        path: 'public/js/pages/tasks.js',
        checks: [
            { pattern: 'new TaskTable', description: 'TaskTable initialization' },
            { pattern: 'new TaskCreationModal', description: 'TaskCreationModal initialization' },
            { pattern: 'new LogViewerModal', description: 'LogViewerModal initialization' },
            { pattern: 'onViewLogs', description: 'Log viewer wiring' },
            { pattern: 'onTaskCreated', description: 'Task creation callback' },
            { pattern: 'startTaskPolling', description: 'Polling service' }
        ]
    }
];

integrationFiles.forEach(file => {
    console.log(`📄 Checking ${file.name}...`);
    
    if (fs.existsSync(file.path)) {
        const content = fs.readFileSync(file.path, 'utf8');
        console.log(`  ✅ File exists`);
        
        file.checks.forEach(check => {
            if (content.includes(check.pattern)) {
                console.log(`  ✅ ${check.description}`);
            } else {
                console.log(`  ❌ ${check.description} NOT found`);
                allPassed = false;
            }
        });
    } else {
        console.log(`  ❌ File NOT found`);
        allPassed = false;
    }
    
    console.log('');
});

// Check test page
console.log('🧪 Checking Test Page...\n');

const testPage = 'public/test-task-components.html';
if (fs.existsSync(testPage)) {
    console.log(`  ✅ Test page exists: ${testPage}`);
    console.log(`  📝 Access at: http://localhost:5050/test-task-components.html`);
} else {
    console.log(`  ❌ Test page NOT found`);
    allPassed = false;
}

console.log('');

// Final result
console.log('═══════════════════════════════════════════════════════════');
if (allPassed) {
    console.log('✅ ALL CHECKS PASSED - Components are ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start server: npm run dev');
    console.log('2. Open test page: http://localhost:5050/test-task-components.html');
    console.log('3. Login to get authentication token');
    console.log('4. Test all components manually');
} else {
    console.log('❌ SOME CHECKS FAILED - Please review the issues above');
}
console.log('═══════════════════════════════════════════════════════════');

process.exit(allPassed ? 0 : 1);
