# Zustand v5 Quick Reference Card
*Keep this handy during debugging sessions*

## 🚨 INSTANT RECOGNITION
```
ERROR: "The result of getSnapshot should be cached to avoid an infinite loop"
ERROR: "Maximum update depth exceeded"
STATUS: Zustand v5 breaking change detected
ACTION: Apply patterns below immediately
```

## 🔍 FIND THE PROBLEM
```bash
# Quick scan for problematic patterns
grep -r "useStore.*=> ({" --include="*.ts" --include="*.tsx" .
grep -r "export const use.*= ()" --include="*.ts" src/
```

## ❌ DANGER PATTERNS
```typescript
// 🚫 BREAKS IN V5: Object destructuring without useShallow
const { data, loading } = useStore(state => ({
  data: state.data,
  loading: state.loading
}));

// 🚫 BREAKS IN V5: Array creation in selector
const filtered = useStore(state => 
  state.items.filter(item => item.active)
);

// 🚫 BREAKS IN V5: Computed object/array returns
const computed = useStore(state => ({
  total: state.items.length,
  mapped: state.items.map(transform)
}));
```

## ✅ SAFE PATTERNS
```typescript
// ✅ FIX 1: Add useShallow for objects
import { useShallow } from 'zustand/react/shallow';

const { data, loading } = useStore(useShallow(state => ({
  data: state.data,
  loading: state.loading
})));

// ✅ FIX 2: Use granular selectors
const data = useStore(state => state.data);
const loading = useStore(state => state.loading);

// ✅ FIX 3: Move computation to useMemo
const items = useStore(state => state.items);
const filtered = useMemo(() => 
  items.filter(item => item.active), [items]
);
```

## 🎯 DEBUGGING WORKFLOW
```
1. Identify ALL custom selectors (useAuth, useDebts, etc.)
2. Check each for object/array returns
3. Fix with useShallow or move to useMemo
4. Test one fix at a time
5. Commit working state before next fix
6. Repeat until no infinite loops
```

## 📋 CHECKLIST
- [ ] All `useStore(state => ({ ... }))` patterns wrapped with `useShallow`
- [ ] Array computations moved to component `useMemo`
- [ ] No new objects/arrays created in selectors
- [ ] All custom hooks (useAuth, useDebts, etc.) checked
- [ ] App runs without infinite loop errors
- [ ] Performance maintained or improved

## 🚀 PREVENTION
```typescript
// Always use these patterns for v5 compatibility:

// For primitives (always safe)
const count = useStore(state => state.count);

// For objects (require useShallow)
const { user, settings } = useStore(useShallow(state => ({
  user: state.user,
  settings: state.settings
})));

// For computations (use useMemo)
const data = useStore(state => state.rawData);
const processed = useMemo(() => 
  data.map(item => ({ ...item, enhanced: true })), [data]
);

// For stable references
const EMPTY_ARRAY = [];
const items = useStore(state => state.items ?? EMPTY_ARRAY);
```

## 🔧 COMMON FIXES
```typescript
// BEFORE (v4 worked, v5 breaks)
export const useAuth = () =>
  useStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated
  }));

// AFTER (v5 compatible)
export const useAuth = () =>
  useStore(useShallow(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated
  })));
```

## 📚 RESOURCES
- [Zustand v5 Migration Guide](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5)
- [useShallow Documentation](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)
- Import path: `import { useShallow } from 'zustand/react/shallow';`

---
*When in doubt: wrap object selectors with `useShallow`, move computations to `useMemo`*