import { buildModuleQuestions, type BankQuestionSpec } from './types.js';

export const m2Questions: BankQuestionSpec[] = buildModuleQuestions('m2-ai-careers', 2, [
  // 20 SINGLE_MCQ
  {
    slug: 'ml-engineer-role',
    type: 'SINGLE_MCQ',
    title: 'Machine Learning Engineer Focus',
    prompt: 'Which responsibility primarily defines a Machine Learning Engineer?',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '19',
    lessonId: 'm2-l1',
    objective: 'Identify core deliverables of an ML Engineer.',
    explanation:
      'ML Engineers bridge software engineering and data science to build and maintain scalable production ML models and data pipelines.',
    options: [
      { text: 'Writing ad copy for consumer billboards' },
      {
        text: 'Bridging software engineering and data science to deploy scalable ML models',
        correct: true,
      },
      { text: 'Maintaining physical school classroom projectors' },
      { text: 'Managing payroll spreadsheets exclusively by hand' },
    ],
  },
  {
    slug: 'data-scientist-role',
    type: 'SINGLE_MCQ',
    title: 'Data Scientist Core Function',
    prompt: 'How does a Data Scientist typically deliver value to an organization?',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '19',
    lessonId: 'm2-l1',
    objective: 'Define the Data Scientist role.',
    explanation:
      'Data Scientists combine statistics, SQL/Python analytics and predictive modelling to extract insights for decision-making.',
    options: [
      {
        text: 'Mining insights from large datasets using statistical analysis and predictive modelling',
        correct: true,
      },
      { text: 'Soldering custom circuit boards exclusively' },
      { text: 'Installing wall switches in office buildings' },
      { text: 'Filing physical paper receipts without metrics' },
    ],
  },
  {
    slug: 'bi-developer-role',
    type: 'SINGLE_MCQ',
    title: 'Business Intelligence Developer Role',
    prompt:
      'Which professional specializes in modelling data warehouses and dashboards to analyze business and market trends?',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '20',
    lessonId: 'm2-l1',
    objective: 'Recognize Business Intelligence Developer tasks.',
    explanation:
      'As outlined on p.20, BI Developers model structured datasets and build reporting dashboards analyzing business trends.',
    options: [
      { text: 'Robotics Hardware Assembler' },
      { text: 'Business Intelligence (BI) Developer', correct: true },
      { text: 'Automotive Paint Technician' },
      { text: 'Voice Actor' },
    ],
  },
  {
    slug: 'robotics-auto',
    type: 'SINGLE_MCQ',
    title: 'AI Career in Automotive & Manufacturing',
    prompt:
      'Which AI role applies directly to designing autonomous navigation and assembly automation in the automotive sector?',
    topic: 'Industry Opportunities',
    difficulty: 'EASY',
    sourcePage: '24, 27',
    lessonId: 'm2-l2',
    objective: 'Match AI roles to industries.',
    explanation:
      'Robotics Engineers and Autonomous Systems Engineers drive automated manufacturing and self-driving vehicle systems.',
    options: [
      { text: 'Robotics Engineer', correct: true },
      { text: 'Poetry Editor' },
      { text: 'Pastry Chef' },
      { text: 'Library Archivist' },
    ],
  },
  {
    slug: 'medical-imaging-role',
    type: 'SINGLE_MCQ',
    title: 'AI Opportunity in Healthcare',
    prompt:
      'A specialist analyzing CT scans and MRIs with computer-vision tools to support clinical diagnosis works primarily as a:',
    topic: 'Industry Opportunities',
    difficulty: 'EASY',
    sourcePage: '24',
    lessonId: 'm2-l2',
    objective: 'Recognize Healthcare AI careers.',
    explanation:
      'Medical Imaging Analysts apply Computer Vision methods to interpret radiology scans alongside clinicians.',
    options: [
      { text: 'Medical Imaging Analyst', correct: true },
      { text: 'E-commerce Fashion Stylist' },
      { text: 'Precision Irrigation Pilot' },
      { text: 'Sports Referee' },
    ],
  },
  {
    slug: 'agriculture-ai-role',
    type: 'SINGLE_MCQ',
    title: 'AI Opportunity in Agriculture',
    prompt:
      'Using drone imagery and soil sensor trends to optimize water and fertilizer use describes which emerging sector application?',
    topic: 'Industry Opportunities',
    difficulty: 'EASY',
    sourcePage: '24-25',
    lessonId: 'm2-l2',
    objective: 'Understand Precision Agriculture applications.',
    explanation:
      'Precision farming combines drone mapping and sensor analytics to raise yields while conserving water and nutrients.',
    options: [
      { text: 'High-frequency stock trading' },
      { text: 'Precision Agriculture & Mapping', correct: true },
      { text: 'Video-game soundtrack mixing' },
      { text: 'Banknote embossing' },
    ],
  },
  {
    slug: 'textile-ai-use',
    type: 'SINGLE_MCQ',
    title: 'AI in Textile Manufacturing',
    prompt: 'How do textile manufacturers frequently deploy AI vision systems on production lines?',
    topic: 'Industry Opportunities',
    difficulty: 'MEDIUM',
    sourcePage: '25',
    lessonId: 'm2-l2',
    objective: 'Identify industrial quality control applications.',
    explanation:
      'AI-powered inspection identifies weaving defects, supports fabric pattern design and tracks inventory.',
    options: [
      { text: 'Replacing physical looms entirely with cloud servers' },
      {
        text: 'Fabric defect quality control, pattern design and inventory forecasting',
        correct: true,
      },
      { text: 'Growing cotton crops directly inside spreadsheets' },
      { text: 'Eliminating cotton dyeing safety regulations' },
    ],
  },
  {
    slug: 'nlp-engineer-scope',
    type: 'SINGLE_MCQ',
    title: 'NLP Specialist Deliverable',
    prompt: 'Which engineering task falls squarely within an NLP Specialist’s domain?',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '20',
    lessonId: 'm2-l1',
    objective: 'Distinguish NLP Engineers from CV or BI specialists.',
    explanation:
      'NLP Engineers build speech recognition, translation, sentiment and conversational dialogue pipelines.',
    options: [
      {
        text: 'Building multilingual customer support chatbots and document extractors',
        correct: true,
      },
      { text: 'Welding chassis frames in an auto plant' },
      { text: 'Calibrating underwater acoustic sonar hardware' },
      { text: 'Designing architectural concrete pillars' },
    ],
  },
  {
    slug: 'core-toolkit-langs',
    type: 'SINGLE_MCQ',
    title: 'Essential Technical Toolkit for AI',
    prompt:
      'Which combination represents foundational technical skills highlighted in the handbook for aspiring AI builders?',
    topic: 'Professional Toolkit',
    difficulty: 'EASY',
    sourcePage: '21-22',
    lessonId: 'm2-l1',
    objective: 'Identify essential programming and analytical foundations.',
    explanation:
      'Programming fluency (especially Python and SQL), probability/linear algebra, data handling and ML libraries anchor the toolkit.',
    options: [
      { text: 'Python, SQL, probability/statistics and data manipulation tools', correct: true },
      { text: 'Exclusively memorizing hardware serial numbers' },
      { text: 'Avoiding mathematics entirely in favour of slide animations' },
      { text: 'Knowing only fixed keyboard shortcuts' },
    ],
  },
  {
    slug: 'soft-skills-ai',
    type: 'SINGLE_MCQ',
    title: 'Transferable Human Skills in AI Teams',
    prompt:
      'Why does the handbook emphasize communication and teamwork for AI engineers alongside coding?',
    topic: 'Professional Toolkit',
    difficulty: 'EASY',
    sourcePage: '21-22',
    lessonId: 'm2-l1',
    objective: 'Connect technical work to cross-functional collaboration.',
    explanation:
      'Engineers must translate metrics into plain language for stakeholders, collaborate with domain experts and document limitations honestly.',
    options: [
      { text: 'To persuade users to ignore known model flaws' },
      {
        text: 'To understand domain requirements and explain results and risks clearly',
        correct: true,
      },
      { text: 'Because Python syntax changes daily based on meetings' },
      { text: 'To bypass dataset testing requirements' },
    ],
  },
  {
    slug: 'domain-expert-value',
    type: 'SINGLE_MCQ',
    title: 'Importance of Domain Expertise',
    prompt:
      'When building an AI early-warning tool for rural crop pests, why is an agronomist or farmer essential on the team?',
    topic: 'Team Collaboration',
    difficulty: 'MEDIUM',
    sourcePage: '21-24',
    lessonId: 'm2-l1',
    objective: 'Explain why domain experts guide valid assumptions.',
    explanation:
      'Domain specialists validate whether collected signals and edge-case labels accurately reflect real seasonal field conditions.',
    options: [
      { text: 'To configure Kubernetes clusters manually' },
      {
        text: 'To verify biological assumptions, label accuracy and realistic field workflows',
        correct: true,
      },
      { text: 'To compile Python source code faster' },
      { text: 'To eliminate the need for field evaluation data' },
    ],
  },
  {
    slug: 'kdnuggets-resource',
    type: 'SINGLE_MCQ',
    title: 'Curated Learning Communities',
    prompt:
      'Which community platform cited in Unit 2 provides tutorials, analytics articles and ML career updates?',
    topic: 'Learning Resources',
    difficulty: 'MEDIUM',
    sourcePage: '26',
    lessonId: 'm2-l2',
    objective: 'Recognize credible open learning resources listed in the source.',
    explanation:
      'Unit 2 (p.26) specifically highlights platforms such as KDnuggets alongside structured online courses and documentation.',
    options: [
      { text: 'KDnuggets', correct: true },
      { text: 'A single-player arcade ROM archive' },
      { text: 'Unverified social rumour feeds' },
      { text: 'Legacy fax telephone directories' },
    ],
  },
  {
    slug: 'cv-engineer-task',
    type: 'SINGLE_MCQ',
    title: 'Computer Vision Engineer Focus',
    prompt: 'Which problem is most likely assigned to a Computer Vision Engineer?',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '20, 24',
    lessonId: 'm2-l1',
    objective: 'Match visual processing tasks to CV engineering.',
    explanation:
      'Visual quality inspection, facial/object recognition and video analytics belong to Computer Vision engineering.',
    options: [
      {
        text: 'Real-time circuit board solder inspection from assembly-line cameras',
        correct: true,
      },
      { text: 'Translating legal contracts between French and Hindi' },
      { text: 'Balancing general ledger spreadsheets' },
      { text: 'Optimizing relational database foreign keys' },
    ],
  },
  {
    slug: 'big-data-spark',
    type: 'SINGLE_MCQ',
    title: 'Handling Massive Datasets in Industry',
    prompt:
      'Which data technologies are cited in Unit 2 as valuable when Data Scientists or ML Engineers process massive distributed datasets?',
    topic: 'Professional Toolkit',
    difficulty: 'MEDIUM',
    sourcePage: '19',
    lessonId: 'm2-l1',
    objective: 'Recognize big-data tools referenced in career profiles.',
    explanation:
      'Unit 2 mentions distributed frameworks like Hadoop and Spark alongside SQL and Python for large-scale data pipelines.',
    options: [
      {
        text: 'Distributed frameworks such as Hadoop and Spark alongside SQL and Python',
        correct: true,
      },
      { text: 'Handwritten paper index cards only' },
      { text: 'Standalone digital stopwatches' },
      { text: 'Fixed dot-matrix printers' },
    ],
  },
  {
    slug: 'global-demand-driver',
    type: 'SINGLE_MCQ',
    title: 'Driver of Global Demand for AI Professionals',
    prompt:
      'What explains growing global demand for AI-literate professionals across diverse fields?',
    topic: 'Global Demand',
    difficulty: 'EASY',
    sourcePage: '19',
    lessonId: 'm2-l1',
    objective: 'Explain broad cross-industry adoption of AI.',
    explanation:
      'Organizations across healthcare, finance, transport, agriculture and retail adopt data-driven automation and analytics.',
    options: [
      { text: 'AI is restricted solely to university physics labs' },
      {
        text: 'Mainstream industries adopt data analytics and ML workflows requiring interdisciplinary skills',
        correct: true,
      },
      { text: 'AI systems completely maintain themselves forever once launched' },
      { text: 'Companies stopped using spreadsheets and websites' },
    ],
  },
  {
    slug: 'researcher-vs-eng',
    type: 'SINGLE_MCQ',
    title: 'AI Researcher vs Integration Engineer',
    prompt:
      'How does an AI Research Scientist typically differ from a Product Software Engineer integrating an AI API?',
    topic: 'AI Job Roles',
    difficulty: 'MEDIUM',
    sourcePage: '19-20',
    lessonId: 'm2-l1',
    objective: 'Compare foundational method exploration with application engineering.',
    explanation:
      'Researchers investigate novel algorithms and mathematical foundations, while software/ML engineers wrap validated models into reliable user products.',
    options: [
      { text: 'Researchers focus exclusively on CSS typography' },
      {
        text: 'Researchers develop new algorithms/theories while engineers integrate reliable systems into products',
        correct: true,
      },
      { text: 'Integration engineers invent new calculus proofs every morning' },
      { text: 'They perform identical work with different salaries' },
    ],
  },
  {
    slug: 'career-critique',
    type: 'SINGLE_MCQ',
    title: 'Evaluating Career Claims Critically',
    prompt:
      'When inspecting two job descriptions for AI internships, which habit best supports long-term career readiness?',
    topic: 'Learning Plan',
    difficulty: 'MEDIUM',
    sourcePage: '22, 26',
    lessonId: 'm2-l2',
    objective: 'Apply critical reasoning to career skill planning.',
    explanation:
      'Separating required foundational skills (Python, data reasoning, math) from trendy tool buzzwords and building testable small projects ensures durable competence.',
    options: [
      { text: 'Memorizing buzzwords without coding any verifiable project' },
      {
        text: 'Distinguishing core foundational skills from preferred tools and practicing small projects',
        correct: true,
      },
      { text: 'Ignoring mathematics and statistics altogether' },
      { text: 'Relying only on outdated blog headlines from 2010' },
    ],
  },
  {
    slug: 'governance-career-need',
    type: 'SINGLE_MCQ',
    title: 'Role of Security, Ethics & Governance Professionals',
    prompt: 'Why do mature AI teams involve security, privacy and governance specialists?',
    topic: 'Team Collaboration',
    difficulty: 'EASY',
    sourcePage: '21-22',
    lessonId: 'm2-l1',
    objective: 'Recognize non-coding governance roles in AI lifecycles.',
    explanation:
      'Governance and security colleagues ensure personal data protection, regulatory compliance, risk review and accountable oversight.',
    options: [
      {
        text: 'To enforce privacy, security controls, fairness reviews and regulatory accountability',
        correct: true,
      },
      { text: 'To hide accuracy drops from external auditors' },
      { text: 'To slow down unit testing intentionally' },
      { text: 'To remove human appeal rights from users' },
    ],
  },
  {
    slug: 'required-vs-tools',
    type: 'SINGLE_MCQ',
    title: 'Durability of Core Foundations',
    prompt:
      'Software libraries evolve rapidly every few years. Which competency remains durable across tool transitions?',
    topic: 'Professional Toolkit',
    difficulty: 'MEDIUM',
    sourcePage: '22',
    lessonId: 'm2-l2',
    objective: 'Value foundational thinking over single vendor syntax.',
    explanation:
      'Understanding data quality, experimental design, probability/programming fundamentals and error analysis transfers cleanly across frameworks.',
    options: [
      {
        text: 'Data reasoning, algorithmic logic, statistics and structured debugging',
        correct: true,
      },
      { text: 'Clicking buttons inside one proprietary wizard interface' },
      { text: 'Hardcoding credentials inside client scripts' },
      { text: 'Ignoring how missing values affect averages' },
    ],
  },
  {
    slug: 'drone-mapping-tech',
    type: 'SINGLE_MCQ',
    title: 'Mapping Technician in Precision Farming',
    prompt:
      'Which technical pairing describes the Precision Agriculture Mapping Technician role in Unit 2?',
    topic: 'Industry Opportunities',
    difficulty: 'MEDIUM',
    sourcePage: '25',
    lessonId: 'm2-l2',
    objective: 'Identify applied drone/spatial AI tasks.',
    explanation:
      'Mapping Technicians operate AI-enabled aerial drones and image analysis to chart crop stress and field boundaries.',
    options: [
      { text: 'Using AI-enabled drones and geospatial imaging to monitor crops', correct: true },
      { text: 'Composing automated piano music for greenhouses' },
      { text: 'Forecasting stock IPO prices inside barns' },
      { text: 'Replacing irrigation pipes with HTML code' },
    ],
  },

  // 5 MULTI_SELECT
  {
    slug: 'ai-roles-multi',
    type: 'MULTI_SELECT',
    title: 'Technical Roles in an AI Product Team',
    prompt:
      'Select ALL roles that directly contribute to designing, building and governing an AI product.',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '19-21',
    lessonId: 'm2-l1',
    objective: 'Identify interdisciplinary AI team composition.',
    explanation:
      'Data Scientists, ML Engineers, BI Developers and Domain/Ethics reviewers work together across the lifecycle.',
    options: [
      { text: 'Data Scientist', correct: true },
      { text: 'Machine Learning Engineer', correct: true },
      { text: 'Business Intelligence Developer', correct: true },
      { text: 'Domain Specialist & Ethics Reviewer', correct: true },
    ],
  },
  {
    slug: 'toolkit-skills-multi',
    type: 'MULTI_SELECT',
    title: 'Core AI Career Competencies',
    prompt:
      'Select ALL skills that strengthen long-term readiness across AI engineering and data science careers.',
    topic: 'Professional Toolkit',
    difficulty: 'EASY',
    sourcePage: '21-22',
    lessonId: 'm2-l1',
    objective: 'Identify both technical and transferable competencies.',
    explanation:
      'Technical literacy (Python, SQL, math) plus human skills (communication, curiosity, ethics) matter equally.',
    options: [
      { text: 'Python and SQL programming skills', correct: true },
      { text: 'Statistics and probability reasoning', correct: true },
      { text: 'Clear stakeholder communication & documentation', correct: true },
      { text: 'Skipping data checks to speed up launches' },
    ],
  },
  {
    slug: 'industries-using-ai',
    type: 'MULTI_SELECT',
    title: 'Industries Applying AI Today',
    prompt: 'Which industries covered in Unit 2 actively deploy specialized AI roles?',
    topic: 'Industry Opportunities',
    difficulty: 'EASY',
    sourcePage: '23-25',
    lessonId: 'm2-l2',
    objective: 'Recognize multi-sector AI career scope.',
    explanation:
      'Healthcare, Agriculture, Automotive/Robotics and Textiles all appear in Unit 2 sector breakdowns.',
    options: [
      { text: 'Healthcare (medical imaging and drug discovery)', correct: true },
      { text: 'Agriculture (crop health and drone mapping)', correct: true },
      { text: 'Textiles (defect detection and demand planning)', correct: true },
      { text: 'Automotive (autonomous sensing and robotics)', correct: true },
    ],
  },
  {
    slug: 'learning-habits-multi',
    type: 'MULTI_SELECT',
    title: 'Habits for a Strong Student AI Portfolio',
    prompt: 'Which activities help students build credible evidence of AI readiness?',
    topic: 'Learning Plan',
    difficulty: 'MEDIUM',
    sourcePage: '26',
    lessonId: 'm2-l2',
    objective: 'Identify verifiable student learning practices.',
    explanation:
      'Building documented small data projects, testing edge cases and reading reputable open guides demonstrate genuine skill.',
    options: [
      {
        text: 'Documenting small end-to-end data/code projects with limitations listed',
        correct: true,
      },
      {
        text: 'Consulting structured tutorials and verified technical documentation',
        correct: true,
      },
      { text: 'Comparing real job requirements across industries', correct: true },
      { text: 'Copying code without running or testing inputs' },
    ],
  },
  {
    slug: 'healthcare-ai-roles',
    type: 'MULTI_SELECT',
    title: 'AI Contributions in Healthcare',
    prompt: 'Select ALL valid applications of AI in Healthcare highlighted in Module 2.',
    topic: 'Industry Opportunities',
    difficulty: 'MEDIUM',
    sourcePage: '24',
    lessonId: 'm2-l2',
    objective: 'Identify concrete clinical AI applications.',
    explanation:
      'Medical imaging analysis, personalized care tools and accelerated drug discovery screening are key healthcare applications.',
    options: [
      { text: 'Medical imaging analysis assisting radiology review', correct: true },
      { text: 'Accelerated screening in drug discovery', correct: true },
      { text: 'Personalized patient risk support alongside clinicians', correct: true },
      { text: 'Eliminating informed patient consent completely' },
    ],
  },

  // 5 TRUE_FALSE
  {
    slug: 'tf-ai-only-coding',
    type: 'TRUE_FALSE',
    title: 'Non-Programming Needs in AI',
    prompt:
      'True or False: Only software programmers contribute usefully to AI projects; domain knowledge and UX design are irrelevant.',
    topic: 'Team Collaboration',
    difficulty: 'EASY',
    sourcePage: '21-22',
    lessonId: 'm2-l1',
    objective: 'Debunk the coding-only myth.',
    explanation:
      'False. Domain experts, UX designers, researchers and ethics/governance leads are indispensable.',
    correctBoolean: false,
  },
  {
    slug: 'tf-tools-over-context',
    type: 'TRUE_FALSE',
    title: 'Tool Mastery vs Problem Context',
    prompt:
      'True or False: Mastering a specific library removes the need to understand the real-world data or domain problem context.',
    topic: 'Professional Toolkit',
    difficulty: 'EASY',
    sourcePage: '21-22',
    lessonId: 'm2-l1',
    objective: 'Reinforce problem-first engineering thinking.',
    explanation:
      'False. Tools change continually; without domain understanding, models frequently optimize the wrong target.',
    correctBoolean: false,
  },
  {
    slug: 'tf-bi-vs-ml',
    type: 'TRUE_FALSE',
    title: 'BI Developer Data Focus',
    prompt:
      'True or False: Business Intelligence Developers design, model and maintain structured data sets and dashboards to analyze trends.',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '20',
    lessonId: 'm2-l1',
    objective: 'Verify BI Developer scope.',
    explanation: 'True. BI Developers structure reliable analytical datasets and visualizations.',
    correctBoolean: true,
  },
  {
    slug: 'tf-agri-drones',
    type: 'TRUE_FALSE',
    title: 'Drones & AI in Farming',
    prompt:
      'True or False: Precision agriculture uses AI-enabled aerial mapping and sensor data to identify crop stress early.',
    topic: 'Industry Opportunities',
    difficulty: 'EASY',
    sourcePage: '24-25',
    lessonId: 'm2-l2',
    objective: 'Verify agriculture sector examples.',
    explanation: 'True. Drones and imaging help detect water stress, weeds or pest hotspots early.',
    correctBoolean: true,
  },
  {
    slug: 'tf-continuous-learning',
    type: 'TRUE_FALSE',
    title: 'Continuous Learning Requirement',
    prompt:
      'True or False: Because AI techniques and guidelines evolve quickly, practitioners must continually inspect credible technical sources and practice.',
    topic: 'Learning Resources',
    difficulty: 'EASY',
    sourcePage: '26',
    lessonId: 'm2-l2',
    objective: 'Emphasize ongoing professional growth.',
    explanation:
      'True. Continuous practice and critical evaluation of new methods keep skills current.',
    correctBoolean: true,
  },

  // 5 FILL_BLANK
  {
    slug: 'fb-ml-engineer',
    type: 'FILL_BLANK',
    title: 'Role Bridging Data Science & Production Software',
    prompt:
      'A Machine Learning ______ bridges data science and software engineering to deploy scalable models handling real-time data.',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '19',
    lessonId: 'm2-l1',
    objective: 'Identify ML Engineer title.',
    explanation: 'Machine Learning Engineer connects research models to production systems.',
    acceptedAnswers: ['Engineer'],
  },
  {
    slug: 'fb-bi-short',
    type: 'FILL_BLANK',
    title: 'BI Acronym Meaning',
    prompt: 'In analytics career roles, BI stands for Business ______.',
    topic: 'AI Job Roles',
    difficulty: 'EASY',
    sourcePage: '20',
    lessonId: 'm2-l1',
    objective: 'Recall Business Intelligence expansion.',
    explanation: 'BI stands for Business Intelligence.',
    acceptedAnswers: ['Intelligence'],
  },
  {
    slug: 'fb-medical-imaging',
    type: 'FILL_BLANK',
    title: 'Healthcare Vision Specialist',
    prompt:
      'In Healthcare AI, a Medical ______ Analyst interprets radiological scans like X-rays and MRIs using computer vision tools.',
    topic: 'Industry Opportunities',
    difficulty: 'EASY',
    sourcePage: '24',
    lessonId: 'm2-l2',
    objective: 'Identify Medical Imaging Analyst.',
    explanation: 'Medical Imaging Analysts inspect scan images with assistive models.',
    acceptedAnswers: ['Imaging'],
  },
  {
    slug: 'fb-sql-language',
    type: 'FILL_BLANK',
    title: 'Query Language for Structured Tables',
    prompt:
      'Alongside Python, Data Scientists routinely use ______ (Structured Query Language) to filter and aggregate tabular databases.',
    topic: 'Professional Toolkit',
    difficulty: 'EASY',
    sourcePage: '19, 22',
    lessonId: 'm2-l1',
    objective: 'Identify SQL in data workflows.',
    explanation: 'SQL queries relational databases cleanly.',
    acceptedAnswers: ['SQL'],
  },
  {
    slug: 'fb-domain-expert',
    type: 'FILL_BLANK',
    title: 'Subject-Matter Partner',
    prompt:
      'A ______ specialist verifies that AI model assumptions, metrics and labels match real-world clinical, farm or classroom reality.',
    topic: 'Team Collaboration',
    difficulty: 'EASY',
    sourcePage: '21-22',
    lessonId: 'm2-l1',
    objective: 'Name domain specialist.',
    explanation: 'Domain specialists anchor model assumptions to real practice.',
    acceptedAnswers: ['domain', 'subject'],
  },

  // 5 SHORT_ANSWER
  {
    slug: 'sa-ds-vs-mle',
    type: 'SHORT_ANSWER',
    title: 'Contrast Data Scientist and ML Engineer',
    prompt:
      'Distinguish between the day-to-day focus of a Data Scientist and a Machine Learning Engineer on a joint project.',
    topic: 'AI Job Roles',
    difficulty: 'MEDIUM',
    sourcePage: '19',
    lessonId: 'm2-l1',
    objective: 'Differentiate exploration/modelling vs production deployment.',
    explanation:
      'Data Scientists explore patterns and test predictive hypotheses; ML Engineers harden pipelines for scale, latency and reliability.',
    expectedPoints: [
      'Data Scientist focuses on data exploration, statistics, feature investigation and insight modelling',
      'ML Engineer focuses on scalable pipelines, software reliability, monitoring and production deployment',
      'Both collaborate closely on data quality and evaluation metrics',
    ],
  },
  {
    slug: 'sa-team-roles-school',
    type: 'SHORT_ANSWER',
    title: 'Assigning AI Team Roles for a Library Assistant',
    prompt:
      'Your school wants an AI search tool for its multi-lingual library catalogue. Name three team roles required and one key decision each role owns.',
    topic: 'Team Collaboration',
    difficulty: 'EASY',
    sourcePage: '19-22',
    lessonId: 'm2-l1',
    objective: 'Map roles to realistic responsibilities.',
    explanation:
      'Requires Librarian (domain validation), NLP/ML Engineer (model indexing & API), UX/Security Reviewer (student search usability & privacy).',
    expectedPoints: [
      'Domain Specialist (Librarian): defines book taxonomy and search relevance checks',
      'ML/NLP Engineer: builds indexing/query pipeline and tests latency',
      'UX or Governance Reviewer: ensures clear fallback for failed searches and safeguards borrowing privacy',
    ],
  },
  {
    slug: 'sa-agri-benefit',
    type: 'SHORT_ANSWER',
    title: 'AI Opportunity in Sustainable Farming',
    prompt:
      'Describe how two distinct AI techniques can help farmers save water and prevent crop losses.',
    topic: 'Industry Opportunities',
    difficulty: 'MEDIUM',
    sourcePage: '24-25',
    lessonId: 'm2-l2',
    objective: 'Apply industry case reasoning to agriculture.',
    explanation:
      'Combines vision/drone imaging for disease detection with statistical sensor analytics for targeted irrigation.',
    expectedPoints: [
      'Drone/camera Computer Vision spots leaf blight or pest outbreaks early',
      'Statistical sensor forecasting estimates soil moisture to irrigate only dry zones',
    ],
  },
  {
    slug: 'sa-learning-plan',
    type: 'SHORT_ANSWER',
    title: 'Designing a Credible Beginner Roadmap',
    prompt:
      'Outline a 3-step beginner learning pathway for a secondary school student aiming for an entry-level data analyst or AI engineering role.',
    topic: 'Learning Plan',
    difficulty: 'EASY',
    sourcePage: '22, 26',
    lessonId: 'm2-l2',
    objective: 'Build structured skill progression.',
    explanation:
      'Progresses from Python + statistics + SQL -> cleaning real small datasets -> documented reproducible project with clear limits.',
    expectedPoints: [
      'Step 1: Python fundamentals, descriptive statistics and SQL data queries',
      'Step 2: Data cleaning, visualization and baseline modelling with small public CSVs',
      'Step 3: Publish 1-2 documented projects highlighting evaluation, edge cases and ethical considerations',
    ],
  },
  {
    slug: 'sa-textile-qc',
    type: 'SHORT_ANSWER',
    title: 'Quality Control & Inventory in Textiles',
    prompt:
      'Why is combining visual inspection models with inventory forecasting useful in a textile factory?',
    topic: 'Industry Opportunities',
    difficulty: 'MEDIUM',
    sourcePage: '25',
    lessonId: 'm2-l2',
    objective: 'Connect technical capabilities to business impact.',
    explanation:
      'Vision catches defects earlier reducing waste, while demand/inventory analytics prevents overproduction.',
    expectedPoints: [
      'Visual defect detection flags torn/misprinted cloth before downstream cutting waste',
      'Demand/inventory models align yarn ordering with realistic customer demand',
    ],
  },

  // 2 LONG_CASE
  {
    slug: 'lc-clinic-hiring-team',
    type: 'LONG_CASE',
    title: 'Case Study: Building an Interdisciplinary Health Analytics Team',
    prompt:
      'A public hospital network wants to predict patient appointment no-shows so clinics can offer open slots earlier, while also scanning diagnostic imaging backlogs. They plan to hire only two fresh coders and skip domain or governance involvement. Critique this staffing plan, recommend an interdisciplinary team covering at least four Unit 2 roles, and specify how each role protects accuracy and fairness.',
    topic: 'Interdisciplinary Team Case Study',
    difficulty: 'HARD',
    sourcePage: '19-24',
    lessonId: 'm2-l1',
    objective: 'Design safe cross-functional AI project teams.',
    explanation:
      'Over-indexing purely on raw coding ignores clinical workflow, appointment access equity and reliable MLOps maintenance.',
    expectedPoints: [
      'Critiques lack of clinical domain context, BI/data engineering and ethics/privacy oversight',
      'Specifies Data Scientist, ML/CV Engineer, Clinical Domain Expert and Ethics/Privacy Lead',
      'Explains risk: no-show models may penalize low-income patients lacking flexible transit unless domain & ethics checks audit policy rules',
    ],
  },
  {
    slug: 'lc-industry-pivot',
    type: 'LONG_CASE',
    title: 'Case Study: Comparing Career Tracks Across Sectors',
    prompt:
      'Compare AI career pathways in Healthcare versus Automotive/Robotics across four dimensions: (1) typical data types handled, (2) primary technical skills required, (3) domain regulations & safety stakes, and (4) how a high school student can begin exploring either track responsibly this year.',
    topic: 'Cross-Industry Career Analysis',
    difficulty: 'MEDIUM',
    sourcePage: '22-26',
    lessonId: 'm2-l2',
    objective: 'Synthesize multi-sector skill mapping.',
    explanation:
      'Contrasts medical imaging/EHR privacy vs real-time sensor/robotics latency and physical safety.',
    expectedPoints: [
      'Data contrast: DICOM imaging + EHR clinical tables vs LiDAR/camera streams + actuator telemetry',
      'Core shared Python/math/ML toolkit plus sector tools (clinical stats vs embedded robotics/control)',
      'Safety stakes: clinical diagnostic accuracy/HIPAA-grade privacy vs physical collision safety',
      'Actionable student exploration plan grounded in public verified datasets and coursework',
    ],
  },

  // 2 PRACTICAL
  {
    slug: 'pr-job-ad-breakdown',
    type: 'PRACTICAL',
    title: 'Practical: Job Requirement Matrix & Gap Plan',
    prompt:
      'Suppose a job posting for Junior ML Engineer lists: Python, SQL, Pandas/NumPy, REST API deployment, Git testing, model drift monitoring, and cross-team presentation. Categorize these seven skills into (a) Foundational CS/Math, (b) Data & ML Engineering, and (c) Collaboration/Operations, then design a focused 4-week study sprint covering two identified personal gaps.',
    topic: 'Skill Mapping Practical',
    difficulty: 'MEDIUM',
    sourcePage: '19-22, 26',
    lessonId: 'm2-l2',
    objective: 'Turn real role criteria into concrete learning milestones.',
    explanation: 'Produces clear skill categorization and measurable weekly deliverables.',
    expectedPoints: [
      'Accurate grouping across CS/Git, Data/ML pipelines, API/Ops and communication',
      'Concrete 4-week sprint goals with verifiable exercises/tests rather than vague reading',
    ],
  },
  {
    slug: 'pr-project-charter-roles',
    type: 'PRACTICAL',
    title: 'Practical: Role Collaboration Matrix for School Transit AI',
    prompt:
      'Draft a RACI-style collaboration mini-charter for building a school bus delay estimator. Include four roles (Data Analyst, ML Engineer, Transport Supervisor, Student/Parent Representative) and define for each: Owned Deliverable, Required Input Data, Quality Sign-Off Gate, and Consulted Partner.',
    topic: 'AI Team Workflow Practical',
    difficulty: 'MEDIUM',
    sourcePage: '19-22',
    lessonId: 'm2-l1',
    objective: 'Operationalize multidisciplinary ownership.',
    explanation: 'Connects roles to explicit inputs, quality gates and stakeholder sign-off.',
    expectedPoints: [
      'All four roles clearly assigned concrete deliverables and dependencies',
      'Includes privacy check on GPS/student pickup details and accuracy check against historical schedules',
    ],
  },
]);
