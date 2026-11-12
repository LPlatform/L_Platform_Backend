import { buildModuleQuestions, type BankQuestionSpec } from './types.js';

export const m1Questions: BankQuestionSpec[] = buildModuleQuestions('m1-ai-foundations', 1, [
  // 20 SINGLE_MCQ
  {
    slug: 'fixed-vs-ai',
    type: 'SINGLE_MCQ',
    title: 'Distinguishing AI from Fixed-Function Hardware',
    prompt:
      'Which device best illustrates fixed-function hardware rather than Artificial Intelligence?',
    topic: 'AI vs Automation',
    difficulty: 'EASY',
    sourcePage: '3',
    lessonId: 'm1-l1',
    objective: 'Differentiate rule-bound hardware from adaptive AI systems.',
    explanation:
      'A conventional microwave oven runs pre-programmed timing/power steps without learning from previous cycles.',
    options: [
      { text: 'A conventional microwave oven following timer settings', correct: true },
      { text: 'A navigation app predicting traffic delays from live speed feeds' },
      { text: 'A voice assistant translating spoken phrases into text' },
      { text: 'A vision model inspecting defective bottles on a conveyer belt' },
    ],
  },
  {
    slug: 'ai-definition',
    type: 'SINGLE_MCQ',
    title: 'Core Capability of Artificial Intelligence',
    prompt: 'What primarily distinguishes an AI system from a non-interactive sensor?',
    topic: 'What is AI',
    difficulty: 'EASY',
    sourcePage: '2-3',
    lessonId: 'm1-l1',
    objective: 'Define AI in terms of learning and decision support.',
    explanation:
      'Sensors measure raw physical signals, whereas AI analyzes collected data to detect patterns and inform predictions or actions.',
    options: [
      { text: 'Measuring temperature without storing values' },
      { text: 'Learning patterns from data to adapt decisions or predictions', correct: true },
      { text: 'Operating purely through mechanical gears' },
      { text: 'Repeating one hardcoded loop indefinitely' },
    ],
  },
  {
    slug: 'turing-year',
    type: 'SINGLE_MCQ',
    title: '1950 Milestone in AI History',
    prompt: 'Why is 1950 regarded as a landmark year in the history of Artificial Intelligence?',
    topic: 'Evolution of AI',
    difficulty: 'EASY',
    sourcePage: '3',
    lessonId: 'm1-l1',
    objective: 'Recall foundational historical milestones of AI.',
    explanation:
      'Alan Turing published his seminal paper posing the question of whether machines can think and proposing the Turing Test.',
    options: [
      { text: 'The release of the first modern web browser' },
      {
        text: 'Alan Turing’s landmark paper exploring machine intelligence and the Turing Test',
        correct: true,
      },
      { text: 'Introduction of cloud GPUs for consumer gaming' },
      { text: 'Invention of commercial fiber-optic cables' },
    ],
  },
  {
    slug: 'ai-winter',
    type: 'SINGLE_MCQ',
    title: 'Understanding AI Winters',
    prompt: 'During periods termed "AI winters" in the late 20th century, what slowed AI progress?',
    topic: 'Evolution of AI',
    difficulty: 'MEDIUM',
    sourcePage: '4',
    lessonId: 'm1-l1',
    objective: 'Explain factors behind cycles of optimism and slowdown in AI history.',
    explanation:
      'Overpromising capabilities beyond existing hardware compute and small datasets led to reduced research funding and skepticism.',
    options: [
      { text: 'Excessive computing speeds made algorithms obsolete' },
      {
        text: 'Skepticism and funding cuts after hype outpaced available data and compute',
        correct: true,
      },
      { text: 'Too many free public benchmark datasets caused confusion' },
      { text: 'A global ban on high-level programming languages' },
    ],
  },
  {
    slug: 'statistical-data-domain',
    type: 'SINGLE_MCQ',
    title: 'Statistical Data AI Domain',
    prompt: 'Fraud scoring on banking transaction tables falls primarily into which AI domain?',
    topic: 'Domains of AI',
    difficulty: 'EASY',
    sourcePage: '6, 8',
    lessonId: 'm1-l1',
    objective: 'Identify tasks belonging to the Statistical Data domain.',
    explanation:
      'Numerical, categorical and alphanumeric transaction tables belong to the Statistical Data domain.',
    options: [
      { text: 'Computer Vision' },
      { text: 'Statistical Data', correct: true },
      { text: 'Speech Synthesis' },
      { text: 'Autonomous Hardware Mechanics' },
    ],
  },
  {
    slug: 'nlu-vs-nlg',
    type: 'SINGLE_MCQ',
    title: 'NLU vs NLG in Natural Language Processing',
    prompt: 'Which NLP subfield converts structured metrics into coherent, human-readable reports?',
    topic: 'Domains of AI',
    difficulty: 'MEDIUM',
    sourcePage: '7',
    lessonId: 'm1-l1',
    objective: 'Differentiate Natural Language Understanding and Natural Language Generation.',
    explanation:
      'Natural Language Generation (NLG) produces human-readable text or speech from structured inputs.',
    options: [
      { text: 'Natural Language Generation (NLG)', correct: true },
      { text: 'Object Detection' },
      { text: 'Optical Sensor Calibration' },
      { text: 'Unstructured Noise Filtering' },
    ],
  },
  {
    slug: 'cv-domain',
    type: 'SINGLE_MCQ',
    title: 'Computer Vision Applications',
    prompt: 'Which scenario relies directly on Computer Vision?',
    topic: 'Domains of AI',
    difficulty: 'EASY',
    sourcePage: '7-8',
    lessonId: 'm1-l1',
    objective: 'Match visual perception applications to Computer Vision.',
    explanation:
      'Detecting pedestrians and road signs from vehicle camera feeds requires interpreting visual image data.',
    options: [
      { text: 'Calculating classroom grade averages from a spreadsheet' },
      { text: 'Detecting pedestrians in autonomous vehicle camera frames', correct: true },
      { text: 'Sorting customer invoices alphabetically by last name' },
      { text: 'Measuring electric current using an analog ammeter' },
    ],
  },
  {
    slug: 'nested-hierarchy',
    type: 'SINGLE_MCQ',
    title: 'Relationship Between AI, ML and DL',
    prompt:
      'Which statement accurately expresses the subset relationship among AI, Machine Learning and Deep Learning?',
    topic: 'AI Terminologies',
    difficulty: 'EASY',
    sourcePage: '9-11',
    lessonId: 'm1-l2',
    objective: 'Describe how AI, ML and DL are nested conceptually.',
    explanation:
      'Machine Learning is a subset of Artificial Intelligence, and Deep Learning is a specialized subset of Machine Learning.',
    options: [
      { text: 'Deep Learning is the broadest field containing AI and ML' },
      { text: 'Machine Learning and Deep Learning are unrelated alternatives to AI' },
      {
        text: 'Deep Learning is a subset of Machine Learning, which is a subset of AI',
        correct: true,
      },
      { text: 'AI is a small toolkit inside Deep Learning' },
    ],
  },
  {
    slug: 'neural-network-layers',
    type: 'SINGLE_MCQ',
    title: 'Layers Inside an Artificial Neural Network',
    prompt:
      'What are the three structural layer groups of a typical Artificial Neural Network (ANN)?',
    topic: 'Neural Networks',
    difficulty: 'EASY',
    sourcePage: '9',
    lessonId: 'm1-l2',
    objective: 'Identify input, hidden and output layers of an ANN.',
    explanation:
      'Artificial Neural Networks process inputs through an input layer, one or more hidden layers, and an output layer.',
    options: [
      { text: 'Header layer, compiler layer and footer layer' },
      { text: 'Input layer, one or more hidden layers, and output layer', correct: true },
      { text: 'Sensor layer, storage layer and printing layer' },
      { text: 'CSV layer, loop layer and rule layer' },
    ],
  },
  {
    slug: 'dl-feature-extraction',
    type: 'SINGLE_MCQ',
    title: 'Feature Extraction Advantage of Deep Learning',
    prompt:
      'How does Deep Learning differ from traditional Machine Learning on image classification tasks such as sorting e-waste?',
    topic: 'Machine Learning vs Deep Learning',
    difficulty: 'MEDIUM',
    sourcePage: '10-11',
    lessonId: 'm1-l2',
    objective: 'Contrast manual feature engineering with Deep Learning feature hierarchies.',
    explanation:
      'Traditional ML often depends on human-engineered features, whereas deep neural networks learn hierarchical visual representations directly from raw pixels.',
    options: [
      { text: 'Deep Learning operates without any training images' },
      {
        text: 'Deep Learning learns layered representations automatically without hand-crafted features',
        correct: true,
      },
      { text: 'Deep Learning runs faster on tiny calculators with ten data rows' },
      { text: 'Deep Learning guarantees 100% explainability on every pixel' },
    ],
  },
  {
    slug: 'supervised-def',
    type: 'SINGLE_MCQ',
    title: 'Supervised Learning Characteristic',
    prompt: 'What defines Supervised Machine Learning?',
    topic: 'Learning Paradigms',
    difficulty: 'EASY',
    sourcePage: '12',
    lessonId: 'm1-l2',
    objective: 'Identify the role of labelled examples in supervised learning.',
    explanation:
      'Supervised learning trains models on example input-output pairs (labelled datasets).',
    options: [
      { text: 'Exploring raw observations with zero target labels' },
      {
        text: 'Mapping input features to known target labels from example input-output pairs',
        correct: true,
      },
      { text: 'Penalizing random movements in an unknown maze without historical records' },
      { text: 'Hardcoding decision trees manually without inspecting data' },
    ],
  },
  {
    slug: 'unsupervised-example',
    type: 'SINGLE_MCQ',
    title: 'Unsupervised Learning Example',
    prompt: 'Which problem illustrates Unsupervised Learning?',
    topic: 'Learning Paradigms',
    difficulty: 'EASY',
    sourcePage: '12-13',
    lessonId: 'm1-l2',
    objective: 'Recognize clustering/grouping problems without labels.',
    explanation:
      'Grouping shoppers solely by purchase patterns without pre-defined category labels is unsupervised learning.',
    options: [
      { text: 'Predicting exam grades from past labelled student cohorts' },
      {
        text: 'Grouping customers by shopping habits when no category labels exist',
        correct: true,
      },
      { text: 'Checking whether a number is even using `% 2 == 0`' },
      { text: 'Grading multiple-choice answers using a key' },
    ],
  },
  {
    slug: 'rl-reward',
    type: 'SINGLE_MCQ',
    title: 'Reinforcement Learning Mechanism',
    prompt: 'How does an agent improve in Reinforcement Learning?',
    topic: 'Learning Paradigms',
    difficulty: 'EASY',
    sourcePage: '13',
    lessonId: 'm1-l2',
    objective: 'Describe agent-environment reward loops.',
    explanation:
      'A reinforcement learning agent interacts with an environment and adjusts future choices based on reward or penalty signals.',
    options: [
      { text: 'By memorizing fixed SQL tables' },
      { text: 'By taking actions in an environment to maximize cumulative rewards', correct: true },
      { text: 'By asking an administrator to type labels for every frame' },
      { text: 'By deleting all negative records from spreadsheets' },
    ],
  },
  {
    slug: 'data-oil-stat',
    type: 'SINGLE_MCQ',
    title: 'Growth of Digital Data',
    prompt: 'Why is data often described in the handbook as foundational fuel for modern AI?',
    topic: 'Types of Data',
    difficulty: 'EASY',
    sourcePage: '5',
    lessonId: 'm1-l1',
    objective: 'Connect modern data volume to AI capability.',
    explanation:
      'Models learn statistical regularities from recorded facts, photos, audio and interactions; richer representative data drives better learning.',
    options: [
      { text: 'Because AI hardware physically consumes crude oil' },
      {
        text: 'Because modern AI algorithms rely on diverse recorded data to learn patterns',
        correct: true,
      },
      { text: 'Because all data is neatly organized without missing fields' },
      { text: 'Because small hardcoded formulas need petabytes of video' },
    ],
  },
  {
    slug: 'narrow-ai-scope',
    type: 'SINGLE_MCQ',
    title: 'Narrow Focus of Today’s AI',
    prompt: 'Which limitation accurately characterizes contemporary deployed AI systems?',
    topic: 'Limitations of AI',
    difficulty: 'MEDIUM',
    sourcePage: '14',
    lessonId: 'm1-l2',
    objective: 'Recognize realistic operational constraints of current AI.',
    explanation:
      'Current AI specializes in defined tasks (e.g. spam filtering or chest X-ray screening) and does not possess human-level general understanding across contexts.',
    options: [
      { text: 'They automatically understand social ethics without human policies' },
      {
        text: 'They excel at specialized tasks while lacking general common-sense reasoning',
        correct: true,
      },
      { text: 'They never inherit bias present in human records' },
      { text: 'They eliminate all need for testing when deployed in new cities' },
    ],
  },
  {
    slug: 'rule-based-wash',
    type: 'SINGLE_MCQ',
    title: 'Adaptive vs Rule-Only Washing Machine',
    prompt:
      'When might a modern washing machine reasonably involve AI rather than basic timing hardware?',
    topic: 'AI vs Automation',
    difficulty: 'MEDIUM',
    sourcePage: '3',
    lessonId: 'm1-l1',
    objective: 'Evaluate borderline consumer devices accurately.',
    explanation:
      'Adjusting wash cycles dynamically by learning soil/fabric patterns from sensor data differs from executing a fixed mechanical timer.',
    options: [
      { text: 'When a dial always spins for exactly 30 minutes regardless of load' },
      {
        text: 'When sensors and learned models adapt water and cycle choices to load fabric and turbidity',
        correct: true,
      },
      { text: 'When the power indicator LED glows red' },
      { text: 'When the lid latch stops the motor physically' },
    ],
  },
  {
    slug: 'human-in-loop',
    type: 'SINGLE_MCQ',
    title: 'Need for Human Oversight in AI',
    prompt: 'In which situation is mandatory human review of an AI output most critical?',
    topic: 'Benefits & Limitations',
    difficulty: 'MEDIUM',
    sourcePage: '2, 14',
    lessonId: 'm1-l2',
    objective: 'Determine high-stakes settings requiring human review.',
    explanation:
      'High-stakes medical, legal or educational decisions carry serious error costs and require human clinical/contextual judgment.',
    options: [
      { text: 'Shuffling a background music playlist' },
      {
        text: 'Medical diagnosis triage or scholarship rejection affecting a person’s future',
        correct: true,
      },
      { text: 'Sorting movie titles alphabetically' },
      { text: 'Auto-capitalizing the first word of a personal note' },
    ],
  },
  {
    slug: 'unstructured-data-ex',
    type: 'SINGLE_MCQ',
    title: 'Unstructured Data Recognition',
    prompt:
      'Which example represents unstructured data requiring preprocessing or domain-specific AI before spreadsheet analysis?',
    topic: 'Data Domains',
    difficulty: 'EASY',
    sourcePage: '5-7',
    lessonId: 'm1-l1',
    objective: 'Distinguish structured tables from unstructured media/text.',
    explanation:
      'Audio recordings, customer chat messages and photos lack fixed table rows/columns.',
    options: [
      { text: 'A classroom attendance register with Student ID and Present/Absent columns' },
      { text: 'Voice recordings and spontaneous customer support chat logs', correct: true },
      { text: 'A sorted CSV table of monthly electricity bills' },
      { text: 'A bank ledger containing integer balances' },
    ],
  },
  {
    slug: 'ai-job-shift',
    type: 'SINGLE_MCQ',
    title: 'Workforce Impact Limitation',
    prompt:
      'Which societal challenge associated with widespread AI automation is emphasized in Module 1?',
    topic: 'Benefits & Limitations',
    difficulty: 'MEDIUM',
    sourcePage: '14',
    lessonId: 'm1-l2',
    objective: 'Identify workforce retraining needs resulting from automation.',
    explanation:
      'Automation of repetitive workflows creates job displacement concerns, making reskilling and lifelong learning essential.',
    options: [
      { text: 'Permanent elimination of all software jobs worldwide' },
      {
        text: 'Job displacement in routine tasks requiring workforce retraining and upskilling',
        correct: true,
      },
      { text: 'Impossibility of training models on modern laptops' },
      { text: 'Automatic prevention of software bugs' },
    ],
  },
  {
    slug: 'node-activation',
    type: 'SINGLE_MCQ',
    title: 'Node Activation in Neural Networks',
    prompt:
      'Inside an Artificial Neural Network node, when does a node pass an activated signal forward in basic threshold models?',
    topic: 'Neural Networks',
    difficulty: 'MEDIUM',
    sourcePage: '9',
    lessonId: 'm1-l2',
    objective: 'Understand basic ANN threshold activation intuition.',
    explanation:
      'As outlined on p.9, when a node’s computed output exceeds its threshold, the node activates and transmits to the next layer.',
    options: [
      { text: 'Only when the input file name ends in `.csv`' },
      {
        text: 'When the node’s weighted output exceeds a threshold activation condition',
        correct: true,
      },
      { text: 'Whenever a human manually clicks a button during training' },
      { text: 'Every ten seconds on a fixed wall clock' },
    ],
  },

  // 5 MULTI_SELECT
  {
    slug: 'ai-domains-multi',
    type: 'MULTI_SELECT',
    title: 'Identify Core Handbook AI Domains',
    prompt: 'Select ALL three primary AI data domains introduced in Unit 1.',
    topic: 'Domains of AI',
    difficulty: 'EASY',
    sourcePage: '6-8',
    lessonId: 'm1-l1',
    objective: 'Identify Statistical Data, NLP and Computer Vision.',
    explanation:
      'The handbook groups AI capabilities across Statistical Data, Natural Language Processing and Computer Vision.',
    options: [
      { text: 'Statistical Data', correct: true },
      { text: 'Natural Language Processing (NLP)', correct: true },
      { text: 'Computer Vision', correct: true },
      { text: 'Mechanical Pulley Gears' },
    ],
  },
  {
    slug: 'non-ai-devices',
    type: 'MULTI_SELECT',
    title: 'Spot Non-AI Devices & Automation',
    prompt:
      'Which of the following examples are classified as traditional/fixed systems rather than AI?',
    topic: 'AI vs Automation',
    difficulty: 'MEDIUM',
    sourcePage: '2-3',
    lessonId: 'm1-l1',
    objective: 'Differentiate non-interactive/fixed systems from AI.',
    explanation:
      'Mechanical pulleys, raw sensors without analysis, and fixed-timer microwaves do not learn from data.',
    options: [
      { text: 'A basic non-interactive electric fan with low/high speed switches', correct: true },
      {
        text: 'A thermometer sensor displaying current temperature without learning',
        correct: true,
      },
      { text: 'An e-commerce recommendation model updating choices from user behaviour' },
      { text: 'A traditional mechanical clock timer', correct: true },
    ],
  },
  {
    slug: 'ai-limitations-multi',
    type: 'MULTI_SELECT',
    title: 'Key Limitations of AI Systems',
    prompt: 'Select ALL valid limitations or risks that must be managed when deploying AI.',
    topic: 'Benefits & Limitations',
    difficulty: 'MEDIUM',
    sourcePage: '14',
    lessonId: 'm1-l2',
    objective: 'Recognize key drawbacks alongside benefits of AI.',
    explanation:
      'Data bias, opacity (explainability gaps), privacy risks and workforce disruption are prominent limitations.',
    options: [
      { text: 'Sensitivity to biased or incomplete training data', correct: true },
      { text: 'Lack of intuitive explainability in complex neural models', correct: true },
      { text: 'Privacy concerns around large personal datasets', correct: true },
      { text: 'Zero requirement for energy or computing resources' },
    ],
  },
  {
    slug: 'nlp-subtasks',
    type: 'MULTI_SELECT',
    title: 'Applications & Subfields of NLP',
    prompt: 'Which capabilities belong within Natural Language Processing (NLP)?',
    topic: 'Domains of AI',
    difficulty: 'EASY',
    sourcePage: '7',
    lessonId: 'm1-l1',
    objective: 'Identify NLU, NLG and language tasks.',
    explanation: 'NLU, NLG, news text summarization and language translation are core NLP tasks.',
    options: [
      { text: 'Natural Language Understanding (NLU)', correct: true },
      { text: 'Natural Language Generation (NLG)', correct: true },
      { text: 'News article text summarization', correct: true },
      { text: 'Measuring road concrete thickness with sonar' },
    ],
  },
  {
    slug: 'learning-types-pair',
    type: 'MULTI_SELECT',
    title: 'Match Supervised & Reinforcement Features',
    prompt: 'Select the accurate statements regarding machine learning paradigms.',
    topic: 'Learning Paradigms',
    difficulty: 'MEDIUM',
    sourcePage: '12-13',
    lessonId: 'm1-l2',
    objective: 'Verify learning paradigm definitions.',
    explanation:
      'Supervised learning uses labelled examples; unsupervised learning finds clusters without labels; reinforcement learning uses rewards.',
    options: [
      { text: 'Supervised learning uses labelled input-output training pairs', correct: true },
      {
        text: 'Reinforcement learning optimizes cumulative feedback rewards over actions',
        correct: true,
      },
      {
        text: 'Unsupervised learning discovers clusters in unlabelled observations',
        correct: true,
      },
      { text: 'Supervised learning never requires historical labels' },
    ],
  },

  // 5 TRUE_FALSE
  {
    slug: 'tf-ai-replaces-all',
    type: 'TRUE_FALSE',
    title: 'Human Decision Replacement Myth',
    prompt:
      'True or False: AI always replaces human judgment completely and requires no human oversight once trained.',
    topic: 'What is AI',
    difficulty: 'EASY',
    sourcePage: '2, 14',
    lessonId: 'm1-l1',
    objective: 'Clarify human-in-the-loop responsibility.',
    explanation:
      'False. AI augments human decision-making and must be checked carefully, especially when conditions shift or harm is possible.',
    correctBoolean: false,
  },
  {
    slug: 'tf-dl-ann',
    type: 'TRUE_FALSE',
    title: 'Deep Learning Foundation',
    prompt:
      'True or False: Deep Learning uses multi-layered Artificial Neural Networks inspired loosely by interconnected neurons.',
    topic: 'Deep Learning',
    difficulty: 'EASY',
    sourcePage: '9-11',
    lessonId: 'm1-l2',
    objective: 'Connect Deep Learning with layered ANNs.',
    explanation:
      'True. Deep learning consists of ANNs with multiple hidden layers extracting progressively higher-level features.',
    correctBoolean: true,
  },
  {
    slug: 'tf-sensors-ai',
    type: 'TRUE_FALSE',
    title: 'Basic Sensors vs AI',
    prompt:
      'True or False: Any device containing an electronic temperature or motion sensor is automatically an Artificial Intelligence system.',
    topic: 'AI vs Automation',
    difficulty: 'EASY',
    sourcePage: '3',
    lessonId: 'm1-l1',
    objective: 'Separate basic sensing from pattern learning.',
    explanation:
      'False. Basic sensors capture raw readings without analyzing patterns or adapting decisions.',
    correctBoolean: false,
  },
  {
    slug: 'tf-unsupervised-labels',
    type: 'TRUE_FALSE',
    title: 'Label Requirement in Unsupervised Learning',
    prompt:
      'True or False: Unsupervised learning discovers hidden patterns or groupings using unlabelled input data.',
    topic: 'Learning Paradigms',
    difficulty: 'EASY',
    sourcePage: '12-13',
    lessonId: 'm1-l2',
    objective: 'Confirm unsupervised learning input structure.',
    explanation: 'True. Unsupervised methods cluster or organize unlabelled records.',
    correctBoolean: true,
  },
  {
    slug: 'tf-dl-more-data',
    type: 'TRUE_FALSE',
    title: 'Deep Learning Data Demand',
    prompt:
      'True or False: Deep Learning usually benefits from larger datasets and more compute than simple rule-based scripts or small linear models.',
    topic: 'Machine Learning vs Deep Learning',
    difficulty: 'MEDIUM',
    sourcePage: '10-11',
    lessonId: 'm1-l2',
    objective: 'Contrast resource demands of DL.',
    explanation:
      'True. Multi-layer networks have numerous parameters requiring substantial data and compute to generalize well.',
    correctBoolean: true,
  },

  // 5 FILL_BLANK
  {
    slug: 'fb-turing-test',
    type: 'FILL_BLANK',
    title: '1950 Machine Intelligence Pioneer',
    prompt:
      'Complete the statement: In 1950, ______ Turing posed the famous question "Can machines think?" and proposed an evaluation game for machine intelligence.',
    topic: 'Evolution of AI',
    difficulty: 'EASY',
    sourcePage: '3',
    lessonId: 'm1-l1',
    objective: 'Recall Alan Turing’s contribution.',
    explanation: 'Alan Turing introduced the imitation game (Turing Test) in 1950.',
    acceptedAnswers: ['Alan', 'Alan Turing'],
  },
  {
    slug: 'fb-nlg',
    type: 'FILL_BLANK',
    title: 'NLP Subfield Turning Data to Text',
    prompt:
      'The NLP subfield that converts structured information into coherent human-readable text or speech is called Natural Language ______ (abbreviated NLG).',
    topic: 'Domains of AI',
    difficulty: 'EASY',
    sourcePage: '7',
    lessonId: 'm1-l1',
    objective: 'Recall NLG terminology.',
    explanation: 'NLG stands for Natural Language Generation.',
    acceptedAnswers: ['Generation'],
  },
  {
    slug: 'fb-reinforcement-signal',
    type: 'FILL_BLANK',
    title: 'Feedback Signal in RL',
    prompt:
      'In Reinforcement Learning, an agent learns from an environment by adjusting actions to maximize cumulative ______.',
    topic: 'Learning Paradigms',
    difficulty: 'EASY',
    sourcePage: '13',
    lessonId: 'm1-l2',
    objective: 'Identify reward signal in RL.',
    explanation: 'Agents maximize cumulative rewards (and avoid penalties).',
    acceptedAnswers: ['reward', 'rewards'],
  },
  {
    slug: 'fb-hidden-layer',
    type: 'FILL_BLANK',
    title: 'Middle Layers of a Neural Network',
    prompt:
      'Between the input layer and output layer of an Artificial Neural Network lie one or more ______ layers.',
    topic: 'Neural Networks',
    difficulty: 'EASY',
    sourcePage: '9',
    lessonId: 'm1-l2',
    objective: 'Name intermediate ANN layers.',
    explanation: 'Hidden layers sit between input and output layers.',
    acceptedAnswers: ['hidden', 'hidden layers'],
  },
  {
    slug: 'fb-computer-vision',
    type: 'FILL_BLANK',
    title: 'Visual Perception AI Domain',
    prompt:
      'The domain of AI enabling machines to derive meaningful information from digital images and video is called Computer ______.',
    topic: 'Domains of AI',
    difficulty: 'EASY',
    sourcePage: '7',
    lessonId: 'm1-l1',
    objective: 'Name Computer Vision domain.',
    explanation: 'Computer Vision interprets visual media.',
    acceptedAnswers: ['Vision', 'Computer Vision'],
  },

  // 5 SHORT_ANSWER
  {
    slug: 'sa-timer-vs-ai',
    type: 'SHORT_ANSWER',
    title: 'Automation vs True AI Decision Support',
    prompt:
      'Explain in 2-3 sentences why an automatic streetlamp controlled solely by a 6:00 PM timer is automation rather than Artificial Intelligence.',
    topic: 'AI vs Automation',
    difficulty: 'EASY',
    sourcePage: '2-3',
    lessonId: 'm1-l1',
    objective: 'Articulate difference between rule-only automation and AI.',
    explanation: 'Rule-only schedules never learn from changing weather or ambient light data.',
    expectedPoints: [
      'Executes a fixed pre-programmed clock rule (6:00 PM)',
      'Does not learn patterns from historical sunset/weather/visibility data',
      'Cannot adapt automatically if storm darkness occurs earlier',
    ],
    sampleAnswer:
      'A 6:00 PM timer strictly follows one fixed rule regardless of real sky brightness or seasonal patterns. Because it does not analyze incoming evidence or adapt from data, it is fixed automation rather than AI.',
  },
  {
    slug: 'sa-ml-vs-dl-sort',
    type: 'SHORT_ANSWER',
    title: 'Traditional ML vs Deep Learning on Image Sorting',
    prompt:
      'Contrast how a traditional Machine Learning system and a Deep Learning model differ when sorting recyclable e-waste items from photographs.',
    topic: 'Machine Learning vs Deep Learning',
    difficulty: 'MEDIUM',
    sourcePage: '10-11',
    lessonId: 'm1-l2',
    objective: 'Explain manual feature engineering vs end-to-end feature extraction.',
    explanation:
      'Traditional ML relies on manually defined shape/colour descriptors, while DL learns visual representations across neural layers automatically.',
    expectedPoints: [
      'Traditional ML requires manual feature extraction (colour histograms, edges, dimensions)',
      'Deep Learning uses layered neural networks to discover features directly from images',
      'DL usually requires larger datasets and compute resources',
    ],
    sampleAnswer:
      'In traditional ML, humans hand-design features like aspect ratio or colour averages before training a classifier. Deep Learning eliminates manual feature design by learning pixel-to-object representations across hidden layers, though it needs more image data and compute.',
  },
  {
    slug: 'sa-three-domains-school',
    type: 'SHORT_ANSWER',
    title: 'Three AI Domains in a School Campus',
    prompt:
      'Propose one practical school campus use case each for Statistical Data, NLP and Computer Vision.',
    topic: 'Domains of AI',
    difficulty: 'EASY',
    sourcePage: '6-8',
    lessonId: 'm1-l1',
    objective: 'Apply all three domains constructively.',
    explanation:
      'Clear domain alignment maps tables->Statistical Data, text/chat->NLP, images->CV.',
    expectedPoints: [
      'Statistical Data: predicting canteen food demand from daily attendance tables',
      'NLP: multilingual helpdesk assistant answering parent timetable queries',
      'Computer Vision: checking safety equipment or microscope slide classification in lab classes',
    ],
  },
  {
    slug: 'sa-learning-paradigms',
    type: 'SHORT_ANSWER',
    title: 'Comparing Learning Settings',
    prompt:
      'Briefly distinguish Supervised, Unsupervised and Reinforcement Learning by naming the kind of feedback each algorithm receives.',
    topic: 'Learning Paradigms',
    difficulty: 'MEDIUM',
    sourcePage: '12-13',
    lessonId: 'm1-l2',
    objective: 'Summarize feedback signals across all three ML paradigms.',
    explanation:
      'Feedback signals distinguish labelled examples vs unlabelled pattern similarity vs trial-and-error rewards.',
    expectedPoints: [
      'Supervised: explicit ground-truth labels paired with inputs',
      'Unsupervised: no target labels; relies on similarity/structure in features',
      'Reinforcement: scalar reward/penalty feedback over environment interactions',
    ],
  },
  {
    slug: 'sa-oversight-reason',
    type: 'SHORT_ANSWER',
    title: 'Why High Accuracy Still Needs Human Oversight',
    prompt:
      'Why should a school or clinic never allow a 95%-accurate AI classifier to make irreversible decisions completely unsupervised?',
    topic: 'Limitations of AI',
    difficulty: 'MEDIUM',
    sourcePage: '14',
    lessonId: 'm1-l2',
    objective: 'Reason about asymmetric error costs and edge cases.',
    explanation:
      'The 5% error rate can systematically harm edge-case individuals or shift dangerously under new conditions.',
    expectedPoints: [
      'Even 5% error rate harms real people when decisions are irreversible',
      'Errors may cluster unevenly on minority or unfamiliar edge cases',
      'Systems lack common-sense context and ethical accountability',
    ],
  },

  // 2 LONG_CASE
  {
    slug: 'lc-hospital-triage',
    type: 'LONG_CASE',
    title: 'Case Study: Hospital Emergency Intake Assistant',
    prompt:
      'A regional clinic pilots an AI system that reads patient intake notes (text), summarizes past numeric vitals, and flags urgent chest X-rays for radiologists. Identify every AI domain involved, specify which learning paradigm suits each part, and propose three concrete human safeguards before clinical deployment.',
    topic: 'Domains & Oversight Case Study',
    difficulty: 'HARD',
    sourcePage: '6-14',
    lessonId: 'm1-l2',
    objective: 'Synthesize domains, learning paradigms and ethical safeguards.',
    explanation:
      'Combines NLP (intake text), Statistical Data (vitals) and Computer Vision (X-rays) using supervised models with human clinical sign-off.',
    expectedPoints: [
      'Identifies Statistical Data (vitals tables), NLP (intake notes), Computer Vision (X-rays)',
      'Explains Supervised learning using labelled clinician histories / validated diagnoses',
      'Safeguards: radiologist final decision (no auto-rejection), subgroup audit for bias, data privacy protection and clear error reporting path',
    ],
  },
  {
    slug: 'lc-smart-campus',
    type: 'LONG_CASE',
    title: 'Case Study: Evaluating "AI-Powered" Campus Tools',
    prompt:
      'Three vendors pitch products to your school: Vendor A sells a bell schedule running fixed SQL calendar triggers; Vendor B sells a camera-based lab safety detector checking goggles; Vendor C sells an unlabelled library-borrowing cluster engine grouping popular topics. Evaluate which are genuinely AI, classify their domains and paradigms, and highlight one risk for Vendors B and C.',
    topic: 'AI Identification Case Study',
    difficulty: 'HARD',
    sourcePage: '2-14',
    lessonId: 'm1-l1',
    objective: 'Critically separate automation from ML/CV systems.',
    explanation:
      'Vendor A is fixed rule automation; Vendor B is Supervised Computer Vision; Vendor C is Unsupervised Statistical/Text clustering.',
    expectedPoints: [
      'Vendor A is rule-based automation (no learning from data)',
      'Vendor B uses Computer Vision + Supervised learning; risks privacy/camera blind spots/lighting failure',
      'Vendor C uses Unsupervised clustering on borrowing data; risks opaque/arbitrary groupings or borrowing-privacy leaks',
    ],
  },

  // 2 PRACTICAL
  {
    slug: 'pr-audit-everyday-app',
    type: 'PRACTICAL',
    title: 'Practical: Map Input-Output-Oversight for Everyday AI',
    prompt:
      'Select a real-world app (e.g., email spam filter, voice navigation, or shopping recommender). Produce a structured 4-part technical audit detailing: (1) exact input data and domain, (2) predicted output & likely learning paradigm, (3) one plausible false-positive vs false-negative failure, and (4) user control mechanism allowing safe override.',
    topic: 'Practical AI Audit',
    difficulty: 'MEDIUM',
    sourcePage: '5-14',
    lessonId: 'm1-l1',
    objective: 'Conduct a structured component breakdown of an applied AI tool.',
    explanation:
      'Practical analysis connects input format -> model domain/paradigm -> asymmetric failure cost -> human recovery UI.',
    expectedPoints: [
      'Clear input type + AI domain mapping',
      'Identifies appropriate ML paradigm (usually Supervised)',
      'Contrasts false positive vs false negative cost realistically',
      'Specifies actionable human override/correction path',
    ],
  },
  {
    slug: 'pr-classify-tasks-matrix',
    type: 'PRACTICAL',
    title: 'Practical: Design a Task-to-Method Decision Table',
    prompt:
      'Create a decision plan for four distinct problems: (a) thermostat switching heater on below 18°C, (b) predicting daily solar panel output from weather logs, (c) grouping anonymous student study-time traces without pre-set labels, and (d) balancing a multi-joint robot arm walking on uneven floor. For each, specify AI vs Rule-Based, Learning Type, Required Evidence, and Verification Metric.',
    topic: 'Learning Paradigm Selection',
    difficulty: 'HARD',
    sourcePage: '3, 12-13',
    lessonId: 'm1-l2',
    objective: 'Select appropriate computational paradigm per task requirement.',
    explanation:
      'Task (a) is fixed rule; (b) Supervised Regression; (c) Unsupervised Clustering; (d) Reinforcement Learning.',
    expectedPoints: [
      '(a) Non-AI fixed rule threshold (<18°C)',
      '(b) Supervised learning using labelled weather-to-output histories',
      '(c) Unsupervised learning (clustering without pre-existing labels)',
      '(d) Reinforcement learning using sensor state actions & stability reward',
    ],
  },
]);
