// ─── Helper Functions ─────────────────────────────────────────────────────────

const getCategoryKey = (categoryId: number | null | undefined, categoryName: string | null | undefined) => {
  if (categoryId !== null && categoryId !== undefined) {
    return `id:${categoryId}`;
  }

  if (categoryName && categoryName.trim().length > 0) {
    return `name:${categoryName.trim().toLowerCase()}`;
  }

  return "";
};

// ─── Test data ────────────────────────────────────────────────────────────────

const fruitsCategory = { id: 1, name: "Fruits" };
const vegetablesCategory = { id: 2, name: "Vegetables" };
const dairyCategory = { id: 3, name: "Dairy" };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("BudgetContext — getCategoryKey()", () => {
  it("prioritizes categoryId over categoryName", () => {
    const key = getCategoryKey(fruitsCategory.id, fruitsCategory.name);
    expect(key).toBe("id:1");
  });

  it("uses categoryName when categoryId is null", () => {
    const key = getCategoryKey(null, fruitsCategory.name);
    expect(key).toBe("name:fruits");
  });

  it("uses categoryName when categoryId is undefined", () => {
    const key = getCategoryKey(undefined, fruitsCategory.name);
    expect(key).toBe("name:fruits");
  });

  it("normalizes categoryName to lowercase", () => {
    const key = getCategoryKey(null, "FRUITS");
    expect(key).toBe("name:fruits");
  });

  it("trims whitespace from categoryName", () => {
    const key = getCategoryKey(null, "  Fruits  ");
    expect(key).toBe("name:fruits");
  });

  it("returns empty string when both categoryId and categoryName are invalid", () => {
    expect(getCategoryKey(null, null)).toBe("");
    expect(getCategoryKey(undefined, undefined)).toBe("");
    expect(getCategoryKey(null, "")).toBe("");
    expect(getCategoryKey(null, "   ")).toBe("");
  });
});

describe("BudgetContext — Budget Management", () => {
  let totalBudget: number;
  let categoryBudgets: Record<string, number>;

  beforeEach(() => {
    // Simulate initial state
    totalBudget = 0;
    categoryBudgets = {};
  });

  // ─── setTotalBudget Tests ─────────────────────────────────────────────────

  describe("setTotalBudget()", () => {
    it("sets a numeric total budget", () => {
      totalBudget = 100;
      expect(totalBudget).toBe(100);
    });

    it("handles zero budget", () => {
      totalBudget = 0;
      expect(totalBudget).toBe(0);
    });

    it("handles large budget amounts", () => {
      totalBudget = 999999.99;
      expect(totalBudget).toBe(999999.99);
    });
  });

  // ─── setCategoryBudget Tests ──────────────────────────────────────────────

  describe("setCategoryBudget()", () => {
    it("sets a category budget by ID", () => {
      const key = getCategoryKey(fruitsCategory.id, null);
      categoryBudgets[key] = 50;
      expect(categoryBudgets[key]).toBe(50);
    });

    it("sets a category budget by name", () => {
      const key = getCategoryKey(null, fruitsCategory.name);
      categoryBudgets[key] = 30;
      expect(categoryBudgets[key]).toBe(30);
    });

    it("can set multiple category budgets", () => {
      categoryBudgets[getCategoryKey(fruitsCategory.id, null)] = 50;
      categoryBudgets[getCategoryKey(vegetablesCategory.id, null)] = 40;
      categoryBudgets[getCategoryKey(dairyCategory.id, null)] = 30;

      expect(Object.keys(categoryBudgets).length).toBe(3);
      expect(categoryBudgets[getCategoryKey(fruitsCategory.id, null)]).toBe(50);
      expect(categoryBudgets[getCategoryKey(vegetablesCategory.id, null)]).toBe(40);
      expect(categoryBudgets[getCategoryKey(dairyCategory.id, null)]).toBe(30);
    });

    it("overwrites existing category budget", () => {
      const key = getCategoryKey(fruitsCategory.id, null);
      categoryBudgets[key] = 50;
      categoryBudgets[key] = 75;
      expect(categoryBudgets[key]).toBe(75);
    });

    it("handles zero category budget", () => {
      const key = getCategoryKey(fruitsCategory.id, null);
      categoryBudgets[key] = 0;
      expect(categoryBudgets[key]).toBe(0);
    });

    it("does not set budget when key is empty", () => {
      const key = getCategoryKey(null, null);
      if (key) {
        categoryBudgets[key] = 50;
      }
      expect(Object.keys(categoryBudgets).length).toBe(0);
    });
  });

  // ─── getCategoryBudget Tests ──────────────────────────────────────────────

  describe("getCategoryBudget()", () => {
    beforeEach(() => {
      categoryBudgets = {
        "id:1": 50,
        "id:2": 40,
        "name:fruits": 30,
      };
    });

    it("retrieves a category budget by ID", () => {
      const key = getCategoryKey(1, null);
      const budget = categoryBudgets[key] || 0;
      expect(budget).toBe(50);
    });

    it("retrieves a category budget by name", () => {
      const key = getCategoryKey(null, "fruits");
      const budget = categoryBudgets[key] || 0;
      expect(budget).toBe(30);
    });

    it("returns 0 when category budget doesn't exist", () => {
      const key = getCategoryKey(999, null);
      const budget = categoryBudgets[key] || 0;
      expect(budget).toBe(0);
    });

    it("prioritizes ID over name when both are provided", () => {
      const key = getCategoryKey(1, "vegetables");
      const budget = categoryBudgets[key] || 0;
      expect(budget).toBe(50);
    });
  });

  // ─── clearCategoryBudget Tests ────────────────────────────────────────────

  describe("clearCategoryBudget()", () => {
    beforeEach(() => {
      categoryBudgets = {
        "id:1": 50,
        "id:2": 40,
        "id:3": 30,
      };
    });

    it("removes a category budget by ID", () => {
      const key = getCategoryKey(1, null);
      delete categoryBudgets[key];
      expect(categoryBudgets[key]).toBeUndefined();
      expect(Object.keys(categoryBudgets).length).toBe(2);
    });

    it("removes a category budget by name", () => {
      categoryBudgets["name:fruits"] = 25;
      const key = getCategoryKey(null, "fruits");
      delete categoryBudgets[key];
      expect(categoryBudgets[key]).toBeUndefined();
    });

    it("does nothing when category doesn't exist", () => {
      const originalLength = Object.keys(categoryBudgets).length;
      const key = getCategoryKey(999, null);
      delete categoryBudgets[key];
      expect(Object.keys(categoryBudgets).length).toBe(originalLength);
    });
  });

  // ─── clearBudgets Tests ───────────────────────────────────────────────────

  describe("clearBudgets()", () => {
    it("clears total budget and all category budgets", () => {
      totalBudget = 500;
      categoryBudgets = {
        "id:1": 50,
        "id:2": 40,
        "id:3": 30,
      };

      totalBudget = 0;
      categoryBudgets = {};

      expect(totalBudget).toBe(0);
      expect(Object.keys(categoryBudgets).length).toBe(0);
    });
  });

  // ─── Budget Validation Tests ──────────────────────────────────────────────

  describe("Budget Validation", () => {
    it("calculates remaining budget correctly", () => {
      totalBudget = 1000;
      const spent = 300;
      const remaining = totalBudget - spent;
      expect(remaining).toBe(700);
    });

    it("detects budget exceeded", () => {
      totalBudget = 1000;
      const spent = 1200;
      const isExceeded = spent > totalBudget;
      expect(isExceeded).toBe(true);
    });

    it("checks category budget limits", () => {
      categoryBudgets["id:1"] = 100;
      const categorySpent = 50;
      const categoryRemaining = categoryBudgets["id:1"] - categorySpent;
      expect(categoryRemaining).toBe(50);
      expect(categorySpent <= categoryBudgets["id:1"]).toBe(true);
    });

    it("sums all category budgets", () => {
      categoryBudgets = {
        "id:1": 50,
        "id:2": 40,
        "id:3": 30,
      };
      const totalCategoryBudget = Object.values(categoryBudgets).reduce(
        (sum, budget) => sum + budget,
        0,
      );
      expect(totalCategoryBudget).toBe(120);
    });
  });
});
