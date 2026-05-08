# Task 13.1 Manual Integration Test Checklist

## Prerequisites
- [ ] Server is running (`node server.js`)
- [ ] User is logged in
- [ ] At least one Steam account exists in the system
- [ ] At least one proxy exists in the system (for task execution)
- [ ] Browser console is open (F12) to check for errors

---

## Test 1: Task Creation Flow

### Steps:
1. [ ] Navigate to Tasks page (click "Görevler" in sidebar)
2. [ ] Verify "Görev Oluştur" button is visible in top-right
3. [ ] Click "Görev Oluştur" button
4. [ ] Verify modal opens with title "Yeni Görev Oluştur"
5. [ ] Verify accounts list loads (or shows "Hesap bulunamadı" if no accounts)
6. [ ] Select an account from the list
7. [ ] Verify "Oluştur" button becomes enabled
8. [ ] Click "Oluştur" button
9. [ ] Verify success notification appears: "Görev başarıyla oluşturuldu"
10. [ ] Verify modal closes automatically
11. [ ] Verify new task appears in the task table
12. [ ] Verify task has status "Bekliyor" (pending)

### Expected Results:
- ✅ Modal opens smoothly
- ✅ Accounts load without errors
- ✅ Account selection works
- ✅ Task is created successfully
- ✅ Table refreshes automatically
- ✅ No console errors

### Error Cases to Test:
- [ ] Click "Oluştur" without selecting account → Button should be disabled
- [ ] Create task when no proxies exist → Should show error notification
- [ ] Cancel modal → Modal should close without creating task

---

## Test 2: Log Viewing Flow

### Steps:
1. [ ] Ensure at least one task exists in the table
2. [ ] Locate the "Loglar" button for a task
3. [ ] Click the "Loglar" button
4. [ ] Verify log viewer modal opens with title "Görev Logları"
5. [ ] Verify logs are displayed (or "Bu görev için log bulunamadı" if no logs)
6. [ ] If logs exist, verify:
   - [ ] Logs are in chronological order (oldest first)
   - [ ] Each log has a timestamp
   - [ ] Log levels are color-coded (info=blue, warning=yellow, error=red)
   - [ ] Log messages are readable
7. [ ] Click "Kapat" button
8. [ ] Verify modal closes

### Expected Results:
- ✅ Modal opens smoothly
- ✅ Logs load without errors
- ✅ Logs are formatted correctly
- ✅ Modal closes properly
- ✅ No console errors

### Test with Different Task States:
- [ ] View logs for pending task → Should show "no logs" message
- [ ] View logs for running task → Should show execution logs
- [ ] View logs for completed task → Should show full execution history
- [ ] View logs for failed task → Should show error logs

---

## Test 3: Real-Time Polling

### Steps:
1. [ ] Navigate to Tasks page
2. [ ] Open browser DevTools Network tab
3. [ ] Filter for "tasks" requests
4. [ ] Observe network requests over 15 seconds
5. [ ] Verify requests to `/api/tasks/tasks` occur every 5 seconds
6. [ ] Create a new task (using Test 1 steps)
7. [ ] Watch the task status change in real-time:
   - [ ] "Bekliyor" (pending) → "İşleniyor" (running) → "Tamamlandı" (completed)
8. [ ] Verify status badge color changes:
   - [ ] Pending: Yellow/Orange
   - [ ] Running: Blue
   - [ ] Completed: Green
9. [ ] Scroll down in the task table
10. [ ] Wait for next polling update (5 seconds)
11. [ ] Verify scroll position is preserved after update

### Expected Results:
- ✅ Polling occurs every 5 seconds
- ✅ Task status updates automatically
- ✅ Status badge colors change correctly
- ✅ Scroll position is preserved
- ✅ No console errors
- ✅ No flickering or UI jumps

### Polling Error Handling:
1. [ ] Disconnect internet (or use DevTools to simulate offline)
2. [ ] Wait 15 seconds (3 polling attempts)
3. [ ] Verify error notification appears: "Görevler yüklenirken sürekli hata oluşuyor"
4. [ ] Reconnect internet
5. [ ] Verify polling resumes and notification disappears

---

## Test 4: Event Listeners

### Create Task Button:
- [ ] Click "Görev Oluştur" → Modal opens
- [ ] Click again after closing → Modal opens again

### Refresh Tasks Button:
- [ ] Click "Yenile" → Table refreshes immediately
- [ ] Verify loading state appears briefly

### Modal Close Handlers:
- [ ] Click overlay (outside modal) → Modal closes
- [ ] Press Escape key → Modal closes
- [ ] Click "İptal" button → Modal closes
- [ ] Click "Kapat" button → Modal closes

### Account Selection:
- [ ] Click on account item → Account is selected
- [ ] Click on radio button → Account is selected
- [ ] Visual selection indicator appears

---

## Test 5: Responsive Design

### Desktop View (> 768px):
- [ ] Task table displays as a table
- [ ] All columns are visible
- [ ] Buttons are properly sized
- [ ] Modals are centered

### Mobile View (< 768px):
- [ ] Task table switches to card layout
- [ ] Cards display all information
- [ ] Buttons are touch-friendly (44x44px minimum)
- [ ] Modals are responsive and scrollable

### Test Procedure:
1. [ ] Open browser DevTools (F12)
2. [ ] Toggle device toolbar (Ctrl+Shift+M)
3. [ ] Test at 375px width (mobile)
4. [ ] Test at 768px width (tablet)
5. [ ] Test at 1920px width (desktop)

---

## Test 6: Internationalization

### Turkish (Default):
- [ ] All UI text is in Turkish
- [ ] Status labels: "Bekliyor", "İşleniyor", "Tamamlandı", "Başarısız", "Zaman Aşımı"
- [ ] Button labels: "Görev Oluştur", "Yenile", "Oluştur", "İptal", "Kapat"
- [ ] Notifications are in Turkish

### English (if implemented):
- [ ] Switch language to English
- [ ] Verify all text updates to English
- [ ] Status labels: "Pending", "Running", "Completed", "Failed", "Timeout"

---

## Test 7: Error Scenarios

### No Accounts:
1. [ ] Delete all Steam accounts
2. [ ] Click "Görev Oluştur"
3. [ ] Verify message: "Hesap bulunamadı. Lütfen önce hesap ekleyin."
4. [ ] Verify "Oluştur" button is disabled

### No Proxies:
1. [ ] Delete all proxies
2. [ ] Try to create a task
3. [ ] Verify error notification: "Proxy bulunamadı. Lütfen önce proxy ekleyin."

### Network Error:
1. [ ] Disconnect internet
2. [ ] Try to create a task
3. [ ] Verify error notification: "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin."

### API Error:
1. [ ] Stop the server
2. [ ] Try to create a task
3. [ ] Verify error notification appears
4. [ ] Verify modal stays open for retry

---

## Test 8: Page Navigation

### Navigate Away:
1. [ ] Go to Tasks page
2. [ ] Verify polling is active (check Network tab)
3. [ ] Navigate to Dashboard page
4. [ ] Verify polling stops (no more requests in Network tab)

### Navigate Back:
1. [ ] Navigate back to Tasks page
2. [ ] Verify polling starts again
3. [ ] Verify tasks load correctly

### Page Refresh:
1. [ ] Refresh the page (F5)
2. [ ] Verify tasks load correctly
3. [ ] Verify polling starts automatically

---

## Test 9: Multiple Tasks

### Create Multiple Tasks:
1. [ ] Create 5 tasks in quick succession
2. [ ] Verify all tasks appear in the table
3. [ ] Verify tasks are ordered by creation time (newest first)
4. [ ] Verify each task has a unique ID

### View Logs for Multiple Tasks:
1. [ ] Open logs for task #1
2. [ ] Close modal
3. [ ] Open logs for task #2
4. [ ] Verify correct logs are displayed for each task

---

## Test 10: Performance

### Large Task List:
1. [ ] Create 20+ tasks
2. [ ] Verify table renders without lag
3. [ ] Verify scrolling is smooth
4. [ ] Verify polling updates don't cause UI freezes

### Memory Leaks:
1. [ ] Open Tasks page
2. [ ] Let it run for 5 minutes (60 polling cycles)
3. [ ] Check browser memory usage (DevTools Performance tab)
4. [ ] Verify no significant memory growth

---

## Console Error Check

Throughout all tests, monitor the browser console for:
- [ ] No JavaScript errors
- [ ] No network errors (except intentional offline tests)
- [ ] No React/Vue warnings (if applicable)
- [ ] No CORS errors
- [ ] No authentication errors

---

## Final Verification

After completing all tests:
- [ ] All integration points work correctly
- [ ] No console errors observed
- [ ] UI is responsive and smooth
- [ ] Error handling works as expected
- [ ] Polling works reliably
- [ ] All event listeners function properly

---

## Sign-Off

**Tester Name:** _________________

**Date:** _________________

**Browser:** _________________

**OS:** _________________

**Result:** ☐ PASS  ☐ FAIL

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
