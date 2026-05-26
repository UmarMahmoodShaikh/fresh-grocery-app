import { getStoredUser, budgetApi } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";

export interface BudgetSettings {
  totalBudget: number;
  categoryBudgets: Record<string, number>;
}

interface BudgetContextType {
  totalBudget: number;
  categoryBudgets: Record<string, number>;
  setTotalBudget: (amount: number) => void;
  setCategoryBudget: (categoryId: number | null | undefined, categoryName: string | null | undefined, amount: number) => void;
  clearCategoryBudget: (categoryId: number | null | undefined, categoryName: string | null | undefined) => void;
  clearBudgets: () => void;
  saveBudgets: () => Promise<void>;
  getCategoryBudget: (categoryId: number | null | undefined, categoryName: string | null | undefined) => number;
  refreshBudgets: () => Promise<void>;
}

const STORAGE_KEY = "budget_settings";
const GUEST_KEY = "guest";

const getCategoryKey = (categoryId: number | null | undefined, categoryName: string | null | undefined) => {
  if (categoryId !== null && categoryId !== undefined) {
    return `id:${categoryId}`;
  }

  if (categoryName && categoryName.trim().length > 0) {
    return `name:${categoryName.trim().toLowerCase()}`;
  }

  return "";
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalBudget, setTotalBudgetState] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [userStorageKey, setUserStorageKey] = useState(GUEST_KEY);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  const resolveUserStorageKey = (user: any | null) => {
    if (!user) {
      return GUEST_KEY;
    }

    const userId = user.id !== undefined && user.id !== null ? String(user.id) : "";
    const userEmail = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";

    if (userId) {
      return `user:${userId}`;
    }

    if (userEmail) {
      return `email:${userEmail}`;
    }

    return GUEST_KEY;
  };

  const getBudgetStorageKey = (storageKey: string) => `${STORAGE_KEY}:${storageKey}`;

  const persistBudgets = async (storageKey: string, nextTotalBudget: number, nextCategoryBudgets: Record<string, number>) => {
    await AsyncStorage.setItem(
      getBudgetStorageKey(storageKey),
      JSON.stringify({ totalBudget: nextTotalBudget, categoryBudgets: nextCategoryBudgets }),
    );
  };

  const loadBudgetsForUser = async (storageKey: string) => {
    try {
      // 1. Try to load from Rails database API if logged in
      if (storageKey !== GUEST_KEY) {
        try {
          const apiRes = await budgetApi.getAll();
          if (apiRes.data && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
            const activeProfile = apiRes.data.find((p: any) => p.is_active) || apiRes.data[0];
            if (activeProfile) {
              setActiveProfileId(activeProfile.id);
              setTotalBudgetState(activeProfile.total_budget || 0);
              
              const catBudgets: Record<string, number> = {};
              if (Array.isArray(activeProfile.category_budgets)) {
                activeProfile.category_budgets.forEach((cb: any) => {
                  if (cb.category_id) {
                    catBudgets[`id:${cb.category_id}`] = cb.amount || 0;
                  }
                });
              }
              setCategoryBudgets(catBudgets);
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Failed to load budgets from API, falling back to AsyncStorage:", apiErr);
        }
      }

      // 2. Fallback to AsyncStorage
      const stored = await AsyncStorage.getItem(getBudgetStorageKey(storageKey));
      if (!stored) {
        setTotalBudgetState(0);
        setCategoryBudgets({});
        return;
      }

      const parsed = JSON.parse(stored) as Partial<BudgetSettings>;
      setTotalBudgetState(Number(parsed.totalBudget) || 0);
      setCategoryBudgets(parsed.categoryBudgets || {});
    } catch (error) {
      console.error("Failed to load budget data", error);
    }
  };

  const syncUserBudget = async () => {
    const user = await getStoredUser();
    const nextUserStorageKey = resolveUserStorageKey(user);

    setUserStorageKey((currentKey) => {
      if (currentKey !== nextUserStorageKey) {
        loadBudgetsForUser(nextUserStorageKey);
      }
      return nextUserStorageKey;
    });
  };

  useEffect(() => {
    syncUserBudget();
  }, []);

  useEffect(() => {
    const saveBudgets = async () => {
      try {
        await persistBudgets(userStorageKey, totalBudget, categoryBudgets);
      } catch (error) {
        console.error("Failed to save budget data", error);
      }
    };

    saveBudgets();
  }, [totalBudget, categoryBudgets, userStorageKey]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        syncUserBudget();
      }
    });

    return () => subscription.remove();
  }, []);

  const setTotalBudget = (amount: number) => {
    setTotalBudgetState(Number(amount) || 0);
  };

  const setCategoryBudget = (
    categoryId: number | null | undefined,
    categoryName: string | null | undefined,
    amount: number,
  ) => {
    const key = getCategoryKey(categoryId, categoryName);
    if (!key) return;

    const value = Number(amount) || 0;
    setCategoryBudgets((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearCategoryBudget = (
    categoryId: number | null | undefined,
    categoryName: string | null | undefined,
  ) => {
    const key = getCategoryKey(categoryId, categoryName);
    if (!key) return;

    setCategoryBudgets((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearBudgets = () => {
    setTotalBudgetState(0);
    setCategoryBudgets({});
    setActiveProfileId(null);
  };

  const saveBudgets = async () => {
    try {
      // 1. Save locally to AsyncStorage
      await persistBudgets(userStorageKey, totalBudget, categoryBudgets);

      // 2. Save to Rails backend API if logged in
      if (userStorageKey !== GUEST_KEY) {
        const categoryBudgetsAttributes = Object.entries(categoryBudgets).map(([key, amount]) => {
          const parts = key.split(":");
          const categoryId = parseInt(parts[1], 10);
          return {
            category_id: categoryId,
            amount: amount,
          };
        }).filter(item => !isNaN(item.category_id));

        const payload = {
          name: "Default Budget",
          total_budget: totalBudget,
          category_budgets_attributes: categoryBudgetsAttributes,
        };

        if (activeProfileId !== null) {
          try {
            await budgetApi.update(activeProfileId, payload);
          } catch (updateErr) {
            console.error("Failed to update budget profile via API", updateErr);
          }
        } else {
          try {
            const createRes = await budgetApi.create(payload);
            if (createRes.data && createRes.data.id) {
              setActiveProfileId(createRes.data.id);
            }
          } catch (createErr) {
            console.error("Failed to create budget profile via API", createErr);
          }
        }
      }
    } catch (error) {
      console.error("Failed to save budget data", error);
    }
  };

  const getCategoryBudget = (
    categoryId: number | null | undefined,
    categoryName: string | null | undefined,
  ) => {
    const key = getCategoryKey(categoryId, categoryName);
    if (!key) return 0;
    return Number(categoryBudgets[key]) || 0;
  };

  const refreshBudgets = async () => {
    await loadBudgetsForUser(userStorageKey);
  };

  return (
    <BudgetContext.Provider
      value={{
        totalBudget,
        categoryBudgets,
        setTotalBudget,
        setCategoryBudget,
        clearCategoryBudget,
        clearBudgets,
        saveBudgets,
        getCategoryBudget,
        refreshBudgets,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};