type Props = {
  isActive: boolean;
};

export default function ResumeInnovates({ isActive }: Props) {
  return (
    <section
      id="resume-innovates"
      className={`resume${isActive ? ' show print' : ''}`}
      aria-labelledby="tab-innovates"
    >
      <div className="top">
        <div>
          <p className="name">Cason Lamothe <span className="small">(he/him)</span></p>
          <p className="tagline">
            Business student with applied experience across early-stage venture building, sales, and program leadership.
            Focused on pilot execution, market validation, and building scalable training systems.
          </p>
        </div>
        <div className="contact">
          Edmonton, AB • <a href="mailto:casonlamothe@gmail.com">casonlamothe@gmail.com</a>
          <br />
          <a href="tel:+14035976536">403-597-6536</a> •{' '}
          <a href="https://www.linkedin.com/in/cason-lamothe-7b1531302" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
      </div>

      <div className="grid">
        <div>
          <h2>Education</h2>
          <p>
            <b>Bachelor of Commerce</b> • MacEwan University <span className="small">(Expected 2026)</span>
            <br />
            <span className="small">Focus: Strategic Management, Entrepreneurship, Leadership</span>
          </p>

          <h2>Academic Projects</h2>
          <ul>
            <li>
              <b>Strategic Management Simulation (GlobeStrat):</b> Led strategy design for multi-year competitive simulation; achieved top-tier performance through early efficiency optimization and disciplined capital allocation. Recovered from late-stage technology constraints to finish 3rd of 8 teams; increased simulated share price by ~14% in final year through margin improvement and asset rationalization.
            </li>
            <li>
              <b>Business Ethics (400-level):</b> Developed and presented a systems-based ethical analysis examining how structural insecurity influences organizational behavior; received top evaluation.
            </li>
          </ul>

          <h2>Experience</h2>

          <div className="avoid-break">
            <div className="role">
              <b>Founder • PitchIQ (AI Sales Training SaaS)</b>
              <span className="meta">Edmonton • 2024–Present</span>
            </div>
            <ul>
              <li>Built an AI roleplay + coaching prototype to simulate sales calls and generate structured feedback.</li>
              <li>
                Conducted 60+ customer conversations with target users; validated demand signal and refined use case positioning.
              </li>
              <li>
                Iterated positioning through customer discovery, reframing from individual use to B2B training outcomes.
              </li>
              <li>
                Designed scenario-based assessments that translate real conversations into repeatable performance benchmarks.
              </li>
            </ul>
          </div>

          <div className="avoid-break">
            <div className="role">
              <b>Founder • Renovation Intelligence Platform</b>
              <span className="meta">Edmonton/Calgary • 2025–Present</span>
            </div>
            <ul>
              <li>Piloted AI-generated renovation estimates to improve homeowner education and contractor lead quality.</li>
              <li>Focused on transparent pricing ranges, qualification logic, and conversion from cold to warm leads.</li>
            </ul>
          </div>

          <div className="avoid-break">
            <div className="role">
              <b>Franchisee • College Pro</b>
              <span className="meta">Apr 2024–Sep 2024</span>
            </div>
            <ul>
              <li>
                Surpassed $42K+ in sales; nominated for Manager of the Year; delivered results under tight seasonal timelines.
              </li>
              <li>Led recruiting, marketing, and project operations; improved efficiency through structured training.</li>
            </ul>
          </div>

          <div className="avoid-break">
            <div className="role">
              <b>Participant • Front Row Ventures</b>
              <span className="meta">2024</span>
            </div>
            <ul>
              <li>
                Completed venture capital fundamentals program covering deal evaluation, portfolio strategy, and ecosystem operations.
              </li>
            </ul>
          </div>

          <div className="avoid-break">
            <div className="role">
              <b>Supervisor • The Donut Mill</b>
              <span className="meta">2017–2023</span>
            </div>
            <ul>
              <li>Supervised 12+ staff during peak periods; improved scheduling, service consistency, and team execution.</li>
              <li>Provided feedback to leadership to address process gaps and strengthen day-to-day operations.</li>
            </ul>
          </div>
        </div>

        <aside>
          <h2>Core Strengths</h2>
          <div className="skills">
            <span className="chip">Program Coordination</span>
            <span className="chip">Pilot Execution</span>
            <span className="chip">Market Validation</span>
            <span className="chip">Commercialization Thinking</span>
            <span className="chip">Stakeholder Communication</span>
            <span className="chip">Process Improvement</span>
            <span className="chip">Sales &amp; BD</span>
            <span className="chip">Training Design</span>
            <span className="chip">Documentation</span>
          </div>

          <h2>Recognition</h2>
          <p className="small">
            <b>Pitch Competition – 2nd Place ($2,000 Award)</b>
          </p>
          <ul>
            <li>Presented an early-stage venture concept; evaluated by external judges on feasibility, clarity, and impact.</li>
          </ul>

          <h2>Leadership</h2>
          <p className="small">
            <b>President • MacEwan SpeechLeaders</b> (2024–Present)
          </p>
          <ul>
            <li>Grew membership from ~20 to 90+ members within two weeks through structured outreach and launch programming.</li>
            <li>Expanded executive team from 4 to 10 members, establishing role ownership and coordination workflows.</li>
            <li>Planned and delivered a club launch event with 50+ attendees, managing promotion, logistics, and facilitation.</li>
          </ul>

          <h2>Certifications</h2>
          <ul>
            <li>Saruk Leadership (Attendance)</li>
            <li>College Pro Recognition</li>
          </ul>

          <h2>Tools</h2>
          <ul>
            <li>Microsoft Excel, Word, PowerPoint, Teams</li>
            <li>Slack</li>
            <li>AI-assisted productivity tools for drafting, analysis, and iteration</li>
          </ul>
        </aside>
      </div>

      <div className="foot">
        <span className="small">References available upon request</span>
        <span className="small">Resume variant: Alberta Innovates</span>
      </div>
    </section>
  );
}
