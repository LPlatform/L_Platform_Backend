import { buildModuleQuestions, type BankQuestionSpec } from './types.js';

export const m7Questions: BankQuestionSpec[] = buildModuleQuestions('m7-language-nlp', 7, [
  // 20 SINGLE_MCQ
  {
    slug: 'nlp-definition',
    type: 'SINGLE_MCQ',
    title: 'Core Purpose of Natural Language Processing',
    prompt: 'What is the primary goal of Natural Language Processing (NLP) in AI?',
    topic: 'Introduction to NLP',
    difficulty: 'EASY',
    sourcePage: '124',
    lessonId: 'm7-l1',
    objective: 'Define NLP concisely.',
    explanation:
      'NLP enables computer systems to analyze, understand, manipulate and generate human written text and spoken speech.',
    options: [
      { text: 'Drawing geometric pixel grids from sensors' },
      {
        text: 'Enabling computers to interpret, process and generate human text and speech',
        correct: true,
      },
      { text: 'Formatting hard-drive partitions exclusively' },
      { text: 'Eliminating grammar rules from all dictionaries' },
    ],
  },
  {
    slug: 'structured-vs-text',
    type: 'SINGLE_MCQ',
    title: 'Why Human Language Is Hard for Computers',
    prompt:
      'Why is natural human conversation harder for computers to parse than neatly organized database tables?',
    topic: 'Language Complexity',
    difficulty: 'EASY',
    sourcePage: '125-127',
    lessonId: 'm7-l1',
    objective: 'Contrast unstructured text ambiguity with structured columns.',
    explanation:
      'Human language is unstructured and rich in ambiguity, idioms, sarcasm and context-dependent pronouns.',
    options: [
      {
        text: 'Human language is messy, unstructured and relies heavily on context, idioms and double meanings',
        correct: true,
      },
      { text: 'Computers cannot store Unicode letters in memory' },
      { text: 'Human sentences never contain nouns or verbs' },
      { text: 'Every English word has only one literal meaning' },
    ],
  },
  {
    slug: 'tokens-def',
    type: 'SINGLE_MCQ',
    title: 'Meaning of Tokens in NLP',
    prompt:
      'In NLP preprocessing, what does segmenting a sentence into "tokens" primarily refer to?',
    topic: 'Lexical Analysis',
    difficulty: 'EASY',
    sourcePage: '124, 130',
    lessonId: 'm7-l1',
    objective: 'Define tokenization cleanly.',
    explanation:
      'Tokenization breaks a raw string stream into discrete word, subword or punctuation units for downstream parsing.',
    options: [
      {
        text: 'Splitting raw text into individual word or subword units for analysis',
        correct: true,
      },
      { text: 'Issuing physical arcade coins' },
      { text: 'Deleting all verbs from text' },
      { text: 'Converting documents to monochrome bitmaps' },
    ],
  },
  {
    slug: 'lexical-phase',
    type: 'SINGLE_MCQ',
    title: 'Phase 1 of NLP: Lexical Analysis',
    prompt:
      'Which NLP phase divides paragraphs into words/tokens and identifies their lexical categories from vocabulary rules?',
    topic: 'Five Phases of NLP',
    difficulty: 'EASY',
    sourcePage: '130',
    lessonId: 'm7-l1',
    objective: 'Identify Lexical Analysis.',
    explanation:
      'Lexical analysis analyzes the structure of words and breaks input text into paragraphs, sentences and tokens.',
    options: [
      { text: 'Lexical Analysis', correct: true },
      { text: 'Pragmatic Analysis' },
      { text: 'Discourse Integration' },
      { text: 'Audio Compression' },
    ],
  },
  {
    slug: 'syntactic-phase',
    type: 'SINGLE_MCQ',
    title: 'Phase 2 of NLP: Syntactic Analysis',
    prompt:
      'Which NLP phase checks grammatical structure and parses word relationships according to formal sentence rules?',
    topic: 'Five Phases of NLP',
    difficulty: 'EASY',
    sourcePage: '130',
    lessonId: 'm7-l1',
    objective: 'Identify Syntactic Analysis (Parsing).',
    explanation:
      'Syntactic analysis inspects grammar and arranges words cleanly into parse structures (rejecting ungrammatical sequences like `"Boy the apple eats"`).',
    options: [
      { text: 'Syntactic Analysis (Parsing)', correct: true },
      { text: 'Semantic Clustering' },
      { text: 'Matrix Normalization' },
      { text: 'Intent Logging' },
    ],
  },
  {
    slug: 'semantic-phase',
    type: 'SINGLE_MCQ',
    title: 'Phase 3 of NLP: Semantic Analysis',
    prompt:
      'A parser checks `"Colorless green ideas sleep furiously"` or `"Hot ice-cream boiled the bicycle"` as syntactically grammatical, yet which phase checks whether literal word combinations actually make sense?',
    topic: 'Five Phases of NLP',
    difficulty: 'MEDIUM',
    sourcePage: '130-131',
    lessonId: 'm7-l1',
    objective: 'Contrast grammar checks (syntax) with meaning checks (semantics).',
    explanation:
      'Semantic analysis verifies literal sentence meaningfulness and rejects contradictory/nonsensical pairings despite valid grammar.',
    options: [
      { text: 'Lexical Analysis' },
      { text: 'Syntactic Analysis' },
      { text: 'Semantic Analysis', correct: true },
      { text: 'Token Compression' },
    ],
  },
  {
    slug: 'discourse-phase',
    type: 'SINGLE_MCQ',
    title: 'Phase 4 of NLP: Discourse Integration',
    prompt:
      'In the pair `"Meera misplaced her lab notebook. She found it near the printer."`, which NLP phase determines that `"She"` refers to `"Meera"` and `"it"` refers to `"lab notebook"`?',
    topic: 'Five Phases of NLP',
    difficulty: 'MEDIUM',
    sourcePage: '131',
    lessonId: 'm7-l1',
    objective: 'Identify cross-sentence Discourse Integration.',
    explanation:
      'Discourse integration interprets how each sentence depends on preceding sentences across a conversation or paragraph.',
    options: [
      { text: 'Lexical Analysis' },
      { text: 'Discourse Integration', correct: true },
      { text: 'Character Tokenization' },
      { text: 'Spelling Normalization' },
    ],
  },
  {
    slug: 'pragmatic-phase',
    type: 'SINGLE_MCQ',
    title: 'Phase 5 of NLP: Pragmatic Analysis',
    prompt:
      'When someone asks `"Can you pass the salt?"` at dinner, recognizing it as a polite request rather than a literal yes/no question about arm strength requires:',
    topic: 'Five Phases of NLP',
    difficulty: 'MEDIUM',
    sourcePage: '131',
    lessonId: 'm7-l1',
    objective: 'Identify Pragmatic situational meaning.',
    explanation:
      'Pragmatic analysis extracts intended real-world communicative meaning using speaker purpose and social context.',
    options: [
      { text: 'Pragmatic Analysis', correct: true },
      { text: 'Lexical Tokenization' },
      { text: 'CSV Delimiter Splitting' },
      { text: 'Numerical Regression' },
    ],
  },
  {
    slug: 'intent-def',
    type: 'SINGLE_MCQ',
    title: 'Intent vs Entity in Chatbots',
    prompt:
      'In a chatbot handling `"Can I walk in at 7 pm?"`, what describes the user’s underlying goal (`CheckOpeningHours`)?',
    topic: 'Chatbot Design',
    difficulty: 'EASY',
    sourcePage: '129',
    lessonId: 'm7-l2',
    objective: 'Distinguish Intent from Entity.',
    explanation:
      'Intent expresses what action/answer the user wants (e.g. checking hours); `7 pm` is a parameter entity.',
    options: [
      { text: 'Intent', correct: true },
      { text: 'Entity' },
      { text: 'Stopword' },
      { text: 'Syntactic error' },
    ],
  },
  {
    slug: 'entity-def',
    type: 'SINGLE_MCQ',
    title: 'Identifying Entities Inside Utterances',
    prompt:
      'In `"Order two scoops of mango ice-cream for pickup at 5 pm"`, which pieces act as specific Entity slots extracted for fulfillment?',
    topic: 'Chatbot Design',
    difficulty: 'EASY',
    sourcePage: '129, 133',
    lessonId: 'm7-l2',
    objective: 'Extract chatbot entity values.',
    explanation:
      'Quantity (`two`), flavour (`mango`) and time (`5 pm`) provide concrete parameter details needed to execute the `OrderIceCream` intent.',
    options: [
      {
        text: 'Details such as quantity (`two`), flavour (`mango`) and pickup time (`5 pm`)',
        correct: true,
      },
      { text: 'The whitespace spaces between words only' },
      { text: 'Punctuation marks at the end of the line' },
      { text: 'The user’s browser version' },
    ],
  },
  {
    slug: 'rule-vs-ai-chatbot',
    type: 'SINGLE_MCQ',
    title: 'Rule-Based vs AI-Powered Chatbot Trade-Off',
    prompt:
      'What is a characteristic limitation of a strictly Rule-Based Chatbot compared to an AI-powered chatbot?',
    topic: 'Chatbot Design',
    difficulty: 'EASY',
    sourcePage: '128',
    lessonId: 'm7-l2',
    objective: 'Contrast rule-based vs ML chatbot failure modes.',
    explanation:
      'Rule-based bots follow scripted flows and fail when users phrase queries outside programmed rules, whereas AI bots handle varied inputs yet risk training-data bias.',
    options: [
      {
        text: 'Rule-based bots cannot adapt gracefully to user phrasing outside their scripted rules',
        correct: true,
      },
      { text: 'Rule-based bots constantly hallucinate random stock quotes' },
      { text: 'Rule-based bots require petabytes of video GPU clusters' },
      { text: 'AI chatbots have zero bias risks' },
    ],
  },
  {
    slug: 'sentiment-analysis-task',
    type: 'SINGLE_MCQ',
    title: 'Sentiment Analysis Purpose',
    prompt:
      'Which NLP task evaluates product feedback (`"Fast shipping but screen flickers constantly!"`) to score emotional polarity or satisfaction attitude?',
    topic: 'NLP Applications',
    difficulty: 'EASY',
    sourcePage: '127, 132',
    lessonId: 'm7-l2',
    objective: 'Define Sentiment Analysis.',
    explanation:
      'Sentiment analysis classifies positive, neutral or negative opinion/emotion expressed in text.',
    options: [
      { text: 'Sentiment Analysis', correct: true },
      { text: 'Image Thresholding' },
      { text: 'K-Means Clustering' },
      { text: 'DNS Routing' },
    ],
  },
  {
    slug: 'sarcasm-trap',
    type: 'SINGLE_MCQ',
    title: 'Sarcasm Challenge in Sentiment Models',
    prompt:
      'Why might a basic keyword sentiment model wrongly score `"Oh fantastic, my laptop crashed five minutes before submission!"` as Positive?',
    topic: 'Language Ambiguity',
    difficulty: 'EASY',
    sourcePage: '126-127',
    lessonId: 'm7-l1',
    objective: 'Recognize sarcasm and implied meaning failures.',
    explanation:
      'Words like `"fantastic"` carry positive polarity in isolation, misleading models lacking pragmatic sarcasm understanding.',
    options: [
      {
        text: 'Because isolated positive keywords like `"fantastic"` mask sarcastic context and frustration',
        correct: true,
      },
      { text: 'Because `"crash"` is always a positive verb in English' },
      { text: 'Because exclamation marks force neutral scores' },
      { text: 'Because laptops cannot run sentiment tests' },
    ],
  },
  {
    slug: 'nlp-not-task',
    type: 'SINGLE_MCQ',
    title: 'Distinguishing NLP Tasks from Computer Vision',
    prompt: 'Which task listed in Unit 7 (p.135) is NOT primarily an NLP task?',
    topic: 'NLP Applications',
    difficulty: 'EASY',
    sourcePage: '132, 135',
    lessonId: 'm7-l2',
    objective: 'Separate NLP from visual perception tasks.',
    explanation:
      'Machine translation, text summarization and spam filtering are NLP tasks; classifying medical X-ray pixel fractures belongs primarily to Computer Vision.',
    options: [
      { text: 'Machine translation between Hindi and English' },
      { text: 'Email spam text filtering' },
      {
        text: 'Detecting fractures in raw orthopedic X-ray images (Computer Vision)',
        correct: true,
      },
      { text: 'Summarizing customer support emails' },
    ],
  },
  {
    slug: 'fallback-escalation',
    type: 'SINGLE_MCQ',
    title: 'Safe Fallback Design in Student Chatbots',
    prompt:
      'What should a school helpdesk chatbot do when a student’s question receives very low intent-match confidence or touches sensitive counseling issues?',
    topic: 'Chatbot Design',
    difficulty: 'MEDIUM',
    sourcePage: '128-133',
    lessonId: 'm7-l2',
    objective: 'Design safe low-confidence escalation.',
    explanation:
      'Rather than guessing wrong guidance, a trustworthy bot clarifies ambiguity and offers a direct handoff/contact for human staff.',
    options: [
      { text: 'Invent a confident policy rule automatically' },
      {
        text: 'Acknowledge uncertainty clearly and escalate/direct the student to a human counselor or clerk',
        correct: true,
      },
      { text: 'Repeat the greeting infinitely in a loop' },
      { text: 'Close the window abruptly without explanation' },
    ],
  },
  {
    slug: 'spam-filter-nlp',
    type: 'SINGLE_MCQ',
    title: 'Everyday NLP: Spam Filtering',
    prompt:
      'Which everyday inbox tool inspects message text patterns and sender indicators to classify promotional or phishing messages?',
    topic: 'NLP Applications',
    difficulty: 'EASY',
    sourcePage: '124, 132',
    lessonId: 'm7-l2',
    objective: 'Recognize spam classification as NLP.',
    explanation: 'Email spam filtering uses text classification features to protect inboxes.',
    options: [
      { text: 'Email spam filtering', correct: true },
      { text: 'Monitor brightness adjustment' },
      { text: 'Hard-drive defragmentation' },
      { text: 'Battery thermal throttling' },
    ],
  },
  {
    slug: 'implied-concept-nlp',
    type: 'SINGLE_MCQ',
    title: 'Keyword Matching vs Implied Concepts',
    prompt:
      'A rule searching strictly for the word `"refund"` misses a review saying `"Can I get my money back for this damaged keyboard?"`. Why?',
    topic: 'Language Complexity',
    difficulty: 'MEDIUM',
    sourcePage: '126',
    lessonId: 'm7-l1',
    objective: 'Contrast literal string search vs conceptual semantics.',
    explanation:
      'Unit 7 (p.126) distinguishes matching literal keywords from grasping implied concepts phrased with different words.',
    options: [
      {
        text: 'Because the concept of a refund is expressed without typing the exact literal word `"refund"`',
        correct: true,
      },
      { text: 'Because `"keyboard"` blocks semantic parsers' },
      { text: 'Because NLP ignores question marks' },
      { text: 'Because shorter sentences cannot contain nouns' },
    ],
  },
  {
    slug: 'python-rule-bot-norm',
    type: 'SINGLE_MCQ',
    title: 'Normalizing Input in a Python Rule Bot',
    prompt:
      'In Unit 7’s Python chatbot snippet (p.134), why does `user_input = user_input.lower()` help before checking dictionary/keyword matches?',
    topic: 'Python Chatbot Exercise',
    difficulty: 'EASY',
    sourcePage: '134',
    lessonId: 'm7-l2',
    objective: 'Understand case normalization in text matching.',
    explanation:
      'Converting `"HELLO"` and `"Hello"` to `"hello"` makes matching case-insensitive without duplicating every spelling.',
    options: [
      {
        text: 'It standardizes capitalization so `"Hello"` and `"HELLO"` match lowercase patterns cleanly',
        correct: true,
      },
      { text: 'It translates text automatically into French' },
      { text: 'It compiles Python bytecode into C++' },
      { text: 'It sorts all words alphabetically inside the sentence' },
    ],
  },
  {
    slug: 'supp-llm-next-token',
    type: 'SINGLE_MCQ',
    title: '[Supplemental] How Large Language Models Generate Text',
    prompt:
      '[Supplemental — GenAI Readiness] Fundamentally, how does a modern Large Language Model (LLM) generate responses to a prompt?',
    topic: 'Supplemental: Generative AI & LLMs',
    difficulty: 'MEDIUM',
    sourcePage: 'Supplemental',
    lessonId: 'm7-l2',
    supplemental: true,
    objective: 'Understand next-token prediction vs curated fact lookup.',
    explanation:
      'LLMs predict statistically plausible next tokens conditioned on context—not by querying an authoritative truth engine.',
    options: [
      { text: 'By looking up guaranteed verified facts inside a static school SQL table' },
      {
        text: 'By predicting probable next text tokens based on statistical patterns learned during pre-training',
        correct: true,
      },
      { text: 'By running human interviews before replying' },
      { text: 'By converting prose strictly into fixed CSV columns' },
    ],
  },
  {
    slug: 'supp-llm-hallucination',
    type: 'SINGLE_MCQ',
    title: '[Supplemental] Managing LLM Hallucinations',
    prompt:
      '[Supplemental — GenAI Readiness] When an LLM confidently invents a non-existent court case or book page citation, this failure is called a(n):',
    topic: 'Supplemental: Generative AI & LLMs',
    difficulty: 'EASY',
    sourcePage: 'Supplemental',
    lessonId: 'm7-l2',
    supplemental: true,
    objective: 'Identify and verify LLM hallucinations.',
    explanation:
      'Confidently fabricated details produced by generative token prediction are known as hallucinations and require primary-source verification.',
    options: [
      { text: 'Tokenization error' },
      {
        text: 'Hallucination (plausible-sounding fabricated output requiring verification)',
        correct: true,
      },
      { text: 'Deterministic compilation' },
      { text: 'Lexical normalization' },
    ],
  },

  // 5 MULTI_SELECT
  {
    slug: 'five-nlp-phases-multi',
    type: 'MULTI_SELECT',
    title: 'Identify All Five Handbook Phases of NLP',
    prompt:
      'Select ALL items that are part of the canonical five-phase NLP pipeline presented in Unit 7.',
    topic: 'Five Phases of NLP',
    difficulty: 'EASY',
    sourcePage: '130-131',
    lessonId: 'm7-l1',
    objective: 'Verify all 5 NLP phases.',
    explanation:
      'The 5 phases are Lexical, Syntactic, Semantic, Discourse Integration and Pragmatic analysis.',
    options: [
      { text: 'Lexical Analysis & Syntactic Analysis', correct: true },
      { text: 'Semantic Analysis', correct: true },
      { text: 'Discourse Integration & Pragmatic Analysis', correct: true },
      { text: 'Circuit Soldering Analysis' },
    ],
  },
  {
    slug: 'nlp-apps-multi',
    type: 'MULTI_SELECT',
    title: 'Real-World NLP Applications',
    prompt: 'Select ALL everyday applications powered significantly by NLP.',
    topic: 'NLP Applications',
    difficulty: 'EASY',
    sourcePage: '124, 132',
    lessonId: 'm7-l2',
    objective: 'Recognize multi-domain NLP deployments.',
    explanation:
      'Machine translation, document summarization, email spam filtering, sentiment classification and voice assistants all rely on NLP.',
    options: [
      { text: 'Machine translation and text summarization', correct: true },
      { text: 'Email spam filtering', correct: true },
      { text: 'Voice virtual assistants and sentiment analysis', correct: true },
      { text: 'Manual mercury thermometer reading' },
    ],
  },
  {
    slug: 'chatbot-design-parts',
    type: 'MULTI_SELECT',
    title: 'Key Concepts in Conversational Chatbot Flow',
    prompt:
      'Which elements help structure an accurate dialogue flow when designing an ordering/helpdesk chatbot?',
    topic: 'Chatbot Design',
    difficulty: 'MEDIUM',
    sourcePage: '128-133',
    lessonId: 'm7-l2',
    objective: 'Identify intents, entities and safe fallbacks.',
    explanation:
      'Intention mapping, entity extraction, multi-phrasing training inputs and clear human fallback cover robust chatbot flow.',
    options: [
      { text: 'Defining distinct Intents mapped to varied user phrasings', correct: true },
      { text: 'Extracting parameter Entities (such as date, flavour or count)', correct: true },
      { text: 'Designing a transparent fallback response for ambiguous queries', correct: true },
      { text: 'Suppressing all error messages indefinitely' },
    ],
  },
  {
    slug: 'ambiguity-causes-multi',
    type: 'MULTI_SELECT',
    title: 'Sources of Difficulty in Human Language Understanding',
    prompt: 'Why can text classifiers misinterpret seemingly simple user messages?',
    topic: 'Language Complexity',
    difficulty: 'MEDIUM',
    sourcePage: '125-127',
    lessonId: 'm7-l1',
    objective: 'Recognize linguistic traps.',
    explanation:
      'Sarcasm, homonyms/double meanings, implied context across sentences and regional idioms challenge surface text pattern matchers.',
    options: [
      { text: 'Words having multiple meanings depending on context (ambiguity)', correct: true },
      { text: 'Sarcasm where literal positive words express frustration', correct: true },
      { text: 'Pronouns (`it`, `they`) whose meaning depends on earlier turns', correct: true },
      { text: 'Fixed integer spacing in decimal columns' },
    ],
  },
  {
    slug: 'supp-llm-verify-multi',
    type: 'MULTI_SELECT',
    title: '[Supplemental] Responsible Student Practices with GenAI / LLMs',
    prompt:
      '[Supplemental — GenAI Readiness] Which practices should students follow when checking or using LLM outputs for study?',
    topic: 'Supplemental: Generative AI & LLMs',
    difficulty: 'EASY',
    sourcePage: 'Supplemental',
    lessonId: 'm7-l2',
    supplemental: true,
    objective: 'Apply critical verification to LLM generations.',
    explanation:
      'Always verify facts/citations against authoritative sources, test generated code cleanly, protect privacy and avoid blind copy-pasting.',
    options: [
      {
        text: 'Fact-check citations, statistics and code outputs against trusted references',
        correct: true,
      },
      {
        text: 'Remember LLMs predict plausible text patterns rather than verifying truth',
        correct: true,
      },
      { text: 'Never treat LLM output as an infallible primary source', correct: true },
      { text: 'Assume every confident URL or page citation generated by an LLM actually exists' },
    ],
  },

  // 5 TRUE_FALSE
  {
    slug: 'tf-rule-bot-bias',
    type: 'TRUE_FALSE',
    title: 'AI-Powered Chatbot Training Risks',
    prompt:
      'True or False: Unlike rigid rule-based scripts, AI-powered chatbots can adapt to varied user wording, yet they remain susceptible to biases learned from training data.',
    topic: 'Chatbot Design',
    difficulty: 'EASY',
    sourcePage: '128',
    lessonId: 'm7-l2',
    objective: 'Verify handbook rule-vs-AI comparison table.',
    explanation:
      'True. Unit 7’s comparison table highlights both adaptability benefits and data-bias risks.',
    correctBoolean: true,
  },
  {
    slug: 'tf-syntax-vs-semantics',
    type: 'TRUE_FALSE',
    title: 'Grammatically Valid Yet Nonsensical Sentences',
    prompt:
      'True or False: A sentence can pass Syntactic Analysis cleanly as valid grammar while still failing Semantic Analysis because its meaning makes no sense.',
    topic: 'Five Phases of NLP',
    difficulty: 'MEDIUM',
    sourcePage: '130-131',
    lessonId: 'm7-l1',
    objective: 'Separate grammar structure from semantic coherence.',
    explanation:
      'True. `"Hot ice cream writes homework"` follows English grammar (`Adj + N + V + N`) while being semantically nonsensical.',
    correctBoolean: true,
  },
  {
    slug: 'tf-intent-vs-entity',
    type: 'TRUE_FALSE',
    title: 'Meaning of Intent',
    prompt:
      'True or False: In chatbot architecture, an Intent specifies an adjustable slot value such as `"chocolate"` or `"7:00 PM"`, while an Entity states the user’s high-level goal.',
    topic: 'Chatbot Design',
    difficulty: 'EASY',
    sourcePage: '129',
    lessonId: 'm7-l2',
    objective: 'Confirm Intent vs Entity roles accurately.',
    explanation:
      'False—it is the reverse! Intent represents the user’s goal (e.g. OrderIceCream), while Entities capture details like `"chocolate"` or `"7:00 PM"`.',
    correctBoolean: false,
  },
  {
    slug: 'tf-nlp-written-and-spoken',
    type: 'TRUE_FALSE',
    title: 'Scope of NLP Inputs',
    prompt:
      'True or False: Natural Language Processing applies exclusively to typed English emails and never deals with speech systems.',
    topic: 'Introduction to NLP',
    difficulty: 'EASY',
    sourcePage: '124, 130',
    lessonId: 'm7-l1',
    objective: 'Verify spoken + written multi-lingual NLP.',
    explanation:
      'False. NLP supports speech-to-text, virtual voice assistants and diverse written languages.',
    correctBoolean: false,
  },
  {
    slug: 'tf-supp-context-window',
    type: 'TRUE_FALSE',
    title: '[Supplemental] LLM Context Window Awareness',
    prompt:
      '[Supplemental — GenAI Readiness] True or False: Because LLMs have a finite context window and generate token-by-token completions, long instructions or hidden details outside their active context can be dropped or misquoted.',
    topic: 'Supplemental: Generative AI & LLMs',
    difficulty: 'MEDIUM',
    sourcePage: 'Supplemental',
    lessonId: 'm7-l2',
    supplemental: true,
    objective: 'Understand finite context windows.',
    explanation:
      'True. Context limits constrain what information the model attends to when predicting tokens.',
    correctBoolean: true,
  },

  // 5 FILL_BLANK
  {
    slug: 'fb-pragmatic-phase',
    type: 'FILL_BLANK',
    title: 'Context & Speaker-Purpose NLP Phase',
    prompt:
      'The fifth NLP phase, which looks beyond literal word definitions to understand real-world speaker intention and social context, is called ______ Analysis.',
    topic: 'Five Phases of NLP',
    difficulty: 'MEDIUM',
    sourcePage: '131',
    lessonId: 'm7-l1',
    objective: 'Recall Pragmatic Analysis.',
    explanation: 'Pragmatic analysis handles indirect requests, tone and real-world context.',
    acceptedAnswers: ['Pragmatic'],
  },
  {
    slug: 'fb-lexical-tokens',
    type: 'FILL_BLANK',
    title: 'Basic Text Units After Segmentation',
    prompt:
      'When an NLP preprocessor splits a raw sentence into individual word/punctuation segments for indexing, those pieces are called ______.',
    topic: 'Lexical Analysis',
    difficulty: 'EASY',
    sourcePage: '124, 130',
    lessonId: 'm7-l1',
    objective: 'Recall tokens.',
    explanation: 'Text units segmented from sentences are tokens.',
    acceptedAnswers: ['tokens', 'token'],
  },
  {
    slug: 'fb-discourse-pronouns',
    type: 'FILL_BLANK',
    title: 'Linking Meaning Across Sentences',
    prompt:
      'Determining what `"it"` or `"they"` refers to in a preceding sentence happens during ______ Integration.',
    topic: 'Five Phases of NLP',
    difficulty: 'MEDIUM',
    sourcePage: '131',
    lessonId: 'm7-l1',
    objective: 'Recall Discourse Integration.',
    explanation: 'Discourse Integration resolves cross-sentence references.',
    acceptedAnswers: ['Discourse'],
  },
  {
    slug: 'fb-chatbot-intent',
    type: 'FILL_BLANK',
    title: 'User Goal in Conversational AI',
    prompt:
      'When `"When do you close?"` and `"What are your hours today?"` map to the same user goal inside a chatbot, that goal is called an ______.',
    topic: 'Chatbot Design',
    difficulty: 'EASY',
    sourcePage: '129',
    lessonId: 'm7-l2',
    objective: 'Recall Intent term.',
    explanation: 'Both utterances share the same underlying Intent.',
    acceptedAnswers: ['intent'],
  },
  {
    slug: 'fb-sentiment-task',
    type: 'FILL_BLANK',
    title: 'Detecting Opinion Polarity',
    prompt:
      'Classifying reviews as Positive, Negative or Neutral to track customer satisfaction is known as ______ Analysis.',
    topic: 'NLP Applications',
    difficulty: 'EASY',
    sourcePage: '127, 132',
    lessonId: 'm7-l2',
    objective: 'Recall Sentiment Analysis.',
    explanation: 'Sentiment Analysis gauges attitude and emotional tone.',
    acceptedAnswers: ['Sentiment'],
  },

  // 5 SHORT_ANSWER
  {
    slug: 'sa-groucho-ambiguity',
    type: 'SHORT_ANSWER',
    title: 'Explaining Linguistic Ambiguity with Context',
    prompt:
      'Consider the classic joke referenced in Unit 7: `"One morning I shot an elephant in my pajamas."` Explain why computers struggle with this sentence and which NLP phases clarify the two possible interpretations.',
    topic: 'Language Complexity',
    difficulty: 'MEDIUM',
    sourcePage: '125, 130-131',
    lessonId: 'm7-l1',
    objective: 'Apply syntactic/pragmatic analysis to structural ambiguity.',
    explanation:
      'Prepositional attachment `"in my pajamas"` could modify `"I"` (syntactic subject) or `"elephant"`. World-knowledge/pragmatic reasoning favors the human wearing pajamas.',
    expectedPoints: [
      'Identifies syntactic prepositional attachment ambiguity ("who wore the pajamas?")',
      'Explains Syntactic/Semantic parsing allows both trees while Pragmatic world-context resolves the absurdity',
    ],
  },
  {
    slug: 'sa-intent-entity-ex',
    type: 'SHORT_ANSWER',
    title: 'Extracting Intent and Entities from a Query',
    prompt:
      'Identify the likely Intent and extract at least two Entities from the request: `"Reserve the science projector for Grade 10 Section B at 10:30 AM tomorrow."`',
    topic: 'Chatbot Design',
    difficulty: 'EASY',
    sourcePage: '129, 133',
    lessonId: 'm7-l2',
    objective: 'Practice Intent/Entity schema breakdown.',
    explanation:
      'Intent: `BookEquipment` / `ReserveResource`. Entities: item=`science projector`, group=`Grade 10 Section B`, time=`10:30 AM`, date=`tomorrow`.',
    expectedPoints: [
      'Intent clearly states resource booking/reservation',
      'Identifies specific entity slots (resource item, class/section, time and date)',
    ],
  },
  {
    slug: 'sa-rule-vs-ml-bot',
    type: 'SHORT_ANSWER',
    title: 'When to Prefer Rule-Based vs AI Chatbots',
    prompt:
      'Compare one scenario where a deterministic Rule-Based Chatbot is preferable and one scenario where an ML/AI-assisted NLP classifier adds genuine value.',
    topic: 'Chatbot Design',
    difficulty: 'MEDIUM',
    sourcePage: '128',
    lessonId: 'm7-l2',
    objective: 'Make principled architectural choices.',
    explanation:
      'Strict regulated step forms (banking PIN reset / official fee schedule menu) benefit from deterministic rules; open-ended customer support routing benefits from flexible phrasing matching with human fallback.',
    expectedPoints: [
      'Rule-based: strict compliance workflows where unpredictable wording could cause policy error',
      'AI-powered: open-ended helpdesk queries expressed in dozens of informal phrasings/dialects (with confidence fallback)',
    ],
  },
  {
    slug: 'sa-five-phases-trace',
    type: 'SHORT_ANSWER',
    title: 'Tracing Two Consecutive Sentences Across NLP Phases',
    prompt:
      'Given `"The principal praised Aarav. He submitted an energy-saving prototype."`, explain briefly what Syntactic Analysis, Semantic Analysis and Discourse Integration each determine here.',
    topic: 'Five Phases of NLP',
    difficulty: 'MEDIUM',
    sourcePage: '130-131',
    lessonId: 'm7-l1',
    objective: 'Differentiate NLP analysis layers cleanly.',
    explanation:
      'Syntactic validates Subject-Verb-Object structure; Semantic links `"praised"` and `"submitted"` meanings; Discourse links `"He"` -> `"Aarav"`.',
    expectedPoints: [
      'Syntactic checks grammatical subject/verb/object word ordering',
      'Semantic evaluates meaningful agent/object action roles',
      'Discourse links pronoun `"He"` back to `"Aarav"` across the sentence boundary',
    ],
  },
  {
    slug: 'sa-supp-llm-vs-bot',
    type: 'SHORT_ANSWER',
    title: '[Supplemental] Handbook Intent Bots vs Modern LLMs',
    prompt:
      '[Supplemental — GenAI Readiness] Explain one operational advantage and one distinct safety/reliability risk of replacing an intent/entity rule chatbot with an unconstrained Large Language Model.',
    topic: 'Supplemental: Generative AI & LLMs',
    difficulty: 'MEDIUM',
    sourcePage: 'Supplemental',
    lessonId: 'm7-l2',
    supplemental: true,
    objective: 'Weigh LLM fluency against hallucination & guardrail risks.',
    explanation:
      'LLMs understand nuanced phrasing naturally across topics, yet can fabricate non-existent rules (hallucinations) or follow adversarial prompts unless grounded safely.',
    expectedPoints: [
      'Advantage: flexible comprehension of complex multi-part questions and natural phrasing without rigid trees',
      'Risk: hallucinations (inventing false policies/citations) unless grounded in authoritative retrieval & guardrails',
    ],
  },

  // 2 LONG_CASE
  {
    slug: 'lc-ecommerce-nlp-case',
    type: 'LONG_CASE',
    title: 'Case Study: Scaling Customer Support & Review Insights for E-Commerce',
    prompt:
      'Referencing the Unit 7 scenario (p.136), imagine you manage support for a rapidly growing multilingual e-commerce platform flooded with regional slang, sarcastic 3-star reviews (`"Great, another torn charger!"`) and repetitive order-status messages. Design an NLP strategy explaining: (1) how Sentiment Analysis & Intent Classification prioritize urgent complaints, (2) why naive keyword sentiment breaks on slang/sarcasm (and how human-in-the-loop review helps), (3) a clear Intent + Entity + Fallback schema for order queries, and (4) why cultural/linguistic test diversity prevents regional unfairness.',
    topic: 'Enterprise NLP Case Study',
    difficulty: 'HARD',
    sourcePage: '126-136',
    lessonId: 'm7-l2',
    objective: 'Architect practical, context-aware multilingual NLP pipelines.',
    explanation:
      'Integrates intent routing, sarcasm caveats, OrderID/Date entity extraction, confidence threshold escalation and multilingual dialect testing.',
    expectedPoints: [
      'Routes routine tracking intents cleanly while surfacing angry/damaged complaints via sentiment + keywords',
      'Addresses sarcasm/slang errors via context features + manual support agent review queues',
      'Defines safe fallback ("transferring to specialist") for low-confidence or sensitive refund disputes',
      'Validates accuracy across underrepresented regional dialects rather than English-only benchmarks',
    ],
  },
  {
    slug: 'lc-school-library-bot',
    type: 'LONG_CASE',
    title: 'Case Study: Complete Blueprint for a Safe School Library Assistant',
    prompt:
      'Design a comprehensive 4-intent school library chatbot supporting: book availability search, borrowing rules/hours lookup, book renewal notice, and an out-of-scope escalation path. Specify: (a) 3 sample utterances per intent, (b) required Entities, (c) a Python dictionary/keyword fallback prototype plan (or hybrid rule + ML design), and (d) how Discourse Integration helps handle follow-up queries like `"Reserve it for me"` without confusing books.',
    topic: 'Chatbot Architecture Case Study',
    difficulty: 'MEDIUM',
    sourcePage: '128-134',
    lessonId: 'm7-l2',
    objective: 'Connect dialogue state, intents, entities and safe fallback.',
    explanation:
      'Covers clear intents, title/author/section entities, normalized Python matching, context tracking (`last_book_id`), and polite out-of-scope escalation.',
    expectedPoints: [
      'Clear intent definitions + varied example phrasings + concrete entities (`book_title`, `author`, `section`)',
      'Dialogue state tracking resolves follow-up pronouns (`"it"`) safely with user confirmation ("Confirm reserving <Title>?")',
      'Explicit fallback directing ambiguous/counseling/policy edge queries to school librarians',
    ],
  },

  // 2 PRACTICAL
  {
    slug: 'pr-python-bot-extend',
    type: 'PRACTICAL',
    title: 'Practical: Tracing & Improving a Python Rule-Based Chatbot',
    prompt:
      'Examine this Unit 7 starter rule chatbot snippet:\n```python\nresponses = {\n    "hours": "The library is open Mon-Sat, 8 AM to 5 PM.",\n    "borrow": "Students may borrow up to 3 books for 14 days."\n}\ndef reply(msg):\n    msg = msg.lower()\n    for k in responses:\n        if k in msg:\n            return responses[k]\n    return "Sorry, I did not understand."\n```\n(1) Trace what happens for `"Can I check library HOURS please?"` and `"I need to borrow books for 3 hours"`. Spot the subtle bug in `"3 hours"`!\n(2) Propose two code fixes using word-boundary or intent scoring + clarification prompt.',
    topic: 'Chatbot Debugging Practical',
    difficulty: 'MEDIUM',
    sourcePage: '129, 134',
    lessonId: 'm7-l2',
    objective: 'Identify brittle substring collision and design safer matching.',
    explanation:
      '"Can I check library HOURS?" matches `"hours"` via `.lower()`. `"I need to borrow books for 3 hours"` triggers `"hours"` FIRST because dictionary insertion order checks `"hours"` before `"borrow"` even though intent was `"borrow"`! Fixes include intent keyword sets + scoring/disambiguation.',
    expectedPoints: [
      'Identifies `"3 hours"` falsely matching `"hours"` rule due to substring search + iteration order',
      'Proposes keyword-list intents / regex word boundaries / tie disambiguation prompt ("Did you ask about opening hours or borrowing?")',
    ],
  },
  {
    slug: 'pr-nlp-5phase-worksheet',
    type: 'PRACTICAL',
    title: 'Practical: 5-Phase NLP Disambiguation Worksheet',
    prompt:
      'Take this 2-sentence exchange: `"Ravi took his tablet to repair at the clinic. It was cracked near the edge."`\nWalk concretely through all FIVE NLP phases (Lexical, Syntactic, Semantic, Discourse, Pragmatic) explaining: (a) what each phase outputs/checks, (b) the double meaning of `"tablet"` + `"clinic"` that challenges naive dictionary lookups, and (c) how surrounding discourse resolves whether `"tablet"` means medicine pill or electronic device.',
    topic: '5-Phase NLP Practical',
    difficulty: 'MEDIUM',
    sourcePage: '125-131',
    lessonId: 'm7-l1',
    objective: 'Apply every NLP layer rigorously to lexical/discourse ambiguity.',
    explanation:
      'Traces tokens -> grammar -> medical vs hardware senses of `"tablet"`/`"clinic"` -> pronoun `"It"` -> situational resolution (`"repair"` + `"cracked"` points to electronic screen).',
    expectedPoints: [
      'Correct concrete action at each of the 5 phases',
      'Explains dual meanings (`tablet` = pill vs electronic device; `clinic` = medical clinic vs repair clinic)',
      'Uses Discourse + Pragmatic context (`repair`, `cracked near edge`) to disambiguate device over medication',
    ],
  },
]);
