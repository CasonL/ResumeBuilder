type Props = {
  isActive: boolean;
};

export default function ResumeTD({ isActive }: Props) {
  return (
    <section id="resume-td" className={`resume${isActive ? ' show print' : ''}`} aria-labelledby="tab-td">
      <div className="top">
        <div>
          <p className="name">Cason Lamothe <span className="small">(he/him)</span></p>
          <p className="tagline">
            Business student with proven experience in sales, operations, and team leadership. Known for executing reliably
            under pressure, improving processes, and communicating clearly with stakeholders.
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
          </p>

          <h2>Experience</h2>

          <div className="avoid-break">
            <div className="role">
              <b>Franchisee • College Pro</b>
              <span className="meta">Apr 2024–Sep 2024</span>
            </div>
            <ul>
              <li>Surpassed $42K+ sales goal and exceeded targets by ~20% through structured outreach and follow-up.</li>
              <li>
                Led recruiting, training, and site safety; maintained documentation and consistent operational standards.
              </li>
              <li>Managed timelines, customer expectations, and issue resolution in a high-volume environment.</li>
            </ul>
          </div>

          <div className="avoid-break">
            <div className="role">
              <b>Supervisor • The Donut Mill</b>
              <span className="meta">2017–2023</span>
            </div>
            <ul>
              <li>Supervised 12+ staff during peak periods; improved scheduling, team performance, and service quality.</li>
              <li>Handled customer escalations and ensured consistent compliance with operational procedures.</li>
              <li>Partnered with management to identify process gaps and implement practical improvements.</li>
            </ul>
          </div>

          <div className="avoid-break">
            <div className="role">
              <b>Program Leadership • MacEwan SpeechLeaders</b>
              <span className="meta">2024–Present</span>
            </div>
            <ul>
              <li>Grew membership from ~20 to 90+ members within two weeks through structured outreach and launch programming.</li>
              <li>Expanded executive team from 4 to 10 members, establishing role ownership and coordination workflows.</li>
              <li>Planned and delivered a club launch event with 50+ attendees, managing promotion, logistics, and facilitation.</li>
            </ul>
          </div>

          <h2>Projects</h2>
          <ul>
            <li>
              <b>PitchIQ</b> – Built a roleplay + feedback prototype focused on structured performance improvement.
            </li>
            <li>
              <b>Renovation Platform</b> – Piloted estimate education workflows to improve lead qualification.
            </li>
          </ul>
        </div>

        <aside>
          <h2>Strengths</h2>
          <div className="skills">
            <span className="chip">Operations</span>
            <span className="chip">Customer Service</span>
            <span className="chip">Documentation</span>
            <span className="chip">Process Improvement</span>
            <span className="chip">Stakeholder Communication</span>
            <span className="chip">Team Supervision</span>
            <span className="chip">Sales</span>
            <span className="chip">Time Management</span>
            <span className="chip">Risk Awareness</span>
          </div>

          <h2>Recognition</h2>
          <ul>
            <li>
              <b>Pitch Competition – 2nd Place ($2,000 Award):</b> Presented an early-stage venture concept; evaluated by external judges on feasibility, clarity, and impact.
            </li>
          </ul>

          <h2>Tools</h2>
          <ul>
            <li>Microsoft Excel, Word, PowerPoint, Teams</li>
            <li>Slack</li>
            <li>AI-assisted productivity tools for drafting and analysis</li>
          </ul>

          <h2>Certifications</h2>
          <ul>
            <li>Saruk Leadership (Attendance)</li>
            <li>College Pro Recognition</li>
          </ul>
        </aside>
      </div>

      <div className="foot">
        <span className="small">References available upon request</span>
        <span className="small">Resume variant: TD Bank</span>
      </div>
    </section>
  );
}
