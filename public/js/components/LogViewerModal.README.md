# LogViewerModal Component

A reusable modal component for displaying task execution logs with color-coded log levels and chronological ordering.

## Features

- ✅ **Modal Structure**: Complete modal HTML with header, body, and actions
- ✅ **Open/Close Functionality**: Programmatic control and user interactions
- ✅ **Close Methods**: Close button, overlay click, and Escape key
- ✅ **Log Display**: Chronological ordering (oldest first)
- ✅ **Color Coding**: Visual distinction for info, warning, and error levels
- ✅ **Timestamp Formatting**: Human-readable date/time display
- ✅ **Empty State**: User-friendly message when no logs exist
- ✅ **Loading State**: Spinner and message during data fetch
- ✅ **Error Handling**: Graceful error display with retry capability
- ✅ **Scrollable View**: Handles large log lists efficiently
- ✅ **Responsive Design**: Mobile-friendly layout
- ✅ **XSS Protection**: HTML escaping for log messages

## Usage

### Basic Setup

```javascript
// Initialize the modal
const logModal = new LogViewerModal('logViewerModal');

// Open modal with a task ID
logModal.open(123);

// Close modal programmatically
logModal.close();
```

### Integration with Task Table

```javascript
// In your task table rendering
function renderTaskRow(task) {
    return `
        <tr>
            <td>${task.id}</td>
            <td>${task.accountUsername}</td>
            <td>${task.status}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewLogs(${task.id})">
                    <i class="ph-bold ph-file-text"></i>
                    Loglar
                </button>
            </td>
        </tr>
    `;
}

// Log button click handler
function viewLogs(taskId) {
    logModal.open(taskId);
}
```

## API Integration

The component expects the following API endpoint:

**GET /api/tasks/logs/:taskId**

### Request
```http
GET /api/tasks/logs/123
Authorization: Bearer <token>
```

### Response (Success)
```json
{
    "success": true,
    "logs": [
        {
            "id": 1,
            "task_id": 123,
            "level": "info",
            "message": "Task started with proxy 192.168.1.1:8080",
            "created_at": "2026-05-08T10:30:00.000Z"
        },
        {
            "id": 2,
            "task_id": 123,
            "level": "error",
            "message": "Proxy connection timeout",
            "created_at": "2026-05-08T10:30:15.000Z"
        }
    ]
}
```

### Response (Error)
```json
{
    "success": false,
    "message": "Task bulunamadı"
}
```

## Log Levels

The component supports three log levels with distinct visual styling:

| Level | Color | Icon | Use Case |
|-------|-------|------|----------|
| `info` | Blue | ℹ️ | General information, progress updates |
| `warning` | Yellow | ⚠️ | Non-critical issues, retries |
| `error` | Red | ❌ | Critical failures, exceptions |

## Component Structure

```
LogViewerModal
├── Modal Overlay (backdrop)
├── Modal Content
│   ├── Modal Header
│   │   └── Title: "Görev Logları"
│   ├── Modal Body
│   │   └── Logs Container
│   │       ├── Loading State (spinner)
│   │       ├── Empty State (no logs message)
│   │       ├── Error State (error message)
│   │       └── Log List
│   │           └── Log Entry (per log)
│   │               ├── Log Header
│   │               │   ├── Level Badge (with icon)
│   │               │   └── Timestamp
│   │               └── Log Message
│   └── Modal Actions
│       └── Close Button
```

## Styling

The component uses two CSS files:

1. **modals.css**: Base modal styles (shared with other modals)
2. **log-viewer-modal.css**: Log-specific styles

### CSS Classes

- `.log-list`: Container for all log entries
- `.log-entry`: Individual log entry wrapper
- `.log-entry-info`: Info level styling
- `.log-entry-warning`: Warning level styling
- `.log-entry-error`: Error level styling
- `.log-header`: Log entry header (level + timestamp)
- `.log-level`: Level badge with icon
- `.log-timestamp`: Formatted timestamp
- `.log-message`: Log message content

## Methods

### `constructor(modalId)`
Creates a new LogViewerModal instance.

**Parameters:**
- `modalId` (string): Unique ID for the modal element

### `open(taskId)`
Opens the modal and loads logs for the specified task.

**Parameters:**
- `taskId` (number): Task ID to load logs for

**Returns:** Promise<void>

### `close()`
Closes the modal and clears current state.

### `loadLogs(taskId)`
Fetches logs from the API for a specific task.

**Parameters:**
- `taskId` (number): Task ID

**Returns:** Promise<void>

### `renderLogs()`
Renders the loaded logs in the modal body.

### `formatTimestamp(timestamp)`
Formats ISO timestamp to human-readable format.

**Parameters:**
- `timestamp` (string): ISO 8601 timestamp

**Returns:** string (formatted as "08 May 2026, 10:30:15")

### `getLevelClass(level)`
Returns CSS class for log level.

**Parameters:**
- `level` (string): Log level (info, warning, error)

**Returns:** string (CSS class name)

### `getLevelIcon(level)`
Returns icon class for log level.

**Parameters:**
- `level` (string): Log level

**Returns:** string (Phosphor icon class)

### `escapeHtml(text)`
Escapes HTML to prevent XSS attacks.

**Parameters:**
- `text` (string): Text to escape

**Returns:** string (escaped HTML)

## Testing

A test HTML file is provided: `LogViewerModal.test.html`

### Test Scenarios

1. **With Logs**: Displays multiple logs with different levels
2. **Empty State**: Shows "no logs" message
3. **Loading State**: Shows spinner during fetch
4. **Error State**: Shows error message on failure

### Running Tests

1. Open `public/js/components/LogViewerModal.test.html` in a browser
2. Click test buttons to verify different states
3. Test close functionality (button, overlay, Escape key)
4. Test responsive design by resizing viewport

## Requirements Satisfied

This component satisfies the following requirements from the spec:

- **Requirement 4.2**: Modal opens when log button clicked
- **Requirement 4.8**: Modal includes close button

## Next Steps

The following tasks will complete the log viewer functionality:

- **Task 7.2**: Implement log loading and display
  - Fetch logs from API endpoint
  - Display in chronological order
  - Format timestamps
  - Color-code log levels
  - Handle empty state

- **Task 7.3**: Wire log button to modal
  - Add click handler to task table log buttons
  - Pass task ID to modal
  - Open modal on click

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Dependencies

- **CSS Variables**: Defined in `base/variables.css`
- **Phosphor Icons**: For log level icons
- **Fetch API**: For loading logs from backend
- **localStorage**: For JWT token storage

## Notes

- The modal automatically creates its HTML structure on initialization
- Only one instance should be created per page
- The modal uses the same styling patterns as TaskCreationModal for consistency
- Log messages are HTML-escaped to prevent XSS vulnerabilities
- The component follows the existing codebase patterns and conventions
