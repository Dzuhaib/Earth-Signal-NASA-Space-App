"""
EarthSignal — Python Scientific Computing Reference Engine
NASA Space Apps Challenge 2026: Be An Earth System Trend Detective!

Reference implementation of Mann-Kendall, Sen's Slope, and OLS regression
using SciPy, NumPy, and Statsmodels.
"""

import numpy as np
from scipy import stats
from typing import Dict, Any, List

def compute_mann_kendall(values: List[float], alpha: float = 0.05) -> Dict[str, Any]:
    """
    Computes Mann-Kendall test with tie adjustments.
    """
    n = len(values)
    if n < 4:
        return {"trend": "no_trend", "p_value": 1.0, "s": 0, "is_significant": False}

    s = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            diff = values[j] - values[i]
            if diff > 0:
                s += 1
            elif diff < 0:
                s -= 1

    # Ties
    vals, counts = np.unique(values, return_counts=True)
    tie_term = sum(c * (c - 1) * (2 * c + 5) for c in counts if c > 1)

    var_s = (n * (n - 1) * (2 * n + 5) - tie_term) / 18.0

    if s > 0:
        z = (s - 1) / np.sqrt(var_s)
    elif s < 0:
        z = (s + 1) / np.sqrt(var_s)
    else:
        z = 0.0

    p_value = 2.0 * (1.0 - stats.norm.cdf(abs(z)))
    tau = s / (0.5 * n * (n - 1))

    is_sig = p_value < alpha
    trend = "increasing" if (is_sig and s > 0) else ("decreasing" if (is_sig and s < 0) else "no_trend")

    return {
        "s": int(s),
        "variance_s": float(var_s),
        "z": float(z),
        "p_value": float(p_value),
        "tau": float(tau),
        "trend": trend,
        "is_significant": bool(is_sig),
    }

def compute_sens_slope(times: List[float], values: List[float]) -> Dict[str, Any]:
    """
    Computes Theil-Sen Median Slope.
    """
    res = stats.theilslopes(values, times, alpha=0.95)
    return {
        "slope": float(res.slope),
        "intercept": float(res.intercept),
        "lower_ci": float(res.low_slope),
        "upper_ci": float(res.high_slope),
    }
