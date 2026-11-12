import { buildModuleQuestions, type BankQuestionSpec } from './types.js';

export const m6Questions: BankQuestionSpec[] = buildModuleQuestions('m6-machine-learning', 6, [
  // 20 SINGLE_MCQ
  {
    slug: 'ml-three-types',
    type: 'SINGLE_MCQ',
    title: 'Three Core Machine Learning Paradigms',
    prompt: 'Which grouping lists the three main learning paradigms compared in Unit 6?',
    topic: 'ML Paradigms',
    difficulty: 'EASY',
    sourcePage: '100-101, 122',
    lessonId: 'm6-l1',
    objective: 'Identify Supervised, Unsupervised and Reinforcement learning.',
    explanation:
      'Unit 6 divides ML broadly into Supervised Learning, Unsupervised Learning and Reinforcement Learning.',
    options: [
      { text: 'Supervised, Unsupervised and Reinforcement Learning', correct: true },
      { text: 'HTML, CSS and JavaScript' },
      { text: 'Printing, Scanning and Archiving' },
      { text: 'Nominal, Ordinal and Binary' },
    ],
  },
  {
    slug: 'positive-correlation-plot',
    type: 'SINGLE_MCQ',
    title: 'Identifying Positive Correlation Visually',
    prompt:
      'On a scatter plot, what visual pattern indicates Positive Correlation between X and Y?',
    topic: 'Correlation',
    difficulty: 'EASY',
    sourcePage: '103-105, 119',
    lessonId: 'm6-l1',
    objective: 'Recognize scatter trend direction.',
    explanation:
      'Positive correlation slopes upward from bottom-left toward top-right: as X rises, Y tends to rise.',
    options: [
      { text: 'Points form an upward diagonal trend from bottom-left to top-right', correct: true },
      { text: 'Points form a downward slope from top-left to bottom-right' },
      { text: 'Points scatter purely randomly like static noise' },
      { text: 'Only one single vertical bar exists' },
    ],
  },
  {
    slug: 'negative-correlation',
    type: 'SINGLE_MCQ',
    title: 'Negative Correlation Interpretation',
    prompt:
      'Suppose higher outside temperatures correspond with lower home heating-fuel consumption. What correlation describes temperature vs heating fuel?',
    topic: 'Correlation',
    difficulty: 'EASY',
    sourcePage: '103-105',
    lessonId: 'm6-l1',
    objective: 'Interpret inverse linear association.',
    explanation:
      'When one variable increases while the other generally decreases, they exhibit negative correlation.',
    options: [
      { text: 'Positive correlation' },
      { text: 'Negative correlation', correct: true },
      { text: 'Binary classification' },
      { text: 'Density clustering' },
    ],
  },
  {
    slug: 'least-squares-purpose',
    type: 'SINGLE_MCQ',
    title: 'Method of Least Squares in Regression',
    prompt:
      'In Linear Regression, what does the least squares method minimize when fitting the slope and intercept of a line?',
    topic: 'Linear Regression',
    difficulty: 'MEDIUM',
    sourcePage: '106-107',
    lessonId: 'm6-l1',
    objective: 'Understand least-squares line fitting.',
    explanation:
      'Least squares chooses slope and intercept to minimize the sum of squared vertical prediction residuals.',
    options: [
      { text: 'The count of training samples' },
      {
        text: 'The sum of squared prediction errors (residuals) between observed and predicted Y',
        correct: true,
      },
      { text: 'The distance to K-Means random labels' },
      { text: 'Only the smallest single observation' },
    ],
  },
  {
    slug: 'simple-vs-multiple-reg',
    type: 'SINGLE_MCQ',
    title: 'Simple vs Multiple Linear Regression',
    prompt:
      'Predicting house price from three input features—area, bedroom count and distance to metro—uses which regression variant?',
    topic: 'Linear Regression',
    difficulty: 'EASY',
    sourcePage: '107-108, 119',
    lessonId: 'm6-l1',
    objective: 'Differentiate single vs multi-feature linear regression.',
    explanation:
      'Multiple linear regression models a continuous outcome from two or more explanatory variables.',
    options: [
      { text: 'Simple linear regression' },
      { text: 'Multiple linear regression', correct: true },
      { text: 'K-Means clustering' },
      { text: 'Zero correlation' },
    ],
  },
  {
    slug: 'reg-strength-simple',
    type: 'SINGLE_MCQ',
    title: 'Key Strength of Linear Regression',
    prompt: 'Why is Simple Linear Regression frequently chosen as an initial regression baseline?',
    topic: 'Linear Regression',
    difficulty: 'EASY',
    sourcePage: '107-110, 119',
    lessonId: 'm6-l1',
    objective: 'Recognize interpretability and simplicity.',
    explanation:
      'Linear regression is fast, mathematically transparent and easy to interpret via slope coefficients.',
    options: [
      {
        text: 'It is simple, fast to train and easy to interpret via slope/intercept',
        correct: true,
      },
      { text: 'It fits arbitrarily complex jagged curves automatically' },
      { text: 'It ignores extreme outliers completely' },
      { text: 'It requires no numeric output values' },
    ],
  },
  {
    slug: 'binary-classification-def',
    type: 'SINGLE_MCQ',
    title: 'Binary Classification Task',
    prompt:
      'Categorizing incoming emails as either `Spam` or `Not Spam` (exactly two distinct labels) is called:',
    topic: 'Classification',
    difficulty: 'EASY',
    sourcePage: '111, 119',
    lessonId: 'm6-l1',
    objective: 'Distinguish binary vs multi-class classification.',
    explanation:
      'Classification across exactly two mutually exclusive labels is binary classification.',
    options: [
      { text: 'Binary classification', correct: true },
      { text: 'Multi-class classification' },
      { text: 'Hierarchical clustering' },
      { text: 'Polynomial regression' },
    ],
  },
  {
    slug: 'multiclass-def',
    type: 'SINGLE_MCQ',
    title: 'Multi-Class Classification Example',
    prompt:
      'Classifying tree leaves into four species (`Oak`, `Maple`, `Neem`, `Pine`) represents:',
    topic: 'Classification',
    difficulty: 'EASY',
    sourcePage: '111, 119',
    lessonId: 'm6-l1',
    objective: 'Identify multi-class tasks.',
    explanation:
      'Predicting one label among three or more predefined classes is multi-class classification.',
    options: [
      { text: 'Multi-class classification', correct: true },
      { text: 'Binary classification' },
      { text: 'Unsupervised clustering' },
      { text: 'Simple regression' },
    ],
  },
  {
    slug: 'knn-prediction-rule',
    type: 'SINGLE_MCQ',
    title: 'How KNN Classifies a New Sample',
    prompt:
      'How does the K-Nearest Neighbors (KNN) classifier assign a category label to a new test point?',
    topic: 'KNN Algorithm',
    difficulty: 'EASY',
    sourcePage: '112-113, 120',
    lessonId: 'm6-l1',
    objective: 'Explain KNN distance-based majority voting.',
    explanation:
      'KNN finds the `K` closest labelled points in feature space and predicts by majority class vote.',
    options: [
      { text: 'By fitting a straight regression line across centroids' },
      { text: 'By majority vote among the K closest labelled training neighbors', correct: true },
      { text: 'By assigning the cluster ID from unlabelled guesses' },
      { text: 'By sorting training strings alphabetically' },
    ],
  },
  {
    slug: 'knn-scaling-impact',
    type: 'SINGLE_MCQ',
    title: 'Why Feature Scaling Matters in KNN',
    prompt:
      'Why can leaving unnormalized features (`Age: 18..25` alongside `AnnualIncome: 200000..1500000`) break KNN accuracy?',
    topic: 'KNN Algorithm',
    difficulty: 'MEDIUM',
    sourcePage: '112-113',
    lessonId: 'm6-l1',
    objective: 'Connect distance metric sensitivity to scaling.',
    explanation:
      'Euclidean distance adds squared raw differences; income differences of 10,000 swamp age differences of 5.',
    options: [
      {
        text: 'Large numeric scales dominate Euclidean distances so smaller-range features barely influence neighbors',
        correct: true,
      },
      { text: 'KNN refuses to run unless values exceed 1,000' },
      { text: 'K automatically resets to zero' },
      { text: 'Training labels reverse sign' },
    ],
  },
  {
    slug: 'unsupervised-clustering-def',
    type: 'SINGLE_MCQ',
    title: 'Goal of Clustering Algorithms',
    prompt: 'What is the fundamental objective of Clustering in Machine Learning?',
    topic: 'Clustering',
    difficulty: 'EASY',
    sourcePage: '114-115, 120',
    lessonId: 'm6-l2',
    objective: 'Define clustering.',
    explanation:
      'Clustering partitions unlabelled points into groups where items inside each cluster share greater similarity with each other than with external clusters.',
    options: [
      { text: 'Predicting continuous stock closing prices' },
      {
        text: 'Grouping unlabelled data observations by similarity into coherent clusters',
        correct: true,
      },
      { text: 'Matching labelled images strictly to predefined exam answers' },
      { text: 'Maximizing random errors' },
    ],
  },
  {
    slug: 'kmeans-family',
    type: 'SINGLE_MCQ',
    title: 'Clustering Type of K-Means',
    prompt: 'Which clustering category does K-Means belong to?',
    topic: 'Clustering Methods',
    difficulty: 'MEDIUM',
    sourcePage: '115-116, 120',
    lessonId: 'm6-l2',
    objective: 'Classify K-Means as Partitioning Clustering.',
    explanation:
      'K-Means divides points into `K` non-overlapping partitions around computed centroids (Partitioning clustering).',
    options: [
      { text: 'Partitioning clustering', correct: true },
      { text: 'Density-based clustering' },
      { text: 'Supervised regression' },
      { text: 'Rule-based sorting' },
    ],
  },
  {
    slug: 'dbscan-family',
    type: 'SINGLE_MCQ',
    title: 'Density-Based Clustering Example',
    prompt:
      'Which algorithm referenced in Unit 6 discovers clusters of dense neighborhoods while marking sparse outliers without pre-specifying `K`?',
    topic: 'Clustering Methods',
    difficulty: 'MEDIUM',
    sourcePage: '115, 120-121',
    lessonId: 'm6-l2',
    objective: 'Recognize DBSCAN as density-based clustering.',
    explanation:
      'DBSCAN is density-based clustering, grouping densely packed neighborhoods and spotting sparse noise points.',
    options: [
      { text: 'DBSCAN', correct: true },
      { text: 'Simple Linear Regression' },
      { text: 'K-Means' },
      { text: 'Logistic Binary Classifier' },
    ],
  },
  {
    slug: 'fuzzy-clustering',
    type: 'SINGLE_MCQ',
    title: 'Soft Membership Across Multiple Clusters',
    prompt:
      'Which clustering approach lets an observation hold fractional membership degrees across more than one cluster rather than a hard single assignment?',
    topic: 'Clustering Methods',
    difficulty: 'MEDIUM',
    sourcePage: '115, 121',
    lessonId: 'm6-l2',
    objective: 'Identify Fuzzy / soft clustering concept.',
    explanation:
      'Fuzzy clustering permits data objects to belong partially to multiple overlapping clusters.',
    options: [
      { text: 'Fuzzy clustering', correct: true },
      { text: 'Hard Partitioning' },
      { text: 'Fixed Rule Thresholds' },
      { text: 'Least Squares Line' },
    ],
  },
  {
    slug: 'kmeans-human-label',
    type: 'SINGLE_MCQ',
    title: 'Interpreting K-Means Clusters',
    prompt:
      'After K-Means outputs Clusters 0, 1 and 2 on student activity logs, why is human inspection still necessary?',
    topic: 'K-Means Algorithm',
    difficulty: 'MEDIUM',
    sourcePage: '115-117',
    lessonId: 'm6-l2',
    objective: 'Avoid equating arbitrary mathematical clusters with valid meaning.',
    explanation:
      'Clusters reflect geometric distance rules and sensitive choices of `K`; domain reviewers must evaluate whether clusters correspond to meaningful patterns.',
    options: [
      {
        text: 'Clusters are geometric groupings dependent on chosen K and scaling—humans must check usefulness and avoid harmful stereotypes',
        correct: true,
      },
      { text: 'K-Means returns English essay interpretations automatically' },
      { text: 'Clusters are illegal unless `K = 10`' },
      { text: 'Human reviewers must erase every third row' },
    ],
  },
  {
    slug: 'overfitting-def',
    type: 'SINGLE_MCQ',
    title: 'Diagnosing Overfitting',
    prompt:
      'A classification model achieves `99%` accuracy on training records yet only `58%` on unseen test patients. What problem is occurring?',
    topic: 'Model Challenges',
    difficulty: 'EASY',
    sourcePage: '120',
    lessonId: 'm6-l2',
    objective: 'Identify overfitting vs underfitting.',
    explanation:
      'Memorizing training noise and idiosyncrasies at the expense of generalization onto held-out data is Overfitting.',
    options: [
      { text: 'Overfitting', correct: true },
      { text: 'Underfitting' },
      { text: 'Positive correlation' },
      { text: 'Zero variance' },
    ],
  },
  {
    slug: 'underfitting-def',
    type: 'SINGLE_MCQ',
    title: 'Diagnosing Underfitting',
    prompt:
      'If a model is too rigid (for instance fitting a straight line to strongly curved U-shaped data) and scores poorly on BOTH training and test splits, it exhibits:',
    topic: 'Model Challenges',
    difficulty: 'MEDIUM',
    sourcePage: '120',
    lessonId: 'm6-l2',
    objective: 'Distinguish underfitting from overfitting.',
    explanation:
      'Underfitting occurs when a model cannot capture the underlying structure even in training examples.',
    options: [
      { text: 'Overfitting' },
      { text: 'Underfitting', correct: true },
      { text: 'Data leakage' },
      { text: 'Perfect generalization' },
    ],
  },
  {
    slug: 'reg-vs-clf-pick',
    type: 'SINGLE_MCQ',
    title: 'Choosing Regression vs Classification',
    prompt: 'For which task should a developer select Regression rather than Classification?',
    topic: 'Model Selection',
    difficulty: 'EASY',
    sourcePage: '107-111',
    lessonId: 'm6-l1',
    objective: 'Match task output types accurately.',
    explanation:
      'Estimating a continuous numerical quantity (`32.4 °C`) requires Regression, whereas discrete categories require Classification.',
    options: [
      {
        text: 'Forecasting tomorrow’s numeric peak electricity demand in megawatts',
        correct: true,
      },
      { text: 'Flagging a bank transfer as Fraudulent or Legitimate' },
      { text: 'Recognizing handwritten digits 0 through 9' },
      { text: 'Classifying email sentiment as Positive, Neutral or Negative' },
    ],
  },
  {
    slug: 'knn-even-k-tie',
    type: 'SINGLE_MCQ',
    title: 'Practical Reason for Odd K in Binary KNN',
    prompt:
      'When performing two-class classification with KNN, why do practitioners commonly prefer odd values like `K = 3` or `K = 5` over even values like `K = 2`?',
    topic: 'KNN Algorithm',
    difficulty: 'MEDIUM',
    sourcePage: '112-113',
    lessonId: 'm6-l1',
    objective: 'Prevent majority-vote ties in binary KNN.',
    explanation: 'Odd `K` avoids exact 50%-50% voting ties between two classes.',
    options: [
      { text: 'Odd K reduces majority-vote ties between two competing classes', correct: true },
      { text: 'Even numbers raise Python SyntaxError' },
      { text: 'Odd K uses zero distance computations' },
      { text: 'Even K switches automatically to Linear Regression' },
    ],
  },
  {
    slug: 'corr-confounder',
    type: 'SINGLE_MCQ',
    title: 'Correlation Without Causation',
    prompt:
      'Monthly drowning incidents and monthly ice-cream sales show strong positive correlation (`r = +0.88`). What explains this without ice cream causing drowning?',
    topic: 'Correlation',
    difficulty: 'EASY',
    sourcePage: '103-105',
    lessonId: 'm6-l1',
    objective: 'Identify confounding hidden variables.',
    explanation:
      'Hot summer weather acts as a shared seasonal factor driving both outdoor swimming and ice-cream purchases independently.',
    options: [
      {
        text: 'A third confounding factor (hot summer season) drives both independently',
        correct: true,
      },
      { text: 'Ice cream strictly causes swimming accidents directly' },
      { text: 'Negative correlation always flips positive in June' },
      { text: 'Least squares forced the slope positive artificially' },
    ],
  },

  // 5 MULTI_SELECT
  {
    slug: 'supervised-tasks-multi',
    type: 'MULTI_SELECT',
    title: 'Supervised Learning Algorithm Families',
    prompt: 'Select ALL supervised learning tasks or models covered in Unit 6.',
    topic: 'Supervised Learning',
    difficulty: 'EASY',
    sourcePage: '102-113',
    lessonId: 'm6-l1',
    objective: 'Distinguish supervised methods from clustering.',
    explanation:
      'Linear Regression (simple/multiple) and Classification (including KNN) are supervised methods using labelled targets.',
    options: [
      { text: 'Simple Linear Regression', correct: true },
      { text: 'Multiple Linear Regression', correct: true },
      { text: 'Binary & Multi-class Classification (including KNN)', correct: true },
      { text: 'K-Means Clustering on unlabelled data' },
    ],
  },
  {
    slug: 'clustering-types-multi',
    type: 'MULTI_SELECT',
    title: 'Clustering Method Families',
    prompt: 'Select ALL clustering approaches introduced in Unit 6.',
    topic: 'Clustering Methods',
    difficulty: 'MEDIUM',
    sourcePage: '115-121',
    lessonId: 'm6-l2',
    objective: 'Recall major clustering taxonomy.',
    explanation:
      'Partitioning (K-Means), Hierarchical, Density-based (DBSCAN) and Distribution/Fuzzy methods are all listed.',
    options: [
      { text: 'Partitioning clustering (e.g. K-Means)', correct: true },
      { text: 'Density-based clustering (e.g. DBSCAN)', correct: true },
      { text: 'Hierarchical clustering', correct: true },
      { text: 'Distribution model-based clustering', correct: true },
    ],
  },
  {
    slug: 'ml-challenges-multi',
    type: 'MULTI_SELECT',
    title: 'Core Challenges When Applying ML Algorithms',
    prompt:
      'Select ALL valid challenges associated with machine learning models highlighted in Unit 6.',
    topic: 'Model Challenges',
    difficulty: 'EASY',
    sourcePage: '120',
    lessonId: 'm6-l2',
    objective: 'Recognize multi-dimensional model risks.',
    explanation:
      'Unit 6 explicitly lists data bias/fairness, interpretability/explainability and overfitting/underfitting.',
    options: [
      { text: 'Data bias and fairness disparities', correct: true },
      { text: 'Interpretability and explainability difficulty', correct: true },
      { text: 'Overfitting and underfitting trade-offs', correct: true },
      { text: 'Total immunity to feature scale differences' },
    ],
  },
  {
    slug: 'kmeans-steps-multi',
    type: 'MULTI_SELECT',
    title: 'Steps Inside the K-Means Loop',
    prompt: 'Which actions execute inside iterative K-Means clustering?',
    topic: 'K-Means Algorithm',
    difficulty: 'MEDIUM',
    sourcePage: '116-117',
    lessonId: 'm6-l2',
    objective: 'Trace K-Means assignment and centroid updates.',
    explanation:
      'Choose K initial centroids -> assign each point to closest centroid -> update centroids to mean of cluster points -> repeat until convergence.',
    options: [
      { text: 'Assign each point to its nearest centroid', correct: true },
      { text: 'Recompute each centroid as the mean of points in that cluster', correct: true },
      { text: 'Iterate until assignments stop changing (or tolerance stops)', correct: true },
      { text: 'Evaluate target exam answers against ground-truth `y_test`' },
    ],
  },
  {
    slug: 'metric-selection-multi',
    type: 'MULTI_SELECT',
    title: 'Sound Practices for Model Evaluation',
    prompt: 'Which habits help measure true model performance responsibly?',
    topic: 'Model Evaluation',
    difficulty: 'MEDIUM',
    sourcePage: '108-120',
    lessonId: 'm6-l2',
    objective: 'Prevent skewed metric interpretation.',
    explanation:
      'Keep test data strictly held out, check error types beyond raw accuracy, normalize features only from training stats, and inspect outliers.',
    options: [
      { text: 'Evaluate predictions on held-out unseen test data', correct: true },
      { text: 'Scale numeric features cleanly before distance-based KNN/K-Means', correct: true },
      {
        text: 'Match error costs (e.g. false negatives in screening) rather than chasing accuracy alone',
        correct: true,
      },
      { text: 'Leak test labels into training features to boost accuracy' },
    ],
  },

  // 5 TRUE_FALSE
  {
    slug: 'tf-kmeans-supervised',
    type: 'TRUE_FALSE',
    title: 'Supervised vs Unsupervised K-Means',
    prompt:
      'True or False: K-Means is a Supervised Classification algorithm requiring labelled target outcomes during training.',
    topic: 'K-Means Algorithm',
    difficulty: 'EASY',
    sourcePage: '116, 120',
    lessonId: 'm6-l2',
    objective: 'Distinguish K-Means from KNN cleanly.',
    explanation:
      'False. K-Means is Unsupervised Clustering; KNN (K-Nearest Neighbors) is Supervised Classification.',
    correctBoolean: false,
  },
  {
    slug: 'tf-zero-corr',
    type: 'TRUE_FALSE',
    title: 'Zero Linear Correlation Pattern',
    prompt:
      'True or False: When two variables show random cloud scatter with no upward or downward linear slope, they exhibit roughly zero linear correlation.',
    topic: 'Correlation',
    difficulty: 'EASY',
    sourcePage: '103-105, 119',
    lessonId: 'm6-l1',
    objective: 'Recognize zero correlation visual.',
    explanation: 'True. No apparent linear trend corresponds to no/zero linear correlation.',
    correctBoolean: true,
  },
  {
    slug: 'tf-knn-lazy',
    type: 'TRUE_FALSE',
    title: 'KNN Reliance on Nearby Labelled Points',
    prompt:
      'True or False: KNN classifies a new observation based on similarity (distance) to its `K` nearest labelled training points.',
    topic: 'KNN Algorithm',
    difficulty: 'EASY',
    sourcePage: '112-113',
    lessonId: 'm6-l1',
    objective: 'Verify KNN nearest-neighbor mechanism.',
    explanation: 'True. Majority class among the `K` closest labelled points decides the label.',
    correctBoolean: true,
  },
  {
    slug: 'tf-linear-reg-nonlinear',
    type: 'TRUE_FALSE',
    title: 'Linear Assumption Limit',
    prompt:
      'True or False: Simple Linear Regression is ideal for capturing sharply oscillating non-linear curves without transforming features.',
    topic: 'Linear Regression',
    difficulty: 'MEDIUM',
    sourcePage: '107-110, 119',
    lessonId: 'm6-l1',
    objective: 'Recognize linearity limits.',
    explanation:
      'False. Simple linear regression fits a straight line (`y = mx + c`), so non-linear curves require transformation or non-linear models.',
    correctBoolean: false,
  },
  {
    slug: 'tf-kmeans-choose-k',
    type: 'TRUE_FALSE',
    title: 'Specifying K in K-Means',
    prompt:
      'True or False: Standard K-Means requires the user or analyst to choose the target number of clusters `K` before running the algorithm.',
    topic: 'K-Means Algorithm',
    difficulty: 'EASY',
    sourcePage: '116',
    lessonId: 'm6-l2',
    objective: 'Identify K as an input hyperparameter.',
    explanation: 'True. `K` is set upfront (and explored carefully across candidate values).',
    correctBoolean: true,
  },

  // 5 FILL_BLANK
  {
    slug: 'fb-least-squares',
    type: 'FILL_BLANK',
    title: 'Line-Fitting Optimization Method',
    prompt:
      'Linear regression estimates slope and intercept by minimizing the sum of squared residuals via the method of ______ squares.',
    topic: 'Linear Regression',
    difficulty: 'EASY',
    sourcePage: '106',
    lessonId: 'm6-l1',
    objective: 'Recall least squares terminology.',
    explanation: 'The method of least squares minimizes squared prediction errors.',
    acceptedAnswers: ['least'],
  },
  {
    slug: 'fb-knn-expand',
    type: 'FILL_BLANK',
    title: 'KNN Expansion',
    prompt: 'In supervised classification, KNN stands for K-Nearest ______.',
    topic: 'KNN Algorithm',
    difficulty: 'EASY',
    sourcePage: '112',
    lessonId: 'm6-l1',
    objective: 'Expand KNN.',
    explanation: 'K-Nearest Neighbors (or Neighbours).',
    acceptedAnswers: ['Neighbors', 'Neighbours'],
  },
  {
    slug: 'fb-kmeans-center',
    type: 'FILL_BLANK',
    title: 'Cluster Center Point Name',
    prompt:
      'In K-Means clustering, the arithmetic mean point representing the center of each cluster is called its ______.',
    topic: 'K-Means Algorithm',
    difficulty: 'EASY',
    sourcePage: '116',
    lessonId: 'm6-l2',
    objective: 'Name cluster centroid.',
    explanation: 'Each cluster center in K-Means is called a centroid.',
    acceptedAnswers: ['centroid', 'centroids'],
  },
  {
    slug: 'fb-binary-two',
    type: 'FILL_BLANK',
    title: 'Two-Class Classification Label',
    prompt:
      'A supervised classification problem with exactly two possible output categories (e.g., Pass/Fail) is called ______ classification.',
    topic: 'Classification',
    difficulty: 'EASY',
    sourcePage: '111',
    lessonId: 'm6-l1',
    objective: 'Name binary classification.',
    explanation: 'Two-label classification is binary classification.',
    acceptedAnswers: ['binary'],
  },
  {
    slug: 'fb-overfitting-term',
    type: 'FILL_BLANK',
    title: 'Memorizing Training Noise',
    prompt:
      'When a machine learning model memorizes noise in training examples and fails to generalize onto new unseen test records, it is suffering from ______.',
    topic: 'Model Challenges',
    difficulty: 'EASY',
    sourcePage: '120',
    lessonId: 'm6-l2',
    objective: 'Recall Overfitting.',
    explanation: 'Overfitting fits training quirks rather than true general pattern.',
    acceptedAnswers: ['overfitting'],
  },

  // 5 SHORT_ANSWER
  {
    slug: 'sa-knn-vs-kmeans',
    type: 'SHORT_ANSWER',
    title: 'Contrast KNN and K-Means Explicitly',
    prompt:
      'Explain three crisp differences between KNN and K-Means (learning type, role of labels, and what `K` means in each).',
    topic: 'KNN vs K-Means',
    difficulty: 'MEDIUM',
    sourcePage: '112-117',
    lessonId: 'm6-l2',
    objective: 'Eliminate confusion between K-named algorithms.',
    explanation:
      'KNN is Supervised Classification (`K` = nearby labelled voters); K-Means is Unsupervised Clustering (`K` = number of centroid partitions).',
    expectedPoints: [
      'KNN is Supervised (requires target labels); K-Means is Unsupervised (uses unlabelled data)',
      'In KNN, K = number of nearest neighbors voting on a query point; in K-Means, K = total cluster groups formed',
      'KNN solves classification/regression against labelled classes; K-Means groups data by similarity',
    ],
  },
  {
    slug: 'sa-corr-types',
    type: 'SHORT_ANSWER',
    title: 'Three Types of Linear Correlation with Examples',
    prompt:
      'Briefly define Positive, Negative and No Correlation and give one plausible real-world example of each.',
    topic: 'Correlation',
    difficulty: 'EASY',
    sourcePage: '103-105',
    lessonId: 'm6-l1',
    objective: 'Illustrate correlation directions cleanly.',
    explanation:
      'Positive: practice hours vs typing speed; Negative: altitude vs air pressure; Zero: shoe size vs math grades.',
    expectedPoints: [
      'Positive: both increase together (e.g. hours spent revising vs test mark)',
      'Negative: one rises as the other falls (e.g. daily screen distraction vs sleep duration)',
      'No correlation: unrelated variation (e.g. birth month vs height)',
    ],
  },
  {
    slug: 'sa-error-costs-clf',
    type: 'SHORT_ANSWER',
    title: 'Why Accuracy Alone Can Mislead in Classification',
    prompt:
      'Suppose only 2% of incoming clinic blood samples carry a critical illness, and a lazy classifier always outputs `"Healthy"` achieving 98% accuracy. Why is this model dangerous despite 98% accuracy?',
    topic: 'Model Evaluation',
    difficulty: 'MEDIUM',
    sourcePage: '111-113, 120',
    lessonId: 'm6-l1',
    objective: 'Understand class imbalance and asymmetric false negative costs.',
    explanation:
      'It misses 100% of sick patients (zero recall / severe false negatives) even while scoring 98% overall accuracy.',
    expectedPoints: [
      'Accuracy hides failure on the rare critical positive class (2%)',
      '100% false-negative rate on ill patients causes severe harm; metrics like recall/precision/confusion breakdown are required',
    ],
  },
  {
    slug: 'sa-kmeans-poor-k',
    type: 'SHORT_ANSWER',
    title: 'What Happens When K in K-Means Is Poorly Chosen',
    prompt:
      'Describe one symptom when `K` is chosen far too small and one symptom when `K` is chosen far too large in K-Means clustering.',
    topic: 'K-Means Algorithm',
    difficulty: 'MEDIUM',
    sourcePage: '115-117',
    lessonId: 'm6-l2',
    objective: 'Evaluate cluster granularity trade-offs.',
    explanation:
      'Too small merges genuinely distinct behaviors into vague blobs; too large shatters uniform groups into tiny meaningless micro-splits.',
    expectedPoints: [
      'K too small collapses genuinely different subgroups into one broad cluster',
      'K too large fragments coherent natural groups into artificial tiny sub-clusters that generalize poorly',
    ],
  },
  {
    slug: 'sa-linear-outliers',
    type: 'SHORT_ANSWER',
    title: 'Effect of Outliers on Least-Squares Regression',
    prompt:
      'Explain briefly why a single extreme typo/outlier point (`y = 500` when trend runs `10..40`) pulls a Simple Linear Regression line noticeably off-course.',
    topic: 'Linear Regression',
    difficulty: 'MEDIUM',
    sourcePage: '106-110, 119',
    lessonId: 'm6-l1',
    objective: 'Connect squared residuals to outlier leverage.',
    explanation:
      'Least squares minimizes squared errors, so one large residual squares to an enormous penalty pulling the fitted line toward itself.',
    expectedPoints: [
      'Least squares minimizes `(actual - predicted)^2`, giving extreme weight to huge vertical errors',
      'A single extreme point tilts slope/intercept toward itself unless inspected visually on a scatter plot first',
    ],
  },

  // 2 LONG_CASE
  {
    slug: 'lc-retail-ml-suite',
    type: 'LONG_CASE',
    title: 'Case Study: Selecting & Inspecting ML Models for a Cooperative Bookstore',
    prompt:
      'A student-run bookstore wants ML help on three separate tasks: (Task A) forecasting exact weekly notebook demand in units from semester week & exam calendar, (Task B) flagging damaged/unreadable donated book cover scans into `Accept`, `Repair`, or `Recycle`, and (Task C) discovering unlabelled browsing patterns across student book borrows. For ALL three tasks: specify Learning Paradigm, exact algorithm family from Unit 6, required features/splitting guardrails, and one critical risk (scale bias, overfitting, label imbalance or misinterpreting clusters).',
    topic: 'Algorithm Selection Case Study',
    difficulty: 'HARD',
    sourcePage: '102-122',
    lessonId: 'm6-l2',
    objective:
      'Map distinct business goals to regression, classification and clustering rigorously.',
    explanation:
      'Task A -> Supervised Regression (Multiple Linear Regression); Task B -> Supervised Multi-class Classification; Task C -> Unsupervised Clustering (K-Means / DBSCAN).',
    expectedPoints: [
      'Task A: Supervised Multiple Regression using numeric history; warn about non-linear exam spikes / outliers',
      'Task B: Supervised Multi-class Classification (3 labels); warn about train/test leakage & lighting/angle generalization',
      'Task C: Unsupervised Clustering (`K-Means`/`DBSCAN`); warn that borrower clusters must remain privacy-preserving and inspected by librarians',
    ],
  },
  {
    slug: 'lc-knn-scale-diagnostic',
    type: 'LONG_CASE',
    title: 'Case Study: Diagnosing Why a Scholarship KNN Model Failed in Production',
    prompt:
      'A developer trains `KNeighborsClassifier(n_neighbors=4)` on raw features `(StudyHours: 1..10, FamilyIncome: 50000..900000, EssayScore: 1..10)` without train/test splitting first—testing accuracy on the same rows used for training (`98%` score)—before deploying live. In real deployment, predictions hinge almost purely on FamilyIncome, tie unpredictably, and underperform badly on new students. Diagnose four technical mistakes from Unit 6 and write the corrected training & evaluation workflow.',
    topic: 'ML Pipeline Debugging Case Study',
    difficulty: 'HARD',
    sourcePage: '108-120',
    lessonId: 'm6-l1',
    objective: 'Spot leakage, unscaled Euclidean distortion, even-K ties and validation flaws.',
    explanation:
      'Diagnoses: (1) unscaled FamilyIncome drowning out EssayScore/StudyHours, (2) evaluating on training rows (no held-out X_test), (3) even K=4 creating voting ties, (4) ethical risk of using FamilyIncome directly in automated screening.',
    expectedPoints: [
      'No feature scaling (`Income` dominates Euclidean distance)',
      'Tested on training data (memorization / data leakage rather than held-out `X_test` evaluation)',
      'Even `K=4` invites ties on binary decisions; try odd K cross-validated on train/validation splits',
      'Fixes order: split train/test FIRST -> fit scaler ONLY on `X_train` -> transform `X_test` -> evaluate against baseline & fairness subgroup audit',
    ],
  },

  // 2 PRACTICAL
  {
    slug: 'pr-knn-hand-trace',
    type: 'PRACTICAL',
    title: 'Practical: Manual 2-D KNN Distance & Rescaling Exercise',
    prompt:
      'Consider 5 normalized training points `(x1, x2) -> Class`: `P1(1,1)->A`, `P2(2,1)->A`, `P3(2,3)->B`, `P4(5,4)->B`, `P5(4,5)->B`, and a query point `Q(2,2)`.\n(1) Compute Euclidean distance squared `d^2 = (x1-2)^2 + (x2-2)^2` from `Q` to all 5 points.\n(2) Predict `Q`’s label using `K = 3` (`A` vs `B`).\n(3) Show how multiplying `x2` by `10` without rescaling (`x2_scaled -> 10*x2`) shifts distances to `P2(2,10)` vs `P3(2,30)` vs `P1(1,10)` and explain the lesson.',
    topic: 'KNN Distance Trace Practical',
    difficulty: 'MEDIUM',
    sourcePage: '112-113',
    lessonId: 'm6-l1',
    objective: 'Execute Euclidean distance neighbor lookup and observe scale impact.',
    explanation:
      'Unscaled `d^2` to Q(2,2): P1->1+1=2(A), P2->0+1=1(A), P3->0+1=1(B), P4->9+4=13(B), P5->4+9=13(B). Top 3 nearest are P2(A,1), P3(B,1), P1(A,2) => Vote A:2 vs B:1 => Predicts Class A! Scaling x2*10 stretches vertical distance 100x.',
    expectedPoints: [
      'Exact squared distances: P1=2(A), P2=1(A), P3=1(B), P4=13(B), P5=13(B)',
      'Nearest 3 neighbors (`P2, P3, P1`) vote 2 A vs 1 B -> predicts Class A',
      'Shows scaling x2 by 10x magnifies vertical differences (`100x` squared weight), proving why normalization is mandatory',
    ],
  },
  {
    slug: 'pr-kmeans-1d-trace',
    type: 'PRACTICAL',
    title: 'Practical: Trace K-Means Centroid Updates by Hand',
    prompt:
      'Run K-Means with `K = 2` on the 1-D dataset `[2, 4, 10, 12]` starting with initial centroids `C1 = 3` and `C2 = 9`:\n(1) Iteration 1 Assignment: assign each point to the closer centroid (`C1` vs `C2`).\n(2) Iteration 1 Update: compute updated centroids as the exact cluster averages.\n(3) Iteration 2 Check: reassign all points to updated centroids and confirm convergence.',
    topic: 'K-Means Practical Trace',
    difficulty: 'EASY',
    sourcePage: '116-117',
    lessonId: 'm6-l2',
    objective: 'Trace assignment, mean update and convergence cleanly.',
    explanation:
      'Iter 1: [2,4] closer to 3; [10,12] closer to 9. New C1=(2+4)/2=3, C2=(10+12)/2=11. Iter 2: |x-3| vs |x-11| -> [2,4] stay with 3, [10,12] stay with 11 -> converged!',
    expectedPoints: [
      'Assignment 1: Cluster 1 = {2, 4}; Cluster 2 = {10, 12}',
      'Centroid updates: C1 = (2+4)/2 = 3; C2 = (10+12)/2 = 11',
      'Iteration 2 produces identical assignments -> algorithm converged in 2 passes',
    ],
  },
]);
