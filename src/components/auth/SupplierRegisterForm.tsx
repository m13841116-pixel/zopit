import React from "react";
import { AuthPage } from "./AuthPage";

interface SupplierRegisterFormProps {
  onSuccess: (user: any, token: string) => void;
  onBackToLogin: () => void;
  onBackToRoleSelect?: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onShowTerms?: () => void;
}

export const SupplierRegisterForm: React.FC<SupplierRegisterFormProps> = ({
  onSuccess,
  showNotification,
  onShowTerms
}) => {
  return (
    <AuthPage
      initialMode="register"
      initialRole="supplier"
      onSuccess={onSuccess}
      showNotification={showNotification}
      onShowTerms={onShowTerms ? () => onShowTerms() : undefined}
    />
  );
};
