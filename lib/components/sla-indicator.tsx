"use client";

import React from "react";
import { useSlaPolicy } from "@/lib/hooks/use-config";

interface SlaIndicatorProps {
  entity: string;
  key: string;
  slaDueAt: string | null;
  slaStatus?: "on_time" | "at_risk" | "breached" | null;
}

/**
 * SLA Indicator - Shows SLA timer and status
 * Reads SLA config from runtime config to determine thresholds
 */
export function SlaIndicator({
  entity,
  key,
  slaDueAt,
  slaStatus,
}: SlaIndicatorProps) {
  const slaConfig = useSlaPolicy(entity, key);
  const [timeRemaining, setTimeRemaining] = React.useState<string>("");

  React.useEffect(() => {
    if (!slaDueAt) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const due = new Date(slaDueAt);
      const diff = due.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Breached");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h`);
      } else {
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [slaDueAt]);

  if (!slaDueAt) {
    return null;
  }

  const getStatusColor = () => {
    if (!slaStatus) return "bg-gray-100 text-gray-800";
    switch (slaStatus) {
      case "on_time":
        return "bg-green-100 text-green-800";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800";
      case "breached":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`text-xs px-2 py-1 rounded ${getStatusColor()}`}>
        {slaStatus === "breached" ? "⚠️ Breached" : 
         slaStatus === "at_risk" ? "⏱️ At Risk" : 
         "✓ On Time"}
      </span>
      {timeRemaining && (
        <span className="text-xs text-muted-foreground">
          {timeRemaining}
        </span>
      )}
    </div>
  );
}

