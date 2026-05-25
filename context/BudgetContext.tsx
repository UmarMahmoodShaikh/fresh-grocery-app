import { getStoredUser, budgetProfilesApi } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useNetwork } from "./NetworkContext";

export interface CategoryBudget {
  id?: number;
  category_id: number;
  category_name?: string;
  amount: number;
}

export interface BudgetProfile {
  id: number;
  name: string;
  total_budget: number;
  is_active: boolean;
  category_budgets: CategoryBudget[];
}

export interface BudgetSettings {
  totalBudget: number;
  categoryBudgets: Record<string, number>;
}

interface BudgetContextType {
  profiles: BudgetProfile[];
  activeProfile: BudgetProfile | null;
  totalBudget: number;
  categoryBudgets: Record<string, number>;
  
  setTotalBudget: (amount: number) => void;
  setCategoryBudget: (categoryId: number | null | undefined, categoryName: string | null | undefined, amount: number) => void;
  clearCategoryBudget: (categoryId: number | null | undefined, categoryName: string | null | undefined) => void;
  clearBudgets: () => void;
  saveBudgets: () => Promise<void>;
  getCategoryBudget: (categoryId: number | null | undefined, categoryName: string | null | undefined) => number;

  createProfile: (name: string, totalBudget?: number) => Promise<void>;
  activateProfile: (id: number) => Promise<void>;
  deleteProfile: (id: number) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = "budget_settings_v2";
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
  const { isOnline } = useNetwork();
  const [profiles, setProfiles] = useState<BudgetProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<BudgetProfile | null>(null);
  
  // Local state for the active budget to allow instant UI updates
  const [totalBudget, setTotalBudgetState] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  
  const [userStorageKey, setUserStorageKey] = useState(GUEST_KEY);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(true);

  const resolveUserStorageKey = (user: any | null) => {
    if (!user || !user.id) return GUEST_KEY;
    return `user:${user.id}`;
  };

  const getBudgetStorageKey = (storageKey: string) => `${STORAGE_KEY}:${storageKey}`;

  // Persist locally for offline access
  const persistLocally = async (storageKey: string, p: BudgetProfile[], active: BudgetProfile | null, t: number, c: Record<string, number>) => {
    await AsyncStorage.setItem(
      getBudgetStorageKey(storageKey),
      JSON.stringify({ profiles: p, activeProfile: active, totalBudget: t, categoryBudgets: c })
    );
  };

  const loadLocally = async (storageKey: string) => {
    try {
      const stored = await AsyncStorage.getItem(getBudgetStorageKey(storageKey));
      if (!stored) {
        setProfiles([]);
        setActiveProfile(null);
        setTotalBudgetState(0);
        setCategoryBudgets({});
        return;
      }
      const parsed = JSON.parse(stored);
      setProfiles(parsed.profiles || []);
      setActiveProfile(parsed.activeProfile || null);
      setTotalBudgetState(parsed.totalBudget || 0);
      setCategoryBudgets(parsed.categoryBudgets || {});
    } catch (error) {
      console.error("Failed to load local budget data", error);
    }
  };

  // Sync from backend
  const refreshProfiles = async () => {
    const user = await getStoredUser();
    const key = resolveUserStorageKey(user);
    setIsGuest(key === GUEST_KEY);
    
    if (key !== userStorageKey) {
      setUserStorageKey(key);
      await loadLocally(key);
    }

    if (key === GUEST_KEY || !isOnline) return;

    setIsLoading(true);
    try {
      const res = await budgetProfilesApi.getAll();
      if (res.data) {
        setProfiles(res.data);
        const active = res.data.find((p: BudgetProfile) => p.is_active) || null;
        setActiveProfile(active);
        
        if (active) {
          setTotalBudgetState(active.total_budget);
          const catBudgets: Record<string, number> = {};
          active.category_budgets.forEach((cb: CategoryBudget) => {
            catBudgets[`id:${cb.category_id}`] = cb.amount;
          });
          setCategoryBudgets(catBudgets);
        } else {
          setTotalBudgetState(0);
          setCategoryBudgets({});
        }
        
        await persistLocally(key, res.data, active, active ? active.total_budget : 0, active ? categoryBudgets : {});
      }
    } catch (error) {
      console.error("Failed to fetch budget profiles from API", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, [isOnline]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") refreshProfiles();
    });
    return () => subscription.remove();
  }, []);

  // Sync to local storage whenever totalBudget or categoryBudgets change
  useEffect(() => {
    persistLocally(userStorageKey, profiles, activeProfile, totalBudget, categoryBudgets);
  }, [totalBudget, categoryBudgets, activeProfile, profiles, userStorageKey]);

  const setTotalBudget = (amount: number) => {
    setTotalBudgetState(Number(amount) || 0);
  };

  const setCategoryBudget = (categoryId: number | null | undefined, categoryName: string | null | undefined, amount: number) => {
    const key = getCategoryKey(categoryId, categoryName);
    if (!key) return;
    setCategoryBudgets((prev) => ({ ...prev, [key]: Number(amount) || 0 }));
  };

  const clearCategoryBudget = (categoryId: number | null | undefined, categoryName: string | null | undefined) => {
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
  };

  // Push local changes to the active profile on the backend
  const saveBudgets = async () => {
    if (isGuest) {
      await persistLocally(userStorageKey, profiles, activeProfile, totalBudget, categoryBudgets);
      return;
    }

    if (!activeProfile && isOnline) {
      // Create a default profile if none exists
      await createProfile("Default Budget", totalBudget);
      return;
    }

    if (!activeProfile || !isOnline) return;

    // Transform record into array of category budgets
    const category_budgets_attributes = Object.keys(categoryBudgets).map(key => {
      const category_id = parseInt(key.replace("id:", ""), 10);
      return { category_id, amount: categoryBudgets[key] };
    }).filter(cb => !isNaN(cb.category_id));

    try {
      const res = await budgetProfilesApi.update(activeProfile.id, {
        total_budget: totalBudget,
        category_budgets_attributes
      });
      if (res.data) {
        await refreshProfiles();
      }
    } catch (e) {
      console.error("Failed to save budget", e);
    }
  };

  const createProfile = async (name: string, tb = 0) => {
    if (!isOnline || isGuest) return;
    try {
      const res = await budgetProfilesApi.create({ name, total_budget: tb });
      if (res.data) await refreshProfiles();
    } catch (e) {
      console.error("Failed to create profile", e);
    }
  };

  const activateProfile = async (id: number) => {
    if (!isOnline || isGuest) return;
    try {
      const res = await budgetProfilesApi.activate(id);
      if (res.data) await refreshProfiles();
    } catch (e) {
      console.error("Failed to activate profile", e);
    }
  };

  const deleteProfile = async (id: number) => {
    if (!isOnline || isGuest) return;
    try {
      await budgetProfilesApi.delete(id);
      await refreshProfiles();
    } catch (e) {
      console.error("Failed to delete profile", e);
    }
  };

  const getCategoryBudget = (categoryId: number | null | undefined, categoryName: string | null | undefined) => {
    const key = getCategoryKey(categoryId, categoryName);
    if (!key) return 0;
    return Number(categoryBudgets[key]) || 0;
  };

  return (
    <BudgetContext.Provider
      value={{
        profiles,
        activeProfile,
        totalBudget,
        categoryBudgets,
        setTotalBudget,
        setCategoryBudget,
        clearCategoryBudget,
        clearBudgets,
        saveBudgets,
        getCategoryBudget,
        createProfile,
        activateProfile,
        deleteProfile,
        refreshProfiles,
        isLoading
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