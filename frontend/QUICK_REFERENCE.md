# ARIA Frontend - Quick Reference Guide

## 🔤 Import Helpers & Constants

```javascript
// Date/Time formatting
import { ago, formatDate, formatTime, formatDateTime } from '../utils/helpers';
ago(date) // → "2 hours ago"
formatDate(date) // → "Jan 5, 2024"

// Text utilities
import { truncate, capitalize, getInitials } from '../utils/helpers';
truncate("Long text...", 20) // → "Long text..."
getInitials("John Doe") // → "JD"

// Colors & Statuses
import { COLORS, STATUS_COLORS, SCORE_COLORS } from '../utils/constants';
// Use: style={{ color: STATUS_COLORS.hired }}
```

---

## 🪝 Using Custom Hooks

### Fetch Candidates
```jsx
import { useCandidates } from '../hooks/useAPI';

// Basic usage
const { candidates, loading, error } = useCandidates();

// With filters
const { candidates, loading, nextPage, hasMore } = useCandidates({
  limit: 20,
  filter: 'hired',
});

// Load data manually
const { refetch } = useCandidates({ autoLoad: false });
<button onClick={refetch}>Refresh</button>
```

### Search Candidates
```jsx
import { useCandidateSearch } from '../hooks/useAPI';

const { candidates, loading, search, query } = useCandidateSearch();

<input 
  onChange={(e) => search(e.target.value)}
  placeholder="Search candidates..."
/>
```

### Safe Polling (No Memory Leaks!)
```jsx
import { usePolling } from '../hooks/useAsync';

// Auto-cleanup on unmount
const { data, stop } = usePolling(
  async () => {
    const res = await api.check();
    return res.data;
  },
  3000, // Poll every 3 seconds
  isChecking // Only poll when needed
);

// Manual stop
<button onClick={stop}>Stop Polling</button>
```

### Form Handling
```jsx
import { useForm, createValidator, ValidationSchemas } from '../hooks';

const { values, errors, touched, handleChange, handleSubmit } = useForm(
  { email: '', password: '' },
  async (values) => await api.login(values),
  createValidator(ValidationSchemas.login)
);

<form onSubmit={handleSubmit}>
  <input name="email" value={values.email} onChange={handleChange} />
  {touched.email && errors.email && <span>{errors.email}</span>}
</form>
```

---

## 🎨 Using CSS Classes

### Flexbox
```jsx
<div className="flex-center">Centered content</div>
<div className="flex-between">
  <span>Left</span>
  <span>Right</span>
</div>
<div className="flex-col gap-md">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Grid
```jsx
<div className="grid-cols-3 gap-md">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>

<!-- Auto-responsive (4 cols → 2 cols on tablet → 1 col on mobile) -->
```

### Cards & Containers
```jsx
<div className="card">Content</div>
<div className="card card-lg">Large padding</div>
<div className="card card-compact">Small padding</div>
```

### Badges
```jsx
<span className="badge">Default</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-danger">Danger</span>
<span className="badge badge-warning">Warning</span>
```

### Buttons
```jsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Delete</button>
<button className="btn btn-sm">Small</button>
<button className="btn btn-lg">Large</button>
```

### Forms
```jsx
<div className="form-group">
  <label>Email</label>
  <input className="input" type="email" />
  <span className="error">Error message</span>
  <span className="help">Helper text</span>
</div>

<select className="select">
  <option>Choose...</option>
</select>

<textarea className="textarea"></textarea>
```

### Text Utilities
```jsx
<p className="text-sm text-muted">Small muted text</p>
<p className="text-lg text-primary">Large primary text</p>
<p className="font-bold">Bold text</p>
<p className="text-danger">Red text</p>
```

### Spacing
```jsx
<div className="p-4">Padding 1rem</div>
<div className="m-6">Margin 1.5rem</div>
<div className="gap-md">Gap 1.5rem (in flex)</div>
```

---

## ✅ Form Validation

### Built-in Validators
```javascript
import { 
  required, email, minLength, maxLength, 
  passwordStrength, phone, url, range 
} from '../utils/validation';

// Single validator
const emailValidator = email('Please enter valid email');
emailValidator('test@example.com') // → ''
emailValidator('invalid') // → 'Please enter valid email'

// Compose multiple validators
const strongPassword = compose(
  required('Password required'),
  minLength(8),
  passwordStrength()
);
```

### Validation Schemas
```javascript
import { ValidationSchemas } from '../utils/validation';

// Use preset schema
ValidationSchemas.login // { email, password }
ValidationSchemas.signup // { email, password, confirmPassword, company }
ValidationSchemas.jobCreation // { title, role, description, ... }

// Or create custom
const mySchema = {
  name: compose(required(), minLength(2)),
  email: email(),
  role: required('Select a role'),
};
```

---

## 🛡️ Error Handling

### Add Error Boundary
```jsx
// In main.jsx or App.jsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Show Loading States
```jsx
import { Spinner } from './components/ui';

if (loading) {
  return <div className="loading"><Spinner /></div>;
}

if (error) {
  return <div className="empty-state">
    <h3>Error</h3>
    <p>Failed to load data</p>
  </div>;
}
```

### Handle API Errors
```jsx
const { toast } = useToastStore();

try {
  await api.doSomething();
  toast('Success!', 'success');
} catch (error) {
  const msg = error.response?.data?.error || 'Something went wrong';
  toast(msg, 'error');
}
```

---

## 🔄 Common Patterns

### Load Data Once
```jsx
const { data, loading } = useAsync(() => api.getData());

useEffect(() => {
  refetch();
}, [id]); // Reload when ID changes
```

### Paginated List
```jsx
const { items, page, nextPage, prevPage, hasMore } = usePaginated(
  (limit, offset) => api.list({ limit, offset })
);

{items.map(item => <div key={item.id}>{item.name}</div>)}
<button onClick={nextPage} disabled={!hasMore}>Next</button>
```

### Debounced Search
```jsx
const { results, search, loading } = useSearch(
  (query) => api.search(query),
  300 // 300ms debounce
);

<input 
  onChange={(e) => search(e.target.value)}
  placeholder="Search..."
/>
{loading && <Spinner />}
{results.map(r => <div key={r.id}>{r.name}</div>)}
```

### Controlled Form
```jsx
const { values, errors, handleChange, handleSubmit } = useForm(
  { title: '', description: '' },
  async (data) => await api.create(data),
  myValidator
);

<input
  name="title"
  value={values.title}
  onChange={handleChange}
/>
{errors.title && <span className="error">{errors.title}</span>}
```

---

## 📱 Responsive Utilities

### Hide on Sizes
```jsx
<div className="hidden-mobile">Only on desktop</div>
<div className="hidden-tablet">Hide on tablet</div>
<div className="hidden-desktop">Hide on desktop</div>
```

### Responsive Grids
```jsx
<!-- Auto: 4 cols (desktop) → 2 cols (tablet) → 1 col (mobile) -->
<div className="grid-cols-4 gap-md">...</div>
```

### Mobile-First Styles
```css
/* Default (mobile) */
.my-element { font-size: 1rem; }

/* Tablet and up */
@media (min-width: 768px) {
  .my-element { font-size: 1.25rem; }
}

/* Desktop and up */
@media (min-width: 1280px) {
  .my-element { font-size: 1.5rem; }
}
```

---

## 🎬 Animations

### Use Built-in Animations
```jsx
<div className="animate-fadeUp">Fades in and slides up</div>
<div className="animate-fadeIn">Fades in</div>
<div className="animate-pulse">Pulses</div>
<div className="animate-spin">Spins</div>
```

### Custom Animations
```css
@keyframes myAnimation {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-custom {
  animation: myAnimation 300ms ease both;
}
```

---

## 🔗 Common Imports Cheat Sheet

```javascript
// Hooks
import { useAsync, usePaginated, useSearch, useForm, usePolling } from '../hooks';
import { useCandidates, useJobs, useSummary } from '../hooks/useAPI';

// Utils
import { ago, formatDate, truncate, capitalize } from '../utils/helpers';
import { copyToClipboard, debounce, formatStatus } from '../utils/helpers';

// Constants
import { COLORS, STATUS_COLORS, SCORE_COLORS } from '../utils/constants';
import { ROLE_CATEGORIES, BILLING_PLANS } from '../utils/constants';

// Validation
import { required, email, minLength, compose } from '../utils/validation';
import { ValidationSchemas, createValidator } from '../utils/validation';

// Components
import { ErrorBoundary } from './components/ErrorBoundary';
import { Card, Badge, Btn, Spinner } from './components/ui';
import { useToastStore, useAuthStore } from './store/useStore';
```

---

## 🚨 Common Mistakes to Avoid

❌ **Don't:** Define `ago()` in multiple files
✅ **Do:** Import from `utils/helpers.js`

❌ **Don't:** Use `setInterval` without storing ref
✅ **Do:** Use `usePolling()` hook

❌ **Don't:** Inline all styles
✅ **Do:** Use CSS classes from `components.css`

❌ **Don't:** Duplicate API call logic
✅ **Do:** Create custom hooks for patterns

❌ **Don't:** Forget to clean up effects
✅ **Do:** Return cleanup function from `useEffect`

---

**Last Updated:** April 2026
**Version:** 1.0
