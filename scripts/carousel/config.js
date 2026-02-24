/**
 * Carousel slide configuration — 10 slides for India AI Summit 2026.
 * Content extracted from enhanced-carousel-design.txt
 */

const DIMENSIONS = {
  carousel: { width: 1080, height: 1350 },
  reel: { width: 1080, height: 1920 },
};

const slides = [
  // ═══════════════════════════════════════════════════════
  // SLIDE 1 — THE HOOK [PHOTO]
  // ═══════════════════════════════════════════════════════
  {
    slide: 1,
    type: 'photo',
    photo: '4.jpeg',
    showSwipeArrow: true,
    content: `
      <div class="content-area">
        <div class="headline size-lg" style="margin-bottom: 16px;">THE INDIA AI SUMMIT 2026.</div>
        <div style="margin-bottom: 12px;">
          <span class="cyan-number size-lg">$250 BILLION</span>
          <span class="headline size-sm"> IN PLEDGES.</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span class="cyan-number size-sm">300,000</span>
          <span class="headline size-sm"> PARTICIPANTS.</span>
        </div>
        <div class="headline size-md" style="margin-bottom: 24px;">GUINNESS WORLD RECORD.</div>
        <div class="headline size-sm" style="margin-top: 16px;">I WAS THERE. HERE'S WHAT<br>ACTUALLY HAPPENED.</div>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 2 — DAY 1-2: THE MONEY [TEXT CARD]
  // ═══════════════════════════════════════════════════════
  {
    slide: 2,
    type: 'text-card',
    content: `
      <div class="day-header">DAY 1</div>
      <div class="bullet-text" style="margin-bottom: 8px;">Modi inaugurates at Bharat Mandapam.</div>
      <div class="sub-text italic" style="margin-bottom: 20px;">"India — the most AI-ready democracy."</div>

      <div class="glass-card" style="margin-bottom: 24px;">
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> ADANI: <span class="cyan">$100B</span> TO AI DATA CENTERS</div>
        <div class="sub-text" style="padding-left: 28px;">(largest single corporate pledge in AI history)</div>
      </div>

      <div class="day-header" style="margin-top: 8px;">DAY 2</div>
      <div class="bullet-text"><span class="bullet-arrow">&gt;</span> GOOGLE: <span class="cyan">$15B</span></div>
      <div class="bullet-text"><span class="bullet-arrow">&gt;</span> MICROSOFT: <span class="cyan">$17.5B</span> INDIA + <span class="cyan">$50B</span> GLOBAL SOUTH</div>
      <div class="bullet-text"><span class="bullet-arrow">&gt;</span> AMAZON: <span class="cyan">~$16B</span></div>
      <div class="bullet-text" style="margin-bottom: 20px;"><span class="bullet-arrow">&gt;</span> OPENAI + TATA: MULTI-BILLION HYPERVAULT</div>

      <div class="cyan-number size-xs" style="margin-top: 8px;">= $150B+ BY DAY 2</div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 3 — WHAT $250B BUYS [TEXT CARD]
  // ═══════════════════════════════════════════════════════
  {
    slide: 3,
    type: 'text-card',
    content: `
      <div class="headline size-lg" style="margin-bottom: 28px;">WHAT <span class="cyan">$250B</span> BUYS:</div>

      <div class="glass-card" style="margin-bottom: 20px;">
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> <span class="cyan-number size-md" style="display:inline;">58,000</span> GPUs</div>
        <div class="sub-text" style="padding-left: 28px;">(up from 38,000)</div>
      </div>

      <div class="glass-card" style="margin-bottom: 20px;">
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> CLOUD AI CLUSTERS FOR <span class="cyan">450M+</span> USERS</div>
        <div class="sub-text" style="padding-left: 28px;">(Google + Jio partnership)</div>
      </div>

      <div class="glass-card" style="margin-bottom: 28px;">
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> INDIA'S FIRST COMMERCIAL CHIP FAB</div>
        <div class="sub-text" style="padding-left: 28px;">(Micron, Sanand, Gujarat)</div>
      </div>

      <div class="headline size-sm" style="margin-bottom: 8px;">COMPUTE. INFRASTRUCTURE. HARDWARE.</div>
      <div class="headline size-sm italic" style="color: var(--white); font-weight: 800;">BUT WHAT ABOUT THE DESIGN LAYER?</div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 4 — DAY 3 SETUP [PHOTO]
  // ═══════════════════════════════════════════════════════
  {
    slide: 4,
    type: 'photo',
    photo: 'WhatsApp Image 2026-02-23 at 06.43.25.jpeg',
    content: `
      <div class="content-area" style="justify-content: center; height: 100%; padding-bottom: 120px;">
        <div class="headline size-xl" style="margin-bottom: 24px;">THEN CAME DAY 3.</div>
        <div style="margin-bottom: 16px;">
          <span class="cyan-number size-xl">5</span>
          <span class="headline size-lg"> ANNOUNCEMENTS.</span>
        </div>
        <div class="headline size-md" style="margin-bottom: 8px;">ONE DAY.</div>
        <div class="headline size-md">EVERYTHING CHANGED.</div>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 5 — DAY 3 BREAKTHROUGHS [TEXT CARD]
  // ═══════════════════════════════════════════════════════
  {
    slide: 5,
    type: 'text-card',
    content: `
      <div class="day-header">DAY 3</div>

      <div class="numbered-item">
        <div class="numbered-circle">1</div>
        <div>
          <div class="bullet-text">SEMICONDUCTOR MISSION 2.0</div>
          <div class="sub-text">Rs 40,000 CRORE (<span class="cyan">$4.7B</span>)</div>
        </div>
      </div>

      <div class="numbered-item">
        <div class="numbered-circle">2</div>
        <div>
          <div class="bullet-text">MICRON GUJARAT</div>
          <div class="sub-text">INDIA'S FIRST COMMERCIAL CHIPS</div>
        </div>
      </div>

      <div class="numbered-item">
        <div class="numbered-circle">3</div>
        <div>
          <div class="bullet-text">HASSABIS + BENGIO + LECUN</div>
          <div class="sub-text">JOINT KEYNOTE. <span class="cyan">500,000+</span> VIEWERS.</div>
        </div>
      </div>

      <div class="numbered-item">
        <div class="numbered-circle">4</div>
        <div>
          <div class="bullet-text"><span class="cyan">CHIPOS</span> LAUNCHED.</div>
          <div class="sub-text italic">(I'LL EXPLAIN.)</div>
        </div>
      </div>

      <div class="numbered-item">
        <div class="numbered-circle">5</div>
        <div>
          <div class="bullet-text"><span class="cyan">CDAC</span> NOTICED.</div>
          <div class="sub-text italic">(THAT PART SURPRISED ME.)</div>
        </div>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 6 — THE GAP [PHOTO]
  // ═══════════════════════════════════════════════════════
  {
    slide: 6,
    type: 'photo',
    photo: '7.jpeg',
    content: `
      <div class="content-area">
        <div class="bullet-text" style="margin-bottom: 6px;">10 YEARS IN CHIP VERIFICATION.</div>
        <div class="bullet-text" style="margin-bottom: 6px;"><span class="cyan">INTEL. ISRO. AXELERA AI.</span></div>
        <div class="bullet-text" style="margin-bottom: 20px;">9 AWARDS. WORKING SILICON.</div>

        <div style="margin-bottom: 20px;">
          <div class="headline size-sm">VERIFICATION EATS</div>
          <span class="cyan-number size-xl">70%</span>
          <span class="headline size-sm"> OF EVERY CHIP PROJECT.</span>
        </div>

        <div class="headline size-sm" style="margin-bottom: 8px;">EVERY DESIGN TOOL IN INDIA</div>
        <div class="headline size-lg" style="margin-bottom: 16px;">IS FOREIGN-BUILT.</div>

        <div>
          <span class="cyan-number size-md">ZERO</span>
          <span class="headline size-sm"> INDIAN COMPANIES</span>
        </div>
        <div class="headline size-sm">BUILDING THE DESIGN LAYER.</div>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 7 — CHIPOS REVEAL [TEXT CARD]
  // ═══════════════════════════════════════════════════════
  {
    slide: 7,
    type: 'text-card',
    content: `
      <div class="headline size-xl" style="margin-bottom: 12px;">SO I BUILT ONE.</div>
      <div class="chipos-brand">CHIPOS</div>

      <div class="body-text" style="margin-bottom: 24px; margin-top: 8px;">DESCRIBE A CHIP IN PLAIN ENGLISH.</div>

      <div class="glass-card" style="margin-bottom: 24px;">
        <div class="bullet-text" style="margin-bottom: 4px;">AI AGENTS:</div>
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> WRITE THE RTL</div>
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> GENERATE TESTBENCHES</div>
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> RUN VERIFICATION</div>
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> DEBUG WAVEFORMS</div>
        <div class="bullet-text"><span class="bullet-arrow">&gt;</span> ITERATE AUTONOMOUSLY. 24/7.</div>
      </div>

      <div style="margin-bottom: 16px;">
        <span class="cyan-number size-sm">261</span><span class="bullet-text"> API ROUTES. </span>
        <span class="cyan-number size-sm">228</span><span class="bullet-text"> TESTS.</span>
      </div>
      <div style="margin-bottom: 20px;">
        <span class="cyan-number size-sm">32</span><span class="bullet-text"> MCP TOOLS. ENTERPRISE-READY.</span>
      </div>

      <div class="headline size-sm" style="font-weight: 800;">NOT A COPILOT. AN OPERATING SYSTEM.</div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 8 — VALIDATION [PHOTO]
  // ═══════════════════════════════════════════════════════
  {
    slide: 8,
    type: 'photo',
    photo: 'WhatsApp Image 2026-02-23 at 06.43.29 (1).jpeg',
    content: `
      <div class="content-area">
        <div class="headline size-sm" style="margin-bottom: 4px;">WITHIN HOURS:</div>
        <div class="bullet-text" style="margin-bottom: 4px;"><span class="cyan">CDAC</span> — THE TEAM BEHIND INDIA'S</div>
        <div class="bullet-text" style="margin-bottom: 4px;"><span class="cyan">RISC-V</span> PROCESSOR — STARTED</div>
        <div class="bullet-text" style="margin-bottom: 24px;">EXPLORING <span class="cyan">CHIPOS</span>.</div>

        <div style="margin-bottom: 8px;">
          <div class="headline size-sm">GLOBALLY:</div>
          <span class="cyan-number size-lg">&lt;10</span>
          <span class="headline size-sm"> COMPANIES BUILDING THIS.</span>
        </div>
        <div style="margin-bottom: 24px;">
          <span class="cyan-number size-sm">$74M</span>
          <span class="headline size-sm"> ALREADY INVESTED IN THIS CATEGORY.</span>
        </div>

        <div>
          <div class="headline size-sm">IN INDIA:</div>
          <span class="headline size-xl" style="font-weight: 800;">ZERO.</span>
        </div>
        <div class="cyan-number size-xs" style="margin-top: 4px;">UNTIL NOW.</div>
      </div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 9 — DAY 4-5 + THESIS [TEXT CARD]
  // ═══════════════════════════════════════════════════════
  {
    slide: 9,
    type: 'text-card',
    content: `
      <div class="day-header">DAY 4-5</div>

      <div class="bullet-text"><span class="bullet-arrow">&gt;</span> PM MODI OPENS LEADERS' PLENARY</div>
      <div class="bullet-text"><span class="bullet-arrow">&gt;</span> ALTMAN + PICHAI + MACRON AT ONE ROUNDTABLE</div>
      <div class="bullet-text"><span class="bullet-arrow">&gt;</span> INDIA JOINS PAX SILICA</div>
      <div class="sub-text" style="padding-left: 28px; margin-bottom: 8px;">(GLOBAL SEMICONDUCTOR ALLIANCE)</div>
      <div class="bullet-text" style="margin-bottom: 24px;"><span class="bullet-arrow">&gt;</span> <span class="cyan">$200B+</span> TOTAL. GUINNESS RECORD.</div>

      <div class="divider"></div>

      <div style="margin-top: 16px; margin-bottom: 8px;">
        <span class="cyan-number size-xs">$250B</span>
        <span class="headline size-sm"> FOR COMPUTE.</span>
      </div>
      <div style="margin-bottom: 20px;">
        <span class="headline size-xl" style="font-weight: 800;">$0</span>
        <span class="headline size-sm"> FOR THE DESIGN LAYER.</span>
      </div>

      <div class="headline size-md" style="font-weight: 800;">INDIA ISN'T JUST CONSUMING AI.</div>
      <div class="headline size-md" style="font-weight: 800;">INDIA IS BUILDING IT.</div>
    `,
  },

  // ═══════════════════════════════════════════════════════
  // SLIDE 10 — CTA [PHOTO]
  // ═══════════════════════════════════════════════════════
  {
    slide: 10,
    type: 'photo',
    photo: '10.jpeg',
    content: `
      <div class="content-area">
        <div style="margin-bottom: 8px;">
          <span class="headline size-lg">TRY CHIPOS </span>
          <span class="cyan-number size-sm">FREE</span>
        </div>
        <div class="cyan" style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 32px; margin-bottom: 24px;">chipos.ai</div>

        <div class="headline size-sm" style="margin-bottom: 4px;">FULL SUMMIT COVERAGE (<span class="cyan">17</span> ARTICLES)</div>
        <div class="cyan" style="font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 28px; margin-bottom: 24px;">futureatoms.com/india-ai-summit-2026</div>

        <div class="divider"></div>

        <div class="headline size-sm" style="margin-top: 16px; margin-bottom: 8px;">WHAT DOES INDIA'S SEMICONDUCTOR</div>
        <div class="headline size-sm" style="margin-bottom: 16px;">INDUSTRY NEED MOST RIGHT NOW?</div>

        <div class="bullet-text" style="font-weight: 800;">TELL ME IN THE COMMENTS.</div>
        <div class="bullet-text" style="font-weight: 800;">SAVE THIS POST FOR REFERENCE.</div>
      </div>
    `,
  },
];

module.exports = { slides, DIMENSIONS };
