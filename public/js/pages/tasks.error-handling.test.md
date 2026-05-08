# Task Management UI - Error Handling Test Plan

## Overview
This document outlines all error scenarios that have been implemented with proper error handling, notifications, and retry logic for the Task Management UI.

## Test Scenarios

### 1. Task Creation Errors

#### 1.1 Network Error (No Internet Connection)
**Steps:**
1. Disconnect from internet
2. Click "Görev Oluştur" button
3. Select an account
4. Click "Oluştur"

**Expected Result:**
- Error notification: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."
- Notification includes "Tekrar Dene" button
- Clicking retry button attempts to create task again
- Maximum 2 retry attempts allowed

**Status:** ✅ Implemented

#### 1.2 Server Error (5xx)
**Steps:**
1. Simulate server error (500, 502, 503, 504)
2. Click "Görev Oluştur" button
3. Select an account
4. Click "Oluştur"

**Expected Result:**
- Error notification with server error message
- Notification includes "Tekrar Dene" button
- Retry logic enabled (up to 2 attempts)

**Status:** ✅ Implemented

#### 1.3 No Proxies Available
**Steps:**
1. Ensure no proxies are available in the system
2. Click "Görev Oluştur" button
3. Select an account
4. Click "Oluştur"

**Expected Result:**
- Error notification: "Proxy bulunamadı. Lütfen önce proxy ekleyin."
- No retry button (this is a user action error, not retryable)

**Status:** ✅ Implemented (backend validation)

#### 1.4 No Accounts Available
**Steps:**
1. Ensure no accounts are added
2. Click "Görev Oluştur" button

**Expected Result:**
- Modal opens
- Shows message: "Hesap bulunamadı. Lütfen önce hesap ekleyin."
- Create button is disabled

**Status:** ✅ Implemented

#### 1.5 Rate Limiting (429)
**Steps:**
1. Simulate rate limit error (429)
2. Click "Görev Oluştur" button
3. Select an account
4. Click "Oluştur"

**Expected Result:**
- Error notification with rate limit message
- Notification includes "Tekrar Dene" button
- Retry logic enabled

**Status:** ✅ Implemented

#### 1.6 Timeout (408)
**Steps:**
1. Simulate timeout error (408)
2. Click "Görev Oluştur" button
3. Select an account
4. Click "Oluştur"

**Expected Result:**
- Error notification with timeout message
- Notification includes "Tekrar Dene" button
- Retry logic enabled

**Status:** ✅ Implemented

### 2. Task List Loading Errors

#### 2.1 Network Error During Polling
**Steps:**
1. Load tasks page successfully
2. Disconnect from internet
3. Wait for 3 polling cycles (15 seconds)

**Expected Result:**
- After 3 consecutive failures, show notification: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."
- Notification includes "Şimdi Tekrar Dene" button
- Last successful task data remains visible (not cleared)
- Polling continues in background

**Status:** ✅ Implemented

#### 2.2 Server Error During Polling
**Steps:**
1. Load tasks page successfully
2. Simulate server error (500)
3. Wait for 3 polling cycles

**Expected Result:**
- After 3 consecutive failures, show notification with error message
- Notification includes "Şimdi Tekrar Dene" button
- Last successful task data remains visible
- Polling continues in background

**Status:** ✅ Implemented

#### 2.3 Manual Retry After Polling Failure
**Steps:**
1. Trigger polling failure notification
2. Click "Şimdi Tekrar Dene" button

**Expected Result:**
- Notification disappears
- Immediate task list refresh attempt
- If successful, task list updates
- Failure counter resets

**Status:** ✅ Implemented

### 3. Log Viewer Errors

#### 3.1 Network Error Loading Logs
**Steps:**
1. Disconnect from internet
2. Click "Loglar" button for any task

**Expected Result:**
- Modal opens
- Shows loading state
- Error message: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."
- "Tekrar Dene" button displayed
- Maximum 2 retry attempts

**Status:** ✅ Implemented

#### 3.2 Server Error Loading Logs
**Steps:**
1. Simulate server error (500)
2. Click "Loglar" button for any task

**Expected Result:**
- Modal opens
- Shows loading state
- Error message with server error details
- "Tekrar Dene" button displayed
- Retry logic enabled

**Status:** ✅ Implemented

#### 3.3 Task Not Found (404)
**Steps:**
1. Click "Loglar" button for a deleted task

**Expected Result:**
- Modal opens
- Error message: "Task bulunamadı" (or similar)
- No retry button (404 is not retryable)

**Status:** ✅ Implemented

#### 3.4 Unauthorized Access (403/401)
**Steps:**
1. Attempt to view logs for task belonging to another user

**Expected Result:**
- Modal opens
- Error message about unauthorized access
- No retry button (authorization errors are not retryable)

**Status:** ✅ Implemented

#### 3.5 Retry Limit Reached
**Steps:**
1. Trigger log loading error
2. Click "Tekrar Dene" button twice
3. Fail all 3 attempts

**Expected Result:**
- After 3rd failure, show error without retry button
- Message: "Maksimum deneme sayısına ulaşıldı. Lütfen daha sonra tekrar deneyin."

**Status:** ✅ Implemented

### 4. Account Loading Errors (in Task Creation Modal)

#### 4.1 Network Error Loading Accounts
**Steps:**
1. Disconnect from internet
2. Click "Görev Oluştur" button

**Expected Result:**
- Modal opens
- Shows loading state
- Error message: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."
- "Tekrar Dene" button displayed
- Maximum 2 retry attempts

**Status:** ✅ Implemented

#### 4.2 Server Error Loading Accounts
**Steps:**
1. Simulate server error (500)
2. Click "Görev Oluştur" button

**Expected Result:**
- Modal opens
- Shows loading state
- Error message with server error details
- "Tekrar Dene" button displayed
- Retry logic enabled

**Status:** ✅ Implemented

### 5. Single Account Check Errors

#### 5.1 Network Error Checking Account
**Steps:**
1. Disconnect from internet
2. Click "Kontrol Et" button on an account card

**Expected Result:**
- Button shows loading state
- Error notification: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."
- Button returns to normal state

**Status:** ✅ Implemented

#### 5.2 Server Error Checking Account
**Steps:**
1. Simulate server error (500)
2. Click "Kontrol Et" button on an account card

**Expected Result:**
- Button shows loading state
- Error notification with server error message
- Button returns to normal state

**Status:** ✅ Implemented

### 6. Inventory Loading Errors

#### 6.1 Network Error Loading Inventory
**Steps:**
1. Disconnect from internet
2. Click "Envanter" button on an account card

**Expected Result:**
- Error notification: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."

**Status:** ✅ Implemented

#### 6.2 Server Error Loading Inventory
**Steps:**
1. Simulate server error (500)
2. Click "Envanter" button on an account card

**Expected Result:**
- Error notification with server error message

**Status:** ✅ Implemented

## Error Classification

### Retryable Errors (Show Retry Button)
- Network errors (TypeError with 'fetch')
- Server errors (5xx status codes)
- Timeout errors (408)
- Rate limiting (429)

### Non-Retryable Errors (No Retry Button)
- Client errors (4xx except 408 and 429)
- Authorization errors (401, 403)
- Not found errors (404)
- Validation errors (400)
- User action errors (no accounts, no proxies)

## Retry Logic

### Maximum Retry Attempts
- Task creation: 2 retries (3 total attempts)
- Log loading: 2 retries (3 total attempts)
- Account loading in modal: 2 retries (3 total attempts)
- Polling: Continuous (shows notification after 3 consecutive failures)

### Retry Behavior
- Retry counter increments with each attempt
- After max retries, show final error without retry button
- Successful operation resets retry counter
- Retry button triggers immediate retry (no delay)

## Notification Behavior

### Standard Notifications
- Duration: 3 seconds
- Auto-dismiss after duration
- Can be manually dismissed by clicking

### Retry Notifications
- Duration: 5 seconds (task creation, log loading)
- Duration: 7 seconds (polling errors)
- Include "Tekrar Dene" or "Şimdi Tekrar Dene" button
- Clicking retry button dismisses notification and retries operation

### Notification Types
- Success: Green border, success icon
- Error: Red border, error icon
- Warning: Yellow border, warning icon
- Info: Blue border, info icon

## Translation Keys

### Turkish (tr.json)
```json
{
  "tasks.notifications.taskCreated": "Görev başarıyla oluşturuldu",
  "tasks.notifications.taskCreationFailed": "Görev oluşturulamadı",
  "tasks.notifications.connectionError": "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.",
  "tasks.notifications.serverError": "Sunucu hatası",
  "tasks.notifications.retry": "Tekrar Dene",
  "tasks.notifications.retryNow": "Şimdi Tekrar Dene",
  "tasks.notifications.tasksLoadError": "Görevler yüklenirken sürekli hata oluşuyor. Lütfen internet bağlantınızı kontrol edin.",
  "tasks.logModal.retryLimitReached": "Maksimum deneme sayısına ulaşıldı. Lütfen daha sonra tekrar deneyin."
}
```

### English (en.json)
```json
{
  "tasks.notifications.taskCreated": "Task created successfully",
  "tasks.notifications.taskCreationFailed": "Failed to create task",
  "tasks.notifications.connectionError": "Connection error. Please check your internet connection.",
  "tasks.notifications.serverError": "Server error",
  "tasks.notifications.retry": "Retry",
  "tasks.notifications.retryNow": "Retry Now",
  "tasks.notifications.tasksLoadError": "Continuous error loading tasks. Please check your internet connection.",
  "tasks.logModal.retryLimitReached": "Maximum retry attempts reached. Please try again later."
}
```

## CSS Enhancements

### Notification with Action Button
```css
.notification-with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.notification-retry-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: var(--light);
  font-weight: 600;
  cursor: pointer;
}
```

## Requirements Coverage

### Requirement 1.5: Success notifications for task creation
✅ Implemented - Shows "Görev başarıyla oluşturuldu" on success

### Requirement 1.6: Error notifications for task creation failure
✅ Implemented - Shows specific error messages with retry logic

### Requirement 8.5: Handle API errors gracefully
✅ Implemented - All API calls have comprehensive error handling

### Requirement 8.6: Handle network errors gracefully
✅ Implemented - Network errors detected and handled with retry logic

## Manual Testing Checklist

- [ ] Test task creation with no internet
- [ ] Test task creation with server error
- [ ] Test task creation with no proxies
- [ ] Test task creation with no accounts
- [ ] Test task creation retry button (success after retry)
- [ ] Test task creation retry limit (3 attempts)
- [ ] Test polling failure notification (after 3 failures)
- [ ] Test polling retry button
- [ ] Test log viewer with no internet
- [ ] Test log viewer with server error
- [ ] Test log viewer retry button
- [ ] Test log viewer retry limit
- [ ] Test account loading in modal with errors
- [ ] Test single account check with errors
- [ ] Test inventory loading with errors
- [ ] Verify all error messages are in Turkish
- [ ] Verify all error messages are in English (when language is switched)
- [ ] Test on mobile (retry buttons should be full width)
- [ ] Test notification auto-dismiss timing
- [ ] Test multiple simultaneous errors

## Notes

1. **Polling Behavior**: When polling fails, the last successful task data remains visible. This prevents the UI from showing an empty state during temporary network issues.

2. **Retry Counter Reset**: The retry counter resets on successful operations, allowing users to retry again if they encounter errors later.

3. **Error Message Specificity**: Error messages are as specific as possible, helping users understand what went wrong and how to fix it.

4. **User Experience**: Retry buttons provide a better UX than forcing users to manually repeat actions. The retry logic is automatic and seamless.

5. **Mobile Responsiveness**: Retry buttons are full-width on mobile devices for better touch accessibility.

## Future Enhancements

1. **Exponential Backoff**: Implement exponential backoff for retry attempts to reduce server load
2. **Offline Mode**: Detect offline state and show persistent offline indicator
3. **Error Logging**: Send error logs to monitoring service (e.g., Sentry)
4. **Retry Queue**: Queue failed operations and retry them automatically when connection is restored
5. **Toast Notifications**: Consider using toast notifications for less critical errors
