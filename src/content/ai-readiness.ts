export interface SupplementalNote {
  label: string;
  content: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  sourcePages: string;
  estimatedMinutes: number;
  learningOutcomes: string[];
  content: string;
  examples: string[];
  activity: string;
  keyTakeaways: string[];
  supplementalNote?: SupplementalNote | null;
}

export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  sourcePages: string;
  estimatedMinutes: number;
  assessmentId: string;
  introduction: string;
  objectives: string[];
  concepts: string[];
  lessons: CourseLesson[];
  revisionNotes: string[];
  practice: string[];
}

export const aiReadinessCourse: {
  id: string;
  title: string;
  description: string;
  attribution: string;
  sourceTitle: string;
  recommendedHours: number;
  estimatedMinutes: number;
  modules: CourseModule[];
} = {
  id: 'ai-readiness',
  title: 'AI Readiness Course',
  description:
    'A practical 10-hour foundation in artificial intelligence, AI careers, Python programming, capstone design thinking, data literacy, machine learning algorithms, natural language processing and responsible AI ethics.',
  attribution:
    'Adapted as original student-facing explanations from the Central Board of Secondary Education (CBSE), Artificial Intelligence Curriculum Student Handbook (Subject Code 843). Page references cite printed handbook page numbers. Explanations are original paraphrases; supplemental Generative AI / LLM notes are explicitly marked as external enrichment.',
  sourceTitle: 'Artificial Intelligence Curriculum Student Handbook (Subject Code 843)',
  recommendedHours: 10,
  estimatedMinutes: 600,
  modules: [
    {
      id: 'm1-ai-foundations',
      moduleNumber: 1,
      title: 'Introduction to Artificial Intelligence',
      sourcePages: '1-17',
      estimatedMinutes: 65,
      assessmentId: 'asmt-ai-m1',
      introduction:
        'Artificial Intelligence (AI) refers to computer systems designed to learn patterns from data, reason over information, and assist with tasks such as perception, language understanding and prediction. Understanding where AI helps—and where simple automation ends—lets learners use technology critically.',
      objectives: [
        'Distinguish AI systems that learn or adapt from fixed-function hardware, basic sensors and rule-only automation.',
        'Trace key milestones in AI history from the 1950 Turing Test and AI winters to modern data- and compute-driven systems.',
        'Compare the three data domains of AI: Statistical Data, Natural Language Processing (NLP) and Computer Vision.',
        'Differentiate AI, Machine Learning (ML), Deep Learning (DL) and supervised, unsupervised and reinforcement learning.',
        'Evaluate benefits, limitations and human-oversight requirements of real-world AI deployments.',
      ],
      concepts: [
        'Fixed-function vs AI systems',
        'AI evolution & AI winters',
        'Structured vs unstructured data',
        'Statistical data domain',
        'NLP (NLU & NLG)',
        'Computer vision',
        'Machine learning vs Deep learning',
        'Supervised, unsupervised & reinforcement learning',
      ],
      lessons: [
        {
          id: 'm1-l1',
          title: 'What AI Can and Cannot Do: History & Core Domains',
          sourcePages: '1-8',
          estimatedMinutes: 30,
          learningOutcomes: [
            'Explain why mechanical devices, basic sensors and fixed-rule timers differ from AI.',
            'Summarize major phases of AI development including Alan Turing (1950) and periods of AI winter.',
            'Classify everyday digital tools into Statistical Data, Natural Language Processing or Computer Vision.',
          ],
          content:
            'Not every smart-sounding machine is Artificial Intelligence. Fixed-function hardware such as a conventional microwave, a non-interactive electric fan, or a raw temperature sensor executes fixed physical or programmed rules without learning from experience. AI systems analyze input data, extract patterns, and adapt outputs or predictions when new evidence arrives. Historically, Alan Turing framed machine intelligence in 1950; periods of over-optimism followed by limited hardware and data produced "AI winters" in the 1970s–1990s before modern compute and abundant datasets accelerated progress. Across applications, AI commonly operates over three domains described in the handbook: Statistical Data (tabular numeric and categorical analytics like weather or fraud alerts), Natural Language Processing (understanding human speech/text via NLU and generating text via NLG), and Computer Vision (interpreting digital images and video for object detection or facial recognition).',
          examples: [
            'Rule-based fan timer vs a smart thermostat adapting schedules from occupancy history.',
            'Email spam filters and translation tools (NLP) vs agricultural crop health imaging from drones (Computer Vision).',
            'Credit transaction anomaly scoring over customer transaction tables (Statistical Data).',
          ],
          activity:
            'List five devices or apps you used this week. For each, note its input data, output decision, whether it learns from data or follows fixed rules, its primary AI domain (if any), and one mistake a human reviewer should catch.',
          keyTakeaways: [
            'Fixed-function hardware and raw sensors execute instructions without learning patterns.',
            'AI applications cluster around Statistical Data, NLP (NLU/NLG) and Computer Vision.',
            'Human judgment remains essential when inputs shift or decisions affect people.',
          ],
        },
        {
          id: 'm1-l2',
          title: 'Learning Paradigms, Neural Networks & Real-World Limits',
          sourcePages: '9-17',
          estimatedMinutes: 35,
          learningOutcomes: [
            'Explain the nested relationship among Artificial Intelligence, Machine Learning and Deep Learning.',
            'Differentiate supervised learning, unsupervised learning and reinforcement learning using concrete inputs and outputs.',
            'Articulate key limitations of AI including data quality, bias, job shifts and lack of explainability.',
          ],
          content:
            'Artificial Intelligence is the broad umbrella. Machine Learning (ML) is a subset of AI where algorithms learn parameters from sample data rather than relying exclusively on hand-written if-else rules. Deep Learning (DL) is a specialized subset of ML built on multi-layered Artificial Neural Networks (input, hidden and output layers) capable of learning hierarchical features automatically—reducing manual feature engineering on high-dimensional images, audio or text at the cost of larger datasets and compute. ML systems learn in three primary modes: Supervised Learning maps labelled inputs to target answers (classification or numeric prediction); Unsupervised Learning uncovers hidden structure or clusters in unlabelled data; Reinforcement Learning trains an agent through actions, environment state transitions and reward/penalty feedback. Regardless of architecture, AI systems inherit bias from skewed training data, remain opaque unless inspected carefully, and depend on clean, representative datasets.',
          examples: [
            'Sorting electronic e-waste items using labelled photos (Supervised ML/DL classification).',
            'Grouping online shoppers by browsing behaviour without pre-assigned segments (Unsupervised learning).',
            'Game-playing or robotic navigation agent learning through rewards and penalties (Reinforcement learning).',
          ],
          activity:
            'Classify six sample scenarios (house price estimation, spam detection, news topic discovery, autonomous maze robot, handwritten digit recognition, defect segmentation) by learning paradigm and justify what training evidence each needs.',
          keyTakeaways: [
            'AI > Machine Learning > Deep Learning represent progressively narrower subsets.',
            'Supervised learning uses labelled examples; unsupervised learning finds patterns without labels; reinforcement learning optimizes cumulative reward.',
            'Privacy, explainability, job transitions and training data bias must be managed intentionally.',
          ],
        },
      ],
      revisionNotes: [
        'AI adapts from data/patterns; pure rule-based automation or sensors do not learn.',
        'Statistical Data, NLP (NLU + NLG) and Computer Vision are the three core handbook AI domains.',
        'ML learns from examples; DL adds multi-layer Artificial Neural Networks for automatic feature extraction.',
        'Supervised = labelled data; Unsupervised = unlabelled pattern discovery; Reinforcement = environment rewards.',
      ],
      practice: [
        'Give two reasons why a thermostat with a fixed cutoff is automation rather than AI.',
        'Compare NLU and NLG with one classroom example of each.',
        'Explain why Deep Learning reduces manual feature selection on image sorting.',
      ],
    },
    {
      id: 'm2-ai-careers',
      moduleNumber: 2,
      title: 'Careers and Opportunities in AI',
      sourcePages: '18-27',
      estimatedMinutes: 50,
      assessmentId: 'asmt-ai-m2',
      introduction:
        'AI solutions are built by multidisciplinary teams rather than lone programmers. Understanding global demand, specialized job roles, foundational toolkits and cross-industry use cases empowers students to connect computer science skills with healthcare, finance, agriculture, robotics and governance.',
      objectives: [
        'Describe key responsibilities across AI career roles including ML Engineer, Data Scientist, BI Developer, NLP Engineer and CV Engineer.',
        'Identify the technical toolkit (Python, SQL, statistics, ML frameworks) and human skills (communication, teamwork, ethics) needed in AI careers.',
        'Analyze how industries such as healthcare, agriculture, automobile/robotics, textile and retail apply AI.',
        'Evaluate credible community and learning platforms and draft a realistic beginner learning roadmap.',
      ],
      concepts: [
        'Global demand for AI talent',
        'Machine Learning Engineer vs Data Scientist',
        'BI Developer & Data Analyst',
        'NLP & Computer Vision Specialists',
        'Robotics & Domain Specialists',
        'Technical toolkit & soft skills',
        'Cross-industry AI applications',
        'Continuous learning resources',
      ],
      lessons: [
        {
          id: 'm2-l1',
          title: 'Roles in an AI Team & Essential Toolkit',
          sourcePages: '18-22',
          estimatedMinutes: 25,
          learningOutcomes: [
            'Distinguish responsibilities of Data Scientists, Machine Learning Engineers, BI Developers and Robotics/NLP Engineers.',
            'List core programming, mathematical and collaborative tools used in AI workflows.',
          ],
          content:
            'Real-world AI systems combine multiple specialties highlighted in the handbook. Data Scientists explore large datasets using statistics, SQL, Python and predictive modelling to uncover actionable insights. Machine Learning Engineers bridge data science and production software engineering, packaging scalable models into reliable pipelines. Business Intelligence (BI) Developers structure warehouse datasets and dashboards to track trends. Specialized engineers focus on Natural Language Processing (chatbots, document parsing), Computer Vision (medical imaging, quality inspection) or Robotics (autonomous navigation). Equally essential is a professional toolkit combining programming languages (Python, SQL, R/Java), data visualization, linear algebra/probability fundamentals, software engineering hygiene, clear communication and ethical judgment.',
          examples: [
            'Splitting an AI hospital triage project across a Clinical Domain Expert, Data Scientist, ML Engineer and Ethics/Security Reviewer.',
            'Choosing BI dashboards vs predictive ML models depending on whether leadership needs historical metrics or risk forecasts.',
          ],
          activity:
            'Select a local problem (school transit scheduling or library catalog search) and assign responsibilities across four AI team roles, specifying what artifact each role delivers and whom they must consult.',
          keyTakeaways: [
            'Data Scientists focus on analysis and insight discovery; ML Engineers focus on scalable production deployment.',
            'Strong communication and domain understanding are as critical as coding fluency.',
          ],
        },
        {
          id: 'm2-l2',
          title: 'Industry Opportunities & Building a Learning Plan',
          sourcePages: '23-27',
          estimatedMinutes: 25,
          learningOutcomes: [
            'Identify concrete AI roles across Healthcare, Agriculture, Automotive, Finance and Textile industries.',
            'Assess credible resources (e.g. documentation, Kaggle/KDnuggets, university/open courses) and create a starter skill roadmap.',
          ],
          content:
            'AI adoption extends well beyond software firms. In Healthcare, Medical Imaging Analysts and diagnostic assistants review scans and drug discovery candidates. In Agriculture, Precision Farming Specialists combine drone imagery and soil sensor trends for irrigation and pest alerts. In Automotive and Manufacturing, Robotics and Autonomous Systems Engineers work alongside quality-inspection specialists; Textile and Retail teams apply vision for fabric defect checks and demand forecasting. To enter these pathways responsibly, learners build foundational Python and data skills, inspect public benchmark datasets, read reputable publications and community tutorials, and document small verifiable projects rather than memorizing buzzwords.',
          examples: [
            'Drone-based crop mapping in Agriculture vs vision-guided fabric defect detection in Textiles.',
            'Comparing two job listings in Finance vs Healthcare to spot shared Python/SQL requirements and domain compliance differences.',
          ],
          activity:
            'Draft a 6-month personal AI readiness plan naming one target industry, two core technical skills, one ethical competence, and one beginner portfolio project you could validate safely.',
          keyTakeaways: [
            'Industry AI roles pair computing methods with sector-specific domain safety and regulations.',
            'Hands-on data projects and critical source verification build lasting readiness.',
          ],
        },
      ],
      revisionNotes: [
        'Data Scientist (insights & modelling) != ML Engineer (scalable production pipelines) != BI Developer (reporting & warehousing).',
        'Healthcare, Agriculture, Automotive, Textile and Finance rely on tailored AI workflows.',
        'Technical literacy must pair with teamwork, curiosity and ethical scrutiny.',
      ],
      practice: [
        'Explain why a healthcare AI team needs medical domain experts alongside ML engineers.',
        'Distinguish a BI Developer from an NLP Engineer using one concrete deliverable each.',
        'Name two industries besides IT using Computer Vision and state the problem solved.',
      ],
    },
    {
      id: 'm3-python',
      moduleNumber: 3,
      title: 'Python Programming',
      sourcePages: '28-54',
      estimatedMinutes: 100,
      assessmentId: 'asmt-ai-m3',
      introduction:
        'Python is the primary high-level language used across AI education and research due to its readable syntax and scientific ecosystem. This module spans foundational language tokens and control flow up through CSV processing, NumPy numerical arrays, Pandas DataFrames and introductory Scikit-learn workflows.',
      objectives: [
        'Apply Python variables, identifiers, literals, data types (int, float, str, bool) and core operators.',
        'Construct branching decisions (if/elif/else) and loops (for, while, break, continue) alongside Lists, Tuples and Dictionaries.',
        'Read and inspect structured records using Python CSV handling.',
        'Use NumPy arrays, Pandas Series/DataFrames (including isnull() missing-value checks) and Scikit-learn train/test classification workflows.',
      ],
      concepts: [
        'Tokens, identifiers & comments (#)',
        'Primitive types & casting',
        'Lists, Tuples & Dictionaries',
        'Conditionals & Loops (break/continue)',
        'csv module & delimited data',
        'NumPy arrays & math ops',
        'Pandas Series, DataFrame & isnull()',
        'Scikit-learn KNeighborsClassifier & train/test split',
      ],
      lessons: [
        {
          id: 'm3-l1',
          title: 'Python Fundamentals, Data Structures & Control Flow',
          sourcePages: '28-37',
          estimatedMinutes: 45,
          learningOutcomes: [
            'Follow Python naming rules for identifiers, string/numeric/boolean literals and # comments.',
            'Choose appropriately among mutable Lists ([]), immutable Tuples (()), and key-value Dictionaries ({}).',
            'Trace conditional statements and loops using break, continue and boundary inputs.',
          ],
          content:
            'Released by Guido van Rossum in 1991, Python organizes programs using clean indentation and expressive tokens. Identifiers start with a letter or underscore (never a digit or special character like `#`), and comments begin with `#`. Core literals cover strings, integers, floats and booleans, inspectable via `type()` and converted via `int()`, `float()` and `str()`. Python supplies ordered mutable Lists (`[10, 20, 30]`), ordered immutable Tuples (`(10, 20)`), and unordered key-value Dictionaries (`{"name": "Asha", "score": 92}`). Control flow directs execution through `if`/`elif`/`else` branching and iteration via `for` (definite sequences/ranges) or `while` (condition-driven loops), with `break` exiting early and `continue` skipping to the next cycle. Reliable programs test ordinary, boundary and invalid inputs carefully.',
          examples: [
            '`marks = [78, 85, 91]`; summing positive values and halting loop iteration on a sentinel `-1` using `break`.',
            'Why `1score` is an invalid variable name while `_score` is valid.',
          ],
          activity:
            'Trace a short Python script that reads daily attendance numbers into a list, ignores negative anomalies using `continue`, stops if `-999` appears, and reports the class average.',
          keyTakeaways: [
            'Lists are mutable (`[]`); tuples are immutable (`()`); dictionaries store `key: value` pairs (`{}`).',
            'Always convert `input()` strings with `int()` or `float()` before arithmetic.',
          ],
        },
        {
          id: 'm3-l2',
          title: 'CSV Files, NumPy, Pandas & Introductory Scikit-learn',
          sourcePages: '38-54',
          estimatedMinutes: 55,
          learningOutcomes: [
            'Load tabular records safely using Python csv reader or Pandas read_csv().',
            'Perform fast array calculations with NumPy and inspect DataFrame missing values with isnull().',
            'Outline a clean Scikit-learn workflow splitting data before fitting KNeighborsClassifier.',
          ],
          content:
            'AI datasets frequently arrive as Comma-Separated Values (CSV) text files. Python’s built-in `csv` module parses rows cleanly while reminding developers that CSV fields begin as text until cast numerically. For numerical computing, NumPy (`import numpy as np`) introduces fixed-type homogeneous arrays (`ndarray`) supporting vectorized math far faster than pure Python loops. For structured data tables, Pandas (`import pandas as pd`) provides 1-D `Series` and 2-D `DataFrame` objects: teams inspect top rows with `.head()`, filter conditions, compute column statistics, and audit incomplete records using `.isnull().sum()`. Finally, Scikit-learn (`sklearn`) standardizes machine learning with consistent `.fit()` and `.predict()` estimators—such as `KNeighborsClassifier(n_neighbors=3)` trained strictly on `X_train, y_train` and evaluated on held-out `X_test, y_test` so the model never peeks at evaluation labels.',
          examples: [
            '`df = pd.read_csv("admission.csv"); df.head(3); df.isnull().sum()` to audit sample records.',
            'Splitting features `X` and labels `y` before `knn = KNeighborsClassifier(n_neighbors=3); knn.fit(X_train, y_train)`.',
          ],
          activity:
            'Given a 6-row student CSV containing one blank score cell, trace what `df.isnull()` reports, decide how to handle the missing row before passing arrays to Scikit-learn, and explain why test rows must stay out of `knn.fit()`.',
          keyTakeaways: [
            'NumPy focuses on fast numerical arrays; Pandas excels at labelled tabular DataFrames.',
            'Use `.isnull()` to detect missing values before modelling; isolate training and test splits cleanly.',
          ],
        },
      ],
      revisionNotes: [
        'Comments start with `#`; `type()` checks runtime type; valid identifiers cannot start with digits.',
        '`csv` reads text rows; Pandas provides `Series` & `DataFrame` (`read_csv`, `head`, `isnull`).',
        'NumPy handles multi-dimensional arrays efficiently; Scikit-learn uses `.fit(X_train, y_train)` and `.predict(X_test)`.',
      ],
      practice: [
        'Predict the exact output of a negative list index (`nums[-1]`) vs positive index.',
        'Contrast a Python List and Dictionary in terms of ordering and lookup keys.',
        'Explain in three lines how `X_train` and `X_test` prevent overfitting mirage.',
      ],
    },
    {
      id: 'm4-capstone',
      moduleNumber: 4,
      title: 'Introduction to Capstone Projects',
      sourcePages: '55-70',
      estimatedMinutes: 70,
      assessmentId: 'asmt-ai-m4',
      introduction:
        'An AI Capstone integrates technical concepts to solve a meaningful human problem. Starting with problem framing and Design Thinking rather than pre-chosen algorithms prevents building flashy demos that ignore real user needs.',
      objectives: [
        'Identify whether an AI problem maps to Classification, Regression, Clustering or Anomaly Detection.',
        'Decompose complex real-world problems into manageable sub-problems and root causes.',
        'Apply the five stages of Design Thinking—Empathize, Define, Ideate, Prototype and Test—including Empathy Maps and 5W1H questioning.',
        'Connect AI capstone ideas to UN Sustainable Development Goals (SDGs) and document a clear Project Abstract.',
      ],
      concepts: [
        'AI problem categories (4 questions)',
        'Problem decomposition',
        'Design Thinking (5 stages)',
        'Empathy Map (Says/Thinks/Does/Feels)',
        '5W1H Problem Canvas',
        'UN Sustainable Development Goals (SDGs)',
        'Low-fidelity Prototype & Evaluation',
      ],
      lessons: [
        {
          id: 'm4-l1',
          title: 'Framing AI Problems, Decomposition & Design Thinking',
          sourcePages: '55-62',
          estimatedMinutes: 35,
          learningOutcomes: [
            'Match problem questions ("Which category?", "How much?", "Which group?", "Is this unusual?") to ML task families.',
            'Break down a multi-factor problem using Problem Decomposition before brainstorming solutions.',
            'Use Empathy Maps and 5W1H canvases during Empathize and Define stages.',
          ],
          content:
            'A Capstone begins with an authentic issue, not a solution hunting for a problem. Data science frames candidate problems via core questions: "Which category?" (Classification), "How much or how many?" (Regression), "Which group?" (Clustering), and "Is this unusual?" (Anomaly Detection). Complex issues like traffic congestion cannot be solved monolithically; Problem Decomposition breaks the situation into component causes (road quality, peak office hours, signal timing, driver behaviour) so each root factor can be analyzed systematically. The five-stage Design Thinking framework guides human-centred building: (1) Empathize—set aside assumptions, interview affected people, and chart what users Say, Think, Do and Feel in an Empathy Map; (2) Define—synthesize insights using Who, What, Where, When, Why and How (5W1H); (3) Ideate—brainstorm broad candidate approaches before filtering feasibility.',
          examples: [
            'Decomposing school admission helpdesk bottlenecks using an Empathy Map for first-time applicants.',
            'Mapping "Predict daily canteen demand" -> Regression vs "Detect unusual network logins" -> Anomaly Detection.',
          ],
          activity:
            'Complete a 4-quadrant Empathy Map and 5W1H statement for a community problem (e.g., library book return delays or campus bus overcrowding), clearly listing who experiences the issue.',
          keyTakeaways: [
            'Classification answers "which category"; Regression predicts quantity; Clustering groups similar items; Anomaly Detection flags unusual points.',
            'Empathy Maps and 5W1H ground the Define phase in real stakeholder evidence.',
          ],
        },
        {
          id: 'm4-l2',
          title: 'SDG Alignment, Prototyping, Testing & Project Abstracts',
          sourcePages: '63-70',
          estimatedMinutes: 35,
          learningOutcomes: [
            'Connect capstone objectives with relevant UN Sustainable Development Goals (SDGs).',
            'Draft a concise Project Abstract covering prototype sketches, data needs, metrics and limitations.',
          ],
          content:
            'The remaining stages of Design Thinking turn ideas into testable artifacts: (4) Prototype—build an inexpensive visual flowchart, intent/entity storyboard or baseline script demonstrating core interaction (such as sketching chatbot intents/entities before writing backend code); (5) Test—collect structured feedback from real stakeholders on whether the prototype genuinely helps, iterating on failures rather than hiding flaws. Many impactful student capstones align with one or more of the 17 United Nations Sustainable Development Goals (SDGs), such as Clean Water, Quality Education, Good Health or Climate Action. A complete Capstone Project Abstract states the problem scope, target users, SDG link, data requirements, baseline/non-AI alternative, chosen metric and ethical risks transparently.',
          examples: [
            'Sketching a low-fidelity chatbot intent/entity paper flow for school admissions queries before programming.',
            'Aligning a local water-leak alert prototype with SDG 6 (Clean Water and Sanitation) and SDG 11 (Sustainable Cities).',
          ],
          activity:
            'Draft a one-page Capstone Abstract canvas containing problem statement, SDG goal link, data sources, prototype outline, evaluation metric and two key ethical risks.',
          keyTakeaways: [
            'Prototypes test core assumptions early before full engineering investment.',
            'Responsible projects specify a baseline, realistic metrics and limitations honestly.',
          ],
        },
      ],
      revisionNotes: [
        '5 Design Thinking stages: Empathize -> Define -> Ideate -> Prototype -> Test.',
        '5W1H captures Who, What, Where, When, Why and How in the Define stage ("While" is not part of 5W1H).',
        'Problem decomposition breaks broad problems into root-cause units before designing AI components.',
      ],
      practice: [
        'Identify which AI task type predicts rainfall in millimeters vs spam email labels.',
        'List the four quadrants of an Empathy Map.',
        'Explain why building a paper/flowchart prototype saves engineering time.',
      ],
    },
    {
      id: 'm5-data-literacy',
      moduleNumber: 5,
      title: 'Data Literacy: Collection to Analysis',
      sourcePages: '71-98',
      estimatedMinutes: 90,
      assessmentId: 'asmt-ai-m5',
      introduction:
        'AI systems are only as trustworthy as the data behind them. Data literacy equips students to distinguish primary and secondary sources, classify measurement scales, compute summary statistics, visualize distributions accurately, preprocess messy records, and understand how matrices encode datasets.',
      objectives: [
        'Compare primary and secondary data sources alongside sampling and ethical collection practices.',
        'Classify variables by measurement level (Nominal, Ordinal, Interval, Ratio) and choose valid operations.',
        'Compute and interpret Mean, Median, Mode, Variance and Standard Deviation and select appropriate Matplotlib charts.',
        'Explain data preprocessing (missing data, integration, normalization) and basic matrix representations in AI.',
      ],
      concepts: [
        'Primary vs secondary data',
        'Nominal, Ordinal, Interval, Ratio levels',
        'Mean, Median, Mode',
        'Variance & Standard Deviation',
        'Charts: Bar, Histogram, Scatter, Pie, Line',
        'Data preprocessing & normalization',
        'Matrices in AI (images, feature tables)',
      ],
      lessons: [
        {
          id: 'm5-l1',
          title: 'Sources, Measurement Scales, Summary Statistics & Variance',
          sourcePages: '71-84',
          estimatedMinutes: 45,
          learningOutcomes: [
            'Differentiate Primary sources (newly collected via surveys/experiments) from Secondary sources (existing censuses, public records).',
            'Distinguish Nominal, Ordinal, Interval and Ratio measurement scales.',
            'Select between Mean, Median and Mode based on outliers/skew and interpret Variance and Standard Deviation.',
          ],
          content:
            'Data literacy means turning raw observations into well-justified insight without misreading evidence. Primary data is gathered directly for a specific study (surveys, sensor readings, interviews), whereas secondary data reuses published records (government portals, historical logs) whose collection context must be checked. Quantitative and qualitative attributes follow four measurement levels: Nominal (labels without order, e.g., eye colour or yes/no), Ordinal (ordered ranks without equal spacing, e.g., ratings), Interval (ordered numeric scale with meaningful differences but arbitrary zero, e.g., Celsius temperature), and Ratio (true zero allows ratios, e.g., height, mass, marks). Central tendency relies on Mean (arithmetic average, sensitive to extreme outliers), Median (middle sorted value, robust to skewed outliers) and Mode (most frequent value, useful for categories). Spread is quantified by Variance (average squared deviation from the mean) and its square root, Standard Deviation.',
          examples: [
            'Why Median salary represents a skewed group better than Mean when one outlier salary is extreme.',
            'Why pin codes are Nominal despite looking numeric, while temperature in °C is Interval and height in cm is Ratio.',
          ],
          activity:
            'Given a list of 9 student quiz scores containing one outlier error (`0` when others range 68–84), calculate Mean, Median and Mode manually and explain which summary fairly represents typical performance.',
          keyTakeaways: [
            'Mean responds strongly to outliers; Median resists extreme skew; Mode works for categorical data.',
            'Small Standard Deviation means values cluster near the mean; large Standard Deviation signals wider spread.',
          ],
        },
        {
          id: 'm5-l2',
          title: 'Visualization, Data Preprocessing & Matrices in AI',
          sourcePages: '85-98',
          estimatedMinutes: 45,
          learningOutcomes: [
            'Match Matplotlib visualization types (line, bar, histogram, scatter, pie) to appropriate data questions.',
            'Describe core preprocessing steps: handling missing values, removing duplicates, data integration and normalization.',
            'Explain how AI represents tabular datasets and digital images using numerical matrices.',
          ],
          content:
            'Effective charts reveal structure honestly: line charts track change over continuous intervals; bar charts compare categories; histograms bin numeric distributions; scatter plots reveal relationships between two continuous variables (`plt.scatter(x, y)`); pie charts show part-to-whole shares across few categories. Real data rarely arrives clean. Preprocessing resolves missing entries (dropping sparse records or careful imputation rather than blindly inserting zeros), harmonizes units during Data Integration, and applies Normalization (scaling numeric attributes to comparable ranges such as `[0, 1]`) so large-magnitude columns do not overpower distance calculations. Under the hood, AI stores tabular samples (rows as instances, columns as features) and grayscale/RGB pixels as 2-D or 3-D numerical matrices, enabling linear-algebra operations at scale.',
          examples: [
            'Aditi’s stationery purchases matrix multiplying quantity matrices cleanly across buyers and items.',
            'Normalization preventing income (`0–1,000,000`) from dominating age (`10–80`) in distance calculations.',
          ],
          activity:
            'Compare a misleading truncated y-axis bar chart against a scatter plot showing height vs weight, and design a preprocessing checklist for a student health survey with blank cells and mixed units (cm vs m).',
          keyTakeaways: [
            'Scatter plots check variable relationships; histograms summarize frequency bins; bar charts compare categories.',
            'Normalization puts differently scaled features on fair footing; matrices turn images and tables into computable grids.',
          ],
        },
      ],
      revisionNotes: [
        'Scales in order of mathematical richness: Nominal < Ordinal < Interval < Ratio (true zero).',
        'Median handles extreme skewness/outliers better than Mean.',
        'Preprocessing covers cleaning missing data, deduplicating, integration and normalization.',
        'Matrices encode pixel intensities and multi-feature datasets cleanly for ML math.',
      ],
      practice: [
        'Explain why replacing missing blood-pressure readings with `0` corrupts mean and diagnosis models.',
        'Pick between a histogram and a scatter plot to check if study hours relate to marks.',
        'Define Normalization in one sentence and state when it helps.',
      ],
    },
    {
      id: 'm6-machine-learning',
      moduleNumber: 6,
      title: 'Machine Learning Algorithms',
      sourcePages: '99-122',
      estimatedMinutes: 90,
      assessmentId: 'asmt-ai-m6',
      introduction:
        'Machine learning spans a spectrum of task families. This module builds intuition behind Correlation, Simple & Multiple Linear Regression, Classification with K-Nearest Neighbors (KNN), and Unsupervised Clustering with K-Means—alongside critical risks like overfitting, feature scale sensitivity and correlation-vs-causation traps.',
      objectives: [
        'Differentiate Supervised Learning (Regression & Classification) from Unsupervised Clustering and Reinforcement Learning.',
        'Interpret Positive, Negative and No Correlation on scatter plots without confusing correlation with causation.',
        'Explain Simple Linear Regression (least-squares best-fit line) and contrast binary vs multi-class Classification.',
        'Trace how KNN classifies by majority vote of nearest neighbors and how K-Means partitions unlabelled points into K clusters.',
      ],
      concepts: [
        'Correlation (positive, negative, zero)',
        'Linear Regression & least squares',
        'Binary vs Multi-class classification',
        'K-Nearest Neighbors (KNN) & scaling',
        'Unsupervised clustering families',
        'K-Means centroids & iterations',
        'Overfitting vs underfitting',
        'Bias & explainability challenges',
      ],
      lessons: [
        {
          id: 'm6-l1',
          title: 'Correlation, Regression & Classification with KNN',
          sourcePages: '99-114',
          estimatedMinutes: 45,
          learningOutcomes: [
            'Distinguish positive, negative and zero correlation from scatter patterns.',
            'Describe how Linear Regression estimates a continuous quantity and how Logistic/Classifier methods predict labels.',
            'Step through KNN classification for odd vs even K and explain why feature scale matters.',
          ],
          content:
            'In Supervised Learning, models learn from labelled examples `(X, y)`. Before fitting models, analysts inspect relationships: Positive correlation shows points rising left-to-right; Negative correlation slopes downward; No correlation scatters randomly. Simple Linear Regression fits a best-fit line minimizing squared prediction errors (the least squares method) using one predictor, whereas Multiple Linear Regression incorporates several predictors to predict continuous values (temperature, price). By contrast, Classification assigns discrete categories—Binary Classification between two classes (spam / not spam) or Multi-class Classification across three or more categories. K-Nearest Neighbors (KNN) is an instance-based classifier predicting a new sample’s label by majority vote of its `K` closest labelled points in feature space. Because Euclidean distance responds heavily to large units, unnormalized features skew nearest-neighbor votes.',
          examples: [
            'Computing how a new flower sample shifts class prediction as `K` changes from 3 to 5 when boundary points are mixed.',
            'Recognizing that ice-cream sales and sunburn rates correlate positively via a confounding factor (hot summer), not causation.',
          ],
          activity:
            'Plot five labelled 2-D points `(study_hours, practice_tests) -> Pass/Fail`, compute Manhattan or Euclidean distances to a test point, classify with `K=3`, and inspect what happens if `study_hours` is converted to minutes without scaling.',
          keyTakeaways: [
            'Regression predicts continuous quantities; Classification predicts predefined category labels.',
            'KNN relies on distance metrics + majority vote, making feature normalization crucial.',
          ],
        },
        {
          id: 'm6-l2',
          title: 'Unsupervised Clustering, K-Means & Model Pitfalls',
          sourcePages: '114-122',
          estimatedMinutes: 45,
          learningOutcomes: [
            'Compare Partitioning (K-Means), Hierarchical, Density-based (DBSCAN) and Distribution-based clustering concepts.',
            'Trace K-Means iterative assignment and centroid update steps until convergence.',
            'Explain overfitting, underfitting, data bias and interpretability challenges in ML.',
          ],
          content:
            'Unsupervised Learning finds patterns in unlabelled datasets. Clustering partitions points so observations within a group resemble each other more than points in other groups. The handbook introduces several clustering families: Partitioning clustering (such as K-Means, dividing data into `K` non-overlapping clusters around centroids), Hierarchical clustering (tree/dendrogram nesting), Density-based clustering (e.g. DBSCAN finding dense regions and noise), and Distribution/Fuzzy methods (allowing soft/probabilistic membership). K-Means works iteratively: choose `K`, initialize `K` centroids, assign each observation to its nearest centroid, recompute centroids as cluster means, and repeat until assignments stabilize. Teams must still validate results carefully: choosing poor `K` creates meaningless clusters, Overfitting memorizes training noise while failing unseen tests, Underfitting misses core patterns, and biased training histories perpetuate unfair predictions.',
          examples: [
            'Segmenting store purchase patterns into `K=3` customer clusters via iterative centroid updates.',
            'Why a model scoring 99% on training data yet 61% on held-out tests suffers overfitting.',
          ],
          activity:
            'Run a manual 2-step K-Means trace with `K=2` on four simple 1-D numbers (`[2, 4, 10, 12]`) starting from centroids `3` and `9`, showing cluster assignment and updated centroids.',
          keyTakeaways: [
            'K-Means requires pre-specifying `K` and iteratively updates centroids; DBSCAN handles arbitrary shapes via density.',
            'Clustering groups need human inspection—mathematical closeness does not guarantee ethical or meaningful labels.',
          ],
        },
      ],
      revisionNotes: [
        'Correlation measures linear association (-1 to +1) — never automatic causation.',
        'Least squares minimizes residual squared errors in linear regression.',
        'KNN = supervised classification by K-neighbor vote; K-Means = unsupervised partitioning into K centroid clusters.',
        'Watch for overfitting, underfitting, feature scale bias and unlabelled data assumptions.',
      ],
      practice: [
        'Explain when KNN could fail if `K` is even on a 2-class problem.',
        'Compare Supervised Classification vs Unsupervised Clustering with one clear difference.',
        'Name two ways to test whether a fitted ML model is overfitting.',
      ],
    },
    {
      id: 'm7-language-nlp',
      moduleNumber: 7,
      title: 'Linguistics and Natural Language Processing',
      sourcePages: '123-136',
      estimatedMinutes: 65,
      assessmentId: 'asmt-ai-m7',
      introduction:
        'Human language is rich with idioms, context, sarcasm and double meanings—making it dramatically harder for computers than neat spreadsheet columns. This module examines the 5 phases of NLP, chatbot intents and entities, real NLP applications, and a clearly demarcated supplemental note on modern Large Language Models.',
      objectives: [
        'Explain why unstructured human language poses structural, semantic and pragmatic ambiguity challenges.',
        'Trace the five phases of NLP: Lexical, Syntactic, Semantic, Discourse Integration and Pragmatic analysis.',
        'Compare rule-based chatbots with AI-powered dialogue agents using Intent, Entity and Context.',
        'Evaluate common NLP applications (sentiment analysis, spam filtering, machine translation) and safe human fallbacks.',
      ],
      concepts: [
        'Structured data vs messy text',
        'Lexical analysis & tokens',
        'Syntactic & Semantic analysis',
        'Discourse integration & Pragmatics',
        'Intent, Entity & Utterance',
        'Rule-based vs AI chatbots',
        'Sentiment analysis & classification',
        '[Supplemental] LLMs & prompt verification',
      ],
      lessons: [
        {
          id: 'm7-l1',
          title: 'Language Complexity & The Five Phases of NLP',
          sourcePages: '123-131',
          estimatedMinutes: 30,
          learningOutcomes: [
            'Illustrate lexical/syntactic ambiguity using multi-meaning sentences.',
            'Sequence and define the 5 phases of NLP described in the handbook.',
          ],
          content:
            'Unlike neat rows and columns, everyday text and speech are unstructured and ambiguous—illustrated by Groucho Marx’s classic joke ("One morning I shot an elephant in my pajamas. How he got in my pajamas, I don’t know"). To map messy text toward actionable structure, NLP systems process language across five conceptual phases: (1) Lexical Analysis breaks streams into tokens/words and structural lexicons; (2) Syntactic Analysis (Parsing) verifies grammar and word dependencies; (3) Semantic Analysis inspects literal word/phrase meaning and rejects nonsensical combinations; (4) Discourse Integration links pronouns and references across surrounding sentences ("it", "he"); (5) Pragmatic Analysis interprets real-world speaker intent and social context beyond literal words (such as sarcasm or polite requests).',
          examples: [
            'Parsing "The bank by the river overflowed" vs "The bank approved the loan" (lexical/semantic disambiguation).',
            'Connecting "Ravi lost his card. He reported it" via Discourse Integration.',
          ],
          activity:
            'Write an ambiguous headline or sentence with two interpretations, trace how Syntactic vs Semantic vs Pragmatic analysis resolves each, and note what a keyword-only filter gets wrong.',
          keyTakeaways: [
            'Five NLP phases progress from tokens (Lexical) -> grammar (Syntactic) -> literal meaning (Semantic) -> cross-sentence links (Discourse) -> real-world intent (Pragmatic).',
            'Sarcasm and cultural idioms commonly break naive word-count classifiers.',
          ],
        },
        {
          id: 'm7-l2',
          title: 'Chatbots, Intents & Real NLP Applications (+ Supplemental GenAI Note)',
          sourcePages: '132-136',
          estimatedMinutes: 35,
          learningOutcomes: [
            'Design basic Chatbot Intents and Entities and contrast rule-based vs AI-powered bots.',
            'Recognize NLP applications across sentiment analysis, email spam filters, smart assistants and translation.',
            'Distinguish handbook chatbot foundations from modern Large Language Model (LLM) prediction and verification.',
          ],
          content:
            'NLP powers spam filters, machine translation, document summarization, smart assistants and sentiment analysis (estimating positive, neutral or negative attitude in reviews). In conversational design, chatbots identify a user’s Intent (the goal, e.g. `CheckHours` or `OrderIceCream`) and extract Entities (details like `7 pm` or `vanilla`). Rule-based chatbots follow scripted keyword trees—predictable yet brittle on unexpected phrasing—while AI-powered chatbots classify varied phrasing using ML models, though they still require bias checks and clear human escalation paths when confidence drops.',
          examples: [
            'Intent `CheckOpeningHours` matching "When do you open?" and extracting time entities.',
            'A Python dictionary-backed rule chatbot returning fallback assistance when no intent matches.',
          ],
          activity:
            'Design a 4-intent dialogue table (greeting, book search, hours query, unknown fallback) for a school library chatbot specifying sample utterances, entities and an escalation message.',
          keyTakeaways: [
            'Intent captures what the user wants; Entities supply specific parameters inside the message.',
            'Always provide safe fallback handling when language confidence is low.',
          ],
          supplementalNote: {
            label:
              'Supplemental — Outside CBSE Subject Code 843 Handbook (Modern Generative AI Context)',
            content:
              'Beyond traditional intent/entity bots covered in the handbook, modern Generative AI tools use Large Language Models (LLMs)—deep transformer neural networks trained on vast text corpora to predict plausible next tokens across large context windows. Because LLMs generate statistically likely continuations rather than consulting verified facts, they can "hallucinate" confident errors or outdated citations. Treat LLM outputs as unverified drafts requiring human fact-checking and clear attribution.',
          },
        },
      ],
      revisionNotes: [
        '5 NLP Phases: Lexical -> Syntactic -> Semantic -> Discourse Integration -> Pragmatic.',
        'Intent = user goal; Entity = specific detail inside the utterance.',
        'Rule-based bots follow fixed patterns; AI bots generalize phrasing but risk bias and drift.',
        '[Supplemental] LLM responses are next-token predictions and can hallucinate without fact checks.',
      ],
      practice: [
        'Name which NLP phase resolves what pronoun "they" refers to in the previous sentence.',
        'Identify Intent and Entity in: "Book two tickets to Delhi for Friday".',
        'State one strength and one failure mode of rule-based vs ML chatbots.',
      ],
    },
    {
      id: 'm8-ai-ethics',
      moduleNumber: 8,
      title: 'AI Ethics and Values',
      sourcePages: '137-150',
      estimatedMinutes: 70,
      assessmentId: 'asmt-ai-m8',
      introduction:
        'Technical accuracy alone does not make an AI system ethical or safe. This concluding module explores the Five Pillars of AI Ethics, how algorithmic bias arises and harms real communities, practical mitigation techniques, international AI governance principles, and ethical dilemma analysis.',
      objectives: [
        'Explain all five pillars of AI Ethics: Explainability, Fairness, Robustness, Transparency and Privacy.',
        'Diagnose how bias enters AI pipelines through historical records, sampling gaps, proxies and human assumptions.',
        'Propose multi-stage bias mitigation measures and institutional AI policies anchored in accountability and human rights.',
        'Reason rigorously about ethical trade-offs in scenarios like autonomous vehicle dilemmas and hiring algorithms.',
      ],
      concepts: [
        'AI Ethics & Moral Accountability',
        'Explainability vs Transparency',
        'Fairness, Robustness & Privacy',
        'Algorithmic Bias Sources',
        'Healthcare proxy bias case study',
        'Bias mitigation strategies',
        'Policy frameworks (EU, OECD, UNESCO)',
        '[Supplemental] GenAI safety & integrity',
      ],
      lessons: [
        {
          id: 'm8-l1',
          title: 'Five Pillars of AI Ethics & Sources of Algorithmic Bias',
          sourcePages: '137-143',
          estimatedMinutes: 35,
          learningOutcomes: [
            'Define Explainability, Fairness, Robustness, Transparency and Privacy and spot tensions between them.',
            'Trace real-world bias mechanisms such as biased proxy metrics and unequal training representation.',
          ],
          content:
            'AI Ethics establishes moral guardrails across design, deployment and oversight. The handbook highlights Five Pillars of AI Ethics: (1) Explainability—stakeholders can understand why an outcome occurred; (2) Fairness—systems treat demographic groups equitably without unjust harm; (3) Robustness—models operate safely and reliably even under unexpected perturbations; (4) Transparency—creators openly disclose capabilities, training assumptions and limitations; (5) Privacy—personal data is safeguarded with informed consent and minimal collection. Bias ("algorithmic bias") happens when skewed data, faulty proxy targets or developer blind spots systematically disadvantage groups. A sobering handbook example shows a hospital triage algorithm using past healthcare expenditure as a proxy for medical need—unfairly assigning lower risk scores to Black patients who historically faced barriers to healthcare spending.',
          examples: [
            'Facial recognition systems trained disproportionately on lighter-skinned faces showing elevated error rates on darker-skinned individuals.',
            'Replacing clinical illness proxies (cost) with direct clinical need measurements to curb proxy bias.',
          ],
          activity:
            'Audit a hypothetical automated scholarship screener against all 5 pillars (Explainability, Fairness, Robustness, Transparency, Privacy), naming one potential failure mode and one protective control for each.',
          keyTakeaways: [
            'Using historical spending or skewed hiring logs as target labels encodes past inequity into future predictions.',
            'Transparency communicates system design openly; Explainability makes specific decisions understandable.',
          ],
        },
        {
          id: 'm8-l2',
          title:
            'Mitigating Bias, AI Policy Frameworks & Ethical Dilemmas (+ Supplemental GenAI Note)',
          sourcePages: '143-150',
          estimatedMinutes: 35,
          learningOutcomes: [
            'Formulate multi-pronged bias mitigation steps spanning diverse datasets, subgroup audits and human appeal loops.',
            'Compare goals of major AI governance frameworks (UNESCO, OECD, EU Ethics Guidelines for Trustworthy AI).',
            'Evaluate human accountability in ethical dilemmas such as Moral Machine and hiring screens.',
          ],
          content:
            'Reducing bias demands deliberate intervention before and after launch: collect balanced, representative datasets; measure error rates across subgroups; involve domain and affected-community voices; enforce human-in-the-loop review and appeal rights when decisions carry high stakes (law enforcement, hiring, medicine). Ethical governance frameworks—including the European Union’s Ethics Guidelines for Trustworthy AI, OECD AI Principles and UNESCO recommendations—stress human agency, safety, non-discrimination and clear accountability when systems fail. Exercises like MIT’s Moral Machine and "Survival of the Best Fit" illustrate that ethical trade-offs cannot simply be hardcoded as pure math: policymakers and engineers must accept accountable human responsibility.',
          examples: [
            'Establishing mandatory human appeal channels and regular false-positive group audits before using vision tools in public safety.',
            'Comparing "Survival of the Best Fit" automated resume scoring against diverse human oversight panels.',
          ],
          activity:
            'Read the handbook law-enforcement facial recognition scenario (p.149): list three privacy/bias risks, two technical safeguards, and two policy rules requiring human sign-off.',
          keyTakeaways: [
            'Bias mitigation combines better data, disaggregated subgroup error testing, and governance/appeal mechanisms.',
            'Humans—never algorithms alone—remain accountable for ethical deployment and harm.',
          ],
          supplementalNote: {
            label:
              'Supplemental — Outside CBSE Subject Code 843 Handbook (Generative AI Responsibility)',
            content:
              'When using modern Generative AI tools (text, code or image generators), apply the handbook’s five ethical pillars: disclose AI assistance honestly (Transparency), verify facts and code against tests rather than blindly submitting generated text (Robustness & Academic Integrity), never upload sensitive student PII into public prompts (Privacy), and inspect generated media for deepfake misrepresentation or unattributed intellectual property.',
          },
        },
      ],
      revisionNotes: [
        '5 Pillars of AI Ethics: Explainability, Fairness, Robustness, Transparency, Privacy.',
        'Proxy variables (e.g., cost instead of health need) can reproduce systemic discrimination silently.',
        'Bias mitigation requires diverse data, group-disaggregated testing, policy guardrails and human appeal routes.',
        '[Supplemental] Never paste student PII into external GenAI tools; always verify claims and cite assistance.',
      ],
      practice: [
        'Contrast Fairness vs Privacy with one example where protecting privacy complicates bias auditing.',
        'Explain why past healthcare cost was a harmful proxy in the hospital triage case study.',
        'Propose two rules an ethical school AI policy should include before deploying automated grading.',
      ],
    },
  ],
};
