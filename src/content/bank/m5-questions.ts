import { buildModuleQuestions, type BankQuestionSpec } from './types.js';

export const m5Questions: BankQuestionSpec[] = buildModuleQuestions('m5-data-literacy', 5, [
  // 20 SINGLE_MCQ
  {
    slug: 'primary-vs-secondary',
    type: 'SINGLE_MCQ',
    title: 'Primary Data Source Definition',
    prompt: 'Which example represents a Primary data source?',
    topic: 'Data Sources',
    difficulty: 'EASY',
    sourcePage: '73',
    lessonId: 'm5-l1',
    objective: 'Distinguish primary vs secondary data.',
    explanation:
      'Primary data is collected firsthand for a specific analysis (such as conducting a new student survey or lab measurement).',
    options: [
      {
        text: 'Conducting your own new survey and temperature log specifically for a project',
        correct: true,
      },
      { text: 'Downloading a 5-year-old public census report compiled by another team' },
      { text: 'Quoting an annual textbook statistical appendix' },
      { text: 'Reusing a third-party sports archive table' },
    ],
  },
  {
    slug: 'nominal-scale',
    type: 'SINGLE_MCQ',
    title: 'Nominal Measurement Scale',
    prompt:
      'Recording students’ eye colours (`Brown`, `Black`, `Hazel`) or `Yes/No` flags illustrates which measurement level?',
    topic: 'Measurement Levels',
    difficulty: 'EASY',
    sourcePage: '75',
    lessonId: 'm5-l1',
    objective: 'Identify nominal attributes.',
    explanation:
      'Nominal data places items into distinct named categories with no intrinsic mathematical ordering.',
    options: [
      { text: 'Nominal Level', correct: true },
      { text: 'Ordinal Level' },
      { text: 'Interval Level' },
      { text: 'Ratio Level' },
    ],
  },
  {
    slug: 'ordinal-scale',
    type: 'SINGLE_MCQ',
    title: 'Ordinal Measurement Scale',
    prompt:
      'Customer satisfaction ratings (`1 = Poor`, `2 = Fair`, `3 = Good`, `4 = Excellent`) have meaningful order without guaranteed equal spacing. Which scale are they?',
    topic: 'Measurement Levels',
    difficulty: 'EASY',
    sourcePage: '75-76',
    lessonId: 'm5-l1',
    objective: 'Identify ordinal attributes.',
    explanation:
      'Ordinal data captures ordered rank positions where intervals between steps are not mathematically uniform.',
    options: [
      { text: 'Nominal Level' },
      { text: 'Ordinal Level', correct: true },
      { text: 'Ratio Level' },
      { text: 'Binary Pixel Level' },
    ],
  },
  {
    slug: 'interval-vs-ratio',
    type: 'SINGLE_MCQ',
    title: 'True Zero Distinction in Ratio Data',
    prompt:
      'Why is weight in kilograms classified as Ratio data whereas temperature in °C is Interval data?',
    topic: 'Measurement Levels',
    difficulty: 'MEDIUM',
    sourcePage: '76',
    lessonId: 'm5-l1',
    objective: 'Differentiate Interval and Ratio scales via true zero.',
    explanation:
      'Ratio scales possess an absolute true zero (0 kg = complete absence of mass, making 20 kg twice 10 kg), unlike arbitrary 0°C.',
    options: [
      { text: 'Weight can be negative whereas Celsius cannot' },
      {
        text: 'Ratio scales have a true meaningful zero allowing proportional ratios; 0°C is arbitrary',
        correct: true,
      },
      { text: 'Interval data can only hold strings' },
      { text: 'Ordinal data has a true zero instead' },
    ],
  },
  {
    slug: 'mean-outlier',
    type: 'SINGLE_MCQ',
    title: 'Sensitivity of Mean to Outliers',
    prompt:
      'Given daily step counts `[5000, 5200, 5100, 5300, 50000]`, which summary best reflects a typical day despite the extreme value?',
    topic: 'Central Tendency',
    difficulty: 'EASY',
    sourcePage: '78-81',
    lessonId: 'm5-l1',
    objective: 'Choose Median over Mean under skewness/outliers.',
    explanation:
      'Sorted values are `[5000, 5100, 5200, 5300, 50000]`. Median (`5200`) resists the outlier `50000`, whereas Mean (`14120`) is dragged far upward.',
    options: [
      { text: 'Mean (14,120)' },
      { text: 'Median (5,200)', correct: true },
      { text: 'Range (45,000)' },
      { text: 'Maximum (50,000)' },
    ],
  },
  {
    slug: 'mode-calc',
    type: 'SINGLE_MCQ',
    title: 'Finding Mode of a Sample',
    prompt: 'What is the Mode of the dataset `[4, 7, 2, 7, 9, 4, 7, 5]`?',
    topic: 'Central Tendency',
    difficulty: 'EASY',
    sourcePage: '80-81',
    lessonId: 'm5-l1',
    objective: 'Compute Mode.',
    explanation: 'The value `7` appears 3 times—more often than any other value.',
    options: [{ text: '4' }, { text: '5.625' }, { text: '7', correct: true }, { text: '9' }],
  },
  {
    slug: 'median-even-count',
    type: 'SINGLE_MCQ',
    title: 'Computing Median with Even Sample Size',
    prompt: 'What is the Median of the values `[12, 4, 18, 8]`?',
    topic: 'Central Tendency',
    difficulty: 'MEDIUM',
    sourcePage: '79',
    lessonId: 'm5-l1',
    objective: 'Sort first and average two middle elements.',
    explanation:
      'Sorting yields `[4, 8, 12, 18]`. The middle pair `(8, 12)` averages to `(8 + 12) / 2 = 10`.',
    options: [{ text: '8' }, { text: '10', correct: true }, { text: '11' }, { text: '12' }],
  },
  {
    slug: 'std-dev-meaning',
    type: 'SINGLE_MCQ',
    title: 'Interpreting Standard Deviation',
    prompt:
      'Two classes both average `75` on a test. Class A has Standard Deviation `3`, while Class B has Standard Deviation `16`. What does this tell us?',
    topic: 'Variance & Spread',
    difficulty: 'MEDIUM',
    sourcePage: '82-84',
    lessonId: 'm5-l1',
    objective: 'Interpret low vs high standard deviation.',
    explanation:
      'Lower standard deviation indicates marks cluster tightly around the mean `75`; higher standard deviation indicates wider score spread.',
    options: [
      { text: 'Class A has scores clustered much closer to 75 than Class B', correct: true },
      { text: 'Class B scored higher on average' },
      { text: 'Class A had 3 students total' },
      { text: 'Standard deviation equals median' },
    ],
  },
  {
    slug: 'variance-unit',
    type: 'SINGLE_MCQ',
    title: 'Variance vs Standard Deviation Relation',
    prompt: 'If a dataset’s Variance is `25`, what is its Standard Deviation?',
    topic: 'Variance & Spread',
    difficulty: 'EASY',
    sourcePage: '82-84',
    lessonId: 'm5-l1',
    objective: 'Compute Standard Deviation as sqrt(Variance).',
    explanation: 'Standard deviation is the square root of variance (`sqrt(25) = 5`).',
    options: [{ text: '5', correct: true }, { text: '12.5' }, { text: '50' }, { text: '625' }],
  },
  {
    slug: 'scatter-plot-func',
    type: 'SINGLE_MCQ',
    title: 'Plotting Bivariate Scatter Diagrams',
    prompt:
      'Which Matplotlib function creates a scatter plot checking whether two numeric variables move together?',
    topic: 'Data Visualization',
    difficulty: 'EASY',
    sourcePage: '91',
    lessonId: 'm5-l2',
    objective: 'Use scatter() appropriately.',
    explanation: 'As shown on p.91, `plt.scatter(x, y)` plots paired quantitative observations.',
    options: [
      { text: 'plt.pie()' },
      { text: 'plt.scatter()', correct: true },
      { text: 'plt.hist()' },
      { text: 'plt.matrix()' },
    ],
  },
  {
    slug: 'histogram-vs-bar',
    type: 'SINGLE_MCQ',
    title: 'Histogram vs Categorical Bar Chart',
    prompt:
      'When inspecting how test scores from 0 to 100 distribute across continuous 10-point score bins, which plot is most appropriate?',
    topic: 'Data Visualization',
    difficulty: 'MEDIUM',
    sourcePage: '88-90',
    lessonId: 'm5-l2',
    objective: 'Distinguish histograms from categorical bar charts.',
    explanation:
      'Histograms group continuous numerical measurements into contiguous frequency bins.',
    options: [
      { text: 'Histogram', correct: true },
      { text: 'Pie Chart with 40 slices' },
      { text: 'Text-only table' },
      { text: 'Nominal map' },
    ],
  },
  {
    slug: 'pie-chart-use',
    type: 'SINGLE_MCQ',
    title: 'Best Use Case for a Pie Chart',
    prompt: 'When is a Pie Chart an appropriate visualization choice?',
    topic: 'Data Visualization',
    difficulty: 'EASY',
    sourcePage: '92',
    lessonId: 'm5-l2',
    objective: 'Apply chart selection guidelines.',
    explanation:
      'Pie charts work best for showing relative percentage parts of a whole across a small set of mutually exclusive categories.',
    options: [
      {
        text: 'Showing percentage breakdown across 3–5 discrete parts summing to 100%',
        correct: true,
      },
      { text: 'Comparing continuous monthly temperatures over 120 years' },
      { text: 'Plotting correlation between height and mass across 500 points' },
      { text: 'Displaying 80 overlapping time series' },
    ],
  },
  {
    slug: 'matrix-ai-images',
    type: 'SINGLE_MCQ',
    title: 'Matrices Representing Images in AI',
    prompt:
      'How are grayscale digital images naturally stored so AI models can compute over pixels?',
    topic: 'Matrices in AI',
    difficulty: 'EASY',
    sourcePage: '94-95',
    lessonId: 'm5-l2',
    objective: 'Understand matrix representation of image grids.',
    explanation:
      'A grayscale image corresponds to a 2-D matrix where each entry stores numeric pixel intensity.',
    options: [
      { text: 'As two-dimensional numerical matrices of pixel intensities', correct: true },
      { text: 'As unsorted MP3 waveforms' },
      { text: 'As comma-free paragraphs of English prose' },
      { text: 'As physical rulers' },
    ],
  },
  {
    slug: 'normalization-purpose',
    type: 'SINGLE_MCQ',
    title: 'Goal of Data Normalization',
    prompt:
      'Why is Data Normalization applied during preprocessing when combining features such as `AnnualIncome (10000..900000)` and `Age (15..65)`?',
    topic: 'Data Preprocessing',
    difficulty: 'MEDIUM',
    sourcePage: '96',
    lessonId: 'm5-l2',
    objective: 'Explain feature scaling benefits.',
    explanation:
      'Normalization scales numeric columns onto comparable ranges (like `[0, 1]`) so large-magnitude columns do not overpower smaller-magnitude columns.',
    options: [
      { text: 'To delete the Age column permanently' },
      {
        text: 'To scale different measurement ranges comparably so huge units do not dominate learning',
        correct: true,
      },
      { text: 'To turn numbers back into raw text' },
      { text: 'To introduce deliberate typos into labels' },
    ],
  },
  {
    slug: 'data-integration-def',
    type: 'SINGLE_MCQ',
    title: 'Data Integration in Preprocessing',
    prompt:
      'Combining attendance spreadsheets from three school campuses—resolving mismatched column headers (`ID` vs `StudentCode`) and mixed date formats—describes:',
    topic: 'Data Preprocessing',
    difficulty: 'MEDIUM',
    sourcePage: '96',
    lessonId: 'm5-l2',
    objective: 'Define data integration.',
    explanation:
      'Data integration merges records from multiple sources into a consistent, unified representation.',
    options: [
      { text: 'Data Integration', correct: true },
      { text: 'Reinforcement Rewarding' },
      { text: 'Scatter Plotting' },
      { text: 'Pragmatic Parsing' },
    ],
  },
  {
    slug: 'missing-data-zero-trap',
    type: 'SINGLE_MCQ',
    title: 'Risk of Blind Zero Imputation',
    prompt:
      'Why is replacing missing body-temperature values (`NaN`) with `0°C` hazardous before analysis?',
    topic: 'Data Quality',
    difficulty: 'EASY',
    sourcePage: '95-96',
    lessonId: 'm5-l2',
    objective: 'Avoid naive corrupting imputations.',
    explanation:
      'Inserting impossible `0°C` values fabricates extreme outliers that pull down the mean and distort downstream models.',
    options: [
      {
        text: 'It turns missingness into impossible physical readings that corrupt averages and predictions',
        correct: true,
      },
      { text: 'Zero is forbidden inside NumPy arrays' },
      { text: 'Scatter plots automatically delete rows equal to 37' },
      { text: 'Variance decreases to zero whenever 0 is added' },
    ],
  },
  {
    slug: 'sample-representativeness',
    type: 'SINGLE_MCQ',
    title: 'Population vs Biased Sample',
    prompt:
      'Surveying only members of the after-school coding club to measure average computer confidence across the entire school introduces:',
    topic: 'Sampling & Bias',
    difficulty: 'EASY',
    sourcePage: '73-74',
    lessonId: 'm5-l1',
    objective: 'Spot unrepresentative convenience sampling.',
    explanation:
      'Coding club volunteers systematically hold higher tech confidence than the full student population—producing sampling bias.',
    options: [
      {
        text: 'Sampling bias where the sample fails to represent the full population',
        correct: true,
      },
      { text: 'True ratio precision' },
      { text: 'Zero variance' },
      { text: 'Exact census completeness' },
    ],
  },
  {
    slug: 'qty-vs-quality',
    type: 'SINGLE_MCQ',
    title: 'Data Quantity vs Quality in ML',
    prompt: 'Which statement holds true regarding dataset size and quality for machine learning?',
    topic: 'Data Quality',
    difficulty: 'MEDIUM',
    sourcePage: '97',
    lessonId: 'm5-l2',
    objective: 'Balance volume against cleanliness and representativeness.',
    explanation:
      'While sufficient examples help learning, huge volumes of corrupted, biased or irrelevant records still yield unreliable models.',
    options: [
      {
        text: 'Both representative quantity and accurate, clean data quality matter; noisy volume alone misleads models',
        correct: true,
      },
      { text: 'Ten billion corrupted random strings always produce perfect models' },
      { text: 'More data automatically fixes wrong labels' },
      { text: 'Datasets never require documentation once rows exceed 1,000' },
    ],
  },
  {
    slug: 'matrix-dimensions',
    type: 'SINGLE_MCQ',
    title: 'Tabular Dataset Shape as Matrix',
    prompt:
      'A dataset with `120` student rows and `5` feature columns is naturally represented by a matrix of dimensions:',
    topic: 'Matrices in AI',
    difficulty: 'EASY',
    sourcePage: '93-95',
    lessonId: 'm5-l2',
    objective: 'Identify matrix row x column shape.',
    explanation: 'Matrices are indexed `rows x columns`, giving shape `120 x 5`.',
    options: [
      { text: '5 x 120' },
      { text: '120 x 5', correct: true },
      { text: '125 x 1' },
      { text: '24 x 24' },
    ],
  },
  {
    slug: 'misleading-axis-chart',
    type: 'SINGLE_MCQ',
    title: 'Detecting Misleading Visualizations',
    prompt:
      'How can starting a vertical bar chart’s y-axis at `97%` instead of `0%` mislead readers comparing scores `98%` vs `99%`?',
    topic: 'Data Visualization',
    difficulty: 'MEDIUM',
    sourcePage: '86-90',
    lessonId: 'm5-l2',
    objective: 'Evaluate visual honesty in charts.',
    explanation:
      'Truncating the bar axis visually exaggerates a tiny 1% difference into looking double or triple in height.',
    options: [
      {
        text: 'It exaggerates small relative differences visually by distorting baseline bar proportions',
        correct: true,
      },
      { text: 'It converts the bar chart into a matrix automatically' },
      { text: 'It forces Mean to equal Mode' },
      { text: 'It increases population sample size' },
    ],
  },

  // 5 MULTI_SELECT
  {
    slug: 'measurement-levels-multi',
    type: 'MULTI_SELECT',
    title: 'Four Classical Levels of Measurement',
    prompt: 'Select ALL four levels of data measurement presented in Unit 5.',
    topic: 'Measurement Levels',
    difficulty: 'EASY',
    sourcePage: '75-76',
    lessonId: 'm5-l1',
    objective: 'Identify Nominal, Ordinal, Interval, Ratio.',
    explanation: 'Nominal, Ordinal, Interval and Ratio are the four measurement scales.',
    options: [
      { text: 'Nominal', correct: true },
      { text: 'Ordinal', correct: true },
      { text: 'Interval', correct: true },
      { text: 'Ratio', correct: true },
      { text: 'Hexadecimal' },
    ],
  },
  {
    slug: 'preprocessing-steps-multi',
    type: 'MULTI_SELECT',
    title: 'Key Data Preprocessing Tasks',
    prompt: 'Select ALL operations performed during Data Preprocessing.',
    topic: 'Data Preprocessing',
    difficulty: 'EASY',
    sourcePage: '95-96',
    lessonId: 'm5-l2',
    objective: 'Identify cleaning, deduplication, integration, normalization.',
    explanation:
      'Handling missing values, removing duplicates, integrating sources and normalizing feature scales are core preprocessing tasks.',
    options: [
      { text: 'Handling missing or null records appropriately', correct: true },
      { text: 'Data integration across disparate sources/formats', correct: true },
      { text: 'Feature normalization / scaling', correct: true },
      { text: 'Training the final model on test labels directly' },
    ],
  },
  {
    slug: 'chart-types-multi',
    type: 'MULTI_SELECT',
    title: 'Standard Matplotlib Chart Types in Unit 5',
    prompt:
      'Which visualization functions belong to basic Matplotlib exploratory charts covered in Unit 5?',
    topic: 'Data Visualization',
    difficulty: 'EASY',
    sourcePage: '85-92',
    lessonId: 'm5-l2',
    objective: 'Recognize Matplotlib plot families.',
    explanation:
      'Line (`plot`), Bar (`bar`), Histogram (`hist`), Scatter (`scatter`) and Pie (`pie`) are the five core charts.',
    options: [
      { text: 'Scatter plot (`scatter()`)', correct: true },
      { text: 'Histogram (`hist()`)', correct: true },
      { text: 'Bar chart (`bar()`)', correct: true },
      { text: 'Pie chart (`pie()`)', correct: true },
    ],
  },
  {
    slug: 'privacy-consent-multi',
    type: 'MULTI_SELECT',
    title: 'Ethical Collection of Student Survey Data',
    prompt: 'Select ALL sound practices when designing a primary data survey in school.',
    topic: 'Data Collection Ethics',
    difficulty: 'MEDIUM',
    sourcePage: '73-74',
    lessonId: 'm5-l1',
    objective: 'Incorporate consent and data minimization.',
    explanation:
      'Collect only relevant variables, explain usage honestly (consent notice), protect identities and audit who might be excluded.',
    options: [
      { text: 'Include a clear consent notice stating how responses will be used', correct: true },
      { text: 'Collect only minimum attributes needed (data minimization)', correct: true },
      { text: 'Check which student subgroups might be underrepresented', correct: true },
      { text: 'Publish full home addresses alongside private survey scores' },
    ],
  },
  {
    slug: 'matrix-ai-uses',
    type: 'MULTI_SELECT',
    title: 'Applications of Matrices in AI',
    prompt: 'Where do matrices serve foundational roles inside AI pipelines?',
    topic: 'Matrices in AI',
    difficulty: 'MEDIUM',
    sourcePage: '93-95',
    lessonId: 'm5-l2',
    objective: 'Recognize multi-use numerical matrices.',
    explanation:
      'Matrices encode feature tables, neural network weights and digital image pixels cleanly.',
    options: [
      { text: 'Representing rows x feature columns in datasets', correct: true },
      { text: 'Storing pixel intensity grids of images', correct: true },
      { text: 'Holding numeric weights multiplied across neural network layers', correct: true },
      { text: 'Preventing CSV files from opening in text editors' },
    ],
  },

  // 5 TRUE_FALSE
  {
    slug: 'tf-secondary-definition',
    type: 'TRUE_FALSE',
    title: 'Secondary Data Collection Context',
    prompt:
      'True or False: Secondary data was originally gathered earlier for another study or operational purpose, so analysts should inspect how and when it was collected.',
    topic: 'Data Sources',
    difficulty: 'EASY',
    sourcePage: '73',
    lessonId: 'm5-l1',
    objective: 'Audit secondary source provenance.',
    explanation: 'True. Reused datasets reflect past definitions, errors and coverage choices.',
    correctBoolean: true,
  },
  {
    slug: 'tf-mean-categorical',
    type: 'TRUE_FALSE',
    title: 'Arithmetic Mean on Nominal Codes',
    prompt:
      'True or False: Computing the arithmetic Mean of telephone area codes or jersey numbers is mathematically meaningful.',
    topic: 'Measurement Levels',
    difficulty: 'EASY',
    sourcePage: '75',
    lessonId: 'm5-l1',
    objective: 'Match valid summary stats to variable scale.',
    explanation:
      'False. Area codes and jersey IDs are nominal identifiers; Mode (most common) makes sense, whereas averaging IDs is meaningless.',
    correctBoolean: false,
  },
  {
    slug: 'tf-stddev-zero',
    type: 'TRUE_FALSE',
    title: 'Standard Deviation When All Values Equal',
    prompt:
      'True or False: If every single measurement in a dataset equals `10`, both Variance and Standard Deviation equal `0`.',
    topic: 'Variance & Spread',
    difficulty: 'MEDIUM',
    sourcePage: '82-84',
    lessonId: 'm5-l1',
    objective: 'Reason about zero spread.',
    explanation:
      'True. Deviations from mean `10` are all `0`, so variance and standard deviation equal `0`.',
    correctBoolean: true,
  },
  {
    slug: 'tf-corr-proves-cause',
    type: 'TRUE_FALSE',
    title: 'Association vs Causation in Data Literacy',
    prompt:
      'True or False: Seeing a strong visual relationship on a scatter plot automatically proves that variable X directly causes variable Y.',
    topic: 'Interpretation',
    difficulty: 'EASY',
    sourcePage: '91',
    lessonId: 'm5-l2',
    objective: 'Avoid causal overstatement.',
    explanation:
      'False. Observed correlation can stem from confounding factors or coincidence; causality requires controlled evidence.',
    correctBoolean: false,
  },
  {
    slug: 'tf-matrix-add-shape',
    type: 'TRUE_FALSE',
    title: 'Matrix Addition Dimension Compatibility',
    prompt:
      'True or False: Two matrices can only be added element-by-element if they have the same number of rows and columns.',
    topic: 'Matrices in AI',
    difficulty: 'EASY',
    sourcePage: '94',
    lessonId: 'm5-l2',
    objective: 'Recall matrix dimension rules.',
    explanation: 'True. Matrix addition requires identical dimensions `m x n`.',
    correctBoolean: true,
  },

  // 5 FILL_BLANK
  {
    slug: 'fb-median-sorted',
    type: 'FILL_BLANK',
    title: 'Middle Value Summary Statistic',
    prompt:
      'When numerical observations are arranged in ascending order, the exact middle value (least distorted by extreme outliers) is the ______.',
    topic: 'Central Tendency',
    difficulty: 'EASY',
    sourcePage: '79',
    lessonId: 'm5-l1',
    objective: 'Recall Median.',
    explanation: 'Median sits at the 50th percentile of ordered values.',
    acceptedAnswers: ['median'],
  },
  {
    slug: 'fb-primary-source',
    type: 'FILL_BLANK',
    title: 'Firsthand Collected Dataset',
    prompt:
      'Data collected firsthand specifically for the investigator’s current study—such as interviews or custom lab measurements—is called ______ data.',
    topic: 'Data Sources',
    difficulty: 'EASY',
    sourcePage: '73',
    lessonId: 'm5-l1',
    objective: 'Recall Primary data.',
    explanation: 'Primary data originates directly from the researcher’s new collection.',
    acceptedAnswers: ['primary'],
  },
  {
    slug: 'fb-nominal-lowest',
    type: 'FILL_BLANK',
    title: 'Categorical Unordered Scale',
    prompt:
      'Categories with labels only and no numeric ranking (such as hair colour or blood group names) belong to the ______ level of measurement.',
    topic: 'Measurement Levels',
    difficulty: 'EASY',
    sourcePage: '75',
    lessonId: 'm5-l1',
    objective: 'Name Nominal scale.',
    explanation: 'Nominal is unordered categorical measurement.',
    acceptedAnswers: ['nominal'],
  },
  {
    slug: 'fb-normalization-term',
    type: 'FILL_BLANK',
    title: 'Scaling Features to Common Range',
    prompt:
      'Rescaling numeric attributes of wildly different units onto a uniform range (such as `0` to `1`) during preprocessing is known as data ______.',
    topic: 'Data Preprocessing',
    difficulty: 'EASY',
    sourcePage: '96',
    lessonId: 'm5-l2',
    objective: 'Recall Normalization term.',
    explanation: 'Normalization harmonizes feature magnitudes.',
    acceptedAnswers: ['normalization', 'normalisation'],
  },
  {
    slug: 'fb-variance-sqrt',
    type: 'FILL_BLANK',
    title: 'Square Root of Variance',
    prompt:
      'The positive square root of Variance, measured back in the original units of the data, is called the ______ Deviation.',
    topic: 'Variance & Spread',
    difficulty: 'EASY',
    sourcePage: '83-84',
    lessonId: 'm5-l1',
    objective: 'Recall Standard Deviation.',
    explanation: 'Standard Deviation = sqrt(Variance).',
    acceptedAnswers: ['Standard'],
  },

  // 5 SHORT_ANSWER
  {
    slug: 'sa-mean-median-calc',
    type: 'SHORT_ANSWER',
    title: 'Compute & Compare Mean, Median and Mode',
    prompt:
      'For the scores `[60, 62, 65, 65, 98]`, compute Mean, Median and Mode, and explain which better summarizes typical student performance.',
    topic: 'Central Tendency',
    difficulty: 'EASY',
    sourcePage: '78-81',
    lessonId: 'm5-l1',
    objective: 'Calculate exact descriptive stats and choose fairly.',
    explanation:
      'Mean = 350/5 = 70; Median = 65; Mode = 65. Median/Mode (65) reflect 4 of 5 typical students without distortion from the single 98.',
    expectedPoints: [
      'Mean = (60 + 62 + 65 + 65 + 98) / 5 = 70',
      'Median = 65, Mode = 65',
      'Median (65) represents the central majority more faithfully than Mean (70) pulled upward by 98',
    ],
  },
  {
    slug: 'sa-4-scales-examples',
    type: 'SHORT_ANSWER',
    title: 'Classifying Real Variables by Scale',
    prompt:
      'Classify each variable as Nominal, Ordinal, Interval or Ratio, briefly justifying each choice: (1) Student Club Name, (2) Competition Medal (`Gold/Silver/Bronze`), (3) Year on calendar (`1995, 2026`), (4) Height in cm.',
    topic: 'Measurement Levels',
    difficulty: 'MEDIUM',
    sourcePage: '75-76',
    lessonId: 'm5-l1',
    objective: 'Apply measurement hierarchy accurately.',
    explanation:
      'Club=Nominal (no order); Medal=Ordinal (ranked, spacing unequal); Calendar Year=Interval (arbitrary zero); Height=Ratio (true zero).',
    expectedPoints: [
      '(1) Club Name: Nominal (unordered labels)',
      '(2) Medal: Ordinal (ordered rank)',
      '(3) Calendar Year: Interval (difference meaningful, Year 0 is convention)',
      '(4) Height in cm: Ratio (true zero allows ratios)',
    ],
  },
  {
    slug: 'sa-survey-underrep',
    type: 'SHORT_ANSWER',
    title: 'Spotting Missing Voices in a Digital Survey',
    prompt:
      'A municipality runs an online-only evening form to plan public bus stops. Name two citizen groups likely to be underrepresented and one practical way to improve coverage.',
    topic: 'Sampling & Bias',
    difficulty: 'EASY',
    sourcePage: '73-74',
    lessonId: 'm5-l1',
    objective: 'Diagnose non-response & coverage gaps.',
    explanation:
      'Seniors/lower-income residents without reliable internet or night-shift workers may be absent; pairing paper/stop-side collection fixes coverage.',
    expectedPoints: [
      'Underrepresented groups: residents lacking smartphones/internet, elderly commuters, or shift workers busy in evenings',
      'Mitigation: short daytime paper forms or multilingual community booth outreach at actual bus hubs',
    ],
  },
  {
    slug: 'sa-matrix-shopping',
    type: 'SHORT_ANSWER',
    title: 'Representing Tabular & Item Quantities as Matrices',
    prompt:
      'Suppose Aditi bought 3 pencils and 2 erasers on Monday, and 1 pencil and 4 erasers on Tuesday; Ravi bought 2 pencils and 5 erasers on Monday, and 0 pencils and 3 erasers on Tuesday. Show how Monday and Tuesday purchases form two `2x2` matrices and state what adding them calculates.',
    topic: 'Matrices in AI',
    difficulty: 'MEDIUM',
    sourcePage: '94-95',
    lessonId: 'm5-l2',
    objective: 'Construct and interpret 2D matrices.',
    explanation:
      'Adding `[[3,2],[2,5]] + [[1,4],[0,3]] = [[4,6],[2,8]]` yields total pencils and erasers bought across both days per buyer.',
    expectedPoints: [
      'Constructs compatible `2x2` matrices (rows = buyers Aditi/Ravi, columns = pencils/erasers)',
      'Element-wise sum yields `[[4, 6], [2, 8]]` representing combined two-day totals per buyer',
    ],
  },
  {
    slug: 'sa-cleaning-choices-doc',
    type: 'SHORT_ANSWER',
    title: 'Documenting Preprocessing Decisions',
    prompt:
      'Why must a data analyst document every decision made during cleaning (such as dropping duplicate IDs or capping sensor spikes) before publishing charts or training models?',
    topic: 'Data Preprocessing',
    difficulty: 'MEDIUM',
    sourcePage: '95-96',
    lessonId: 'm5-l2',
    objective: 'Ensure scientific reproducibility and auditability.',
    explanation:
      'Unrecorded edits change averages and hide deleted subgroups; transparent logs allow peer audit and reproducible testing.',
    expectedPoints: [
      'Cleaning steps alter dataset statistics and sample balance substantially',
      'Audit trail ensures reproducibility and prevents hidden removal of inconvenient records',
    ],
  },

  // 2 LONG_CASE
  {
    slug: 'lc-messy-health-csv',
    type: 'LONG_CASE',
    title: 'Case Study: End-to-End Cleaning of a Messy School Wellness Dataset',
    prompt:
      'Your team obtains a merged nutrition & fitness CSV (`height` mixed in `cm` and `m`, 15 blank `sleep_hours`, 4 duplicate student IDs, one impossible `sleep_hours = 99`, and `favourite_sport` text with inconsistent capitalization like `"chess"`, `"Chess "`). Design a complete Data Literacy pipeline detailing: (1) exact checks & Measurement Level for each field, (2) four prioritized preprocessing fixes (and why blank `sleep_hours` should NOT become `0`), (3) which two charts clearly visualize sleep vs fitness, and (4) why observed sleep-score association still needs caution.',
    topic: 'Data Literacy Lifecycle Case Study',
    difficulty: 'HARD',
    sourcePage: '74-96',
    lessonId: 'm5-l2',
    objective: 'Combine scale classification, cleaning, charting and causal humility.',
    explanation:
      'Standardizes m->cm, trims/lowercases categorical strings, deduplicates IDs, treats 99h sleep as invalid/missing rather than blind average, avoids zero imputation, uses histogram + scatter plot, warns against confounding variables.',
    expectedPoints: [
      'Measurement levels: Ratio (`height`, `sleep_hours`), Nominal (`favourite_sport`, `student_id`)',
      'Standardizes height units, normalizes/trims text categories, removes exact duplicate IDs, flags 99h error & preserves missingness safely',
      'Histogram of `sleep_hours` + scatter plot comparing clean sleep vs fitness scores',
      'Notes correlation does not prove causation (confounders like commute time or stress)',
    ],
  },
  {
    slug: 'lc-misleading-report-audit',
    type: 'LONG_CASE',
    title: 'Case Study: Auditing a Suspect Promotional Statistics Report',
    prompt:
      'An ed-tech brochure claims: "Our app doubled student performance! Average user test scores are 92, and a graph shows our bar three times taller than traditional schools!" When you inspect their footnote, you learn: (a) they surveyed only 30 voluntary competition winners, (b) the comparison bar chart starts its y-axis at 85 instead of 0, comparing 92% vs 87%, and (c) only 1 student scored 100 while the median was undisclosed. Write a thorough Data Literacy critique covering sampling, central tendency, visualization distortion and secondary source verification.',
    topic: 'Critical Data Interpretation',
    difficulty: 'HARD',
    sourcePage: '73-91',
    lessonId: 'm5-l1',
    objective: 'Expose statistical distortion across collection, summary and charts.',
    explanation:
      'Diagnoses volunteer selection bias, non-zero baseline y-axis visual exaggeration (92 vs 87 is only +5pp, not 3x), outlier sensitivity vs missing median/spread, and lack of baseline pretest control.',
    expectedPoints: [
      'Diagnoses non-representative volunteer/survivorship sample bias',
      'Exposes truncated y-axis (`85%` base) exaggerating a 5-point difference into appearing 3x taller',
      'Requests Median, Standard Deviation, sample size and randomized/matched comparison group before accepting claims',
    ],
  },

  // 2 PRACTICAL
  {
    slug: 'pr-compute-stats-set',
    type: 'PRACTICAL',
    title: 'Practical: Manual Calculation of Mean, Median, Mode, Variance & Std Dev',
    prompt:
      'Compute all five statistics cleanly step-by-step for the sample `X = [2, 4, 4, 4, 5, 5, 7, 9]` (`n = 8`): Mean, Median, Mode, Population Variance (dividing squared deviations by `n`), and Population Standard Deviation. Show intermediate squared deviations clearly.',
    topic: 'Summary & Spread Practical',
    difficulty: 'MEDIUM',
    sourcePage: '78-84',
    lessonId: 'm5-l1',
    objective: 'Execute full summary and spread calculation accurately.',
    explanation:
      'Sum=40, Mean=5; Median=(4+5)/2=4.5; Mode=4; Deviations=[-3,-1,-1,-1,0,0,2,4], squares=[9,1,1,1,0,0,4,16], sum=32, Variance=32/8=4, StdDev=sqrt(4)=2.',
    expectedPoints: [
      'Mean = 40 / 8 = 5',
      'Median = (4 + 5) / 2 = 4.5; Mode = 4',
      'Squared deviations sum to 9+1+1+1+0+0+4+16 = 32; Population Variance = 32/8 = 4; Population Standard Deviation = 2',
    ],
  },
  {
    slug: 'pr-normalize-minmax-table',
    type: 'PRACTICAL',
    title: 'Practical: Min-Max Feature Normalization Table',
    prompt:
      'Apply Min-Max normalization `x_norm = (x - min) / (max - min)` independently to both columns of this tiny 3-student table:\n- Student A: `StudyHours = 2`, `AttendanceScore = 60`\n- Student B: `StudyHours = 6`, `AttendanceScore = 80`\n- Student C: `StudyHours = 10`, `AttendanceScore = 100`\nShow the normalized `[0, 1]` matrix and briefly explain why unnormalized distance would have been dominated by `AttendanceScore`.',
    topic: 'Preprocessing Practical',
    difficulty: 'MEDIUM',
    sourcePage: '94-96',
    lessonId: 'm5-l2',
    objective: 'Compute normalized `[0, 1]` values and justify scaling.',
    explanation:
      'Min-max maps 2,6,10 -> 0.0, 0.5, 1.0 and 60,80,100 -> 0.0, 0.5, 1.0. Before scaling, AttendanceScore spanned 40 units vs StudyHours spanning 8.',
    expectedPoints: [
      'StudyHours normalized: [0.0, 0.5, 1.0]; AttendanceScore normalized: [0.0, 0.5, 1.0]',
      'Explains scale imbalance before normalization (range 40 vs range 8) would overweight AttendanceScore in distance models',
    ],
  },
]);
