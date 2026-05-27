export interface Experience {
  id: string;
  role: string;
  company: string;
  location?: string;
  dates: string;
  bullets: string[];
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  tags: string[];
}

export interface Skill {
  category: string;
  items: string[];
}

export interface Certification {
  name: string;
  details?: string;
}

export interface Education {
  degree: string;
  institution: string;
  dates: string;
  focus?: string;
  coursework?: string[];
}

export interface MasterData {
  personalInfo: {
    name: string;
    pronouns: string;
    location: string;
    email: string;
    phone: string;
    linkedin: string;
  };
  education: Education;
  experiences: Experience[];
  projects: Project[];
  leadership: Experience[];
  skills: Skill[];
  certifications: Certification[];
}

export const masterData: MasterData = {
  personalInfo: {
    name: "Cason Lamothe",
    pronouns: "he/him",
    location: "Edmonton, AB",
    email: "casonlamothe@gmail.com",
    phone: "403-597-8536",
    linkedin: "linkedin.com/in/casonlamothe",
  },

  education: {
    degree: "Bachelor of Commerce",
    institution: "MacEwan University",
    dates: "Expected 2026",
    focus: "Leadership",
    coursework: [
      "Strategic Management",
      "Entrepreneurship",
      "Leadership"
    ],
  },

  experiences: [
    {
      id: "pitchiq-founder",
      role: "Founder",
      company: "PitchIQ (AI Sales Training SaaS)",
      dates: "Edmonton, AB | Current | 2024–Present",
      bullets: [
        "Surpassed $2400+ sales in under two weeks through 60+ customer conversations and exceeded targets by >200% through structured outreach and follow-up.",
        "Led recruiting, training, and site policy; maintained documentation and consistent operational standards.",
        "Managed timelines, customer expectations, and issue resolution in a high-volume environment."
      ],
      tags: ["founder", "sales", "ai", "saas", "customer-service", "entrepreneurship", "training"]
    },
    {
      id: "donut-mill-supervisor",
      role: "Supervisor",
      company: "The Donut Mill",
      dates: "2017–2023",
      bullets: [
        "Supervised 12+ staff during peak periods; improved scheduling, team performance, and service quality.",
        "Refined escalations and ensured consistent compliance with operational procedures.",
        "Partnered with management to identify process gaps and implement practical improvements."
      ],
      tags: ["supervisor", "team-management", "customer-service", "operations", "scheduling"]
    },
    {
      id: "college-pro-franchisee",
      role: "Franchisee",
      company: "College Pro",
      dates: "Apr 2024–Sep 2024",
      bullets: [
        "Surpassed $42K+ in sales; nominated for Manager of the Year; delivered results under tight seasonal timelines.",
        "Led recruiting, marketing, and project operations; improved efficiency through structured training."
      ],
      tags: ["franchisee", "sales", "entrepreneurship", "team-management", "customer-service"]
    },
    {
      id: "frv-participant",
      role: "Participant",
      company: "Front Row Ventures",
      dates: "2024",
      bullets: [
        "Curated venture capital fundamentals program covering deal evaluation, portfolio strategy, and ecosystem operations."
      ],
      tags: ["venture-capital", "investment", "learning"]
    },
    {
      id: "renovation-founder",
      role: "Founder",
      company: "Renovation Intelligence Platform",
      dates: "Edmonton/Calgary/Juno • Present",
      bullets: [
        "Piloted AI-generated renovation estimates to improve homeowner education and contractor efficiency.",
        "Iterated on transparent pricing ranges, qualification logic, and streamlined flow over print work.",
        "Validated engagement pricing ranges, qualification logic, and conversion from over print work."
      ],
      tags: ["founder", "ai", "platform", "innovation", "real-estate"]
    }
  ],

  leadership: [
    {
      id: "speechleaders",
      role: "Founder",
      company: "MacEwan SpeechLeaders",
      dates: "2024–Present",
      bullets: [
        "Grew membership from ~20 to 50+ members within two weeks through structured outreach and launch programming.",
        "Expanded executive team from 6 to 10 members, establishing role ownership and coordination workflows.",
        "Planned and delivered a club launch event with 50+ attendees, managing promotion, logistics, and facilitation."
      ],
      tags: ["founder", "leadership", "public-speaking", "community", "events"]
    }
  ],

  projects: [
    {
      id: "pitchiq-roleplay",
      title: "PitchIQ",
      description: "Built a roleplay + feedback prototype focused on structured performance improvement.",
      bullets: [
        "Built a roleplay + feedback prototype focused on structured performance improvement."
      ],
      tags: ["ai", "sales", "training", "prototype"]
    },
    {
      id: "renovation-platform",
      title: "Renovation Platform",
      description: "Piloted estimate education workflows to improve lead qualification.",
      bullets: [
        "Piloted estimate education workflows to improve lead qualification."
      ],
      tags: ["ai", "platform", "real-estate", "automation"]
    },
    {
      id: "globestrat",
      title: "Strategic Management Simulation (GlobeStrat)",
      description: "Led strategy design for multi-competitor simulation; advised on cost, operations, and differentiation. Achieved top-3 finish by balancing margins and market positioning.",
      bullets: [
        "Led strategy design for multi-competitor simulation; advised on cost, operations, and differentiation.",
        "Achieved top-3 finish by balancing margins and market positioning."
      ],
      tags: ["strategy", "simulation", "leadership", "business"]
    },
    {
      id: "business-ethics",
      title: "Business Ethics (400-level)",
      description: "Developed an investment-based ethical analysis mentoring how structural incentives influence organizational behavior and reveal underlying ethical evaluator.",
      bullets: [
        "Developed an investment-based ethical analysis mentoring how structural incentives influence organizational behavior and reveal underlying ethical evaluator."
      ],
      tags: ["ethics", "analysis", "academic"]
    }
  ],

  skills: [
    {
      category: "Tools",
      items: [
        "Microsoft Excel",
        "Word",
        "PowerPoint",
        "Teams",
        "Slack",
        "AI-assisted productivity tools for drafting and analysis"
      ]
    },
    {
      category: "Core Strengths",
      items: [
        "Operations",
        "Customer Service",
        "Documentation",
        "Process Improvement",
        "Stakeholder Communication",
        "Team Supervision",
        "Sales",
        "Risk Awareness",
        "Time Management",
        "Program Coordination",
        "Pilot Execution",
        "Market Validation",
        "Commercialization Thinking",
        "Training Design"
      ]
    }
  ],

  certifications: [
    {
      name: "Scrum Leadership",
      details: "Attended"
    },
    {
      name: "College Pro Recognition"
    }
  ]
};
