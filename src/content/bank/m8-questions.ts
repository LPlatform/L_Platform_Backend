import { buildModuleQuestions, type BankQuestionSpec } from './types.js';

export const m8Questions: BankQuestionSpec[] = buildModuleQuestions('m8-ai-ethics', 8, [
  // 20 SINGLE_MCQ
  {
    slug: 'ai-ethics-focus',
    type: 'SINGLE_MCQ',
    title: 'Core Purpose of AI Ethics',
    prompt: 'What is the primary focus of AI Ethics as introduced in Unit 8?',
    topic: 'Ethics in AI',
    difficulty: 'EASY',
    sourcePage: '138, 147',
    lessonId: 'm8-l1',
    objective: 'Define AI Ethics.',
    explanation:
      'AI Ethics guides the design, development and deployment of AI technologies according to moral principles such as fairness, transparency, privacy and accountability.',
    options: [
      { text: 'Maximizing shareholder revenue regardless of community impact' },
      {
        text: 'Guiding the development and deployment of AI systems according to moral principles and human well-being',
        correct: true,
      },
      { text: 'Eliminating legal accountability for automated decisions' },
      { text: 'Focusing solely on GPU processing benchmarks' },
    ],
  },
  {
    slug: 'pillar-explainability',
    type: 'SINGLE_MCQ',
    title: 'Explainability Pillar of AI Ethics',
    prompt:
      'Which AI ethics pillar ensures people affected by a system (such as a loan rejection or medical risk alert) can understand why the system produced that output?',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Define Explainability.',
    explanation:
      'Explainability makes model reasoning understandable in human terms rather than leaving decisions opaque.',
    options: [
      { text: 'Explainability', correct: true },
      { text: 'Hardware Redundancy' },
      { text: 'Data Compression' },
      { text: 'Infinite Scaling' },
    ],
  },
  {
    slug: 'pillar-fairness',
    type: 'SINGLE_MCQ',
    title: 'Fairness Pillar Meaning',
    prompt:
      'Ensuring an AI system distributes benefits accurately and avoids unjust discrimination across gender, race, age or socioeconomic groups captures which pillar?',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139, 141',
    lessonId: 'm8-l1',
    objective: 'Define Fairness.',
    explanation:
      'Fairness demands treating populations equitably and actively checking for skewed subgroup harms.',
    options: [
      { text: 'Fairness', correct: true },
      { text: 'Compression' },
      { text: 'Randomness' },
      { text: 'Secrecy' },
    ],
  },
  {
    slug: 'pillar-robustness',
    type: 'SINGLE_MCQ',
    title: 'Robustness Pillar Meaning',
    prompt:
      'Which pillar concerns an AI system functioning reliably and safely under unexpected inputs, edge cases or real-world noise?',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Define Robustness.',
    explanation:
      'Robustness means dependable, safe system behavior across diverse and challenging operating conditions.',
    options: [
      { text: 'Robustness', correct: true },
      { text: 'Anonymity' },
      { text: 'Visual Styling' },
      { text: 'Marketing Reach' },
    ],
  },
  {
    slug: 'pillar-transparency',
    type: 'SINGLE_MCQ',
    title: 'Transparency vs Secrecy',
    prompt:
      'Openly documenting what data trained a model, how it was evaluated, its known limits and when users are interacting with AI addresses which pillar?',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139-140',
    lessonId: 'm8-l1',
    objective: 'Define Transparency.',
    explanation:
      'Transparency communicates design choices, intended scope, limitations and AI involvement clearly to stakeholders.',
    options: [
      { text: 'Transparency', correct: true },
      { text: 'Opacity' },
      { text: 'Overfitting' },
      { text: 'Clustering' },
    ],
  },
  {
    slug: 'pillar-privacy',
    type: 'SINGLE_MCQ',
    title: 'Privacy Pillar Responsibility',
    prompt:
      'Minimizing collected personal information, protecting student records against unauthorized exposure and respecting consent aligns directly with:',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Define Privacy.',
    explanation:
      'Privacy safeguards individuals’ personal information and control over how data is stored and shared.',
    options: [
      { text: 'Privacy', correct: true },
      { text: 'Latency' },
      { text: 'Dimensionality' },
      { text: 'Normalization' },
    ],
  },
  {
    slug: 'healthcare-proxy-bias',
    type: 'SINGLE_MCQ',
    title: 'Healthcare Cost Proxy Case Study',
    prompt:
      'In the Unit 8 healthcare algorithm case (p.139), why did the model systematically underestimate illness severity for Black patients?',
    topic: 'Sources of Algorithmic Bias',
    difficulty: 'MEDIUM',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Diagnose proxy-target bias.',
    explanation:
      'The model used past healthcare spending as a proxy for medical need; unequal historical access meant equal illness generated lower healthcare billing, teaching the model systematic bias.',
    options: [
      {
        text: 'It predicted future healthcare spending as a proxy for illness need despite unequal historical care access',
        correct: true,
      },
      { text: 'Doctors manually deleted all fever entries' },
      { text: 'Python strings forced negative risk numbers' },
      { text: 'Computers had insufficient monitor resolution' },
    ],
  },
  {
    slug: 'facial-rec-bias',
    type: 'SINGLE_MCQ',
    title: 'Representation Bias in Facial Recognition',
    prompt:
      'Why have commercial facial recognition models shown noticeably higher error rates on darker-skinned individuals or women?',
    topic: 'Sources of Algorithmic Bias',
    difficulty: 'EASY',
    sourcePage: '142',
    lessonId: 'm8-l1',
    objective: 'Link unbalanced training representation to disparate subgroup error.',
    explanation:
      'Underrepresentation of diverse skin tones and genders in training datasets produces higher misclassification rates on underrepresented groups.',
    options: [
      {
        text: 'Training datasets heavily overrepresented lighter-skinned faces and lacked balanced diversity',
        correct: true,
      },
      { text: 'Neural networks cannot process pixels darker than gray' },
      { text: 'Cameras physically fail outdoors in summer' },
      { text: 'Explainability removes facial outlines' },
    ],
  },
  {
    slug: 'bias-definition',
    type: 'SINGLE_MCQ',
    title: 'Meaning of Algorithmic Bias',
    prompt: 'What is "AI bias" (algorithmic bias)?',
    topic: 'AI Bias',
    difficulty: 'EASY',
    sourcePage: '141',
    lessonId: 'm8-l1',
    objective: 'Define algorithmic bias accurately.',
    explanation:
      'AI bias occurs when models produce systematically skewed outcomes reflecting historical inequality, flawed data sampling or flawed design assumptions.',
    options: [
      { text: 'Random minor hardware lag when saving spreadsheets' },
      {
        text: 'Systematic unfair outputs caused by skewed data, faulty proxies or prejudiced design assumptions',
        correct: true,
      },
      { text: 'Using float numbers instead of integers' },
      { text: 'Increasing sample size until variance reaches average' },
    ],
  },
  {
    slug: 'mitigating-bias-act',
    type: 'SINGLE_MCQ',
    title: 'Effective Bias Mitigation Step',
    prompt:
      'Which technical practice helps detect hidden demographic unfairness BEFORE deploying a hiring or admission screener?',
    topic: 'Mitigating Bias',
    difficulty: 'MEDIUM',
    sourcePage: '143',
    lessonId: 'm8-l2',
    objective: 'Select subgroup disaggregated auditing.',
    explanation:
      'Evaluating error rates (false positives and false negatives) separately across relevant demographic groups exposes disparities obscured by overall average accuracy.',
    options: [
      { text: 'Removing the group column only and never measuring subgroup error rates' },
      {
        text: 'Measuring error rates separately across diverse subgroups alongside diverse training data and human review',
        correct: true,
      },
      { text: 'Deleting documentation on evaluation data' },
      { text: 'Increasing output font size' },
    ],
  },
  {
    slug: 'eu-trustworthy-ai',
    type: 'SINGLE_MCQ',
    title: 'EU Trustworthy AI Policy Principles',
    prompt:
      'In the European Union’s Ethics Guidelines for Trustworthy AI summarized in Unit 8, which commitments anchor responsible AI governance?',
    topic: 'Developing AI Policies',
    difficulty: 'MEDIUM',
    sourcePage: '144-145',
    lessonId: 'm8-l2',
    objective: 'Recognize international trustworthy AI guidelines.',
    explanation:
      'EU guidelines stress human autonomy, prevention of harm, fairness and explicability/accountability.',
    options: [
      {
        text: 'Respect for human autonomy, prevention of harm, fairness and explicability',
        correct: true,
      },
      { text: 'Mandatory removal of human appeals in public services' },
      { text: 'Unrestricted collection of children’s biometrics without notice' },
      { text: 'Replacing laws with automated chatbots' },
    ],
  },
  {
    slug: 'ai-for-good-ex',
    type: 'SINGLE_MCQ',
    title: 'Beneficial AI Assisting Humanity',
    prompt:
      'Which example cited in Unit 8 illustrates ethical "AI for Good" assisting humanity responsibly?',
    topic: 'Ethics in AI',
    difficulty: 'EASY',
    sourcePage: '140, 148',
    lessonId: 'm8-l2',
    objective: 'Identify positive societal applications with guardrails.',
    explanation:
      'Unit 8 cites supportive mental-health access tools, early disaster/environmental monitoring and accessible assistive tools built with safeguards.',
    options: [
      {
        text: 'Supportive accessibility and mental-health assistance tools paired with human care referrals',
        correct: true,
      },
      { text: 'Secretly ranking employees using biased historical layoffs' },
      { text: 'Spreading synthetic election deepfakes' },
      { text: 'Reserving healthcare triage solely for high spenders' },
    ],
  },
  {
    slug: 'moral-machine-purpose',
    type: 'SINGLE_MCQ',
    title: 'Lesson from the Moral Machine Dilemma',
    prompt:
      'What key insight does exploring ethical dilemmas like MIT’s Moral Machine for autonomous vehicles reveal?',
    topic: 'Ethical Dilemmas',
    difficulty: 'MEDIUM',
    sourcePage: '146',
    lessonId: 'm8-l2',
    objective: 'Understand human moral responsibility behind code.',
    explanation:
      'Real-world dilemmas involve conflicting moral values across cultures—so engineers and society, not raw math alone, must shape ethical rules and laws.',
    options: [
      {
        text: 'Moral trade-offs cannot be resolved by pure math alone and require transparent societal debate and law',
        correct: true,
      },
      { text: 'Autonomous cars never face unpredictable road emergencies' },
      { text: 'Developers carry zero responsibility for autonomous code' },
      { text: 'Traffic rules should depend on car purchase price' },
    ],
  },
  {
    slug: 'best-fit-game',
    type: 'SINGLE_MCQ',
    title: 'Takeaway from "Survival of the Best Fit"',
    prompt:
      'What real-world hazard does the "Survival of the Best Fit" interactive scenario demonstrate regarding automated hiring?',
    topic: 'Sources of Algorithmic Bias',
    difficulty: 'MEDIUM',
    sourcePage: '141-143, 146',
    lessonId: 'm8-l2',
    objective: 'Spot hiring feedback loops.',
    explanation:
      'Training resume screeners purely on narrow past hires reproduces legacy exclusions and narrows diversity over time.',
    options: [
      {
        text: 'Models trained on biased past hiring decisions learn to reject qualified candidates from underrepresented groups',
        correct: true,
      },
      { text: 'Automated hiring automatically selects the healthiest runners' },
      { text: 'Random selection eliminates fairness reviews' },
      { text: 'Hiring models never look at keyword resumes' },
    ],
  },
  {
    slug: 'human-accountability',
    type: 'SINGLE_MCQ',
    title: 'Who Is Accountable When AI Harms Someone?',
    prompt:
      'If a school or company deploys an automated grading or loan model that harms someone unfairly, who holds ultimate ethical and legal accountability?',
    topic: 'AI Policy & Governance',
    difficulty: 'EASY',
    sourcePage: '144-145',
    lessonId: 'm8-l2',
    objective: 'Reject blaming software objects for human deployment choices.',
    explanation:
      'AI software has no moral agency; the organizations, leaders and designers building, approving and deploying the system bear responsibility.',
    options: [
      { text: 'Only the mathematical gradient function' },
      {
        text: 'The human creators and deploying organization responsible for governance, testing and remedies',
        correct: true,
      },
      { text: 'Nobody, because software made the choice automatically' },
      { text: 'Affected users for clicking submit' },
    ],
  },
  {
    slug: 'policy-appeal-right',
    type: 'SINGLE_MCQ',
    title: 'Important Element of Organisational AI Policy',
    prompt: 'Why should an institutional AI policy establish a human appeal and redress mechanism?',
    topic: 'Developing AI Policies',
    difficulty: 'EASY',
    sourcePage: '144-145',
    lessonId: 'm8-l2',
    objective: 'Design user recourse in policies.',
    explanation:
      'Affected individuals need an accessible path to contest false flags or discriminatory outputs before permanent harm occurs.',
    options: [
      {
        text: 'To give people affected by mistakes a clear path to challenge decisions and get human review',
        correct: true,
      },
      { text: 'To delay support tickets by six months' },
      { text: 'To publish confidential user passwords' },
      { text: 'To avoid testing model accuracy' },
    ],
  },
  {
    slug: 'blindness-myth',
    type: 'SINGLE_MCQ',
    title: 'Why Dropping One Column Doesn’t Guarantee Fairness',
    prompt:
      'Suppose an insurer deletes the `"Ethnicity"` column from a dataset, yet continues predicting rates using `"PostalZipCode"`. Why can bias persist?',
    topic: 'Sources of Algorithmic Bias',
    difficulty: 'HARD',
    sourcePage: '141-143',
    lessonId: 'm8-l1',
    objective: 'Understand proxy correlations beyond sensitive labels.',
    explanation:
      'Geographic ZIP codes, school names or spending habits correlate strongly with demographics, acting as hidden proxies unless fairness is audited.',
    options: [
      {
        text: 'Other features like postal code can serve as hidden proxies recreating biased disparities',
        correct: true,
      },
      { text: 'Deleting one column breaks NumPy mathematically' },
      { text: 'Postal codes never correlate with neighbourhood demographics' },
      { text: 'Removing a column converts supervised ML into clustering' },
    ],
  },
  {
    slug: 'transparency-vs-explain',
    type: 'SINGLE_MCQ',
    title: 'Transparency vs Explainability Distinction',
    prompt: 'How do Transparency and Explainability complement each other without being identical?',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'MEDIUM',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Distinguish system-level openness from case-level explanation.',
    explanation:
      'Transparency discloses system goals, training scope and limits overall, while Explainability explains why a concrete output occurred for a specific input.',
    options: [
      {
        text: 'Transparency shares how the system was built and governed overall; Explainability clarifies reasons behind an individual output',
        correct: true,
      },
      { text: 'Both mean publishing raw employee passwords openly' },
      { text: 'Transparency hides errors while Explainability encrypts models' },
      { text: 'Only hardware circuits have transparency' },
    ],
  },
  {
    slug: 'supp-genai-pii-privacy',
    type: 'SINGLE_MCQ',
    title: '[Supplemental] Protecting Student Privacy with GenAI Tools',
    prompt:
      '[Supplemental — GenAI Readiness] Before pasting classroom feedback or student health notes into an unapproved public Generative AI website, what privacy risk must a teacher remember?',
    topic: 'Supplemental: GenAI Ethics & Privacy',
    difficulty: 'EASY',
    sourcePage: 'Supplemental',
    lessonId: 'm8-l2',
    supplemental: true,
    objective: 'Enforce strict student PII privacy with external GenAI.',
    explanation:
      'Public AI websites may log prompts or train on submitted text, exposing confidential student PII—violating Privacy.',
    options: [
      {
        text: 'Submitted text may be logged, retained or exposed to third parties outside approved school safeguards',
        correct: true,
      },
      { text: 'Public chatbots automatically erase personal names legally' },
      { text: 'Copy-pasting never sends data over networks' },
      { text: 'Ethics pillars apply only to offline calculators' },
    ],
  },
  {
    slug: 'supp-deepfake-disinfo',
    type: 'SINGLE_MCQ',
    title: '[Supplemental] Ethical Risks of Deepfakes & Synthetic Media',
    prompt:
      '[Supplemental — GenAI Readiness] Which harm arises when generative audio/video models impersonate real people without consent ("deepfakes")?',
    topic: 'Supplemental: GenAI Ethics & Integrity',
    difficulty: 'EASY',
    sourcePage: 'Supplemental',
    lessonId: 'm8-l2',
    supplemental: true,
    objective: 'Recognize consent and misinformation harms in generative media.',
    explanation:
      'Non-consensual synthetic impersonation undermines truth, causes personal harassment/fraud and requires transparency disclosure and consent.',
    options: [
      {
        text: 'Misinformation, fraud, non-consensual impersonation and erosion of public trust',
        correct: true,
      },
      { text: 'Improved CSV file loading speeds' },
      { text: 'Guaranteed elimination of spam emails' },
      { text: 'Stronger hardware battery preservation' },
    ],
  },

  // 5 MULTI_SELECT
  {
    slug: 'five-pillars-multi',
    type: 'MULTI_SELECT',
    title: 'Identify the Five Handbook Pillars of AI Ethics',
    prompt: 'Select ALL pillars belonging to the Five Pillars of AI Ethics covered in Unit 8.',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Recall all 5 pillars cleanly.',
    explanation:
      'Explainability, Fairness, Robustness, Transparency and Privacy comprise the five handbook pillars.',
    options: [
      { text: 'Explainability & Transparency', correct: true },
      { text: 'Fairness', correct: true },
      { text: 'Robustness', correct: true },
      { text: 'Privacy', correct: true },
      { text: 'Monopolization' },
    ],
  },
  {
    slug: 'bias-sources-multi',
    type: 'MULTI_SELECT',
    title: 'Sources Where Bias Enters AI Pipelines',
    prompt: 'Select ALL ways systematic bias can enter an AI system.',
    topic: 'Sources of Algorithmic Bias',
    difficulty: 'EASY',
    sourcePage: '139-142',
    lessonId: 'm8-l1',
    objective: 'Identify multi-stage sources of bias.',
    explanation:
      'Bias stems from unrepresentative datasets, historical inequality encoded in labels, flawed proxies (cost vs need) and unexamined deployment assumptions.',
    options: [
      { text: 'Skewed historical decisions encoded in training labels', correct: true },
      {
        text: 'Underrepresentation of specific demographic groups in training samples',
        correct: true,
      },
      { text: 'Flawed proxy targets (such as spending replacing medical need)', correct: true },
      { text: 'Using clean, normalized train/test splits' },
    ],
  },
  {
    slug: 'bias-mitigation-multi',
    type: 'MULTI_SELECT',
    title: 'Practical Strategies to Mitigate AI Bias',
    prompt: 'Select ALL effective actions teams take to reduce algorithmic unfairness.',
    topic: 'Mitigating Bias',
    difficulty: 'MEDIUM',
    sourcePage: '143-145',
    lessonId: 'm8-l2',
    objective: 'Combine data, metric, participatory and policy mitigations.',
    explanation:
      'Diverse data curation, disaggregated error evaluation, community stakeholder consultation and accountable appeal controls work together.',
    options: [
      {
        text: 'Audit false-positive and false-negative rates separately across relevant demographic groups',
        correct: true,
      },
      { text: 'Collect balanced, diverse and well-documented datasets', correct: true },
      { text: 'Maintain human oversight and accessible user appeal pathways', correct: true },
      { text: 'Conceal failure metrics from external oversight' },
    ],
  },
  {
    slug: 'policy-principles-multi',
    type: 'MULTI_SELECT',
    title: 'Foundations of Responsible AI Policies',
    prompt: 'Which elements strengthen organizational or national AI governance policies?',
    topic: 'Developing AI Policies',
    difficulty: 'MEDIUM',
    sourcePage: '144-145',
    lessonId: 'm8-l2',
    objective: 'Design governance frameworks.',
    explanation:
      'Human rights respect, transparent disclosure, regular safety/bias audits and clear legal accountability anchor trustworthy policy.',
    options: [
      { text: 'Clear human accountability and legal compliance', correct: true },
      { text: 'Mandatory data privacy and informed consent protections', correct: true },
      {
        text: 'Periodic post-deployment monitoring and human remedies when harm occurs',
        correct: true,
      },
      { text: 'Granting autonomous software total legal immunity' },
    ],
  },
  {
    slug: 'supp-genai-ethics-multi',
    type: 'MULTI_SELECT',
    title: '[Supplemental] Ethical Academic & Coding Use of GenAI',
    prompt:
      '[Supplemental — GenAI Readiness] Which guidelines reflect responsible student conduct with Generative AI assistants?',
    topic: 'Supplemental: GenAI Ethics & Integrity',
    difficulty: 'EASY',
    sourcePage: 'Supplemental',
    lessonId: 'm8-l2',
    supplemental: true,
    objective: 'Promote honesty, attribution and verification.',
    explanation:
      'Be transparent per teacher rules, verify generated answers/code via tests, never feed private PII, and own your final reasoning.',
    options: [
      {
        text: 'Disclose AI assistance honestly according to course/school guidelines',
        correct: true,
      },
      { text: 'Protect classmates’ and your own private data by withholding PII', correct: true },
      {
        text: 'Independently verify claims and test any generated logic thoroughly',
        correct: true,
      },
      { text: 'Submit unverified AI essays pretending they are purely original work' },
    ],
  },

  // 5 TRUE_FALSE
  {
    slug: 'tf-bias-only-code',
    type: 'TRUE_FALSE',
    title: 'Nature of AI Bias',
    prompt:
      'True or False: AI bias is purely a programming syntax bug; once code compiles without crashes, the resulting model cannot treat groups unfairly.',
    topic: 'AI Bias',
    difficulty: 'EASY',
    sourcePage: '141-142',
    lessonId: 'm8-l1',
    objective: 'Recognize socio-technical origin of bias.',
    explanation:
      'False. Syntactically bug-free pipelines routinely reproduce deep unfairness from skewed historical data, proxy metrics and design blind spots.',
    correctBoolean: false,
  },
  {
    slug: 'tf-pillars-conflict',
    type: 'TRUE_FALSE',
    title: 'Tension Between Ethics Pillars',
    prompt:
      'True or False: Ethics pillars like maximum dataset transparency and strict individual privacy can sometimes conflict in practice, requiring thoughtful trade-offs and safeguards.',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'MEDIUM',
    sourcePage: '139-145',
    lessonId: 'm8-l1',
    objective: 'Reason about real-world pillar trade-offs.',
    explanation:
      'True. Publishing raw training tables improves transparency but can threaten personal privacy unless de-identified or access-governed.',
    correctBoolean: true,
  },
  {
    slug: 'tf-moral-machine-answers',
    type: 'TRUE_FALSE',
    title: 'Moral Machine Ethical Universality',
    prompt:
      'True or False: Ethical dilemma studies like MIT’s Moral Machine show that different communities sometimes weigh ethical trade-offs differently, making open human dialogue essential.',
    topic: 'Ethical Dilemmas',
    difficulty: 'EASY',
    sourcePage: '146',
    lessonId: 'm8-l2',
    objective: 'Recognize societal dialogue need in policy.',
    explanation:
      'True. Hypothetical trolley/autonomous dilemmas expose real cultural and ethical tensions requiring public debate and accountable regulation.',
    correctBoolean: true,
  },
  {
    slug: 'tf-privacy-consent',
    type: 'TRUE_FALSE',
    title: 'Consent and Privacy Safeguards',
    prompt:
      'True or False: Strong AI privacy practice collects only necessary attributes, secures storage strictly and obtains informed consent before secondary use.',
    topic: 'Privacy',
    difficulty: 'EASY',
    sourcePage: '139, 144',
    lessonId: 'm8-l1',
    objective: 'Verify privacy controls.',
    explanation:
      'True. Data minimization, encryption/isolation and informed consent anchor the Privacy pillar.',
    correctBoolean: true,
  },
  {
    slug: 'tf-policy-once-done',
    type: 'TRUE_FALSE',
    title: 'Continuous Governance Need',
    prompt:
      'True or False: Because real-world conditions and data drift after launch, AI governance requires ongoing monitoring rather than a single pre-launch check.',
    topic: 'Developing AI Policies',
    difficulty: 'EASY',
    sourcePage: '144-145',
    lessonId: 'm8-l2',
    objective: 'Emphasize lifecycle monitoring.',
    explanation:
      'True. EU and OECD trustworthy guidelines call for continuous evaluation and improvement.',
    correctBoolean: true,
  },

  // 5 FILL_BLANK
  {
    slug: 'fb-five-pillars-fairness',
    type: 'FILL_BLANK',
    title: 'Equitable Treatment Pillar',
    prompt:
      'Among the Five Pillars of AI Ethics—Explainability, ______, Robustness, Transparency and Privacy—the one focused specifically on preventing unjust group discrimination is missing.',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Recall Fairness pillar.',
    explanation: 'Fairness addresses unbiased equitable treatment.',
    acceptedAnswers: ['Fairness'],
  },
  {
    slug: 'fb-explainability-pillar',
    type: 'FILL_BLANK',
    title: 'Understandable Decisions Pillar',
    prompt:
      'Ensuring human reviewers and affected citizens can understand the reasons behind a specific AI recommendation or rejection reflects the ______ pillar.',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Recall Explainability pillar.',
    explanation: 'Explainability reveals why a decision occurred.',
    acceptedAnswers: ['Explainability'],
  },
  {
    slug: 'fb-algorithmic-bias',
    type: 'FILL_BLANK',
    title: 'Systematic Skewed Model Outcomes',
    prompt:
      'When an ML model systematically produces prejudiced errors due to skewed training records or flawed design assumptions, it exhibits algorithmic ______.',
    topic: 'AI Bias',
    difficulty: 'EASY',
    sourcePage: '141',
    lessonId: 'm8-l1',
    objective: 'Recall bias terminology.',
    explanation: 'Algorithmic bias / AI bias reflects systemic unfair skew.',
    acceptedAnswers: ['bias'],
  },
  {
    slug: 'fb-robustness-pillar',
    type: 'FILL_BLANK',
    title: 'Dependable Operation Across Conditions',
    prompt:
      'The ethics pillar ensuring a model functions safely, accurately and dependably even under noisy or unexpected inputs is ______.',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Recall Robustness.',
    explanation: 'Robustness keeps behavior safe under perturbations.',
    acceptedAnswers: ['Robustness'],
  },
  {
    slug: 'fb-transparency-pillar',
    type: 'FILL_BLANK',
    title: 'Open System Disclosure Pillar',
    prompt:
      'Openly communicating how an AI system was developed, tested, limited and deployed—and informing people when AI is used—fulfills the ______ pillar.',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'EASY',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Recall Transparency.',
    explanation: 'Transparency fosters informed trust through open disclosure.',
    acceptedAnswers: ['Transparency'],
  },

  // 5 SHORT_ANSWER
  {
    slug: 'sa-proxy-bias-health',
    type: 'SHORT_ANSWER',
    title: 'Explaining Proxy Bias in the Hospital Cost Case',
    prompt:
      'Using the Unit 8 healthcare algorithm example (p.139), explain how choosing healthcare spending as the predicted target introduced racial bias even without intentionally writing discriminatory rules.',
    topic: 'Sources of Algorithmic Bias',
    difficulty: 'MEDIUM',
    sourcePage: '139',
    lessonId: 'm8-l1',
    objective: 'Analyze indirect proxy discrimination.',
    explanation:
      'Equal medical severity generated lower past healthcare billing for underserved Black patients, teaching the regression model to score equally sick Black patients as lower risk.',
    expectedPoints: [
      'Model predicted past healthcare expenditure as a proxy for actual medical illness need',
      'Because historical access barriers caused lower spending per equally ill Black patient, model assigned lower risk priority unfairly',
      'Replacing cost proxy with direct clinical indicators mitigates that distortion',
    ],
  },
  {
    slug: 'sa-five-pillars-school-tool',
    type: 'SHORT_ANSWER',
    title: 'Applying All Five Pillars to a School Attendance Early-Alert Tool',
    prompt:
      'A high school considers an AI tool predicting student dropout risk. State one concrete question or safeguard for EACH of the five pillars: Explainability, Fairness, Robustness, Transparency and Privacy.',
    topic: 'Five Pillars of AI Ethics',
    difficulty: 'MEDIUM',
    sourcePage: '139-145',
    lessonId: 'm8-l1',
    objective: 'Operationalize all 5 pillars cleanly.',
    explanation:
      'Maps each pillar to concrete questions: understandable factors (explainability), equal false-flag rates across neighborhoods (fairness), resilience to snow-day data gaps (robustness), informing parents/students (transparency), strict RBAC/retention limits (privacy).',
    expectedPoints: [
      'Explainability: counselors see key contributing signals rather than opaque score',
      'Fairness: check error rates across commute zones / income / demographics',
      'Robustness: handle missing attendance syncs or sick weeks gracefully',
      'Transparency: disclose usage, limits and supportive intent to families',
      'Privacy: restrict PII strictly to authorized counselors with retention limits',
    ],
  },
  {
    slug: 'sa-mitigate-hiring-bias',
    type: 'SHORT_ANSWER',
    title: 'Mitigating Bias in Automated Resume Screening',
    prompt:
      'Describe three concrete steps an organization should take to detect and reduce bias before letting any resume-triage model assist recruiters.',
    topic: 'Mitigating Bias',
    difficulty: 'EASY',
    sourcePage: '142-144',
    lessonId: 'm8-l2',
    objective: 'Propose actionable bias mitigation measures.',
    explanation:
      'Audit historical labels, test demographic selection parity + proxy features, keep final human review with explanation/reconsideration path.',
    expectedPoints: [
      'Audit historical hiring records for skewed labels and proxy gaps (e.g. gaps, school names)',
      'Evaluate model acceptance/error rates across demographic subgroups using diverse validation pools',
      'Enforce human-in-the-loop review rather than automatic rejections plus clear appeal notice',
    ],
  },
  {
    slug: 'sa-privacy-vs-fairness-audit',
    type: 'SHORT_ANSWER',
    title: 'Balancing Privacy and Fairness Audits',
    prompt:
      'How can auditing a model for demographic Fairness create tension with Data Privacy, and how can teams handle that responsibly?',
    topic: 'Ethics Trade-Offs',
    difficulty: 'HARD',
    sourcePage: '139-145',
    lessonId: 'm8-l1',
    objective: 'Navigate competing ethical values thoughtfully.',
    explanation:
      'Measuring error gaps across groups requires knowing group attributes, yet storing sensitive attributes increases privacy exposure—solved via strict role access, aggregation, minimization and consented auditing.',
    expectedPoints: [
      'Subgroup bias auditing needs demographic labels, whereas privacy seeks minimal sensitive PII collection',
      'Balanced safeguards: strict access control, aggregated audit reporting, optional voluntary survey or separated anonymized evaluation keys',
    ],
  },
  {
    slug: 'sa-supp-genai-school-policy',
    type: 'SHORT_ANSWER',
    title: '[Supplemental] Two Classroom Policy Rules for GenAI',
    prompt:
      '[Supplemental — GenAI Readiness] Propose two practical, ethical classroom policy rules for Generative AI that encourage learning without blocking legitimate accessibility/study help.',
    topic: 'Supplemental: GenAI Ethics & Policy',
    difficulty: 'EASY',
    sourcePage: 'Supplemental',
    lessonId: 'm8-l2',
    supplemental: true,
    objective: 'Write balanced educational AI policies.',
    explanation:
      'Rules balance transparency ("cite prompt/assistance role cleanly"), verification ("test code and cross-check citations"), and privacy ("zero student/teacher PII").',
    expectedPoints: [
      'Transparent disclosure when GenAI tools were used for brainstorming/editing vs independent work',
      'Mandatory student verification of facts/code plus strict ban on entering sensitive personal data into public tools',
    ],
  },

  // 2 LONG_CASE
  {
    slug: 'lc-facial-rec-law-enforcement',
    type: 'LONG_CASE',
    title: 'Case Study: Law-Enforcement Facial Recognition System Audit',
    prompt:
      'Referencing Unit 8’s Case Study (p.149), a technology vendor pitches a high-throughput facial recognition tool to identify suspects across city cameras. Evaluate this deployment across: (1) Three severe risks across Fairness (unequal false-positive misidentifications across skin tone/gender), Privacy (mass biometric tracking) and Robustness (blur, night lighting, look-alikes); (2) Why high headline average accuracy hides false-arrest harm; and (3) Five concrete policy, technical and human-oversight rules required before any limited trial (or criteria for rejecting deployment altogether).',
    topic: 'Facial Recognition Ethics Case Study',
    difficulty: 'HARD',
    sourcePage: '142-149',
    lessonId: 'm8-l2',
    objective: 'Conduct rigorous human-rights and technical ethics evaluation.',
    explanation:
      'Connects demographic accuracy gaps, mass biometric surveillance risk, low-light degradation, false-positive detention consequences, mandatory corroborating evidence and strict legal warrant/transparency governance.',
    expectedPoints: [
      'Diagnoses demographic false-positive disparities (citing Unit 8 facial recognition findings)',
      'Flags mass biometric consent/privacy violation and lighting/occlusion robustness failure',
      'Insists AI match alone NEVER authorizes arrest/detention without independent corroborating human investigation, regular subgroup audit, public transparency report and ban on unchecked surveillance',
    ],
  },
  {
    slug: 'lc-automated-credit-policy',
    type: 'LONG_CASE',
    title: 'Case Study: Designing an Organisational AI Governance Policy for Lending',
    prompt:
      'A micro-lending organization wants an ML tool predicting small-business loan default risk. In testing, rural women shopkeepers are declined at twice the rate of urban applicants with identical revenue because past loan archives held mostly urban data. Draft a 4-section Governance Policy covering: (1) Problem diagnosis & bias sources, (2) Data & subgroup testing requirements before launch, (3) Customer Explainability & Human Appeal workflow, and (4) Post-launch monitoring & executive accountability.',
    topic: 'AI Policy Design Case Study',
    difficulty: 'HARD',
    sourcePage: '139-145',
    lessonId: 'm8-l2',
    objective: 'Author an enforceable governance policy applying all 5 pillars.',
    explanation:
      'Addresses urban sampling skew, requires disaggregated approval/false-rejection audits, mandates actionable plain-language denial reasons + rapid human officer appeal, and sets quarterly drift/fairness reviews.',
    expectedPoints: [
      'Identifies historical underrepresentation / proxy location bias',
      'Mandates representative data enrichment + subgroup false-negative parity audit before launch',
      'Enforces plain-language explanation + human loan-officer appeal loop',
      'Assigns named executive accountability, quarterly fairness audit schedule and model halt threshold',
    ],
  },

  // 2 PRACTICAL
  {
    slug: 'pr-five-pillar-rubric-audit',
    type: 'PRACTICAL',
    title: 'Practical: Complete 5-Pillar Risk Audit Matrix',
    prompt:
      'Select a real educational or civic AI concept (e.g., automated essay grading OR smart-city traffic red-light camera fining). Produce a structured 5-row Ethics Matrix with columns: `Pillar (Explainability, Fairness, Robustness, Transparency, Privacy)` | `Specific Potential Failure` | `Measurable Pre-Launch Test` | `Mandatory Human Safeguard / Remedy`. Every row must contain concrete actionable engineering or policy checks rather than vague slogans.',
    topic: '5-Pillar Ethics Audit Practical',
    difficulty: 'MEDIUM',
    sourcePage: '139-145',
    lessonId: 'm8-l1',
    objective: 'Translate high-level ethics pillars into concrete engineering gates.',
    explanation:
      'Each row connects pillar -> concrete failure mode -> testable verification check (e.g. dialect grading error parity, PII access log audit) -> explicit human override/appeal remedy.',
    expectedPoints: [
      'All five pillars completed specifically for the chosen tool',
      'Concrete quantitative/auditable pre-launch verification per row (not just "be fair")',
      'Clear human appeal or override path per pillar',
    ],
  },
  {
    slug: 'pr-bias-root-cause-map',
    type: 'PRACTICAL',
    title: 'Practical: Pipeline Bias Trace & Mitigation Redesign',
    prompt:
      'Examine this simplified pipeline: A school builds a `"Leadership Scholarship Predictor"` trained on 10 years of past winners (`85%` came from two expensive coding clubs and held uniform blazers in photos). Inputs include `club_fee_paid`, `zip_code`, `teacher_endorsement_word_count`, and `grade_average`.\n(1) Trace 3 distinct bias pathways (data/historical, proxy feature, and measurement/endorsement bias).\n(2) Propose a concrete redesigned rubric/workflow specifying which features must be dropped or audited, how teachers ensure equitable recommendations, and what metric tracks fairness post-launch.',
    topic: 'Bias Diagnosis Practical',
    difficulty: 'HARD',
    sourcePage: '141-145',
    lessonId: 'm8-l2',
    objective: 'Eliminate proxy and socioeconomic feedback loops in predictive pipelines.',
    explanation:
      'Spots fee/ZIP wealth proxies, unequal access to expensive clubs and endorsement-writing inequality; replaces socioeconomic proxies with need-blind leadership impact rubrics + human committee review.',
    expectedPoints: [
      'Identifies historical winner skew, wealth proxies (`club_fee_paid`, `zip_code`) and endorsement style disparities',
      'Drops wealth/ZIP proxies, replaces opaque scoring with transparent rubric + broad outreach, tracks subgroup selection/error parity',
    ],
  },
]);
