'use client';

import { useEffect } from "react";
import { showStreakAtRiskNotification } from "@/lib/notifications";

interface StreakAlertProps {
  atRisk: boolean;
  current: number;
  notificationsEnabled: boolean;
}

export function StreakAlert({
  atRisk,
  current,
  notificationsEnabled,
}: StreakAlertProps) {
  useEffect(() => {
    if (atRisk && notificationsEnabled) {
      showStreakAtRiskNotification(current);
    }
  }, [atRisk, current, notificationsEnabled]);

  return null;
}

