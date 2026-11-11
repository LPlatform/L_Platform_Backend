export interface CourseLesson {
  title: string;
  content: string;
  activity: string;
}

export interface CourseModule {
  id: string;
  title: string;
  sourcePages: string;
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
  modules: CourseModule[];
} = {
  id: 'ai-readiness',
  title: 'AI Readiness Course',
  description:
    'A practical introduction to artificial intelligence, data, programming, machine learning, language technologies, project work and responsible AI.',
  attribution:
    'Adapted as original student-facing explanations from the Central Board of Secondary Education, Artificial Intelligence Curriculum Student Handbook, Subject Code 843. Page ranges refer to the printed page numbers. Explanations here are paraphrases, not quotations.',
  sourceTitle: 'Artificial Intelligence Curriculum Student Handbook (Subject Code 843)',
  modules: [
    {
      id: 'm1-ai-foundations',
      title: 'Introduction to Artificial Intelligence',
      sourcePages: '1-17',
      introduction:
        'AI is a family of computer methods that use data, rules or feedback to help perform tasks such as recognizing patterns, understanding language and making predictions. A useful AI solution begins with a human problem and must be judged by both its results and its effects.',
      objectives: [
        'Explain AI with examples and non-examples.',
        'Distinguish AI, machine learning and deep learning.',
        'Compare data, language and vision domains.',
        'Describe benefits, limits and human oversight needs.',
      ],
      concepts: [
        'AI and automation',
        'AI history and types',
        'Statistical data',
        'Natural language processing',
        'Computer vision',
        'Machine learning',
        'Deep learning',
        'Prediction and classification',
      ],
      lessons: [
        {
          title: 'What AI can and cannot do',
          content:
            'Start with a task: identify what information is available, what output is useful, and who is affected. A fixed calculator follows explicit instructions; a learned classifier estimates a label from examples. Neither system understands the world in the human sense. AI performance depends on the task, training evidence and conditions at use time.',
          activity:
            'List five everyday systems. For each, identify its input, output, the pattern it may use, and one situation where a person should check its result.',
        },
        {
          title: 'Domains and learning approaches',
          content:
            'Statistical-data systems find patterns in tables and measurements. Language systems process words and speech; vision systems process images or video. Machine learning derives a model from examples. Deep learning uses layered neural networks and can learn complex representations, but may require substantial data and computing. Supervised learning uses labelled examples, unsupervised learning explores structure without supplied labels, and reinforcement learning learns from actions and feedback.',
          activity:
            'Sort example tasks into data, language or vision. Then decide whether each is better described as a fixed rule, supervised learning, unsupervised learning or reinforcement learning.',
        },
      ],
      revisionNotes: [
        'Define AI by the task and method rather than by a product label.',
        'AI, machine learning and deep learning are related, nested ideas, not synonyms.',
        'A prediction is an estimate; its usefulness and error costs depend on context.',
        'Human review, privacy and explainability matter in consequential settings.',
      ],
      practice: [
        'Explain why a timer is automation but not necessarily AI.',
        'Compare one benefit and one limitation of image recognition.',
        'Give an example where a human should override an AI recommendation.',
      ],
    },
    {
      id: 'm2-ai-careers',
      title: 'Careers and Opportunities in AI',
      sourcePages: '18-27',
      introduction:
        'AI work happens across many industries and requires teams with different strengths. Technical roles build and maintain systems; domain experts, designers, researchers and governance professionals help ensure that systems solve real problems responsibly.',
      objectives: [
        'Describe a range of AI-related roles.',
        'Map technical and transferable skills to work tasks.',
        'Investigate an industry use case and its constraints.',
        'Plan a small personal learning pathway.',
      ],
      concepts: [
        'Data analyst',
        'ML engineer',
        'AI researcher',
        'Product and UX roles',
        'Domain expertise',
        'Communication',
        'Ethics and governance',
      ],
      lessons: [
        {
          title: 'Roles in an AI team',
          content:
            'A data analyst prepares and explains evidence. A data scientist explores data and builds models. An ML engineer turns models into reliable services. A software developer integrates those services into a product. A domain specialist checks whether assumptions fit the real setting. Product, design, security and policy colleagues consider usability, risk and accountability. Job titles vary; the work and collaboration are more informative than the label.',
          activity:
            'Choose a local problem and assign at least four team roles. For each role, write one decision it should own and one teammate it must consult.',
        },
        {
          title: 'Skills and a learning plan',
          content:
            'Useful foundations include programming, data reasoning, mathematics, communication, teamwork and careful documentation. Tools change, so practice learning unfamiliar tools and explaining results clearly. A career investigation should check reliable current sources, distinguish required skills from preferred ones, and notice how opportunity and access vary.',
          activity:
            'Compare two current job descriptions from different industries. Record recurring skills, one difference, and a beginner project that could demonstrate one shared skill.',
        },
      ],
      revisionNotes: [
        'AI teams combine technical skills with subject knowledge and communication.',
        'A tool is not a substitute for understanding data and problem context.',
        'Career claims should be checked against current, credible sources.',
      ],
      practice: [
        'Explain why an AI project needs domain expertise.',
        'Select a role for checking dataset quality and justify your choice.',
        'Write a three-step learning plan tied to a role you want to explore.',
      ],
    },
    {
      id: 'm3-python',
      title: 'Python Programming',
      sourcePages: '28-54',
      introduction:
        'Python provides a readable way to express algorithms and analyze data. This module moves from expressions and control flow to collections, files and introductory scientific libraries. Programs should be tested with ordinary, boundary and invalid inputs.',
      objectives: [
        'Use variables, data types, operators and strings.',
        'Write conditions, loops and list operations.',
        'Read and process simple CSV data.',
        'Explain introductory uses of NumPy, Pandas and Scikit-learn.',
      ],
      concepts: [
        'Tokens and expressions',
        'Variables and constants',
        'Types and operators',
        'Strings and lists',
        'Selection and iteration',
        'CSV',
        'NumPy arrays',
        'Pandas tables',
        'Scikit-learn workflow',
      ],
      lessons: [
        {
          title: 'Build a small algorithm',
          content:
            'Break a task into input, processing and output. Variables name values; types determine which operations are sensible. Conditions choose a path and loops repeat a process. Lists collect ordered values. Clear names and small functions make a program easier to inspect and test.',
          activity:
            'Write a program plan that reads three quiz marks, rejects values outside the allowed range, computes the mean and reports a band. Test minimum, maximum and invalid values.',
        },
        {
          title: 'Files and data libraries',
          content:
            'CSV stores rows and columns as text, so programs must handle headers, missing cells and numeric conversion. NumPy provides efficient arrays and mathematical operations. Pandas provides labelled tables useful for filtering, summarizing and cleaning records. Scikit-learn offers model-building tools; a responsible workflow separates training and evaluation data and compares results against a simple baseline.',
          activity:
            'With a small hand-made CSV, count records, identify a missing value, compute a column average, and describe how you would prevent the label column from leaking into model inputs.',
        },
      ],
      revisionNotes: [
        'Trace code using sample values before running it.',
        'A loop needs a clear stopping condition.',
        'CSV values are text until converted.',
        'Keep training and evaluation evidence separate.',
      ],
      practice: [
        'Predict the output of a short loop and explain each iteration.',
        'Write pseudocode to count values above a threshold.',
        'Explain why a model should be compared with a baseline.',
      ],
    },
    {
      id: 'm4-capstone',
      title: 'Introduction to Capstone Projects',
      sourcePages: '55-70',
      introduction:
        'A capstone brings learning together around a meaningful problem. A strong project is scoped to available time and evidence, includes the people affected, and tests whether the proposed solution is useful and responsible.',
      objectives: [
        'Identify and scope a problem.',
        'Map stakeholders and data needs.',
        'Plan, build and evaluate a prototype.',
        'Present limitations and next steps honestly.',
      ],
      concepts: [
        'Problem framing',
        'Stakeholders',
        'Data requirements',
        'Prototype',
        'Evaluation',
        'Iteration',
        'Presentation',
      ],
      lessons: [
        {
          title: 'From concern to project question',
          content:
            'Begin with a real situation, not an assumed need for AI. Ask who experiences the problem, what evidence describes it, and what a successful outcome would mean. Narrow the scope to a question that can be explored with safe, available data. Consider a non-AI solution as a comparison.',
          activity:
            'Create a problem statement with a user group, context, measurable need and out-of-scope boundary. Interview or observe stakeholders only with appropriate permission.',
        },
        {
          title: 'Plan, evaluate and communicate',
          content:
            'A project plan identifies data, roles, milestones, risks and a simple prototype. Evaluation checks whether the prototype meets criteria and where it fails. Present the process, evidence, limitations and ethical decisions. A polished demo is not proof of real-world effectiveness.',
          activity:
            'Draft a one-page project canvas: problem, stakeholders, data, baseline, prototype, evaluation measure, risks, and a next iteration.',
        },
      ],
      revisionNotes: [
        'The problem and affected people come before the technology.',
        'Scope should match evidence and available time.',
        'Evaluation criteria should be defined before interpreting results.',
        'Report limitations and risks alongside successes.',
      ],
      practice: [
        'Turn a broad idea into a testable project question.',
        'Identify a stakeholder who might disagree with your solution.',
        'Choose an evaluation measure and explain what it misses.',
      ],
    },
    {
      id: 'm5-data-literacy',
      title: 'Data Literacy',
      sourcePages: '71-98',
      introduction:
        'Data literacy is the ability to ask useful questions of data, understand how observations were collected, assess quality, analyze patterns and communicate findings without overstating what the evidence proves.',
      objectives: [
        'Compare primary and secondary data.',
        'Identify measurement types and quality concerns.',
        'Plan collection with privacy and consent in mind.',
        'Clean, summarize, visualize and interpret data.',
      ],
      concepts: [
        'Data sources',
        'Population and sample',
        'Measurement scales',
        'Quality and missingness',
        'Preprocessing',
        'Descriptive statistics',
        'Matrices',
        'Visualization',
      ],
      lessons: [
        {
          title: 'Collection, quality and representation',
          content:
            'Primary data is collected for a particular investigation; secondary data was collected earlier for another purpose. A sample may not represent the population. Measurements can be categorical or numerical and have different valid operations. Check provenance, coverage, accuracy, timeliness, missing values, duplicates and possible bias before analysis.',
          activity:
            'Design a short survey for a school question. Define the population, sampling method, variables and consent notice; identify two groups likely to be underrepresented.',
        },
        {
          title: 'Preprocessing and interpretation',
          content:
            'Preprocessing documents how missing or inconsistent records are handled. Summaries such as counts, averages and ranges describe different aspects of data. A visualization should make comparisons legible without hiding scale or uncertainty. Association does not by itself establish cause, and conclusions should match the collection method.',
          activity:
            'Make two charts from a small dataset, then explain which one communicates the question more fairly and what uncertainty remains.',
        },
      ],
      revisionNotes: [
        'Ask who and what are absent from a dataset.',
        'Document cleaning choices so analysis can be reviewed.',
        'Choose summaries and charts that match variable types.',
        'Correlation alone does not prove causation.',
      ],
      practice: [
        'Distinguish a population from a sample in a classroom poll.',
        'Explain one risk of replacing every missing value with zero.',
        'Describe how a misleading axis could distort a chart.',
      ],
    },
    {
      id: 'm6-machine-learning',
      title: 'Machine Learning Algorithms',
      sourcePages: '99-122',
      introduction:
        'Machine learning uses examples or interaction to improve a task-specific model. This module compares learning settings and introduces regression, classification and clustering through small, interpretable examples.',
      objectives: [
        'Compare supervised, unsupervised and reinforcement learning.',
        'Distinguish regression from classification.',
        'Explain correlation and linear regression at an introductory level.',
        'Describe KNN and K-Means and their limitations.',
      ],
      concepts: [
        'Features and labels',
        'Training and testing',
        'Regression',
        'Correlation',
        'Classification',
        'K-nearest neighbours',
        'Clustering',
        'K-Means',
        'Reward and feedback',
      ],
      lessons: [
        {
          title: 'Choose a learning task',
          content:
            'Supervised learning uses examples paired with target labels or values. Classification predicts a category; regression predicts a numeric value. Unsupervised learning explores structure without target labels, such as grouping similar observations. Reinforcement learning studies action choices and feedback over time. The method should follow the question and available evidence.',
          activity:
            'For four scenarios, state the input, desired output, learning setting and one potential consequence of an incorrect result.',
        },
        {
          title: 'Compare simple algorithms',
          content:
            'Linear regression models a numeric relationship with a line and should be checked for assumptions and unusual points. Correlation describes how variables vary together but does not establish cause. KNN predicts from nearby labelled examples and depends on distance and feature scale. K-Means assigns points to a chosen number of clusters; clusters are mathematical groupings, not automatically meaningful categories.',
          activity:
            'Use a tiny two-feature dataset to manually find the nearest neighbours of one point, then rescale a feature and discuss whether its prediction changes.',
        },
      ],
      revisionNotes: [
        'Choose metrics that reflect the task and error costs.',
        'Keep evaluation examples out of training.',
        'Feature scaling can matter for distance-based methods.',
        'A cluster label needs human interpretation.',
      ],
      practice: [
        'Select regression or classification for three prediction questions.',
        'Explain why correlation cannot establish a cause.',
        'Describe one way K-Means can produce an unhelpful grouping.',
      ],
    },
    {
      id: 'm7-language-nlp',
      title: 'Linguistics and Natural Language Processing',
      sourcePages: '123-136',
      introduction:
        'Natural Language Processing (NLP) applies computational methods to human language. Language meaning depends on structure, context and intent, so a system can process text patterns while still misunderstanding a person.',
      objectives: [
        'Explain why language is difficult for computers.',
        'Describe lexical, syntactic, semantic, discourse and pragmatic analysis.',
        'Compare sentiment and text classification tasks.',
        'Outline a basic chatbot interaction.',
      ],
      concepts: [
        'Token and lexicon',
        'Syntax',
        'Semantics',
        'Discourse',
        'Pragmatics',
        'Sentiment',
        'Intent and entity',
        'Dialogue state',
      ],
      lessons: [
        {
          title: 'Layers of language analysis',
          content:
            'Lexical analysis identifies words or tokens. Syntactic analysis considers how words form grammatical structures. Semantic analysis estimates meaning, while discourse links meaning across sentences. Pragmatics considers the speaker, purpose and situation. Ambiguity, idiom, dialect and missing context make language understanding challenging.',
          activity:
            'Write one sentence with two possible meanings. Explain what context would disambiguate it and what a text-only system might miss.',
        },
        {
          title: 'Classification and dialogue systems',
          content:
            'Sentiment analysis estimates an attitude or emotion from text; text classification assigns a label such as topic. A chatbot may map an utterance to an intent, identify entities, update dialogue state and choose a response. These components can fail on sarcasm, unfamiliar language or out-of-scope requests; users need a clear way to correct or reach a person.',
          activity:
            'Design a three-turn school-library chatbot flow. List intents, entities, one ambiguous input and a safe fallback response.',
        },
      ],
      revisionNotes: [
        'Word patterns are not the same as full human understanding.',
        'Intent is the goal of an utterance; entities are details within it.',
        'Test language systems on varied speakers and contexts.',
        'Provide a clear fallback for uncertain predictions.',
      ],
      practice: [
        'Give an example of ambiguity that requires context.',
        'Separate intent from entity in a request to reserve a book.',
        'Name one limitation of sentiment classification.',
      ],
    },
    {
      id: 'm8-ai-ethics',
      title: 'AI Ethics and Values',
      sourcePages: '137-150',
      introduction:
        'Responsible AI asks how a system affects people throughout its design and use. The handbook presents five pillars: explainability, fairness, robustness, transparency and privacy. These principles require evidence, safeguards and accountable human decisions.',
      objectives: [
        'Explain the five ethics pillars identified in the source.',
        'Identify how data and design choices can create bias.',
        'Propose ways to detect and mitigate unequal outcomes.',
        'Describe the role of policy and accountability.',
      ],
      concepts: [
        'Explainability',
        'Fairness',
        'Robustness',
        'Transparency',
        'Privacy',
        'Bias sources',
        'Mitigation',
        'AI policy',
        'Ethical dilemma',
      ],
      lessons: [
        {
          title: 'The five pillars',
          content:
            'Explainability helps people understand reasons and limits behind outputs. Fairness considers whether benefits and errors are distributed unjustly. Robustness concerns dependable behavior across conditions. Transparency communicates how a system is designed and used. Privacy protects people’s information and control over it. The pillars can conflict; teams should document trade-offs and keep accountable human oversight.',
          activity:
            'Evaluate a hypothetical attendance-risk tool against all five pillars. Write one question and one safeguard for each.',
        },
        {
          title: 'Bias, mitigation and policy',
          content:
            'Bias can enter through historical records, who is represented, how labels are assigned, which features are selected and how a system is deployed. Compare outcomes across relevant groups, inspect data and collection practices, involve affected people, and test mitigations. No metric removes every value judgment. Policies should assign responsibilities, set review points and provide remedies when people are harmed.',
          activity:
            'Review a fictional screening system that performs worse for one group. Map possible bias sources and propose a measurement, mitigation and appeal process.',
        },
      ],
      revisionNotes: [
        'Bias is a system and data problem, not just a coding mistake.',
        'Fairness needs context and affected-community input.',
        'Transparency and explainability are related but distinct.',
        'Privacy and robustness must be considered across the lifecycle.',
      ],
      practice: [
        'Distinguish transparency from explainability.',
        'Suggest an audit for group-level differences in error rates.',
        'Describe who should be accountable when an AI decision causes harm.',
      ],
    },
  ],
};
