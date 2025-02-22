// First, create a shared hook for consistent behavior

import { useState } from 'react';

export const useMetricsSelection = (allMetrics: string[]) => {
  const [selectedGraphs, setSelectedGraphs] = useState<string[]>(allMetrics);
  const [isAllMetricsSelected, setIsAllMetricsSelected] = useState<boolean>(true);

  const handleMetricSelection = (metric: string) => {
    if (metric === 'all') {
      const shouldShowAll = !isAllMetricsSelected;
      setIsAllMetricsSelected(shouldShowAll);
      setSelectedGraphs(shouldShowAll ? allMetrics : []);
      return;
    }

    // If all metrics are currently shown and user clicks an individual metric
    if (isAllMetricsSelected) {
      setIsAllMetricsSelected(false);
      setSelectedGraphs([metric]);
      return;
    }

    // Toggle individual metric
    setSelectedGraphs(prev => {
      if (prev.includes(metric)) {
        const newSelection = prev.filter(m => m !== metric);
        // If no metrics are selected, show all metrics
        if (newSelection.length === 0) {
          setIsAllMetricsSelected(true);
          return allMetrics;
        }
        return newSelection;
      }

      // Add new metric if under limit
      if (prev.length < 4) {
        return [...prev, metric];
      }
      return prev;
    });
  };

  return {
    selectedGraphs,
    isAllMetricsSelected,
    handleMetricSelection,
  };
};