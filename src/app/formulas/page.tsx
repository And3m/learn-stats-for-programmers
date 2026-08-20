import katex from "katex";
import type { Metadata } from "next";

import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Formula reference",
  description:
    "Every formula in the course on one page, grouped by chapter, with a one-line note on what each is for.",
};

type Formula = { name: string; note: string; tex: string };
type Group = { title: string; formulas: Formula[] };

const groups: Group[] = [
  {
    title: "Probability and counting",
    formulas: [
      {
        name: "Classical probability",
        note: "Valid only when every outcome is equally likely.",
        tex: String.raw`P(A) = \frac{\text{favourable outcomes}}{\text{total outcomes}}`,
      },
      {
        name: "General addition rule",
        note: "Subtract the overlap; the simple rule is this with P(A ∩ B) = 0.",
        tex: String.raw`P(A \cup B) = P(A) + P(B) - P(A \cap B)`,
      },
      {
        name: "General multiplication rule",
        note: "Reduces to P(A)P(B) exactly when the events are independent.",
        tex: String.raw`P(A \cap B) = P(A)\,P(B \mid A)`,
      },
      {
        name: "Complement rule",
        note: "The route to every 'at least one' question.",
        tex: String.raw`P(A) = 1 - P(A^{c})`,
      },
      {
        name: "Permutations",
        note: "Ordered arrangements of k items from n.",
        tex: String.raw`P(n, k) = \frac{n!}{(n-k)!}`,
      },
      {
        name: "Combinations",
        note: "Unordered selections — permutations divided by k!.",
        tex: String.raw`\binom{n}{k} = \frac{n!}{k!\,(n-k)!}`,
      },
      {
        name: "Odds and probability",
        note: "The scale logistic regression actually models.",
        tex: String.raw`\text{odds} = \frac{P}{1-P}, \qquad P = \frac{\text{odds}}{1 + \text{odds}}`,
      },
    ],
  },
  {
    title: "Distributions",
    formulas: [
      {
        name: "Normal density",
        note: "Depends on x only through its distance from μ in units of σ.",
        tex: String.raw`f(x) = \frac{1}{\sigma\sqrt{2\pi}}\, e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}`,
      },
      {
        name: "z-score",
        note: "Standardises any normal question into the standard normal.",
        tex: String.raw`z = \frac{x - \mu}{\sigma}`,
      },
      {
        name: "Binomial",
        note: "Fixed trials, two outcomes, constant p, independence.",
        tex: String.raw`P(X = k) = \binom{n}{k} p^{k} (1-p)^{n-k}`,
      },
      {
        name: "Poisson",
        note: "Rare events in a fixed window. Mean and variance are both λ.",
        tex: String.raw`P(X = k) = \frac{\lambda^{k} e^{-\lambda}}{k!}`,
      },
      {
        name: "Conditional probability",
        note: "Narrows the sample space to outcomes where B occurred.",
        tex: String.raw`P(A \mid B) = \frac{P(A \cap B)}{P(B)}`,
      },
      {
        name: "Bayes' theorem",
        note: "Posterior ∝ likelihood × prior. The base rate does most of the work.",
        tex: String.raw`P(A \mid B) = \frac{P(B \mid A)P(A)}{P(B \mid A)P(A) + P(B \mid A^{c})P(A^{c})}`,
      },
    ],
  },
  {
    title: "Regression",
    formulas: [
      {
        name: "Linear model",
        note: "Each coefficient is an effect holding the others fixed.",
        tex: String.raw`y_i = \beta_0 + \beta_1 x_{i1} + \cdots + \beta_k x_{ik} + \varepsilon_i`,
      },
      {
        name: "Least squares slope",
        note: "A correlation, rescaled by the ratio of standard deviations.",
        tex: String.raw`\hat{\beta}_1 = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2} = r_{xy}\frac{s_y}{s_x}`,
      },
      {
        name: "R-squared",
        note: "Variance explained. Never falls when predictors are added.",
        tex: String.raw`R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}`,
      },
      {
        name: "Logistic model",
        note: "Linear in the log-odds, S-shaped in probability.",
        tex: String.raw`\ln\!\left(\frac{p}{1-p}\right) = \beta_0 + \beta_1 x_1 + \cdots + \beta_k x_k`,
      },
      {
        name: "Logistic function",
        note: "Maps the whole real line into (0, 1).",
        tex: String.raw`\sigma(z) = \frac{1}{1 + e^{-z}}`,
      },
      {
        name: "Precision and recall",
        note: "Of those flagged, how many were real; of the real, how many caught.",
        tex: String.raw`\text{precision} = \frac{TP}{TP+FP}, \qquad \text{recall} = \frac{TP}{TP+FN}`,
      },
      {
        name: "F1 score",
        note: "Harmonic mean, so being hopeless at one is not hidden by the other.",
        tex: String.raw`F_1 = 2\cdot\frac{\text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}}`,
      },
    ],
  },
  {
    title: "Trees and time series",
    formulas: [
      {
        name: "Gini impurity",
        note: "Zero for a pure node, 0.5 for an even two-class split.",
        tex: String.raw`\text{Gini} = 1 - \sum_i p_i^2`,
      },
      {
        name: "Entropy",
        note: "Average bits to encode a node's class.",
        tex: String.raw`\text{Entropy} = -\sum_i p_i \log_2 p_i`,
      },
      {
        name: "Information gain",
        note: "Impurity removed, weighted by how much data went each way.",
        tex: String.raw`\text{gain} = I(\text{parent}) - \left(\frac{n_L}{n}I(L) + \frac{n_R}{n}I(R)\right)`,
      },
      {
        name: "Differencing",
        note: "Ordinary removes trend; seasonal removes a repeating cycle.",
        tex: String.raw`\nabla y_t = y_t - y_{t-1}, \qquad \nabla_m y_t = y_t - y_{t-m}`,
      },
      {
        name: "Autoregression, AR(p)",
        note: "Today as a weighted sum of recent values.",
        tex: String.raw`y_t = c + \phi_1 y_{t-1} + \cdots + \phi_p y_{t-p} + \varepsilon_t`,
      },
      {
        name: "Moving average, MA(q)",
        note: "Today as a weighted sum of recent forecast errors — not a rolling mean.",
        tex: String.raw`y_t = c + \varepsilon_t + \theta_1 \varepsilon_{t-1} + \cdots + \theta_q \varepsilon_{t-q}`,
      },
      {
        name: "Exponential smoothing",
        note: "α is the responsiveness dial: high tracks, low smooths.",
        tex: String.raw`\ell_t = \alpha y_t + (1-\alpha)\ell_{t-1}`,
      },
    ],
  },
  {
    title: "Optimisation, simulation and decisions",
    formulas: [
      {
        name: "Linear program",
        note: "The form scipy expects; negate to maximise.",
        tex: String.raw`\min_x c^{\mathsf T}x \quad \text{s.t.} \quad A_{ub}x \le b_{ub},\; l \le x \le u`,
      },
      {
        name: "Monte Carlo standard error",
        note: "Halving the error costs four times the trials.",
        tex: String.raw`SE = \frac{\sigma}{\sqrt{n}}`,
      },
      {
        name: "Expected monetary value",
        note: "Correct in the long run for a risk-neutral decision maker.",
        tex: String.raw`EMV_i = \sum_j P(s_j)\,V_{ij}`,
      },
      {
        name: "Regret",
        note: "Shortfall against the best choice for that state.",
        tex: String.raw`R_{ij} = \left(\max_k V_{kj}\right) - V_{ij}`,
      },
      {
        name: "EVPI",
        note: "A hard ceiling on what any study can be worth.",
        tex: String.raw`EVPI = \sum_j P(s_j)\max_i V_{ij} \;-\; \max_i EMV_i`,
      },
    ],
  },
  {
    title: "Markov, Benford, projects and quality",
    formulas: [
      {
        name: "State transition",
        note: "Rows of P sum to 1; π is a row vector.",
        tex: String.raw`\pi_{t+1} = \pi_t P, \qquad \pi_n = \pi_0 P^{\,n}`,
      },
      {
        name: "Steady state",
        note: "Needs the normalisation, or every scalar multiple qualifies.",
        tex: String.raw`\pi P = \pi, \qquad \sum_i \pi_i = 1`,
      },
      {
        name: "Fundamental matrix",
        note: "Expected visits to each transient state before absorption.",
        tex: String.raw`N = (I - Q)^{-1}, \qquad B = NR, \qquad t = N\mathbf{1}`,
      },
      {
        name: "Benford's law",
        note: "Equivalent to the mantissa of log₁₀ being uniform.",
        tex: String.raw`P(D_1 = d) = \log_{10}\!\left(1 + \frac{1}{d}\right)`,
      },
      {
        name: "PERT estimate",
        note: "Exceeds the mode whenever the pessimistic tail is longer.",
        tex: String.raw`t_e = \frac{a + 4m + b}{6}, \qquad \sigma^2 = \left(\frac{b-a}{6}\right)^2`,
      },
      {
        name: "Slack",
        note: "Zero slack means critical. Slack belongs to a path, not an activity.",
        tex: String.raw`\text{slack}_i = LS_i - ES_i = LF_i - EF_i`,
      },
      {
        name: "Control limits",
        note: "About one false alarm per 370 samples. Not specification limits.",
        tex: String.raw`UCL = \bar{x} + 3\hat{\sigma}, \qquad LCL = \bar{x} - 3\hat{\sigma}`,
      },
      {
        name: "Capability indices",
        note: "Cp measures width; Cpk also penalises being off-centre.",
        tex: String.raw`C_p = \frac{USL - LSL}{6\sigma}, \quad C_{pk} = \min\!\left(\frac{USL-\mu}{3\sigma}, \frac{\mu-LSL}{3\sigma}\right)`,
      },
      {
        name: "EWMA",
        note: "Accumulates evidence, catching small sustained shifts.",
        tex: String.raw`z_i = \lambda x_i + (1-\lambda) z_{i-1}`,
      },
    ],
  },
];

function render(tex: string): string {
  return katex.renderToString(tex, {
    displayMode: true,
    throwOnError: false,
    output: "html",
  });
}

export default function FormulasPage() {
  const count = groups.reduce((total, group) => total + group.formulas.length, 0);

  return (
    <div className="shell" style={{ maxWidth: "60rem", paddingBottom: "3rem" }}>
      <div className="chapter-hero">
        <p className="eyebrow">Reference</p>
        <h1>Formula sheet.</h1>
        <p className="chapter-hero__overview">
          {count} formulas from across the course, each with a one-line note on what it is for and
          where it goes wrong. Grouped roughly by chapter; use ⌘K to jump to the lesson that
          derives any of them.
        </p>
      </div>

      {groups.map((group) => (
        <section className="formula-group" key={group.title}>
          <h2 className="formula-group__title">{group.title}</h2>
          {group.formulas.map((formula) => (
            <div className="formula" key={formula.name}>
              <div className="formula__name">
                {formula.name}
                <span className="formula__note">{formula.note}</span>
              </div>
              <div
                className="formula__math"
                // KaTeX output is generated at build time from the literals above.
                dangerouslySetInnerHTML={{ __html: render(formula.tex) }}
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
