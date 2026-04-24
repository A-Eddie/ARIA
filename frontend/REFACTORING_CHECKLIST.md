# Page Refactoring Checklist

Use this checklist when refactoring each page to use the new improvements.

## Pre-Refactoring

- [ ] Create a branch: `git checkout -b refactor/page-name`
- [ ] Verify current page works without errors
- [ ] Take screenshot of current state
- [ ] Note any console errors/warnings
- [ ] Check memory usage in DevTools

## Code Structure

- [ ] Move hardcoded colors to `COLORS` constant
- [ ] Move hardcoded status mappings to constants
- [ ] Extract `ago()` usage, replace with imported function
- [ ] Remove helper functions defined in the component
- [ ] Replace nested try/catch with error state management

## Hook Migration

- [ ] Identify all `useEffect` + async data fetching
- [ ] Replace with appropriate custom hook:
  - [ ] `useAsync()` for simple data
  - [ ] `usePaginated()` for lists with pagination
  - [ ] `useSearch()` for search inputs
  - [ ] `usePolling()` for intervals
  - [ ] `useForm()` for form handling
- [ ] Verify all dependencies are included
- [ ] Test that data loads correctly
- [ ] Verify error states work
- [ ] Verify loading states work

## Styling

- [ ] Identify all inline `style={{}}` objects
- [ ] Replace with CSS classes where possible
  - [ ] `display: flex` → Use `flex-center`, `flex-between`, etc.
  - [ ] `display: grid` → Use `grid-cols-*`
  - [ ] Repeated style objects → Extract to utility classes
  - [ ] Colors → Use CSS variables
  - [ ] Gap/margin → Use `gap-*`, `m-*`, `p-*` classes
- [ ] Create page-specific CSS file if needed (`src/styles/page-name.css`)
- [ ] Add mobile responsive styles
- [ ] Test on mobile (375px, 768px, 1920px)
- [ ] Verify all colors and spacing look correct

## Form Validation

- [ ] Check for any form inputs
- [ ] Add validation using `ValidationSchemas` or custom rules
- [ ] Show field-level error messages
- [ ] Disable submit button while validating
- [ ] Show success/error feedback after submit
- [ ] Test validation with invalid inputs

## Error Handling

- [ ] Replace `console.error` with error state
- [ ] Show user-friendly error messages
- [ ] Add retry functionality where appropriate
- [ ] Verify error UI matches design system

## Memory Leaks

- [ ] Search for `setInterval` → Replace with `usePolling()`
- [ ] Search for `setTimeout` → Ensure cleanup in `useEffect`
- [ ] Search for event listeners → Ensure cleanup in `useEffect`
- [ ] Verify no intervals left on unmount (DevTools → Performance)
- [ ] Check memory usage stays stable (DevTools → Memory)

## Accessibility

- [ ] Add `aria-label` to icon-only buttons
- [ ] Add form `label` elements
- [ ] Verify keyboard navigation works (Tab, Enter, Escape)
- [ ] Check color contrast meets WCAG standards
- [ ] Test with screen reader simulation

## Testing

- [ ] Verify page loads without errors
- [ ] Test all data fetching works
- [ ] Test all buttons/links work
- [ ] Test form submission works
- [ ] Test error states
- [ ] Test loading states
- [ ] Test responsive design on all breakpoints
- [ ] Verify no console warnings
- [ ] Check DevTools for memory leaks
- [ ] Test on real mobile device if possible

## Performance

- [ ] Check bundle size hasn't increased
- [ ] Verify no unnecessary re-renders (React DevTools)
- [ ] Check image optimization
- [ ] Verify animations are smooth
- [ ] Check API calls are minimized
- [ ] Use Chrome DevTools Lighthouse to check performance

## Code Review Checklist

- [ ] Code follows project conventions
- [ ] No hardcoded values
- [ ] Proper error handling
- [ ] Comments on complex logic
- [ ] No unused imports/variables
- [ ] Proper spacing and formatting
- [ ] Tests pass (if applicable)

## Final Verification

- [ ] Page works exactly as before (feature parity)
- [ ] All new code is cleaner and more maintainable
- [ ] No console errors/warnings
- [ ] Memory usage stable
- [ ] Performance is same or better
- [ ] Ready for code review

## After Merge

- [ ] Monitor error logs for issues
- [ ] Gather user feedback on UX
- [ ] Update project documentation if needed
- [ ] Consider what to refactor next

---

## Refactoring Priority Order

1. **Dashboard** (simple, few API calls)
2. **Jobs** (complex list, lots of styles)
3. **Candidates** (complex list, filtering)
4. **Candidate Detail** (multiple tabs, complex data)
5. **Interview** (highest memory leak risk)
6. **Forms** (Login, Signup, Settings)
7. **Reports** (simple display)
8. **Other pages**

---

## Questions During Refactoring?

- Check `QUICK_REFERENCE.md` for usage examples
- See `Dashboard.refactored.jsx` for best practices
- Review `Interview.refactored.jsx` for memory leak fixes
- Read `IMPROVEMENTS.md` for detailed explanations

---

## Common Refactoring Tasks

### Replace Multiple State Variables
```javascript
// Before
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// After
const { data, loading, error } = useAsync(...);
```

### Replace useEffect Data Fetching
```javascript
// Before
useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.list();
      setData(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);

// After
const { data, loading, error } = useAsync(() => api.list());
```

### Replace Inline Styles
```javascript
// Before
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  padding: '1.5rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
}}>

// After
<div className="card flex-between gap-md">
```

### Add Validation to Form
```javascript
// Before
<input value={email} onChange={(e) => setEmail(e.target.value)} />

// After
<input
  name="email"
  value={values.email}
  onChange={handleChange}
  onBlur={handleBlur}
/>
{touched.email && errors.email && <span className="error">{errors.email}</span>}
```

### Safe Polling
```javascript
// Before ❌ Memory leak
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await api.check();
    // ...
  }, 3000);
  // Missing cleanup!
}, []);

// After ✅ Proper cleanup
const { stop } = usePolling(() => api.check(), 3000);
useEffect(() => {
  return () => stop(); // Cleanup on unmount
}, [stop]);
```

---

## Post-Refactoring Metrics

Track these to verify improvements:

- **Code Lines:** Reduced by X%
- **Inline Styles:** Reduced by X%
- **useEffect Complexity:** Simplified
- **Memory Usage:** Stable (no leaks)
- **Bundle Size:** Same or smaller
- **Performance Score:** Same or higher
- **Test Coverage:** Maintained or improved
- **Developer Happiness:** Increased! 🎉

