import { useState, useEffect, createContext, useContext } from "react";

export interface BusinessRules {
  // Supplier Penalties & Auto Suspension
  underReviewThreshold: number;
  temporarySuspensionThreshold: number;
  blockedThreshold: number;
  autoSuspensionEnabled: boolean;

  // Supplier score calculation rules
  SCORE_BASE: number;
  DELAY_SCORE_DEDUCTION: number;
  RETURN_SCORE_DEDUCTION: number;
  CANCEL_SCORE_DEDUCTION: number;
  CANCEL_SATISFACTION_DEDUCTION: number;
  RETURN_SATISFACTION_DEDUCTION: number;
  DELAY_RESPONSIVENESS_DEDUCTION: number;

  // Return Policies & Deadlines
  RETURN_PERIOD_DAYS: number;
  MAX_DELIVERY_HOURS: number;
  ORDER_PROCESSING_HOURS: number;

  // Financial
  COMMISSION_PERCENTAGE: number;
  TAX_RATE: number;
  MIN_PAYOUT_AMOUNT: number;
  REFUND_RULES_AUTO_APPROVE: boolean;

  // Notifications
  AUTO_NOTIFY_ON_WARNING: boolean;
  AUTO_PENALIZE_ON_DELAY: boolean;

  // SLA policies
  SLA_CRITICAL_HOURS: number;

  // Supplier verification rules
  SUPPLIER_AUTO_VERIFY: boolean;

  // Extra generic keys
  [key: string]: any;
}

export const defaultBusinessRules: BusinessRules = {
  underReviewThreshold: 20,
  temporarySuspensionThreshold: 40,
  blockedThreshold: 60,
  autoSuspensionEnabled: true,

  SCORE_BASE: 100,
  DELAY_SCORE_DEDUCTION: 2,
  RETURN_SCORE_DEDUCTION: 3,
  CANCEL_SCORE_DEDUCTION: 4,
  CANCEL_SATISFACTION_DEDUCTION: 3,
  RETURN_SATISFACTION_DEDUCTION: 1.5,
  DELAY_RESPONSIVENESS_DEDUCTION: 2,

  RETURN_PERIOD_DAYS: 7,
  MAX_DELIVERY_HOURS: 48,
  ORDER_PROCESSING_HOURS: 24,

  COMMISSION_PERCENTAGE: 10,
  TAX_RATE: 9,
  MIN_PAYOUT_AMOUNT: 1000000,
  REFUND_RULES_AUTO_APPROVE: false,

  AUTO_NOTIFY_ON_WARNING: true,
  AUTO_PENALIZE_ON_DELAY: true,

  SLA_CRITICAL_HOURS: 12,

  SUPPLIER_AUTO_VERIFY: false,
};

const BusinessRulesContext = createContext<{
  rules: BusinessRules;
  loading: boolean;
  refresh: () => void;
}>({
  rules: defaultBusinessRules,
  loading: true,
  refresh: () => {},
});

export function BusinessRulesProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<BusinessRules>(defaultBusinessRules);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch system config
      const resConfig = await fetch("/api/config");
      const configData = await resConfig.json();
      
      // 2. Fetch penalty config
      const resPenalty = await fetch("/api/admin/penalty-config").catch(() => null);
      const penaltyData = resPenalty ? await resPenalty.json() : null;

      const mergedRules: BusinessRules = {
        ...defaultBusinessRules,
        ...configData,
      };

      if (penaltyData && !penaltyData.error) {
        mergedRules.underReviewThreshold = penaltyData.underReviewThreshold ?? mergedRules.underReviewThreshold;
        mergedRules.temporarySuspensionThreshold = penaltyData.temporarySuspensionThreshold ?? mergedRules.temporarySuspensionThreshold;
        mergedRules.blockedThreshold = penaltyData.blockedThreshold ?? mergedRules.blockedThreshold;
        mergedRules.autoSuspensionEnabled = penaltyData.autoSuspensionEnabled ?? mergedRules.autoSuspensionEnabled;
      }

      setRules(mergedRules);
    } catch (err) {
      console.error("Failed to fetch business rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return (
    <BusinessRulesContext.Provider value={{ rules, loading, refresh: fetchRules }}>
      {children}
    </BusinessRulesContext.Provider>
  );
}

export function useBusinessRules() {
  return useContext(BusinessRulesContext);
}
