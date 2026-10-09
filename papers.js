// The sources the guide mentions: research papers for the most part, and a
// few essays, announcements and news articles. A link marked data-paper="key"
// gets its address from here and its short summary from the strings file
// (papers, under the same key); app.js shows the summary on the first click
// and lets the second click through to the source. Journal articles point to
// their DOI, everything else to the author's or publisher's own page.
// Titles stay as published.

const arxiv = (id) => `https://arxiv.org/pdf/${id}`;

const PAPERS = {
  attention: {
    title: 'Attention Is All You Need', url: arxiv('1706.03762'),
  },
  bengio: {
    title: 'A Neural Probabilistic Language Model', url: 'https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf',
  },
  alexnet: {
    title: 'ImageNet Classification with Deep Convolutional Neural Networks', url: 'https://proceedings.neurips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf',
  },
  word2vec: {
    title: 'Efficient Estimation of Word Representations in Vector Space', url: arxiv('1301.3781'),
  },
  bahdanau: {
    title: 'Neural Machine Translation by Jointly Learning to Align and Translate', url: arxiv('1409.0473'),
  },
  distill: {
    title: 'Distilling the Knowledge in a Neural Network', url: arxiv('1503.02531'),
  },
  moe: {
    title: 'Adaptive Mixtures of Local Experts', url: 'https://www.cs.toronto.edu/~hinton/absps/jjnh91.pdf',
  },
  bpe: {
    title: 'Neural Machine Translation of Rare Words with Subword Units', url: arxiv('1508.07909'),
  },
  vit: {
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale', url: arxiv('2010.11929'),
  },
  clip: {
    title: 'Learning Transferable Visual Models From Natural Language Supervision', url: arxiv('2103.00020'),
  },
  bitnet: {
    title: 'The Era of 1-bit LLMs: All Large Language Models are in 1.58 Bits', url: arxiv('2402.17764'),
  },
  ttt: {
    title: 'Test-Time Training with Self-Supervision for Generalization under Distribution Shifts', url: arxiv('1909.13231'),
  },
  tttLlm: {
    title: 'The Surprising Effectiveness of Test-Time Training for Few-Shot Learning', url: arxiv('2411.07279'),
  },
  gpt1: {
    title: 'Improving Language Understanding by Generative Pre-Training', url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf',
  },
  gpt2: {
    title: 'Language Models are Unsupervised Multitask Learners', url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf',
  },
  gpt3: {
    title: 'Language Models are Few-Shot Learners', url: arxiv('2005.14165'),
  },
  bert: {
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', url: arxiv('1810.04805'),
  },
  rag: {
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', url: arxiv('2005.11401'),
  },
  nucleus: {
    title: 'The Curious Case of Neural Text Degeneration', url: arxiv('1904.09751'),
  },
  cot: {
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', url: arxiv('2201.11903'),
  },
  react: {
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models', url: arxiv('2210.03629'),
  },
  prefs: {
    title: 'Deep Reinforcement Learning from Human Preferences', url: arxiv('1706.03741'),
  },
  instructgpt: {
    title: 'Training Language Models to Follow Instructions with Human Feedback', url: arxiv('2203.02155'),
  },
  lora: {
    title: 'LoRA: Low-Rank Adaptation of Large Language Models', url: arxiv('2106.09685'),
  },
  rt2: {
    title: 'RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control', url: arxiv('2307.15818'),
  },
  graphcast: {
    title: 'GraphCast: Learning Skillful Medium-Range Global Weather Forecasting', url: arxiv('2212.12794'),
  },
  alphafold: {
    title: 'Highly Accurate Protein Structure Prediction with AlphaFold', url: 'https://www.nature.com/articles/s41586-021-03819-2.pdf',
  },
  mcculloch: {
    title: 'A Logical Calculus of the Ideas Immanent in Nervous Activity', url: 'https://doi.org/10.1007/BF02478259',
  },
  shannon: {
    title: 'A Mathematical Theory of Communication', url: 'https://doi.org/10.1002/j.1538-7305.1948.tb01338.x',
  },
  turing: {
    title: 'Computing Machinery and Intelligence', url: 'https://doi.org/10.1093/mind/LIX.236.433',
  },
  dartmouth: {
    title: 'A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence', url: 'https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html',
  },
  perceptron: {
    title: 'The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain', url: 'https://doi.org/10.1037/h0042519',
  },
  wiener: {
    title: 'Some Moral and Technical Consequences of Automation', url: 'https://doi.org/10.1126/science.131.3410.1355',
  },
  good: {
    title: 'Speculations Concerning the First Ultraintelligent Machine', url: 'https://doi.org/10.1016/S0065-2458(08)60418-0',
  },
  eliza: {
    title: 'ELIZA—A Computer Program for the Study of Natural Language Communication Between Man and Machine', url: 'https://doi.org/10.1145/365153.365168',
  },
  searle: {
    title: 'Minds, Brains, and Programs', url: 'https://doi.org/10.1017/S0140525X00005756',
  },
  backprop: {
    title: 'Learning Representations by Back-propagating Errors', url: 'https://doi.org/10.1038/323533a0',
  },
  hawking: {
    title: 'Stephen Hawking warns artificial intelligence could end mankind', url: 'https://www.bbc.com/news/technology-30290540',
  },
  alphago: {
    title: 'Mastering the Game of Go with Deep Neural Networks and Tree Search', url: 'https://doi.org/10.1038/nature16961',
  },
  gnmt: {
    title: "Google's Neural Machine Translation System: Bridging the Gap between Human and Machine Translation", url: arxiv('1609.08144'),
  },
  bitterLesson: {
    title: 'The Bitter Lesson', url: 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html',
  },
  parrots: {
    title: 'On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?', url: 'https://doi.org/10.1145/3442188.3445922',
  },
  mcp: {
    title: 'Introducing the Model Context Protocol', url: 'https://www.anthropic.com/news/model-context-protocol',
  },
  geminiEnergy: {
    title: 'Measuring the Environmental Impact of Delivering AI at Google Scale', url: arxiv('2508.15734'),
  },
  gentleSingularity: {
    title: 'The Gentle Singularity', url: 'https://blog.samaltman.com/the-gentle-singularity',
  },
};

document.querySelectorAll('a.source[data-paper]').forEach((link) => {
  // A key that is not in the list leaves that one link plain; the others still work.
  const paper = PAPERS[link.dataset.paper];
  if (!paper) return;
  const { title, url } = paper;
  const { by, summary } = STRINGS.papers[link.dataset.paper] ?? {};
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  // Without a summary in this language the link still opens the paper, at the first click.
  if (!summary) return;
  link.dataset.tipTitle = t('tooltip.paperTitle', { title, by });
  link.dataset.tip = summary;
  link.setAttribute('aria-describedby', 'tooltip');
});
