const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '../env.local' });

const dbPath = process.env.DB_PATH || './database/recruitment.db';

// Ensure database directory exists
const dbDir = require('path').dirname(dbPath);
const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Demo jobseeker data
const demoJobseekers = [
  {
    email: 'sarah.engineer@demo.com',
    password: 'password123',
    fullName: 'Sarah Johnson',
    education: 'Bachelor of Science in Computer Science\nStanford University, 2018-2022\nGPA: 3.8/4.0\nRelevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems',
    experience: 'Software Engineer at TechCorp (2022-Present)\n- Developed full-stack web applications using React, Node.js, and PostgreSQL\n- Led a team of 3 developers on a major feature implementation\n- Improved application performance by 40% through optimization\n\nSoftware Engineering Intern at StartupXYZ (2021)\n- Built RESTful APIs and microservices\n- Collaborated with cross-functional teams on product development',
    skills: 'Programming Languages: JavaScript, Python, Java, SQL\nFrontend: React, Vue.js, HTML5, CSS3, Tailwind CSS\nBackend: Node.js, Express.js, Django, Flask\nDatabases: PostgreSQL, MongoDB, Redis\nTools: Git, Docker, AWS, Jenkins\nSoft Skills: Team Leadership, Problem Solving, Agile Development'
  },
  {
    email: 'mike.designer@demo.com',
    password: 'password123',
    fullName: 'Mike Chen',
    education: 'Bachelor of Arts in Graphic Design\nParsons School of Design, 2019-2023\nMinor in Digital Marketing\nDean\'s List: 2020-2023',
    experience: 'UI/UX Designer at CreativeStudio (2023-Present)\n- Designed user interfaces for mobile and web applications\n- Conducted user research and usability testing\n- Created design systems and component libraries\n\nFreelance Designer (2021-2023)\n- Completed 50+ projects for various clients\n- Specialized in brand identity and digital marketing materials',
    skills: 'Design Tools: Figma, Adobe Creative Suite (Photoshop, Illustrator, XD)\nPrototyping: Figma, InVision, Framer\nUser Research: User interviews, surveys, usability testing\nDesign Systems: Component libraries, style guides\nProgramming: HTML, CSS, JavaScript (basic)\nSoft Skills: Creative Problem Solving, Client Communication, Project Management'
  },
  {
    email: 'emma.marketing@demo.com',
    password: 'password123',
    fullName: 'Emma Rodriguez',
    education: 'Master of Business Administration\nHarvard Business School, 2020-2022\nBachelor of Arts in Communications\nUniversity of California, 2016-2020\nGPA: 3.9/4.0',
    experience: 'Senior Marketing Manager at GrowthCorp (2022-Present)\n- Led digital marketing campaigns generating $2M+ in revenue\n- Managed a team of 5 marketing specialists\n- Increased brand awareness by 150% through social media campaigns\n\nMarketing Specialist at BrandAgency (2020-2022)\n- Developed and executed marketing strategies for Fortune 500 clients\n- Analyzed market trends and competitor activities',
    skills: 'Digital Marketing: SEO, SEM, Social Media Marketing, Email Marketing\nAnalytics: Google Analytics, Facebook Ads Manager, HubSpot\nContent Creation: Copywriting, Video Production, Graphic Design\nTools: Salesforce, Marketo, Hootsuite, Canva\nSoft Skills: Strategic Planning, Data Analysis, Team Leadership, Client Relations'
  },
  {
    email: 'david.data@demo.com',
    password: 'password123',
    fullName: 'David Kim',
    education: 'Master of Science in Data Science\nMIT, 2021-2023\nBachelor of Science in Mathematics\nUniversity of Chicago, 2017-2021\nGPA: 3.95/4.0',
    experience: 'Data Scientist at DataTech (2023-Present)\n- Built machine learning models for predictive analytics\n- Developed data pipelines processing 1TB+ of data daily\n- Created interactive dashboards for business intelligence\n\nData Analyst at AnalyticsInc (2021-2023)\n- Performed statistical analysis and A/B testing\n- Generated insights leading to 25% increase in user engagement',
    skills: 'Programming: Python, R, SQL, Scala\nMachine Learning: TensorFlow, PyTorch, Scikit-learn\nBig Data: Apache Spark, Hadoop, Kafka\nVisualization: Tableau, Power BI, D3.js\nStatistics: Statistical modeling, hypothesis testing, experimental design\nSoft Skills: Analytical Thinking, Problem Solving, Technical Communication'
  },
  {
    email: 'lisa.sales@demo.com',
    password: 'password123',
    fullName: 'Lisa Thompson',
    education: 'Bachelor of Science in Business Administration\nUniversity of Texas, 2018-2022\nSales and Marketing Concentration\nMinor in Psychology',
    experience: 'Sales Manager at SalesForce (2022-Present)\n- Exceeded sales targets by 120% for 3 consecutive quarters\n- Managed a team of 8 sales representatives\n- Developed and implemented sales training programs\n\nAccount Executive at TechSales (2020-2022)\n- Generated $1.5M in new business revenue\n- Built relationships with C-level executives at enterprise companies',
    skills: 'Sales Methodologies: SPIN Selling, Challenger Sale, Solution Selling\nCRM Systems: Salesforce, HubSpot, Pipedrive\nSales Tools: LinkedIn Sales Navigator, ZoomInfo, Outreach\nNegotiation: Contract negotiation, pricing strategies, objection handling\nSoft Skills: Relationship Building, Communication, Leadership, Persistence'
  }
];

// Demo employer data
const demoEmployers = [
  {
    email: 'hr@techstartup.com',
    password: 'password123',
    fullName: 'Jennifer Smith',
    companyName: 'TechStartup Inc.',
    designation: 'HR Director',
    jobs: [
      {
        title: 'Senior Full-Stack Developer',
        responsibilities: 'Lead development of our flagship SaaS platform\nArchitect scalable solutions for high-traffic applications\nMentor junior developers and conduct code reviews\nCollaborate with product and design teams\nParticipate in technical decision-making and planning',
        requirements: '5+ years of experience in full-stack development\nExpertise in React, Node.js, and PostgreSQL\nExperience with cloud platforms (AWS/Azure/GCP)\nStrong understanding of software architecture patterns\nExperience with CI/CD pipelines and DevOps practices\nExcellent problem-solving and communication skills',
        salary: '$120,000 - $150,000',
        location: 'San Francisco, CA',
        jobType: 'full-time'
      },
      {
        title: 'Product Manager',
        responsibilities: 'Define product vision, strategy, and roadmap\nGather and analyze user feedback and market research\nWork closely with engineering and design teams\nTrack key metrics and drive product improvements\nCoordinate product launches and feature releases',
        requirements: '3+ years of product management experience\nStrong analytical and strategic thinking skills\nExperience with agile development methodologies\nExcellent communication and stakeholder management\nTechnical background or understanding preferred\nMBA or relevant degree preferred',
        salary: '$100,000 - $130,000',
        location: 'Remote',
        jobType: 'full-time'
      }
    ]
  },
  {
    email: 'careers@designstudio.com',
    password: 'password123',
    fullName: 'Alex Johnson',
    companyName: 'Creative Design Studio',
    designation: 'Creative Director',
    jobs: [
      {
        title: 'Senior UI/UX Designer',
        responsibilities: 'Create intuitive and beautiful user interfaces\nConduct user research and usability testing\nDevelop design systems and component libraries\nCollaborate with developers to ensure design implementation\nMentor junior designers and provide design direction',
        requirements: '5+ years of UI/UX design experience\nProficiency in Figma, Adobe Creative Suite\nStrong portfolio demonstrating user-centered design\nExperience with design systems and component libraries\nUnderstanding of user research methodologies\nExcellent visual design and typography skills',
        salary: '$90,000 - $120,000',
        location: 'New York, NY',
        jobType: 'full-time'
      },
      {
        title: 'Brand Designer',
        responsibilities: 'Develop brand identities and visual guidelines\nCreate marketing materials and campaigns\nDesign logos, packaging, and promotional materials\nMaintain brand consistency across all touchpoints\nCollaborate with marketing and creative teams',
        requirements: '3+ years of brand design experience\nStrong portfolio showcasing brand work\nExpertise in Adobe Creative Suite\nUnderstanding of brand strategy and positioning\nExperience with print and digital design\nExcellent typography and color theory skills',
        salary: '$70,000 - $90,000',
        location: 'Los Angeles, CA',
        jobType: 'full-time'
      }
    ]
  },
  {
    email: 'jobs@marketingagency.com',
    password: 'password123',
    fullName: 'Sarah Williams',
    companyName: 'Digital Marketing Agency',
    designation: 'Talent Acquisition Manager',
    jobs: [
      {
        title: 'Digital Marketing Specialist',
        responsibilities: 'Manage social media accounts and campaigns\nCreate and optimize paid advertising campaigns\nDevelop content strategies and create engaging content\nAnalyze campaign performance and provide insights\nCollaborate with clients and internal teams',
        requirements: '2+ years of digital marketing experience\nExperience with social media platforms and advertising\nProficiency in Google Ads, Facebook Ads, and analytics tools\nStrong copywriting and content creation skills\nAnalytical mindset and data-driven approach\nExcellent communication and client management skills',
        salary: '$60,000 - $80,000',
        location: 'Chicago, IL',
        jobType: 'full-time'
      },
      {
        title: 'SEO Specialist',
        responsibilities: 'Conduct keyword research and competitive analysis\nOptimize website content and technical SEO\nMonitor and report on search rankings and traffic\nDevelop and execute link building strategies\nStay updated with SEO best practices and algorithm changes',
        requirements: '3+ years of SEO experience\nStrong understanding of search engine algorithms\nExperience with SEO tools (Ahrefs, SEMrush, Google Search Console)\nKnowledge of technical SEO and website optimization\nAnalytical skills and ability to interpret data\nExperience with content marketing and link building',
        salary: '$65,000 - $85,000',
        location: 'Remote',
        jobType: 'full-time'
      }
    ]
  },
  {
    email: 'hr@datacompany.com',
    password: 'password123',
    fullName: 'Michael Brown',
    companyName: 'Data Analytics Company',
    designation: 'HR Manager',
    jobs: [
      {
        title: 'Data Scientist',
        responsibilities: 'Develop machine learning models and algorithms\nAnalyze large datasets to extract insights\nCreate predictive models for business applications\nPresent findings to stakeholders and business teams\nCollaborate with engineering teams on data infrastructure',
        requirements: 'Master\'s degree in Data Science, Statistics, or related field\n3+ years of experience in data science or analytics\nProficiency in Python, R, SQL, and statistical modeling\nExperience with machine learning frameworks (TensorFlow, PyTorch)\nStrong statistical and mathematical background\nExcellent communication and presentation skills',
        salary: '$110,000 - $140,000',
        location: 'Boston, MA',
        jobType: 'full-time'
      },
      {
        title: 'Business Intelligence Analyst',
        responsibilities: 'Create interactive dashboards and reports\nAnalyze business metrics and KPIs\nDevelop data models and ETL processes\nProvide insights to support business decisions\nTrain users on BI tools and dashboards',
        requirements: 'Bachelor\'s degree in Business, Analytics, or related field\n2+ years of experience in business intelligence or analytics\nProficiency in SQL, Tableau, Power BI, or similar tools\nExperience with data modeling and ETL processes\nStrong analytical and problem-solving skills\nExcellent communication and stakeholder management',
        salary: '$75,000 - $95,000',
        location: 'Austin, TX',
        jobType: 'full-time'
      }
    ]
  },
  {
    email: 'careers@salescompany.com',
    password: 'password123',
    fullName: 'David Wilson',
    companyName: 'Enterprise Sales Solutions',
    designation: 'VP of Sales',
    jobs: [
      {
        title: 'Enterprise Sales Executive',
        responsibilities: 'Develop and execute sales strategies for enterprise clients\nBuild relationships with C-level executives and decision makers\nManage complex sales cycles and negotiations\nExceed sales targets and quotas\nCollaborate with marketing and product teams',
        requirements: '5+ years of enterprise sales experience\nProven track record of exceeding sales targets\nExperience selling to Fortune 500 companies\nStrong understanding of B2B sales methodologies\nExcellent negotiation and presentation skills\nBachelor\'s degree in Business or related field',
        salary: '$120,000 - $180,000 (base + commission)',
        location: 'Dallas, TX',
        jobType: 'full-time'
      },
      {
        title: 'Sales Development Representative',
        responsibilities: 'Generate qualified leads through outbound prospecting\nConduct initial discovery calls with prospects\nSchedule meetings for sales executives\nResearch target accounts and decision makers\nMaintain accurate records in CRM system',
        requirements: '1+ years of sales or business development experience\nStrong communication and interpersonal skills\nExperience with CRM systems (Salesforce preferred)\nAbility to handle rejection and maintain motivation\nGoal-oriented and results-driven mindset\nBachelor\'s degree preferred',
        salary: '$50,000 - $70,000 (base + commission)',
        location: 'Denver, CO',
        jobType: 'full-time'
      }
    ]
  }
];

// Add demo data to database
async function addDemoData() {
  try {
    console.log('Starting to add demo data...');
    
    // Add demo jobseekers
    console.log('Adding demo jobseekers...');
    for (const jobseeker of demoJobseekers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(jobseeker.password, 10);
      
      // Insert user
      const userResult = await db.run(
        'INSERT INTO users (email, password, full_name, user_type) VALUES (?, ?, ?, ?)',
        [jobseeker.email, hashedPassword, jobseeker.fullName, 'jobseeker']
      );
      
      // Insert CV
      const uniqueId = uuidv4();
      await db.run(
        'INSERT INTO cvs (user_id, unique_id, education, experience, skills) VALUES (?, ?, ?, ?, ?)',
        [userResult.lastID, uniqueId, jobseeker.education, jobseeker.experience, jobseeker.skills]
      );
      
      console.log(`Added jobseeker: ${jobseeker.fullName} (ID: ${uniqueId})`);
    }
    
    // Add demo employers and their jobs
    console.log('Adding demo employers and jobs...');
    for (const employer of demoEmployers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(employer.password, 10);
      
      // Insert user
      const userResult = await db.run(
        'INSERT INTO users (email, password, full_name, user_type, company_name, designation) VALUES (?, ?, ?, ?, ?, ?)',
        [employer.email, hashedPassword, employer.fullName, 'employer', employer.companyName, employer.designation]
      );
      
      // Insert jobs
      for (const job of employer.jobs) {
        await db.run(
          'INSERT INTO jobs (employer_id, title, responsibilities, requirements, salary, location, job_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userResult.lastID, job.title, job.responsibilities, job.requirements, job.salary, job.location, job.jobType]
        );
      }
      
      console.log(`Added employer: ${employer.fullName} from ${employer.companyName} with ${employer.jobs.length} jobs`);
    }
    
    console.log('\n✅ Demo data added successfully!');
    console.log('\nDemo Jobseekers:');
    demoJobseekers.forEach(js => console.log(`- ${js.fullName} (${js.email})`));
    
    console.log('\nDemo Employers:');
    demoEmployers.forEach(emp => console.log(`- ${emp.fullName} from ${emp.companyName} (${emp.email})`));
    
    console.log('\nAll demo accounts use password: password123');
    
  } catch (error) {
    console.error('Error adding demo data:', error);
  } finally {
    db.close();
  }
}

// Helper function to run SQL with promises
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Run the script
addDemoData(); 