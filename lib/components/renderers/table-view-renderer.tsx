"use client";

import React from "react";
import { useViewConfig } from "@/lib/hooks/use-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/lib/components/ui/card";

interface TableViewRendererProps {
  entity: string;
  key: string;
  data?: Array<Record<string, any>>;
  onRowClick?: (row: Record<string, any>) => void;
}

/**
 * TableViewRenderer - Renders tables dynamically from published config
 * This component reads view configuration from the runtime config snapshot
 * and renders the table accordingly. No hard-coded tables!
 */
export function TableViewRenderer({
  entity,
  key,
  data = [],
  onRowClick,
}: TableViewRendererProps) {
  const viewConfig = useViewConfig(entity, key);
  const [sortField, setSortField] = React.useState<string | null>(
    viewConfig?.defaultSort?.field || null
  );
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    viewConfig?.defaultSort?.direction || "asc"
  );

  if (!viewConfig) {
    return (
      <div className="p-4 border rounded-lg bg-muted">
        <p className="text-muted-foreground">
          View configuration not found: {entity}/{key}
        </p>
      </div>
    );
  }

  const sortedColumns = [...viewConfig.columns].sort((a, b) => a.order - b.order);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getFieldValue = (row: Record<string, any>, fieldPath: string): any => {
    const parts = fieldPath.split(".");
    let value = row;
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return null;
    }
    return value;
  };

  const renderCell = (column: typeof viewConfig.columns[0], row: Record<string, any>) => {
    const value = getFieldValue(row, column.field);

    switch (column.type) {
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        return value ? new Date(value).toLocaleDateString() : "-";
      case "datetime":
        return value ? new Date(value).toLocaleString() : "-";
      case "badge":
        return (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {String(value || "-")}
          </span>
        );
      case "link":
        return value ? (
          <a href={String(value)} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            {String(value)}
          </a>
        ) : (
          "-"
        );
      default:
        return value !== null && value !== undefined ? String(value) : "-";
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = getFieldValue(a, sortField);
    const bVal = getFieldValue(b, sortField);

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  if (viewConfig.type === "kanban") {
    // Kanban view (simplified - would need more config for columns)
    return (
      <Card>
        <CardHeader>
          <CardTitle>{viewConfig.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Kanban view not yet implemented</p>
        </CardContent>
      </Card>
    );
  }

  // Table view
  return (
    <Card>
      <CardHeader>
        <CardTitle>{viewConfig.title}</CardTitle>
        {viewConfig.description && (
          <p className="text-sm text-muted-foreground">{viewConfig.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  {sortedColumns.map((column) => (
                    <th
                      key={column.id}
                      className="text-left p-3 font-medium text-sm"
                      style={{ width: column.width }}
                    >
                      {column.sortable ? (
                        <button
                          onClick={() => handleSort(column.field)}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          {column.label}
                          {sortField === column.field && (
                            <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onRowClick?.(row)}
                  >
                    {sortedColumns.map((column) => (
                      <td key={column.id} className="p-3 text-sm">
                        {renderCell(column, row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

