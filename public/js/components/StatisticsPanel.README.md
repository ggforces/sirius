# StatisticsPanel Component

## Overview

The `StatisticsPanel` component displays real-time task statistics in color-coded cards. It provides a visual overview of task distribution across different statuses (total, running, pending, completed, failed).

## Features

- **Real-time Statistics**: Automatically calculates statistics from task arrays
- **Color-Coded Cards**: Each status has a distinct color for easy identification
  - Total: Purple gradient
  - Running: Blue gradient
  - Pending: Yellow/Amber gradient
  - Completed: Green gradient
  - Failed: Red gradient
- **Responsive Grid Layout**: Adapts to different screen sizes
- **Client-Side Calculation**: No additional API calls required
- **Efficient Updates**: Only re-renders when statistics change
- **Icon Support**: Uses Phosphor Icons for visual enhancement

## Usage

### Basic Usage

```javascript
// Initialize the component
const statsPanel = new StatisticsPanel('statisticsPanel');

// Update with task data
const tasks = [
  { status: 'running' },
  { status: 'pending' },
  { status: 'completed' },
  { status: 'failed' }
];
statsPanel.update(tasks);
```

### HTML Structure

```html
<div id="statisticsPanel"></div>
```

### Integration Example

```javascript
// In your page initialization
const statsPanel = new StatisticsPanel('statisticsPanel');

// When tasks are loaded or updated
async function loadTasks() {
  const response = await fetch('/api/tasks/tasks');
  const data = await response.json();
  
  if (data.success) {
    // Update statistics panel
    statsPanel.update(data.tasks);
    
    // Update other components...
  }
}

// During polling updates
setInterval(() => {
  loadTasks();
}, 5000);
```

## API Reference

### Constructor

```javascript
new StatisticsPanel(containerId)
```

**Parameters:**
- `containerId` (string): The ID of the container element where the panel will be rendered

**Example:**
```javascript
const statsPanel = new StatisticsPanel('statisticsPanel');
```

### Methods

#### `update(tasks)`

Updates the statistics panel with new task data.

**Parameters:**
- `tasks` (Array): Array of task objects with `status` property

**Returns:** void

**Example:**
```javascript
statsPanel.update([
  { id: 1, status: 'running' },
  { id: 2, status: 'completed' },
  { id: 3, status: 'pending' }
]);
```

#### `calculateStatistics(tasks)`

Calculates statistics from a task array. This method is called internally by `update()` but can also be used independently.

**Parameters:**
- `tasks` (Array): Array of task objects with `status` property

**Returns:** Object with statistics
```javascript
{
  total: number,
  running: number,
  pending: number,
  completed: number,
  failed: number
}
```

**Example:**
```javascript
const stats = statsPanel.calculateStatistics(tasks);
console.log(`Total tasks: ${stats.total}`);
```

#### `getStatistics()`

Returns the current statistics object.

**Returns:** Object with current statistics

**Example:**
```javascript
const currentStats = statsPanel.getStatistics();
console.log(currentStats);
// { total: 10, running: 2, pending: 3, completed: 4, failed: 1 }
```

#### `reset()`

Resets all statistics to zero and re-renders the panel.

**Returns:** void

**Example:**
```javascript
statsPanel.reset();
```

#### `render()`

Renders the statistics panel. This method is called automatically by `update()` and `reset()`.

**Returns:** void

## Task Status Mapping

The component recognizes the following task statuses:

- `'running'` → Counted as running
- `'pending'` → Counted as pending
- `'completed'` → Counted as completed
- `'failed'` → Counted as failed
- `'timeout'` → Counted as failed (timeout is treated as a failure)

## Styling

The component uses the following CSS classes:

- `.statistics-grid` - Container grid for statistics cards
- `.stat-card` - Individual statistics card
- `.stat-icon` - Icon container
- `.stat-content` - Content container (value + label)
- `.stat-value` - Numeric value display
- `.stat-label` - Label text
- `.stat-total` - Total statistics card (purple)
- `.stat-running` - Running statistics card (blue)
- `.stat-pending` - Pending statistics card (yellow)
- `.stat-completed` - Completed statistics card (green)
- `.stat-failed` - Failed statistics card (red)

### Example CSS

```css
.statistics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-running {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
}
```

## Translation Keys

The component uses the following translation keys:

- `tasks.statistics.total` - "Toplam" / "Total"
- `tasks.statistics.running` - "İşleniyor" / "Running"
- `tasks.statistics.pending` - "Bekliyor" / "Pending"
- `tasks.statistics.completed` - "Tamamlandı" / "Completed"
- `tasks.statistics.failed` - "Başarısız" / "Failed"

## Icons

The component uses Phosphor Icons:

- Total: `ph-bold ph-clipboard-text`
- Running: `ph-bold ph-play-circle`
- Pending: `ph-bold ph-clock`
- Completed: `ph-bold ph-check-circle`
- Failed: `ph-bold ph-x-circle`

## Performance Considerations

- **Efficient Updates**: The component only re-renders when statistics actually change
- **Client-Side Calculation**: No additional API calls are made
- **Lightweight**: Minimal DOM manipulation
- **Fast Rendering**: Statistics calculation is O(n) where n is the number of tasks

## Testing

A test file is provided at `StatisticsPanel.test.html` which demonstrates:

- Component initialization
- Statistics updates with different task distributions
- Reset functionality
- Real-time updates

To run the tests:
1. Open `StatisticsPanel.test.html` in a browser
2. Use the test control buttons to see different scenarios
3. Check the test log for detailed output

## Requirements Validation

This component satisfies the following requirements from the spec:

- **Requirement 2.1**: Displays total task count
- **Requirement 2.2**: Displays running task count
- **Requirement 2.3**: Displays pending task count
- **Requirement 2.4**: Displays completed task count
- **Requirement 2.5**: Displays failed task count
- **Requirement 2.6**: Automatically updates when task data changes
- **Requirement 2.7**: Uses appropriate color coding for each statistic
- **Requirement 8.3**: Responsive grid layout for mobile devices
- **Requirement 10.4**: Client-side statistics calculation (no additional API calls)

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ support required
- CSS Grid support required

## Dependencies

- Phosphor Icons (for icons)
- Translation function `window.t()` (for internationalization)

## Example Integration

See `StatisticsPanel.test.html` for a complete working example.

## Related Components

- `TaskTable` - Displays the task list
- `FilterSystem` - Filters tasks by status
- `TasksManager` - Orchestrates all task-related components

## License

Part of the Sirius Steam Automation project.
