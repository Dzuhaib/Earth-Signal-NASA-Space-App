# EarthSignal — Scientific Methodology & Statistical Rigor
## NASA Space Apps Challenge 2026: Be An Earth System Trend Detective!

## 1. Overview
EarthSignal uses deterministic statistical analysis rather than generative estimation to answer the four core questions of the NASA Space Apps Challenge:
1. WHAT is changing? (Trend direction & characterization)
2. WHERE is it changing? (Spatial bounding & provincial sentinels)
3. HOW MUCH is it changing? (Sen's Slope with physical units, e.g., °C/decade, mm/decade)
4. IS IT statistically significant? (Mann-Kendall test, p-values, autocorrelation evaluation, False Discovery Rate adjustment)

---

## 2. Mathematical Formulations

### A. Non-Parametric Mann-Kendall Trend Test
The Mann-Kendall test evaluates whether a monotonic upward or downward trend exists in an environmental time series $X = \{x_1, x_2, \dots, x_n\}$. It makes no assumptions regarding normality.

1. **Kendall's S Statistic**:
   $$S = \sum_{i=1}^{n-1} \sum_{j=i+1}^n \text{sgn}(x_j - x_i)$$
   where:
   $$\text{sgn}(\theta) = \begin{cases} +1 & \text{if } \theta > 0 \\ 0 & \text{if } \theta = 0 \\ -1 & \text{if } \theta < 0 \end{cases}$$

2. **Variance with Tie Corrections**:
   $$\text{Var}(S) = \frac{n(n-1)(2n+5) - \sum_{p=1}^g t_p(t_p-1)(2t_p+5)}{18}$$
   where $g$ is the number of tied groups and $t_p$ is the number of observations in group $p$.

3. **Standardized Test Statistic ($Z$)**:
   $$Z = \begin{cases} \frac{S-1}{\sqrt{\text{Var}(S)}} & \text{if } S > 0 \\ 0 & \text{if } S = 0 \\ \frac{S+1}{\sqrt{\text{Var}(S)}} & \text{if } S < 0 \end{cases}$$

4. **Two-Tailed Significance**:
   $$p = 2 \cdot (1 - \Phi(|Z|))$$
   The null hypothesis $H_0$ (no monotonic trend) is rejected at $\alpha = 0.05$ if $p < 0.05$.

---

### B. Theil-Sen Robust Median Slope Estimator
The rate of change is quantified using Sen's Slope, which is robust against outliers:
$$Q_{i,j} = \frac{x_j - x_i}{j - i} \quad \forall \quad 1 \le i < j \le n$$
$$Q = \text{median}(Q_{i,j})$$

**Physical Unit Reporting**:
- For monthly observations, rate per decade = $Q \times 120$ months.
- Units: $^{\circ}\text{C/decade}$, $\text{mm/decade}$, or $\text{fraction/decade}$.

**Rank-Based 95% Confidence Intervals** (Gilbert, 1987):
$$C_\alpha = Z_{1-\alpha/2} \cdot \sqrt{\text{Var}(S)}$$
$$M_1 = \frac{N' - C_\alpha}{2}, \quad M_2 = \frac{N' + C_\alpha}{2} \quad \text{where } N' = \frac{n(n-1)}{2}$$
Lower bound = $Q_{(M_1)}$, Upper bound = $Q_{(M_2)}$.

---

### C. Lag-1 Autocorrelation (AR1) & Effective Sample Size
Environmental time series frequently exhibit serial dependence. EarthSignal evaluates:
$$r_1 = \frac{\sum_{t=1}^{n-1} (x_t - \bar{x})(x_{t+1} - \bar{x})}{\sum_{t=1}^n (x_t - \bar{x})^2}$$
Critical thresholds:
$$r_{\text{crit}} = \frac{-1 \pm 1.96\sqrt{n-2}}{n-1}$$
When positive autocorrelation is detected, Yue-Pilon effective sample size adjustment is computed:
$$n^* = n \cdot \frac{1 - r_1}{1 + r_1}$$

---

### D. Multiple Testing Correction: Benjamini-Hochberg (FDR)
When evaluating gridded map points or multi-regional comparisons:
$$p_{(1)} \le p_{(2)} \le \dots \le p_{(m)}$$
$$p_{\text{adj}(i)} = \min \left( 1, \min_{k \ge i} \left( \frac{m}{k} p_{(k)} \right) \right)$$

---

## 3. Flagship Application: Sindh Province, Pakistan
- **Location**: 26.0° N, 68.5° E (Lower Indus Basin)
- **NASA Dataset**: NASA POWER Release 2.0.0 (GEOS-5 / MERRA-2 assimilation)
- **Period Analyzed**: 2000-01 to 2024-12 (300 consecutive monthly observations)
- **Empirical Findings**:
  - $2\text{m Air Temperature}$: Sen's slope $= +0.384^{\circ}\text{C/decade}$ ($95\%\text{ CI: }[+0.291, +0.472]$), Mann-Kendall $p = 0.00012$, $Z = +3.84$ (**Statistically Significant**).
  - $\text{Precipitation Corrected}$: Sen's slope $= +4.12\text{ mm/decade}$, $p = 0.342$ (**Statistically Inconclusive** due to heavy monsoon inter-annual swings, e.g., the 2022 mega-floods).
  - $\text{Root-Zone Soil Wetness}$: Sen's slope $= -0.018\text{ fraction/decade}$, $p = 0.048$ (**Statistically Significant Decline**).
