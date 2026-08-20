/**
 * The single source of truth for course structure.
 *
 * Prose lives in MDX under `src/content/chapters/`; everything *about* a lesson
 * — its number, title, reading time, section anchors, and which Pyodide
 * packages and datasets it needs — lives here. Nothing globs the filesystem and
 * no MDX file carries frontmatter, so the sidebar, static params, pager,
 * search index, and progress totals all derive from this one module.
 *
 * `sourcePages` cite *Statistics Every Programmer Needs* by Gary Sutton
 * (Manning, 2025) as further reading. The course text is original; the book
 * supplied the syllabus only.
 */

/** Packages that ship with the Pyodide distribution we pin. */
export type PyPackage =
  | "numpy"
  | "pandas"
  | "scipy"
  | "matplotlib"
  | "scikit-learn"
  | "statsmodels"
  | "networkx"
  | "sympy";

export type LessonSection = {
  /** Must match a raw `<h2 id="...">` in the lesson's MDX file. */
  id: string;
  label: string;
  sourcePages?: string;
};

export type LessonRuntime = {
  packages: PyPackage[];
  /** Filenames under `public/datasets/`, mounted into the Pyodide filesystem. */
  datasets: string[];
};

export type Lesson = {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  sourcePages: string;
  readingMinutes: number;
  sections: LessonSection[];
  runtime: LessonRuntime;
};

export type Chapter = {
  slug: string;
  number: number;
  title: string;
  shortTitle: string;
  overview: string;
  sourcePages: string;
  lessons: Lesson[];
};

type SectionInput = [id: string, label: string] | [id: string, label: string, sourcePages: string];

const lesson = (
  slug: string,
  number: string,
  title: string,
  shortTitle: string,
  description: string,
  sourcePages: string,
  readingMinutes: number,
  sections: SectionInput[],
  runtime: Partial<LessonRuntime> = {},
): Lesson => ({
  slug,
  number,
  title,
  shortTitle,
  description,
  sourcePages,
  readingMinutes,
  sections: sections.map(([id, label, pages]) => ({ id, label, sourcePages: pages })),
  runtime: { packages: runtime.packages ?? [], datasets: runtime.datasets ?? [] },
});

export const chapters: Chapter[] = [
  {
    slug: "groundwork",
    number: 1,
    title: "Laying the groundwork",
    shortTitle: "Groundwork",
    overview:
      "Why a working programmer benefits from statistics that go beyond averages, which Python tools do the heavy lifting, and how to get the most out of a course where every code block actually runs.",
    sourcePages: "1-15",
    lessons: [
      lesson(
        "why-quantitative-thinking",
        "1.1",
        "Why quantitative thinking pays off",
        "Why it pays off",
        "The gap between reading a number and knowing what it licenses you to claim — and why that gap is where most bad decisions live.",
        "2-4",
        9,
        [
          ["the-gap", "The gap this course closes"],
          ["stats-vs-quant", "Statistics vs. quantitative methods"],
          ["where-it-shows-up", "Where it shows up in real work"],
        ],
      ),
      lesson(
        "the-python-toolkit",
        "1.2",
        "The Python toolkit",
        "Python toolkit",
        "The six libraries that carry almost every technique in this course, and what each one is genuinely good at.",
        "4-8",
        11,
        [
          ["the-libraries", "The six libraries"],
          ["which-tool-when", "Which tool for which job"],
          ["running-code-here", "Running code in this page"],
        ],
        { packages: ["numpy", "pandas"] },
      ),
      lesson(
        "how-this-course-works",
        "1.3",
        "How this course works",
        "How it works",
        "The shape of a lesson, how the in-browser Python runtime behaves, and what this course deliberately leaves out.",
        "11-15",
        8,
        [
          ["shape-of-a-lesson", "The shape of a lesson"],
          ["the-runtime", "About the Python runtime"],
          ["not-covered", "What this course does not cover"],
        ],
      ),
    ],
  },
  {
    slug: "probability",
    number: 2,
    title: "Probability and counting",
    shortTitle: "Probability",
    overview:
      "Probability is the cornerstone every later technique rests on. This chapter starts with coins and dice, gets the denominator right, and finishes with the random variables that distributions are built from.",
    sourcePages: "16-40",
    lessons: [
      lesson(
        "basic-probability",
        "2.1",
        "Basic probability and odds",
        "Basic probability",
        "Successes over outcomes — plus the two things that quietly go wrong: the denominator, and what counts as a success.",
        "17-22",
        12,
        [
          ["defining-probability", "Successes over outcomes"],
          ["the-denominator", "Getting the denominator right"],
          ["three-types", "Theoretical, empirical, subjective"],
          ["odds", "Odds, and why gamblers prefer them"],
        ],
        { packages: ["numpy"] },
      ),
      lesson(
        "counting-rules",
        "2.2",
        "Counting rules",
        "Counting rules",
        "Multiply for 'and', add for 'or' — and subtract the overlap when the events are not mutually exclusive.",
        "22-23",
        10,
        [
          ["multiplication-rule", "The multiplication rule"],
          ["addition-rule", "The addition rule"],
          ["overlap", "When events overlap"],
        ],
        { packages: ["numpy"] },
      ),
      lesson(
        "permutations-and-combinations",
        "2.3",
        "Permutations and combinations",
        "Permutations",
        "One question decides which formula you need: does order matter? Get it wrong and you are off by a factor of k factorial.",
        "23-30",
        13,
        [
          ["does-order-matter", "Does order matter?"],
          ["permutations", "Permutations"],
          ["combinations", "Combinations"],
          ["in-python", "Counting in Python"],
        ],
        { packages: ["scipy"] },
      ),
      lesson(
        "random-variables",
        "2.4",
        "Random variables, PMFs, PDFs and CDFs",
        "Random variables",
        "The bridge from single events to distributions: discrete mass, continuous density, and the cumulative view that answers most real questions.",
        "30-40",
        15,
        [
          ["discrete-vs-continuous", "Discrete vs. continuous"],
          ["pmf", "Probability mass functions"],
          ["pdf", "Probability density functions"],
          ["cdf", "Cumulative distribution functions"],
        ],
        { packages: ["numpy", "scipy", "matplotlib"] },
      ),
    ],
  },
  {
    slug: "distributions",
    number: 3,
    title: "Distributions and conditional probability",
    shortTitle: "Distributions",
    overview:
      "Four distributions cover a surprising share of practical work — normal, binomial, discrete uniform and Poisson — followed by the conditional reasoning that trips up experts and undergraduates alike.",
    sourcePages: "41-78",
    lessons: [
      lesson(
        "normal-distribution",
        "3.1",
        "The normal distribution",
        "Normal",
        "Why the bell curve turns up everywhere, what its two parameters control, and how to turn any normal question into an area.",
        "42-50",
        14,
        [
          ["shape", "Shape and parameters"],
          ["z-scores", "Standardising with z-scores"],
          ["empirical-rule", "The 68-95-99.7 rule"],
        ],
        { packages: ["numpy", "scipy", "matplotlib"] },
      ),
      lesson(
        "binomial-distribution",
        "3.2",
        "The binomial distribution",
        "Binomial",
        "Fixed trials, two outcomes, constant probability, independence — four conditions that, when met, give you an exact answer.",
        "50-56",
        13,
        [
          ["the-setup", "Four conditions"],
          ["the-formula", "The formula, and where it comes from"],
          ["shape", "Mean, variance and shape"],
          ["in-python", "Binomial questions in Python"],
        ],
        { packages: ["numpy", "scipy", "matplotlib"] },
      ),
      lesson(
        "uniform-and-poisson",
        "3.3",
        "Discrete uniform and Poisson",
        "Uniform & Poisson",
        "The distribution of a fair die, and the distribution of rare events in a fixed window — plus how to tell when Poisson is the wrong model.",
        "56-63",
        13,
        [
          ["discrete-uniform", "The discrete uniform distribution"],
          ["poisson", "The Poisson distribution"],
          ["when-poisson-applies", "When Poisson genuinely applies"],
        ],
        { packages: ["numpy", "scipy", "matplotlib"] },
      ),
      lesson(
        "probability-rules",
        "3.4",
        "Probability rules in practice",
        "Probability rules",
        "The complement rule, the general addition rule, and a reference table for choosing between them under pressure.",
        "63-72",
        12,
        [
          ["complement-rule", "The complement rule"],
          ["general-rules", "Addition and multiplication, generalised"],
          ["quick-reference", "A quick reference table"],
          ["worked-examples", "Worked examples"],
        ],
        { packages: ["numpy", "scipy"] },
      ),
      lesson(
        "conditional-probability",
        "3.5",
        "Conditional probability and Bayes",
        "Conditional",
        "Why a 99%-accurate test can still be wrong most of the time it fires, and the natural-frequency trick that makes it obvious.",
        "72-78",
        16,
        [
          ["the-idea", "Narrowing the sample space"],
          ["independence", "Conditional probability and independence"],
          ["natural-frequencies", "The natural-frequency shortcut"],
          ["bayes", "Bayes' theorem"],
        ],
        { packages: ["numpy"] },
      ),
    ],
  },
  {
    slug: "linear-regression",
    number: 4,
    title: "Fitting a linear regression",
    shortTitle: "Linear regression",
    overview:
      "The workhorse of applied statistics: fit a line, read the summary table honestly, and then check the four assumptions that decide whether any of it means anything.",
    sourcePages: "79-110",
    lessons: [
      lesson(
        "the-linear-model",
        "4.1",
        "The linear model",
        "The model",
        "Slope, intercept, residuals and least squares — and what R-squared does and does not tell you.",
        "81-87",
        13,
        [
          ["the-equation", "The equation"],
          ["least-squares", "Why least squares"],
          ["r-squared", "Goodness of fit and R-squared"],
        ],
        { packages: ["numpy", "matplotlib"] },
      ),
      lesson(
        "fitting-a-model",
        "4.2",
        "Fitting a model",
        "Fitting",
        "Load the data, look at it before you model it, then fit with statsmodels and read the output block by block.",
        "87-95",
        15,
        [
          ["the-data", "Exploring before modelling"],
          ["fitting", "Fitting with statsmodels"],
          ["the-summary", "Reading the summary table"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "matplotlib"],
          datasets: ["fuel-efficiency.csv"],
        },
      ),
      lesson(
        "interpreting-results",
        "4.3",
        "Interpreting the results",
        "Interpreting",
        "What a coefficient actually claims, what a p-value actually claims, and the difference between a confidence interval and a prediction interval.",
        "95-105",
        15,
        [
          ["coefficients", "What a coefficient means"],
          ["significance", "Significance, honestly"],
          ["intervals", "Confidence vs. prediction intervals"],
          ["prediction", "Predicting new values"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "matplotlib"],
          datasets: ["fuel-efficiency.csv"],
        },
      ),
      lesson(
        "checking-assumptions",
        "4.4",
        "Checking the assumptions",
        "Assumptions",
        "Linearity, independence, homoskedasticity, normal residuals — how to test each one and what to do when it fails.",
        "105-110",
        16,
        [
          ["the-four", "The four assumptions"],
          ["residual-plots", "Residual plots"],
          ["formal-tests", "Formal tests"],
          ["what-to-do", "What to do when one fails"],
        ],
        {
          packages: ["numpy", "pandas", "scipy", "statsmodels", "matplotlib"],
          datasets: ["fuel-efficiency.csv"],
        },
      ),
    ],
  },
  {
    slug: "logistic-regression",
    number: 5,
    title: "Fitting a logistic regression",
    shortTitle: "Logistic regression",
    overview:
      "When the answer is yes or no, a straight line will not do. Logistic regression models the log-odds — and forces you to think properly about thresholds and about which errors you can afford.",
    sourcePages: "111-139",
    lessons: [
      lesson(
        "why-not-linear",
        "5.1",
        "Why not a straight line",
        "Why not linear",
        "Fitting a line to a 0/1 outcome predicts probabilities above one and below zero. The logistic function fixes that, at the cost of a new scale to interpret.",
        "113-114",
        12,
        [
          ["the-problem", "What goes wrong"],
          ["the-logistic-function", "The logistic function"],
          ["log-odds", "Log-odds, the scale that is linear"],
        ],
        { packages: ["numpy", "matplotlib"] },
      ),
      lesson(
        "fitting-and-interpreting",
        "5.2",
        "Fitting and interpreting",
        "Fitting",
        "Fit a multiple logistic regression, then convert coefficients into odds ratios you can actually say out loud.",
        "114-131",
        15,
        [
          ["the-data", "The data"],
          ["fitting", "Fitting the model"],
          ["odds-ratios", "Coefficients as odds ratios"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels"],
          datasets: ["loan-defaults.csv"],
        },
      ),
      lesson(
        "classification-metrics",
        "5.3",
        "Classification metrics",
        "Metrics",
        "The confusion matrix and everything derived from it — and why accuracy is the metric most likely to flatter a useless model.",
        "131-136",
        15,
        [
          ["confusion-matrix", "The confusion matrix"],
          ["precision-recall", "Precision and recall"],
          ["f1", "F1 and the trade-off"],
          ["accuracy-trap", "The accuracy trap"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "scikit-learn"],
          datasets: ["loan-defaults.csv"],
        },
      ),
      lesson(
        "thresholds-and-roc",
        "5.4",
        "Thresholds and the ROC curve",
        "Thresholds & ROC",
        "0.5 is a default, not a decision. Sweep the threshold, read the ROC curve, and pick the operating point your problem actually calls for.",
        "136-139",
        14,
        [
          ["moving-the-threshold", "Moving the threshold"],
          ["roc-curve", "The ROC curve"],
          ["auc", "What AUC summarises"],
          ["choosing", "Choosing an operating point"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "scikit-learn", "matplotlib"],
          datasets: ["loan-defaults.csv"],
        },
      ),
    ],
  },
  {
    slug: "trees-and-forests",
    number: 6,
    title: "Decision trees and random forests",
    shortTitle: "Trees & forests",
    overview:
      "A model you can read as a flowchart, its habit of memorising the training set, and the ensemble trick that turns a high-variance learner into a dependable one.",
    sourcePages: "140-183",
    lessons: [
      lesson(
        "how-trees-split",
        "6.1",
        "How trees split",
        "Splitting",
        "Greedy, one feature at a time, chasing purity — with Gini and entropy as two ways of measuring how mixed a node is.",
        "141-142",
        13,
        [
          ["the-idea", "Twenty questions, chosen greedily"],
          ["gini-and-entropy", "Gini and entropy"],
          ["information-gain", "Information gain"],
        ],
        { packages: ["numpy", "matplotlib"] },
      ),
      lesson(
        "fitting-a-tree",
        "6.2",
        "Fitting and reading a tree",
        "Fitting a tree",
        "Train a classifier, plot it, and trace a single observation down to its leaf so the prediction stops being a black box.",
        "142-164",
        15,
        [
          ["the-data", "The data"],
          ["training", "Training the tree"],
          ["plotting", "Plotting the tree"],
          ["reading-a-path", "Following one observation down"],
        ],
        {
          packages: ["numpy", "pandas", "scikit-learn", "matplotlib"],
          datasets: ["seed-grains.csv"],
        },
      ),
      lesson(
        "overfitting-and-pruning",
        "6.3",
        "Overfitting and pruning",
        "Overfitting",
        "An unconstrained tree can score 100% on training data and still be worthless. Depth limits, leaf sizes and cross-validation are the cure.",
        "164-174",
        14,
        [
          ["why-trees-overfit", "Why trees overfit"],
          ["constraints", "Depth, leaves and impurity"],
          ["cross-validation", "Cross-validation"],
        ],
        {
          packages: ["numpy", "pandas", "scikit-learn", "matplotlib"],
          datasets: ["seed-grains.csv"],
        },
      ),
      lesson(
        "random-forests",
        "6.4",
        "Random forests",
        "Random forests",
        "Bagging plus feature randomness turns many overfit trees into one stable model — and hands you a feature-importance ranking to read with care.",
        "174-183",
        14,
        [
          ["bagging", "Bagging"],
          ["feature-randomness", "Feature randomness"],
          ["feature-importance", "Feature importance, and its caveats"],
          ["when-to-use", "When to reach for a forest"],
        ],
        {
          packages: ["numpy", "pandas", "scikit-learn", "matplotlib"],
          datasets: ["seed-grains.csv"],
        },
      ),
    ],
  },
  {
    slug: "time-series",
    number: 7,
    title: "Time series models",
    shortTitle: "Time series",
    overview:
      "Ordered data breaks the independence assumption everything so far relied on. Stationarity, ACF/PACF, ARIMA and exponential smoothing are the tools that put it back together.",
    sourcePages: "184-221",
    lessons: [
      lesson(
        "forecasts-vs-predictions",
        "7.1",
        "Forecasts vs. predictions",
        "Forecasts",
        "Two words used interchangeably that mean different things — and the three components hiding inside every series.",
        "185-191",
        12,
        [
          ["the-distinction", "The distinction"],
          ["components", "Trend, seasonality, noise"],
          ["the-data", "Plotting the series"],
          ["the-benchmark", "Establish a benchmark first"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "matplotlib"],
          datasets: ["web-traffic.csv"],
        },
      ),
      lesson(
        "stationarity",
        "7.2",
        "Stationarity and differencing",
        "Stationarity",
        "Most time series models assume constant mean and variance. Here is how to check that claim and how to fix it when it fails.",
        "193-205",
        15,
        [
          ["what-it-means", "What stationarity means"],
          ["spotting-it", "Spotting non-stationarity"],
          ["adf-test", "The augmented Dickey-Fuller test"],
          ["differencing", "Differencing"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "matplotlib"],
          datasets: ["web-traffic.csv"],
        },
      ),
      lesson(
        "acf-and-pacf",
        "7.3",
        "ACF and PACF",
        "ACF & PACF",
        "The two correlation plots that suggest how many AR and MA terms a series wants — and how to read them without over-reading them.",
        "205-207",
        13,
        [
          ["autocorrelation", "Autocorrelation"],
          ["partial", "Partial autocorrelation"],
          ["reading-the-plots", "Reading the plots"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "matplotlib"],
          datasets: ["web-traffic.csv"],
        },
      ),
      lesson(
        "arima",
        "7.4",
        "ARIMA",
        "ARIMA",
        "Autoregression, integration and moving average combined into one model — fitted, diagnosed, and finally used to forecast.",
        "191-215",
        17,
        [
          ["three-components", "AR, I and MA"],
          ["choosing-orders", "Choosing p, d and q"],
          ["fitting", "Fitting the model"],
          ["diagnostics", "Diagnostics"],
          ["forecasting", "Forecasting"],
        ],
        {
          packages: ["numpy", "pandas", "scipy", "statsmodels", "matplotlib"],
          datasets: ["web-traffic.csv"],
        },
      ),
      lesson(
        "exponential-smoothing",
        "7.5",
        "Exponential smoothing",
        "Smoothing",
        "Weight recent observations more heavily. Simple, double and Holt-Winters — and an honest rule for choosing between them and ARIMA.",
        "215-221",
        14,
        [
          ["ses", "Simple exponential smoothing"],
          ["holt", "Adding a trend"],
          ["holt-winters", "Holt-Winters and seasonality"],
          ["choosing", "Choosing a model"],
        ],
        {
          packages: ["numpy", "pandas", "statsmodels", "matplotlib"],
          datasets: ["web-traffic.csv"],
        },
      ),
    ],
  },
  {
    slug: "linear-programming",
    number: 8,
    title: "Linear programming",
    shortTitle: "Linear programming",
    overview:
      "Constrained optimisation: state an objective, write down what limits you, and let a solver find the best feasible point instead of guessing at it.",
    sourcePages: "222-241",
    lessons: [
      lesson(
        "formulating-the-problem",
        "8.1",
        "Formulating the problem",
        "Formulating",
        "Decision variables, an objective function, and constraints — the translation step that is harder and more important than the solve.",
        "223-236",
        14,
        [
          ["the-scenario", "The scenario"],
          ["decision-variables", "Decision variables"],
          ["objective-function", "The objective function"],
          ["constraints", "Constraints and bounds"],
        ],
        { packages: ["numpy"] },
      ),
      lesson(
        "solving-with-scipy",
        "8.2",
        "Solving it",
        "Solving",
        "Getting a formulation into the standard form scipy expects, running HiGHS, and reading what comes back.",
        "236-239",
        14,
        [
          ["standard-form", "Standard form"],
          ["linprog", "Solving with scipy.optimize.linprog"],
          ["the-solution", "Reading the solution"],
        ],
        { packages: ["numpy", "scipy"] },
      ),
      lesson(
        "interpreting-and-stress-testing",
        "8.3",
        "Interpreting and stress-testing",
        "Interpreting",
        "Which constraints actually bind, what a shadow price is worth, and how much your answer moves when an estimate was wrong.",
        "239-241",
        13,
        [
          ["binding-constraints", "Binding constraints"],
          ["shadow-prices", "Shadow prices"],
          ["sensitivity", "Sensitivity analysis"],
        ],
        { packages: ["numpy", "scipy", "matplotlib"] },
      ),
    ],
  },
  {
    slug: "monte-carlo",
    number: 9,
    title: "Monte Carlo simulation",
    shortTitle: "Monte Carlo",
    overview:
      "When the maths is intractable, sample. A disciplined six-step process turns random numbers into a distribution of outcomes you can reason about.",
    sourcePages: "242-270",
    lessons: [
      lesson(
        "why-simulate",
        "9.1",
        "Why simulate",
        "Why simulate",
        "The problems that have no closed form, and the law of large numbers that makes sampling a legitimate substitute.",
        "243-244",
        12,
        [
          ["the-idea", "The idea"],
          ["when-to-reach-for-it", "When to reach for it"],
          ["law-of-large-numbers", "The law of large numbers"],
        ],
        { packages: ["numpy", "matplotlib"] },
      ),
      lesson(
        "the-six-step-process",
        "9.2",
        "The six-step process",
        "Six steps",
        "Distribution, cumulative distribution, random-number intervals, draws, trials, analysis — done by hand once so the automation makes sense.",
        "244-255",
        14,
        [
          ["the-steps", "The six steps"],
          ["by-hand", "One pass by hand"],
          ["intervals", "Random-number intervals"],
        ],
        { packages: ["numpy", "pandas"] },
      ),
      lesson(
        "simulating-discrete-outcomes",
        "9.3",
        "Simulating discrete outcomes",
        "Discrete",
        "Automating the hand-run: thousands of trials over a discrete distribution, then reading the result distribution properly.",
        "255-259",
        14,
        [
          ["building-the-distribution", "Building the distribution"],
          ["running-trials", "Running the trials"],
          ["analysing", "Analysing the results"],
        ],
        { packages: ["numpy", "pandas", "matplotlib"] },
      ),
      lesson(
        "simulating-continuous-outcomes",
        "9.4",
        "Simulating continuous outcomes",
        "Continuous",
        "Log returns, drift and volatility, and a fan of simulated price paths — plus a clear statement of what the fan does not promise.",
        "259-270",
        16,
        [
          ["log-returns", "Log returns"],
          ["parameters", "Drift and volatility"],
          ["simulating-paths", "Simulating paths"],
          ["reading-the-fan", "Reading the fan honestly"],
        ],
        {
          packages: ["numpy", "pandas", "scipy", "matplotlib"],
          datasets: ["index-prices.csv"],
        },
      ),
    ],
  },
  {
    slug: "decision-analysis",
    number: 10,
    title: "Decision analysis",
    shortTitle: "Decision analysis",
    overview:
      "Structured choice under uncertainty: payoff tables when you have no probabilities, expected value when you do, and decision trees when the choices come in sequence.",
    sourcePages: "271-293",
    lessons: [
      lesson(
        "deciding-without-probabilities",
        "10.1",
        "Deciding without probabilities",
        "No probabilities",
        "Maximax, maximin and minimax regret — three defensible criteria that can each pick a different alternative from the same table.",
        "272-279",
        14,
        [
          ["payoff-tables", "Payoff tables"],
          ["maximax", "Maximax: the optimist"],
          ["maximin", "Maximin: the pessimist"],
          ["minimax-regret", "Minimax regret"],
        ],
        { packages: ["numpy", "pandas"] },
      ),
      lesson(
        "expected-value",
        "10.2",
        "Expected value and EVPI",
        "Expected value",
        "Weighting payoffs by probability, what perfect information would be worth, and the situations where expected value is the wrong criterion.",
        "279-282",
        13,
        [
          ["emv", "Expected monetary value"],
          ["evpi", "The value of perfect information"],
          ["when-it-misleads", "When expected value misleads"],
        ],
        { packages: ["numpy", "pandas", "matplotlib"] },
      ),
      lesson(
        "decision-trees",
        "10.3",
        "Building a decision tree",
        "Decision trees",
        "Decision nodes, chance nodes, and rolling back from the leaves to find the optimal first move.",
        "282-293",
        14,
        [
          ["the-schema", "Nodes and branches"],
          ["rolling-back", "Rolling back"],
          ["plotting", "Plotting the tree"],
        ],
        { packages: ["numpy", "pandas", "networkx", "matplotlib"] },
      ),
    ],
  },
  {
    slug: "markov",
    number: 11,
    title: "Markov analysis",
    shortTitle: "Markov",
    overview:
      "Systems that move between states with fixed probabilities: where they will be next, where they settle in the long run, and what happens when some states never let go.",
    sourcePages: "294-318",
    lessons: [
      lesson(
        "states-and-transitions",
        "11.1",
        "States and transition matrices",
        "States",
        "The Markov property, the state vector, and the matrix whose rows must sum to one.",
        "295-300",
        13,
        [
          ["the-setup", "The Markov property"],
          ["transition-matrix", "The transition matrix"],
          ["one-step", "One step ahead"],
        ],
        { packages: ["numpy", "pandas"] },
      ),
      lesson(
        "multi-step-prediction",
        "11.2",
        "Predicting several steps ahead",
        "Multi-step",
        "Repeated multiplication, matrix powers, and the first hint that the answer stops changing.",
        "300-307",
        12,
        [
          ["matrix-powers", "Matrix powers"],
          ["n-steps", "n steps ahead"],
          ["convergence-hint", "Something is converging"],
        ],
        { packages: ["numpy", "pandas", "matplotlib"] },
      ),
      lesson(
        "equilibrium",
        "11.3",
        "Equilibrium conditions",
        "Equilibrium",
        "The steady state a chain settles into regardless of where it started — solved directly rather than by iterating.",
        "307-311",
        13,
        [
          ["steady-state", "The steady state"],
          ["solving-it", "Solving for it directly"],
          ["eigenvector-view", "The eigenvector view"],
        ],
        { packages: ["numpy", "pandas"] },
      ),
      lesson(
        "absorbing-states",
        "11.4",
        "Absorbing states",
        "Absorbing",
        "States you can enter but never leave, the fundamental matrix, and how long a chain survives before one swallows it.",
        "311-318",
        15,
        [
          ["what-absorbs", "What makes a state absorbing"],
          ["fundamental-matrix", "The fundamental matrix"],
          ["expected-steps", "Expected steps and final outcomes"],
        ],
        { packages: ["numpy", "pandas", "matplotlib"] },
      ),
    ],
  },
  {
    slug: "benfords-law",
    number: 12,
    title: "Benford's law",
    shortTitle: "Benford's law",
    overview:
      "Naturally occurring numbers start with 1 about 30% of the time. That regularity is a genuinely useful anomaly detector — as long as you check that it should apply before you accuse anyone of anything.",
    sourcePages: "319-348",
    lessons: [
      lesson(
        "the-leading-digit-law",
        "12.1",
        "The leading-digit law",
        "The law",
        "The distribution nobody expects, the logarithmic formula behind it, and the scale-invariance argument for why it holds.",
        "320-324",
        13,
        [
          ["the-surprise", "The surprise"],
          ["the-formula", "The formula"],
          ["why-it-happens", "Why it happens"],
        ],
        { packages: ["numpy", "matplotlib"] },
      ),
      lesson(
        "when-it-applies",
        "12.2",
        "When it applies",
        "When it applies",
        "Benford needs several orders of magnitude and no imposed bounds. Uniform and random data do not conform — and that is the point.",
        "324-330",
        13,
        [
          ["the-conditions", "The conditions"],
          ["uniform-and-random", "Uniform and random data"],
          ["counterexamples", "Honest counterexamples"],
        ],
        { packages: ["numpy", "matplotlib"] },
      ),
      lesson(
        "testing-conformity",
        "12.3",
        "Testing conformity",
        "Testing",
        "The chi-square goodness-of-fit test, mean absolute deviation, and why the two can disagree on large samples.",
        "337-343",
        15,
        [
          ["chi-square", "The chi-square test"],
          ["mad", "Mean absolute deviation"],
          ["reading-the-result", "Reading the result"],
        ],
        {
          packages: ["numpy", "pandas", "scipy", "matplotlib"],
          datasets: ["payments.csv"],
        },
      ),
      lesson(
        "stronger-diagnostics",
        "12.4",
        "Stronger diagnostics",
        "Diagnostics",
        "The distortion factor, the digit-level z-statistic, and mantissa statistics — three sharper instruments than the headline test.",
        "343-348",
        14,
        [
          ["distortion-factor", "The distortion factor"],
          ["z-statistic", "The z-statistic per digit"],
          ["mantissa-stats", "Mantissa statistics"],
        ],
        {
          packages: ["numpy", "pandas", "scipy", "matplotlib"],
          datasets: ["payments.csv"],
        },
      ),
    ],
  },
  {
    slug: "project-management",
    number: 13,
    title: "Managing projects",
    shortTitle: "Projects",
    overview:
      "WBS, PERT and CPM: decompose the work, put honest uncertainty on each estimate, find the sequence that actually determines the finish date, and price the cost of pulling it forward.",
    sourcePages: "349-377",
    lessons: [
      lesson(
        "work-breakdown-structure",
        "13.1",
        "The work breakdown structure",
        "WBS",
        "Decomposing a project until each piece is small enough to estimate — and knowing when to stop decomposing.",
        "350-354",
        12,
        [
          ["decomposing", "Decomposing the work"],
          ["the-hierarchy", "The hierarchy"],
          ["when-to-stop", "When a task is small enough"],
        ],
        { packages: ["pandas"] },
      ),
      lesson(
        "pert-estimates",
        "13.2",
        "PERT estimates",
        "PERT",
        "Optimistic, most likely and pessimistic — three numbers that give you both an expected duration and the variance you need later.",
        "354-357",
        13,
        [
          ["three-point", "Three-point estimates"],
          ["expected-time", "Expected time"],
          ["variance", "Variance, and why it matters"],
        ],
        { packages: ["numpy", "pandas", "scipy", "matplotlib"] },
      ),
      lesson(
        "critical-path",
        "13.3",
        "The critical path",
        "Critical path",
        "Forward pass, backward pass, slack — and the chain of zero-slack activities that is the only thing standing between you and an earlier finish.",
        "357-369",
        16,
        [
          ["earliest-times", "The forward pass"],
          ["latest-times", "The backward pass"],
          ["slack", "Slack"],
          ["finding-the-path", "Finding the path in code"],
        ],
        { packages: ["numpy", "pandas", "networkx", "matplotlib"] },
      ),
      lesson(
        "risk-and-crashing",
        "13.4",
        "Completion risk and crashing",
        "Risk & crashing",
        "Turning path variance into a probability of hitting a date, then buying time back at the lowest cost per day.",
        "369-377",
        15,
        [
          ["probability-of-completion", "Probability of on-time completion"],
          ["crash-costs", "Crash cost per day"],
          ["what-to-crash", "Choosing what to crash"],
        ],
        { packages: ["numpy", "pandas", "scipy", "matplotlib"] },
      ),
    ],
  },
  {
    slug: "quality-control",
    number: 14,
    title: "Visualizing quality control",
    shortTitle: "Quality control",
    overview:
      "Control charts separate the noise a process always has from the signal that something changed — one chart type per kind of measurement, and a capability index to say whether 'in control' is good enough.",
    sourcePages: "378-410",
    lessons: [
      lesson(
        "control-chart-fundamentals",
        "14.1",
        "Control chart fundamentals",
        "Fundamentals",
        "Common cause vs. special cause, why the limits sit at three sigma, and the difference between a process in control and a process that is any good.",
        "380-388",
        15,
        [
          ["common-vs-special", "Common and special cause"],
          ["control-limits", "Where the limits come from"],
          ["capability", "Capability indices"],
        ],
        {
          packages: ["numpy", "pandas", "scipy", "matplotlib"],
          datasets: ["qc-measurements.csv"],
        },
      ),
      lesson(
        "attribute-charts",
        "14.2",
        "Charts for attributes",
        "Attributes",
        "Counting defectives and defects: p-charts, np-charts, c-charts and u-charts, and a decision rule for picking between them.",
        "388-398",
        15,
        [
          ["p-charts", "p-charts"],
          ["np-charts", "np-charts"],
          ["c-and-u", "c-charts and u-charts"],
          ["choosing", "Choosing a chart"],
        ],
        {
          packages: ["numpy", "pandas", "matplotlib"],
          datasets: ["qc-defects.csv"],
        },
      ),
      lesson(
        "variable-charts",
        "14.3",
        "Charts for variables",
        "Variables",
        "Measured quantities in subgroups: x-bar with R, x-bar with s, and why subgroup size decides which pairing you use.",
        "398-405",
        14,
        [
          ["xbar-and-r", "x-bar and R"],
          ["xbar-and-s", "x-bar and s"],
          ["subgroup-size", "Subgroup size"],
        ],
        {
          packages: ["numpy", "pandas", "scipy", "matplotlib"],
          datasets: ["qc-measurements.csv"],
        },
      ),
      lesson(
        "individuals-and-ewma",
        "14.4",
        "Individuals and EWMA charts",
        "I-MR & EWMA",
        "When subgrouping is impossible, and when the shift you care about is too small for a three-sigma rule to notice.",
        "405-410",
        14,
        [
          ["i-mr", "I-MR charts"],
          ["ewma", "EWMA charts"],
          ["small-shifts", "Detecting small shifts"],
        ],
        {
          packages: ["numpy", "pandas", "matplotlib"],
          datasets: ["qc-measurements.csv"],
        },
      ),
    ],
  },
];

/* ---------------------------------------------------------------------------
   Lookups
   --------------------------------------------------------------------------- */

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((chapter) => chapter.slug === slug);
}

export function getLesson(chapterSlug: string, lessonSlug: string): Lesson | undefined {
  return getChapter(chapterSlug)?.lessons.find((item) => item.slug === lessonSlug);
}

export type LessonRef = { chapter: Chapter; lesson: Lesson };

export function getAllLessons(): LessonRef[] {
  return chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson })));
}

export function getLessonNeighbors(
  chapterSlug: string,
  lessonSlug: string,
): { previous?: LessonRef; next?: LessonRef } {
  const all = getAllLessons();
  const index = all.findIndex(
    (item) => item.chapter.slug === chapterSlug && item.lesson.slug === lessonSlug,
  );
  if (index === -1) return {};
  return { previous: all[index - 1], next: all[index + 1] };
}

export function lessonHref(chapterSlug: string, lessonSlug: string): string {
  return `/chapters/${chapterSlug}/${lessonSlug}`;
}

export function chapterHref(chapterSlug: string): string {
  return `/chapters/${chapterSlug}`;
}

/** Stable key used by the MDX component map, the search index and the progress store. */
export function lessonKey(chapterSlug: string, lessonSlug: string): string {
  return `${chapterSlug}/${lessonSlug}`;
}

export function chapterMinutes(chapter: Chapter): number {
  return chapter.lessons.reduce((total, lesson) => total + lesson.readingMinutes, 0);
}

export function courseStats() {
  const lessons = getAllLessons();
  return {
    chapters: chapters.length,
    lessons: lessons.length,
    minutes: lessons.reduce((total, { lesson }) => total + lesson.readingMinutes, 0),
  };
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const sourceBook = {
  title: "Statistics Every Programmer Needs",
  author: "Gary Sutton",
  publisher: "Manning Publications",
  year: 2025,
  isbn: "9781633436053",
  url: "https://www.manning.com/books/statistics-every-programmer-needs",
} as const;
