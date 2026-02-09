# Asset Manager - Pre-Deployment Checklist

**Date:** ________  
**Deployer:** ________  
**Environment:** [ ] Staging [ ] Production

---

## ✅ Code Quality Checks

### Backend
- [ ] All TypeScript files compile without errors
- [ ] No ESLint errors in backend code
- [ ] All backend tests pass (`npm test` in `/apps/backend`)
- [ ] API endpoints respond correctly (manual test)
- [ ] Environment variables documented in `.env.example`

### Frontend  
- [ ] All TypeScript files compile without errors
- [ ] No ESLint errors in frontend code
- [ ] All frontend tests pass (`npm test` in `/apps/web`)
- [ ] UI renders correctly in dev mode
- [ ] No console errors in browser

---

## ✅ Functionality Tests

### Image Generation & Save
- [ ] Can generate an image with AI
- [ ] "Save to Assets" button appears after generation
- [ ] Clicking "Save to Assets" shows success message
- [ ] Image appears in Asset Manager after saving

### Asset Manager UI
- [ ] Can open Asset Manager from profile dropdown
- [ ] Modal displays correctly (responsive)
- [ ] Search box works (filters in real-time)
- [ ] Filter tabs work (All/Generated/Uploaded)
- [ ] Pagination works if >20 assets
- [ ] Empty state shows when no assets

### Asset Operations
- [ ] Images load and display in asset cards
- [ ] Can hover over cards to see action buttons
- [ ] Can delete an asset (with confirmation)
- [ ] Deleted asset disappears from list
- [ ] Can search for assets by name
- [ ] Can filter by source type

### Deduplication
- [ ] Generate same image twice
- [ ] Save both times
- [ ] Only ONE asset appears in list
- [ ] Deleting the asset works correctly

---

## ✅ Database Configuration

### Firestore Rules
- [ ] `firestore.rules` file exists
- [ ] Rules deployed: `firebase deploy --only firestore:rules`
- [ ] Verified in Firebase Console: Rules → Asset collections protected
- [ ] Test: Cannot access another user's assets

### Firestore Indexes
- [ ] `firestore.indexes.json` file exists
- [ ] Indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] Verified in Firebase Console: Indexes → All building/built
- [ ] Wait 5-10 minutes for indexes to complete
- [ ] Test: Asset queries work without errors

### Firestore Collections
- [ ] `assets` collection exists (will be created on first use)
- [ ] `assetData` collection exists (will be created on first use)
- [ ] Sample data created from testing

---

## ✅ Security Checks

### Authentication
- [ ] All `/api/assets/*` endpoints require authentication
- [ ] Unauthorized requests return 401
- [ ] Cannot access other users' assets (403)
- [ ] JWTs validated correctly

### Authorization
- [ ] Users can only see their own assets
- [ ] Users cannot modify other users' assets
- [ ] Users cannot delete other users' assets
- [ ] Asset data endpoint verifies ownership

### Data Validation
- [ ] Invalid asset creation rejected (400)
- [ ] Missing required fields rejected (400)
- [ ] Invalid asset IDs rejected (404)
- [ ] SQL injection attempts handled safely

---

## ✅ Performance Tests

### Backend Performance
- [ ] Asset list loads in <2 seconds
- [ ] Asset creation completes in <3 seconds
- [ ] Asset deletion completes in <1 second
- [ ] Image data fetch completes in <2 seconds

### Frontend Performance
- [ ] Modal opens instantly (<100ms)
- [ ] Search filtering is instant (<50ms)
- [ ] Filter tabs switch instantly
- [ ] Images lazy-load correctly

### Storage
- [ ] Large images (>1MB) save successfully
- [ ] Multiple images can be saved in succession
- [ ] Deduplication prevents redundant storage
- [ ] Asset data collection doesn't exceed Firestore limits

---

## ✅ Error Handling

### Network Errors
- [ ] Offline mode shows appropriate error
- [ ] Failed save shows error message
- [ ] Failed load shows error message
- [ ] Retry functionality works

### Edge Cases
- [ ] Empty search returns all assets
- [ ] Invalid page number handled gracefully
- [ ] No assets found shows empty state
- [ ] Malformed image data rejected

---

## ✅ Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## ✅ Responsive Design

Test on:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile (360x640)

---

## ✅ Documentation

- [ ] API endpoints documented
- [ ] Code comments added where needed
- [ ] README updated with Asset Manager info
- [ ] User guide created (if needed)
- [ ] Developer quick reference available

---

## ✅ Monitoring & Logging

- [ ] Backend logs asset operations
- [ ] Error logging configured
- [ ] Performance monitoring enabled
- [ ] Usage analytics tracked (optional)

---

## ✅ Deployment Steps

### Pre-Deployment
- [ ] All checklist items above completed
- [ ] Code reviewed by team member
- [ ] Staging environment tested
- [ ] Rollback plan documented

### Deployment
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Environment variables set

### Post-Deployment
- [ ] Verify deployment successful
- [ ] Test production endpoint manually
- [ ] Check error logs for issues
- [ ] Monitor performance metrics
- [ ] Announce to users (if applicable)

---

## ✅ Rollback Plan (If Needed)

### Backend Rollback
```bash
# Rollback to previous version
git checkout <previous-commit>
npm run deploy:backend
```

### Frontend Rollback
```bash
# Rollback to previous version
git checkout <previous-commit>
npm run deploy:frontend
```

### Firestore Rules Rollback
```bash
# Revert rules in Firebase Console
# Or redeploy previous firestore.rules
firebase deploy --only firestore:rules
```

---

## 📝 Notes & Issues

**Issues Found:**
_Document any issues found during testing_

---

**Deployment Approved By:** ________  
**Date:** ________  
**Signature:** ________

---

## 🎉 Post-Checklist Actions

After successful deployment:
1. Create release notes
2. Update changelog
3. Notify team in Slack
4. Monitor for 24 hours
5. Collect user feedback

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-02-08  
**Feature:** Asset Manager
