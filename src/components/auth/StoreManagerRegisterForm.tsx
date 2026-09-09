import React from "react";
import { AuthPage } from "./AuthPage";

interface StoreManagerRegisterFormProps {
  onSuccess: (user: any, token: string) => void;
  onBackToLogin?: () => void;
  onBackToRoleSelect?: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const StoreManagerRegisterForm: React.FC<StoreManagerRegisterFormProps> = ({
  onSuccess,
  showNotification
}) => {
  return (
    <AuthPage
      initialMode="register"
      initialRole="store"
      onSuccess={onSuccess}
      showNotification={showNotification}
    />
  );
};
