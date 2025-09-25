# Testing Strategy for Vitality Character Builder

## Overview

This document outlines comprehensive testing approaches for the character builder web application, focusing on end-to-end character creation workflows and identifying potential failure points in the user journey.

---

## Testing Challenges & Considerations

### Current Architecture Constraints
- **No Traditional Test Framework**: The application lacks Jest, Cypress, or similar testing infrastructure
- **Browser-Based ES6 Modules**: Uses native ES6 imports requiring a browser environment or module bundler
- **Complex State Management**: Character state flows through multiple interconnected systems
- **Event-Driven UI**: Heavy reliance on DOM event delegation and dynamic rendering

### Key Testing Targets
- **Data Integrity**: Ensuring character object remains valid throughout creation process
- **Point Pool Calculations**: Verifying budget calculations across all pools (main, utility, special attacks)
- **Advisory System**: Confirming non-blocking behavior while maintaining warnings
- **Cross-Tab Dependencies**: Validating that choices in one tab properly affect other tabs
- **Custom Content Creation**: Testing user-generated content (custom abilities, limits, etc.)

---

## Proposed Testing Approaches

### 1. Browser Automation Testing (Recommended)

**Tool Options:**
- **Playwright/Puppeteer**: Headless browser automation for full character creation flows
- **Selenium WebDriver**: Cross-browser compatibility testing
- **Cypress**: Modern e2e testing with excellent debugging capabilities

**Test Scenarios:**
- **Happy Path Character Creation**: Build a complete character from start to finish
- **Budget Boundary Testing**: Attempt to exceed various point pools and verify advisory warnings
- **Cross-Tab Navigation**: Verify state persistence when switching between tabs
- **Custom Content Flows**: Create custom abilities, limits, and utility items
- **Data Export/Import**: Test JSON export functionality and character loading

**Sample Test Flow:**
```
1. Load character-builder.html
2. Fill basic info (name, tier, character type)
3. Select all 7 archetypes
4. Allocate attribute points
5. Purchase main pool items (traits, flaws, boons, unique abilities)
6. Create special attacks with limits and upgrades
7. Purchase utility items and expertise
8. Verify final character in summary tab
9. Export character JSON
10. Validate exported data structure
```

### 2. Unit Testing with JSDOM

**Approach**: Test individual components in isolation using Node.js + JSDOM
**Benefits**: Fast execution, good for testing specific component logic
**Limitations**: Doesn't capture integration issues or browser-specific behavior

**Test Categories:**
- **System Classes**: UtilitySystem, UniqueAbilitySystem calculation methods
- **Calculator Functions**: Point pool calculations, stat derivations
- **Validation Logic**: Custom item validation, purchase validation
- **Data Manager**: GameDataManager data loading and caching

### 3. Integration Testing Strategy

**Component Integration Tests:**
- Test that GameDataManager properly loads all JSON data files
- Verify that PointPoolCalculator correctly aggregates costs from all systems
- Ensure EventManager delegation works across all tab components

**Data Flow Tests:**
- Verify character object structure remains valid after each major operation
- Test that character updates properly trigger UI re-renders
- Ensure state synchronization between tabs

### 4. Property-Based Testing

**Concept**: Generate random valid character configurations and verify invariants
**Tools**: QuickCheck-style libraries (fast-check for JavaScript)

**Invariants to Test:**
- Point pools never become invalid after any sequence of valid operations
- Character object always passes schema validation
- Advisory warnings appear when appropriate but don't block actions
- Calculated stats always derive correctly from base attributes and purchases

---

## Specific Test Scenarios

### Critical User Journeys

**Scenario 1: Budget-Conscious Player**
- Create character with limited points
- Attempt to purchase items that exceed budget
- Verify warnings appear but purchases proceed
- Confirm final character is valid despite over-budget status

**Scenario 2: Power Gamer**
- Create high-tier character with maximum points
- Purchase complex combinations of abilities with upgrades
- Test edge cases with multiple custom items
- Verify all calculations remain accurate

**Scenario 3: Custom Content Creator**
- Create custom unique abilities with upgrades
- Build custom utility items across all categories
- Design custom special attack limits
- Ensure custom content integrates properly with standard items

### Error Condition Testing

**Data Corruption Scenarios:**
- Invalid JSON in data files
- Missing required character properties
- Circular dependencies in upgrade systems

**UI State Issues:**
- Rapid tab switching during operations
- Multiple simultaneous purchases
- Event listener conflicts during re-renders

**Boundary Conditions:**
- Zero-point characters
- Maximum-tier characters
- Edge cases in point calculations

---

## Testing Implementation Recommendations

### Phase 1: Basic Automation Setup
1. Choose browser automation tool (Playwright recommended for modern features)
2. Set up basic test harness that can load the character builder
3. Implement simple "smoke tests" that verify page loads and basic navigation

### Phase 2: Core Workflow Testing
1. Implement full character creation flow test
2. Add point pool validation tests
3. Test advisory system behavior under various budget conditions

### Phase 3: Advanced Scenarios
1. Custom content creation testing
2. Complex interaction testing (multiple abilities, upgrades, etc.)
3. Data export/import validation

### Phase 4: Comprehensive Coverage
1. Property-based testing for edge cases
2. Performance testing with large numbers of purchases
3. Cross-browser compatibility verification

---

## Expected Benefits of Comprehensive Testing

### Bug Prevention
- Catch calculation errors before they reach users
- Identify state management issues early
- Prevent regressions in complex interaction chains

### Development Confidence
- Safe refactoring of complex components
- Reliable deployment of new features
- Clear documentation of expected behavior

### User Experience Validation
- Verify that advisory system provides helpful guidance
- Ensure smooth character creation workflows
- Confirm that custom content features work as intended

---

## Implementation Considerations

### Test Data Management
- Create standardized test character configurations
- Maintain test data sets that cover edge cases
- Version control test scenarios alongside code

### Continuous Integration
- Automated test runs on code changes
- Performance regression detection
- Cross-browser testing automation

### Test Maintenance
- Keep tests synchronized with UI changes
- Regular review of test coverage
- Periodic validation of test scenario relevance

---

## Proposed Test Folder Structure

### Root `/tests/` Directory Organization

```
tests/
├── package.json                    # Test dependencies and scripts
├── playwright.config.js            # Playwright configuration
├── jest.config.js                  # Jest configuration for unit tests
├── .gitignore                      # Ignore node_modules, test artifacts
├── README.md                       # Test suite documentation
│
├── e2e/                            # End-to-end browser tests
│   ├── character-creation/
│   │   ├── basic-workflow.spec.js      # Happy path character creation
│   │   ├── tier-scenarios.spec.js      # Different tier character builds
│   │   ├── archetype-combinations.spec.js  # Various archetype combos
│   │   └── budget-scenarios.spec.js    # Over/under budget testing
│   │
│   ├── advisory-system/
│   │   ├── budget-warnings.spec.js     # Advisory notification testing
│   │   ├── non-blocking.spec.js        # Ensure purchases proceed
│   │   └── calculation-accuracy.spec.js # Point pool math validation
│   │
│   ├── custom-content/
│   │   ├── custom-abilities.spec.js    # Custom unique ability creation
│   │   ├── custom-utilities.spec.js    # Custom utility item creation
│   │   ├── custom-limits.spec.js       # Custom special attack limits
│   │   └── custom-upgrades.spec.js     # Custom upgrade creation
│   │
│   ├── cross-tab-integration/
│   │   ├── state-persistence.spec.js   # Tab switching with state
│   │   ├── dependency-updates.spec.js  # Changes affecting other tabs
│   │   └── navigation-flow.spec.js     # Complete tab progression
│   │
│   └── data-management/
│       ├── export-import.spec.js       # JSON export/import testing
│       ├── character-library.spec.js   # Character saving/loading
│       └── data-validation.spec.js     # Character object integrity
│
├── unit/                           # Component isolation tests
│   ├── systems/
│   │   ├── UtilitySystem.test.js       # Utility point calculations
│   │   ├── UniqueAbilitySystem.test.js # Unique ability logic
│   │   ├── SpecialAttackSystem.test.js # Special attack mechanics
│   │   ├── AttributeSystem.test.js     # Attribute management
│   │   └── TraitFlawSystem.test.js     # Trait/flaw logic
│   │
│   ├── calculators/
│   │   ├── PointPoolCalculator.test.js # Point pool aggregation
│   │   ├── CombatCalculator.test.js    # Combat stat derivation
│   │   ├── StatCalculator.test.js      # General stat calculations
│   │   └── LimitCalculator.test.js     # Limit point calculations
│   │
│   ├── core/
│   │   ├── GameDataManager.test.js     # Data loading/caching
│   │   ├── VitalityCharacter.test.js   # Character object structure
│   │   └── TierSystem.test.js          # Tier-based calculations
│   │
│   └── utils/
│       ├── RenderUtils.test.js         # UI rendering utilities
│       ├── EventManager.test.js        # Event delegation system
│       └── UpdateManager.test.js       # State update management
│
├── integration/                    # Component interaction tests
│   ├── tab-integration/
│   │   ├── BasicInfo-to-Archetypes.test.js
│   │   ├── Archetypes-to-Attributes.test.js
│   │   ├── MainPool-dependencies.test.js
│   │   └── Summary-validation.test.js
│   │
│   ├── data-flow/
│   │   ├── character-updates.test.js   # Character modification flows
│   │   ├── point-recalculation.test.js # Point pool updates
│   │   └── ui-synchronization.test.js  # UI state sync
│   │
│   └── system-integration/
│       ├── GameData-Systems.test.js    # Data loading to system usage
│       ├── Calculator-Systems.test.js  # Calculator/system interaction
│       └── Validation-Systems.test.js  # Cross-system validation
│
├── fixtures/                       # Test data and scenarios
│   ├── characters/
│   │   ├── tier-1-basic.json          # Low-tier simple character
│   │   ├── tier-5-complex.json        # Mid-tier complex build
│   │   ├── tier-10-maximum.json       # High-tier power build
│   │   ├── over-budget.json           # Intentionally over-budget
│   │   └── edge-cases.json            # Boundary condition characters
│   │
│   ├── game-data/
│   │   ├── minimal-data-set.json      # Reduced data for fast tests
│   │   ├── corrupted-data.json        # Invalid data for error testing
│   │   └── extended-data.json         # Additional test content
│   │
│   └── scenarios/
│       ├── user-journeys.json         # Predefined user workflows
│       ├── error-conditions.json     # Known failure scenarios
│       └── performance-tests.json    # Large-scale test scenarios
│
├── helpers/                        # Test utility functions
│   ├── character-builders.js          # Helper functions to build test characters
│   ├── page-objects.js               # Page object models for UI interaction
│   ├── assertion-helpers.js          # Custom assertion functions
│   ├── data-generators.js            # Property-based test data generation
│   └── mock-data.js                  # Mock game data for unit tests
│
├── performance/                     # Performance and load testing
│   ├── rendering-performance.spec.js  # UI rendering speed tests
│   ├── calculation-performance.spec.js # Point calculation speed
│   ├── memory-usage.spec.js          # Memory leak detection
│   └── large-dataset.spec.js         # Performance with many purchases
│
└── reports/                        # Test output and artifacts
    ├── coverage/                      # Code coverage reports
    ├── screenshots/                   # Failed test screenshots
    ├── videos/                        # Test execution recordings
    └── logs/                          # Detailed test execution logs
```

### File Responsibilities Breakdown

#### **E2E Tests (`/e2e/`)**
- **`character-creation/`**: Tests complete character building workflows from start to finish
- **`advisory-system/`**: Validates the non-blocking advisory budget system behavior
- **`custom-content/`**: Tests all custom creation features (abilities, utilities, limits)
- **`cross-tab-integration/`**: Ensures proper state management across tab navigation
- **`data-management/`**: Tests character persistence, export/import functionality

#### **Unit Tests (`/unit/`)**
- **`systems/`**: Isolated testing of business logic in each system class
- **`calculators/`**: Pure function testing of all calculation logic
- **`core/`**: Tests foundational classes like GameDataManager and character structure
- **`utils/`**: Tests utility functions for rendering, events, and updates

#### **Integration Tests (`/integration/`)**
- **`tab-integration/`**: Tests interactions between different tab components
- **`data-flow/`**: Validates character update flows and point recalculations
- **`system-integration/`**: Tests how different systems work together

#### **Supporting Infrastructure**
- **`fixtures/`**: Predefined test data including characters, game data, and scenarios
- **`helpers/`**: Reusable test utilities and page object models
- **`performance/`**: Specialized tests for performance characteristics
- **`reports/`**: Generated test artifacts, coverage reports, and debugging aids

### Configuration Files

#### **`package.json`**
```json
{
  "name": "vitality-character-builder-tests",
  "scripts": {
    "test": "jest",
    "test:e2e": "playwright test",
    "test:unit": "jest unit/",
    "test:integration": "jest integration/",
    "test:performance": "playwright test performance/",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage && playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "fast-check": "^3.15.0"
  }
}
```

### Key Testing Scenarios by File

#### **`e2e/character-creation/basic-workflow.spec.js`**
- Load character builder
- Fill out basic info tab
- Select all required archetypes
- Allocate attribute points
- Make main pool purchases
- Create special attack
- Purchase utility items
- Verify final character in summary
- Export character JSON
- Validate exported data structure

#### **`e2e/advisory-system/budget-warnings.spec.js`**
- Create character with limited points
- Attempt to purchase expensive items
- Verify warning notifications appear
- Confirm purchases still proceed
- Check final character validity

#### **`unit/systems/UtilitySystem.test.js`**
- Test `calculateUtilityPointsSpent()` with various purchase combinations
- Validate `validateCustomItemPurchase()` with edge cases
- Test `purchaseCustomItem()` with valid and invalid data
- Verify mastered expertise cost calculation logic

#### **`integration/data-flow/character-updates.test.js`**
- Test character modifications trigger proper UI updates
- Verify point pool recalculations across systems
- Ensure tab state synchronization
- Validate character object integrity after operations

This structure provides comprehensive coverage while maintaining clear organization and separation of concerns. Each test type serves a specific purpose in ensuring the character builder works correctly across all use cases.

---

## Conclusion

Comprehensive testing of the character builder is not only possible but highly recommended given the complexity of the point calculation systems and the critical nature of character data integrity. Browser automation testing offers the best coverage for end-to-end workflows, while unit testing provides rapid feedback for component-level changes.

The key to successful testing will be starting with core user journeys and gradually expanding coverage to edge cases and error conditions. The investment in testing infrastructure will pay dividends in development confidence and user experience quality.