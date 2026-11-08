export const profile = {
  name: "Himanshu Suri",
  role: "Integrated M.Tech CSE student building with ML, signals and the web",
  location: "Hyderabad, India",
  email: "himanshusuri.2795@gmail.com",
  github: "https://github.com/Himanshu-Suri",
  linkedin: "https://linkedin.com/in/himanshu-suri-16b9a41a3",
};

export type Experience = {
  id: string;
  role: string;
  org: string;
  period: string;
  place: string;
  project?: string;
  summary: string;
  points: string[];
  tags: string[];
};

// The internship body is shown scrambled on the site, with only buzzwords
// readable. This file still ships to every visitor's browser, so the text
// below is deliberately generic: no models, numbers or methods.
export const experience: Experience[] = [
  {
    id: "iiith",
    role: "Research Intern",
    org: "IIIT Hyderabad",
    period: "Present",
    place: "Hyderabad, India",
    project: "Research Project: LLM Quantization & Efficient Inference",
    summary:
      "Research internship on LLM quantization and efficient inference.",
    points: [
      "Studied post-training LLM quantization methods and compared them against full-precision baselines.",
      "Built tooling to measure the memory use, speed and accuracy of compressed models during inference.",
      "Ran calibration experiments to understand how model weights and activations behave.",
      "Explored mixed-precision quantization schemes across transformer layers.",
      "Looked at Hadamard rotations and related techniques for reducing low-bit error.",
      "Investigated integer-only inference for running models more efficiently.",
    ],
    tags: ["Python", "PyTorch", "CUDA", "LLM", "Quantization", "Inference"],
  },
];

export type Project = {
  id: string;
  title: string;
  period: string;
  tags: string[];
  points: string[];
};

export const projects: Project[] = [
  {
    id: "rf-cnn",
    title: "RF Signal Classification using CNN",
    period: "Dec 2025 - Jan 2026",
    tags: ["Python", "PyTorch", "CNN", "SDR", "IQ", "Spectrogram"],
    points: [
      "Developed an end-to-end CNN pipeline for automated RF signal identification (SSTV, APRS, FSK, Noise).",
      "Generated spectrograms from raw IQ samples with automated 80/20 train-test splits.",
      "Trained a 3-layer CNN in PyTorch with early stopping and confusion matrix analysis.",
      "Built visualization tools for IQ waveforms, spectrograms, and class probability outputs.",
    ],
  },
  {
    id: "chat-app",
    title: "Chat App with Real-Time Messaging",
    period: "Dec 2025 - Jan 2026",
    tags: [
      "MERN",
      "Socket.io",
      "JWT",
      "Zustand",
      "TailwindCSS",
      "Daisy UI",
      "React",
    ],
    points: [
      "Built a full-stack chat application using the MERN stack with real-time messaging via Socket.io.",
      "Implemented JWT-based authentication and secure authorization flows.",
      "Added online user presence tracking with global state management using Zustand.",
      "Designed a responsive UI using TailwindCSS and Daisy UI with robust error handling.",
      "Deployed the application to a cloud platform for production use.",
    ],
  },
];

export type Education = {
  id: string;
  school: string;
  detail: string;
  score: string;
  period: string;
  place: string;
  extra?: string;
};

export const education: Education[] = [
  {
    id: "mahindra",
    school: "Mahindra University",
    detail: "Integrated M.Tech, Computer Science and Engineering",
    score: "GPA 7.4",
    period: "Aug 2023 - May 2028 (expected)",
    place: "Hyderabad, India",
    extra:
      "Data Structures & Algorithms, Machine Learning, Database Management Systems, Computer Networks, Object Oriented Programming",
  },
  {
    id: "narayana",
    school: "Narayana Junior College",
    detail: "Intermediate, MPC",
    score: "93%",
    period: "Jun 2021 - May 2023",
    place: "Hyderabad, India",
  },
  {
    id: "allsaints",
    school: "All Saints High School",
    detail: "High School",
    score: "GPA 10.0",
    period: "Jun 2013 - May 2021",
    place: "Hyderabad, India",
  },
];

export const skills: { id: string; group: string; items: string[] }[] = [
  {
    id: "lang",
    group: "Programming Languages",
    items: ["Python", "C", "JavaScript", "SQL"],
  },
  {
    id: "rf",
    group: "RF & Signal Processing",
    items: [
      "SDR",
      "IQ Analysis",
      "FFT",
      "Spectrogram Analysis",
      "Satellite Communication",
    ],
  },
  {
    id: "dl",
    group: "Deep Learning",
    items: [
      "PyTorch",
      "CNN Architectures",
      "Model Optimization",
      "Confusion Matrix Analysis",
    ],
  },
  {
    id: "full",
    group: "Full-Stack Development",
    items: ["MERN Stack", "Socket.io", "JWT Authentication", "Zustand", "Next.js"],
  },
  {
    id: "front",
    group: "Frontend",
    items: ["React.js", "TailwindCSS", "Daisy UI", "Responsive Design"],
  },
  {
    id: "tools",
    group: "Tools & Platforms",
    items: ["Git", "RTL-SDR"],
  },
  {
    id: "llm",
    group: "LLM Quantization & Inference",
    items: [
      "AWQ",
      "GPTQ",
      "FP8",
      "NF4",
      "BitsAndBytes",
      "llm-compressor",
      "Hugging Face Transformers",
      "CUDA",
      "LLM Benchmarking",
    ],
  },
];

export const awards: { id: string; title: string; note: string }[] = [
  {
    id: "gemini",
    title: "2nd Place, AI Student of the Year Hackathon",
    note: "Google Gemini collaboration",
  },
  {
    id: "scholarship",
    title: "Academic Merit Scholarship",
    note: "Awarded scholarships worth ₹1,00,000 for academic performance, AY 2024-2025 and AY 2025-2026",
  },
  {
    id: "wpx",
    title: "1st Place, CQ WPX India Youth Category",
    note: "International RF competition",
  },
  {
    id: "iaru",
    title: "2nd Place, IARU HF 2024 India Youth Category",
    note: "International Amateur Radio Union",
  },
  {
    id: "lostinspace",
    title: "2nd Place, SpaceTech LostInSpace Hackathon",
    note: "Mahindra University",
  },
  {
    id: "ham",
    title: "HAM Radio License Holder",
    note: "Active amateur radio operator, VU2AZH",
  },
];
