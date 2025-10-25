# Zed AI Assistant Context-Aware Rules
## State Management & Framework Breaking Changes Debugging Protocol

### 🎯 OVERVIEW
This rule file provides context-sensitive guidance for AI assistants when encountering state management issues, particularly Zustand v5 infinite loop scenarios and similar framework breaking change bugs.

---

## 📋 IMMEDIATE RECOGNITION PATTERNS

### 🚨 HIGH-PRIORITY DETECTION TRIGGERS
When you encounter ANY of these patterns, **IMMEDIATELY** activate enhanced debugging protocols:

#### Zustand v5 Specific Indicators:
```
- Error: "The result of getSnapshot should be cached to avoid an infinite loop"
- Error: "Maximum update depth exceeded"
- Package.json shows: "zustand": "^5.x.x" or higher
- Recent dependency updates in commit history
- Object destructuring patterns in useStore selectors: `useStore(state => ({ ... }))`
- Custom hook selectors returning objects without useShallow
```

#### General State Management Red Flags:
```
- Infinite re-render errors after dependency updates
- Performance degradation after framework updates
- "Cannot update component while rendering" errors
- useSyncExternalStore warnings
- Selector functions creating new references
- Custom hooks returning new objects/arrays on every call
```

---

## 🔍 SYSTEMATIC INVESTIGATION PROTOCOL

### STEP 1: IMMEDIATE CONTEXT GATHERING (30 seconds max)
```bash
# Execute these checks IMMEDIATELY:
1. Check package.json for recent Zustand/state library versions
2. Scan for useStore/useState patterns with object returns
3. Look for recent commits touching state management
4. Identify all custom selector hooks (useDebts, useAuth, etc.)
```

### STEP 2: PATTERN ANALYSIS (Before suggesting ANY fix)
```typescript
// 🔍 SCAN FOR THESE ANTI-PATTERNS:

// ❌ DANGER PATTERN 1: Object destructuring without useShallow
export const useCustomHook = () =>
  useStore((state) => ({
    data: state.data,
    loading: state.loading,
  }));

// ❌ DANGER PATTERN 2: Array creation in selectors
export const useFilteredData = () =>
  useStore((state) => state.items.filter(item => item.active));

// ❌ DANGER PATTERN 3: Computed values creating new references
export const useComputedValues = () =>
  useStore((state) => ({
    total: state.items.reduce((sum, item) => sum + item.value, 0),
    filtered: state.items.map(item => ({ ...item, processed: true }))
  }));
```

### STEP 3: ROOT CAUSE VALIDATION
Before proposing solutions, **VERIFY** the root cause by checking:
1. **Scope**: Is this affecting one component or multiple?
2. **Timing**: When did this start occurring? (Recent updates?)
3. **Pattern**: Are there similar patterns elsewhere in the codebase?

---

## 🛠️ SOLUTION HIERARCHY & IMPLEMENTATION

### SOLUTION PRIORITY MATRIX

#### 🥇 FIRST CHOICE: useShallow for Object Selectors
```typescript
// ✅ RECOMMENDED PATTERN
import { useShallow } from 'zustand/react/shallow';

export const useCustomHook = () =>
  useStore(
    useShallow((state) => ({
      data: state.data,
      loading: state.loading,
    })),
  );
```

**Use when**: Object destructuring needed, multiple related values, existing patterns

#### 🥈 SECOND CHOICE: Granular Selectors
```typescript
// ✅ PERFORMANCE OPTIMIZED
export const useData = () => useStore((state) => state.data);
export const useLoading = () => useStore((state) => state.loading);
```

**Use when**: Performance critical, simple state access, few dependencies

#### 🥉 THIRD CHOICE: Component-Level useMemo
```typescript
// ✅ FLEXIBLE COMPUTATION
const data = useStore((state) => state.data);
const computedValue = useMemo(() => 
  data.filter(item => item.active), [data]
);
```

**Use when**: Complex computations, component-specific logic, dynamic filtering

---

## ⚠️ CRITICAL IMPLEMENTATION RULES

### 🚫 NEVER DO THESE ACTIONS:
1. **Don't suggest random fixes** without understanding the pattern
2. **Don't fix one selector** without checking others for the same issue
3. **Don't ignore middleware interactions** (persist, subscriptions, etc.)
4. **Don't assume it's user code** before checking dependency versions
5. **Don't implement createWithEqualityFn** with middleware (known compatibility issue)

### ✅ ALWAYS DO THESE ACTIONS:
1. **Check ALL custom selectors** in the project, not just the problematic one
2. **Scan multiple files** for the same pattern (auth stores, data stores, etc.)
3. **Test incrementally** - fix one store at a time and verify
4. **Commit working states** before attempting next fixes
5. **Document the fix reason** for future team members

---

## 📚 CONTEXT-AWARE DEBUGGING DECISION TREE

```
🔍 ERROR DETECTED
     ↓
📋 CHECK: Is this Zustand v5 + object selectors?
     ↓ YES
🚨 ACTIVATE: Enhanced state management protocol
     ↓
🔍 SCAN: Find ALL similar patterns in codebase
     ↓
📊 PRIORITIZE: Start with most critical/frequently used
     ↓
🛠️ IMPLEMENT: useShallow for object destructuring
     ↓
🧪 TEST: Verify fix works before moving to next
     ↓
💾 COMMIT: Save progress (incremental commits)
     ↓
🔄 REPEAT: Until all patterns fixed
     ↓
📝 DOCUMENT: Add preventive comments/patterns
```

---

## 🎯 FRAMEWORK-AGNOSTIC PREVENTION PATTERNS

### 🛡️ FUTURE-PROOFING GUIDELINES:
```typescript
// ✅ SAFE PATTERNS that survive version updates:

// 1. Primitive returns (safest)
const data = useStore(state => state.data);

// 2. Shallow-wrapped objects
const { data, loading } = useStore(useShallow(state => ({
  data: state.data,
  loading: state.loading
})));

// 3. Memoized computations
const processedData = useMemo(() => 
  rawData.map(transform), [rawData]
);

// 4. Stable reference patterns
const EMPTY_ARRAY = [];
const items = useStore(state => state.items ?? EMPTY_ARRAY);
```

### 🚫 ANTI-PATTERNS to Always Flag:
```typescript
// ❌ These will likely break in future versions:

// New objects in selectors
const state = useStore(state => ({ ...state.user }));

// Array methods in selectors  
const filtered = useStore(state => state.items.filter(fn));

// Computed properties
const computed = useStore(state => ({
  total: state.items.length,
  sum: state.items.reduce((a, b) => a + b.value, 0)
}));
```

---

## 🔧 DEBUGGING TOOLKIT COMMANDS

### Instant Diagnostic Commands:
```bash
# 1. Find all object-returning selectors
grep -r "useStore.*=>" --include="*.ts" --include="*.tsx" . | grep "=>"

# 2. Check Zustand version
npm list zustand

# 3. Find custom hooks that might be problematic
grep -r "export const use.*= ()" --include="*.ts" src/

# 4. Check for useShallow imports
grep -r "useShallow" --include="*.ts" src/
```

### Version Impact Assessment:
```typescript
// Quick version check pattern for any state library:
// 1. Check package.json for version changes
// 2. Look for breaking change patterns in recent commits  
// 3. Cross-reference with library's migration guides
// 4. Test with isolated reproduction case
```

---

## 🎓 LEARNING EXTRACTION PROTOCOL

### After Each Fix, Document:
1. **Root cause**: What specific pattern caused the issue?
2. **Scope**: How many files/components were affected?
3. **Solution chosen**: Why this approach over alternatives?
4. **Prevention**: What pattern would prevent this in future?

### Team Knowledge Sharing:
```markdown
## Add to team documentation:
- Link to this debugging session
- Code patterns that broke and why
- Recommended patterns going forward
- Migration checklist for future updates
```

---

## 🚀 PROACTIVE MEASURES

### Before Major Dependency Updates:
1. **Audit current patterns** against new version breaking changes
2. **Create test cases** for critical state management flows  
3. **Plan migration strategy** with rollback options
4. **Update linting rules** to catch problematic patterns

### Ongoing Monitoring:
```typescript
// Add these ESLint rules to catch issues early:
// - Detect object returns in store selectors
// - Flag array methods in selectors
// - Require useShallow for object destructuring
// - Warn on computed values in selectors
```

---

## 🎯 SUCCESS METRICS

### Fix Completion Checklist:
- [ ] All infinite loop errors eliminated
- [ ] Performance maintained or improved
- [ ] Patterns consistent across codebase
- [ ] Future-proof architecture in place
- [ ] Team documentation updated
- [ ] Prevention measures implemented

### Quality Gates:
- Bundle size impact: < 5% increase
- Performance: No regression in render times
- Developer Experience: Patterns remain intuitive
- Maintainability: Clear separation of concerns

---

*This rule file should be treated as a living document, updated based on new framework versions and debugging experiences.*