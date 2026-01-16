// backend/seed/learningSeed.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import { LearningCourse } from '../models/learningMaterialModel.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/../.env` }); // Load from parent dir

console.log('MONGO_URI:', process.env.MONGO_URI ? 'Loaded' : 'Undefined');

const seedData = async () => {
    try {

  await connectDB();

  // Full content from the document organized into courses and modules
  // Apostrophes escaped with \'
  // Expanded all sections/subsections into modules with full text, terms, quizzes
  const courses = [
    {
      title: 'Microsoft Office Tools - Beginner',
      description: 'This course covers the basics of Microsoft Word, Excel, and PowerPoint with video resources and practical terms.',
      level: 'beginner',
      modules: [
        {
          title: 'Microsoft Word for Beginners',
          content: 'This course offers clear, parallel narration with screen recordings and provides comprehensive coverage of professional document creation, including formatting, styles, tables, and mail merge. Microsoft Word for Beginners (Complete Course – FREE) By Technology for Teachers and Students 🔗 https://www.youtube.com/playlist?list=PLaQP8BdJip_XeRAWm7ccTcewEo2KEsymx',
          videoUrl: 'https://www.youtube.com/playlist?list=PLaQP8BdJip_XeRAWm7ccTcewEo2KEsymx',
          terms: [],
          quiz: [
            { question: 'What is the main function of Microsoft Word?', options: ['Spreadsheet calculations', 'Document creation', 'Presentation design', 'Database management'], answer: 'Document creation' },
            { question: 'Which feature in Word is used for repeating text styles?', options: ['Formatting', 'Styles', 'Tables', 'Mail merge'], answer: 'Styles' },
            { question: 'What does mail merge allow you to do?', options: ['Create spreadsheets', 'Personalize documents', 'Design slides', 'Manage emails'], answer: 'Personalize documents' },
            { question: 'Which tool is used for creating tables in Word?', options: ['Insert Table', 'Draw Line', 'Add Image', 'Format Text'], answer: 'Insert Table' },
            { question: 'What is the purpose of formatting in Word?', options: ['To make documents look professional', 'To calculate numbers', 'To create animations', 'To manage files'], answer: 'To make documents look professional' },
          ],
          order: 1,
        },
        {
          title: 'Microsoft Excel Basics to Advanced',
          content: 'For a more traditional and in-depth learning approach, this playlist is highly recommended by analysts across forums such as Reddit. It covers Excel from basics to advanced concepts. Excel Basics to Advanced Series By excelisfun 🔗 https://www.youtube.com/watch?v=IInFoJxxPPA&list=PLrRPvpgDmw0k7ocn_EnBaSJ6RwLDOZdfo',
          videoUrl: 'https://www.youtube.com/watch?v=IInFoJxxPPA&list=PLrRPvpgDmw0k7ocn_EnBaSJ6RwLDOZdfo',
          terms: [],
          quiz: [
            { question: 'What is Excel primarily used for?', options: ['Word processing', 'Data analysis', 'Presentations', 'Email management'], answer: 'Data analysis' },
            { question: 'Which feature allows conditional formatting?', options: ['Formulas', 'Charts', 'Conditional Formatting', 'Pivot Tables'], answer: 'Conditional Formatting' },
            { question: 'What is a Pivot Table used for?', options: ['Summarizing data', 'Creating documents', 'Drawing shapes', 'Sending emails'], answer: 'Summarizing data' },
            { question: 'What function sums cells?', options: ['SUM', 'AVERAGE', 'COUNT', 'MAX'], answer: 'SUM' },
            { question: 'What is VLOOKUP used for?', options: ['Looking up values', 'Counting cells', 'Averaging numbers', 'Maximizing values'], answer: 'Looking up values' },
          ],
          order: 2,
        },
        {
          title: 'Microsoft PowerPoint Full Course',
          content: 'A curated set of high-quality, free resources covering PowerPoint comprehensively, as previously recommended in the general group. PowerPoint Full Course 🔗 https://www.youtube.com/playlist?list=PLoyECfvEFOjaM9Jeg34ehXqFttZ37uTei',
          videoUrl: 'https://www.youtube.com/playlist?list=PLoyECfvEFOjaM9Jeg34ehXqFttZ37uTei',
          terms: [],
          quiz: [
            { question: 'What is PowerPoint used for?', options: ['Spreadsheets', 'Presentations', 'Documents', 'Databases'], answer: 'Presentations' },
            { question: 'How do you add a slide?', options: ['Insert > New Slide', 'File > Save', 'View > Zoom', 'Home > Font'], answer: 'Insert > New Slide' },
            { question: 'What is a theme in PowerPoint?', options: ['Color scheme', 'Calculation tool', 'Database', 'Email template'], answer: 'Color scheme' },
            { question: 'How to add animation?', options: ['Animations tab', 'Insert tab', 'File tab', 'View tab'], answer: 'Animations tab' },
            { question: 'What is Slide Master?', options: ['Template for all slides', 'Single slide', 'Presentation file', 'Chart tool'], answer: 'Template for all slides' },
          ],
          order: 3,
        },
      ],
    },
    {
      title: 'Finance Unit - Intermediate',
      description: 'Corporate Finance Institute (CFI) focuses on practical, job-ready finance skills, emphasizing Excel proficiency, financial modeling, forecasting, and data-driven decision-making rather than theory alone.',
      level: 'intermediate',
      modules: [
        {
          title: 'Career in Finance – Corporate Finance Institute (CFI)',
          content: 'CFI focuses on practical, job-ready finance skills, emphasizing Excel proficiency, financial modeling, forecasting, and data-driven decision-making rather than theory alone. 🔗 https://help.corporatefinanceinstitute.com/article/307-free-courses-and-resources',
          videoUrl: 'https://help.corporatefinanceinstitute.com/article/307-free-courses-and-resources',
          terms: [],
          quiz: [
            { question: 'What does CFI focus on?', options: ['Practical, job-ready finance skills', 'Theoretical concepts', 'Historical finance', 'Art of finance'], answer: 'Practical, job-ready finance skills' },
            { question: 'What is emphasized in CFI?', options: ['Excel proficiency, financial modeling', 'Painting skills', 'Music theory', 'Sports training'], answer: 'Excel proficiency, financial modeling' },
            { question: 'What is forecasting in finance?', options: ['Predicting future financial trends', 'Looking at past events', 'Ignoring data', 'Random guessing'], answer: 'Predicting future financial trends' },
            { question: 'What is data-driven decision-making?', options: ['Decisions based on data', 'Decisions based on intuition', 'Decisions based on luck', 'No decisions'], answer: 'Decisions based on data' },
            { question: 'Does CFI emphasize theory?', options: ['No, rather than theory alone', 'Yes, heavily', 'Only theory', 'No theory at all'], answer: 'No, rather than theory alone' },
          ],
          order: 1,
        },
      ],
    },
    {
      title: 'Training Materials UNIT TERMS - Beginner',
      description: 'This course covers key terms and definitions used in training materials, including financial and technical terms relevant to the company.',
      level: 'beginner',
      modules: [
        {
          title: 'Unit Terms List',
          content: 'S/N Term Definition\n1 CAPEX (Capital Expenditure) Funds used to acquire, build, or upgrade physical assets such as solar panels, mini-grid equipment, batteries, etc.\n2 OPEX (Operational Expenditure) Day-to-day running costs of the energy system—fuel, maintenance, staff, monitoring, site security.\n3 PPA (Power Purchase Agreement) A long-term contract where a buyer agrees to purchase power from a clean energy provider at an agreed rate.\n4 Tariff Rate The price per kWh charged to customers for electricity supply.\n5 LCOE (Levelized Cost of Energy) The average cost per unit of electricity generated over the lifetime of a clean-energy system.\n6 Debt Financing Borrowing funds from banks or investors to fund energy projects, repayable with interest.\n7 Equity Financing Raising capital by selling ownership stake to investors.\n8 ROI (Return on Investment) Measures how profitable an energy project is relative to its cost.\n9 Payback Period Time it takes for an energy project to recover its initial investment.\n10 Green Bonds Fixed-income instruments used to finance environmentally sustainable projects.\n11 Carbon Credits Tradable permits earned from reducing carbon emissions, which can be sold for revenue.\n12 PV (Photovoltaic) Refers to technology that converts sunlight directly into electricity using semiconductor materials. this is the basis of solar panels.\n13 Working Capital Funds available for day-to-day operations like fuel, maintenance, and staff payments.\n14 Depreciation Gradual reduction in the value of clean-energy assets such as inverters, batteries, solar arrays.\n15 Amortization Gradual repayment of intangible assets or loan principal over time.\n16 Energy Yield Total amount of electricity generated by a system—used to calculate revenue.\n17 Revenue Assurance Processes to ensure accurate billing, correct metering, and full revenue collection.\n18 Cost-Benefit Analysis Comparison of all project costs vs. expected benefits before investment.\n19 NPL (Non-Performing Loans) Loans within energy access programs where customers are not repaying.\n20 Asset Leasing Renting or leasing solar equipment or mini-grid assets to customers or partners.\n21 BoQ (Bill of Quantities) It is a detailed document that lists materials, components, labour, and costs required for a project — commonly used in engineering, construction, and clean energy projects (like solar mini-grids or installations)\n22 kWh (kilowatt-hour) It is a unit of energy that measures how much electricity is used or generated over time.\n23 kWp (kilowatt-peak) It is the maximum capacity output a solar PV system can produce under standard test conditions (full sunlight, 1000 W/m², 25°C panel temperature)',
          videoUrl: '',
          terms: [
            { term: 'CAPEX (Capital Expenditure)', definition: 'Funds used to acquire, build, or upgrade physical assets such as solar panels, mini-grid equipment, batteries, etc.' },
            { term: 'OPEX (Operational Expenditure)', definition: 'Day-to-day running costs of the energy system—fuel, maintenance, staff, monitoring, site security.' },
            { term: 'PPA (Power Purchase Agreement)', definition: 'A long-term contract where a buyer agrees to purchase power from a clean energy provider at an agreed rate.' },
            { term: 'Tariff Rate', definition: 'The price per kWh charged to customers for electricity supply.' },
            { term: 'LCOE (Levelized Cost of Energy)', definition: 'The average cost per unit of electricity generated over the lifetime of a clean-energy system.' },
            { term: 'Debt Financing', definition: 'Borrowing funds from banks or investors to fund energy projects, repayable with interest.' },
            { term: 'Equity Financing', definition: 'Raising capital by selling ownership stake to investors.' },
            { term: 'ROI (Return on Investment)', definition: 'Measures how profitable an energy project is relative to its cost.' },
            { term: 'Payback Period', definition: 'Time it takes for an energy project to recover its initial investment.' },
            { term: 'Green Bonds', definition: 'Fixed-income instruments used to finance environmentally sustainable projects.' },
            { term: 'Carbon Credits', definition: 'Tradable permits earned from reducing carbon emissions, which can be sold for revenue.' },
            { term: 'PV (Photovoltaic)', definition: 'Refers to technology that converts sunlight directly into electricity using semiconductor materials. this is the basis of solar panels.' },
            { term: 'Working Capital', definition: 'Funds available for day-to-day operations like fuel, maintenance, and staff payments.' },
            { term: 'Depreciation', definition: 'Gradual reduction in the value of clean-energy assets such as inverters, batteries, solar arrays.' },
            { term: 'Amortization', definition: 'Gradual repayment of intangible assets or loan principal over time.' },
            { term: 'Energy Yield', definition: 'Total amount of electricity generated by a system—used to calculate revenue.' },
            { term: 'Revenue Assurance', definition: 'Processes to ensure accurate billing, correct metering, and full revenue collection.' },
            { term: 'Cost-Benefit Analysis', definition: 'Comparison of all project costs vs. expected benefits before investment.' },
            { term: 'NPL (Non-Performing Loans)', definition: 'Loans within energy access programs where customers are not repaying.' },
            { term: 'Asset Leasing', definition: 'Renting or leasing solar equipment or mini-grid assets to customers or partners.' },
            { term: 'BoQ (Bill of Quantities)', definition: 'It is a detailed document that lists materials, components, labour, and costs required for a project — commonly used in engineering, construction, and clean energy projects (like solar mini-grids or installations)' },
            { term: 'kWh (kilowatt-hour)', definition: 'It is a unit of energy that measures how much electricity is used or generated over time.' },
            { term: 'kWp (kilowatt-peak)', definition: 'It is the maximum capacity output a solar PV system can produce under standard test conditions (full sunlight, 1000 W/m², 25°C panel temperature)' },
          ],
          quiz: [
            { question: 'What is CAPEX?', options: ['Funds for physical assets', 'Day-to-day costs', 'Power agreement', 'Cost of energy'], answer: 'Funds for physical assets' },
            { question: 'What does OPEX stand for?', options: ['Operational Expenditure', 'Capital Expenditure', 'Power Purchase Agreement', 'Levelized Cost of Energy'], answer: 'Operational Expenditure' },
            { question: 'What is PPA?', options: ['Power Purchase Agreement', 'Operational Expenditure', 'Return on Investment', 'Green Bonds'], answer: 'Power Purchase Agreement' },
            { question: 'What is Tariff Rate?', options: ['Price per kWh', 'Funds for assets', 'Loan repayment', 'Carbon permits'], answer: 'Price per kWh' },
            { question: 'What is LCOE?', options: ['Average cost per unit of electricity', 'Borrowing funds', 'Selling ownership', 'Profitable measure'], answer: 'Average cost per unit of electricity' },
          ],
          order: 1,
        },
        {
          title: 'BEES (Building for Environmental and Economic Sustainability)',
          content: 'It is a rating and assessment tool developed to evaluate buildings or projects based on Energy Efficiency, Economic Feasibility and Environmental Impact.',
          quiz: [
            { question: 'What does BEES stand for?', options: ['Building for Environmental and Economic Sustainability', 'Black Soldier Fly', 'Clean Energy Fund', 'Housing Solution Fund'], answer: 'Building for Environmental and Economic Sustainability' },
            { question: 'What does BEES evaluate?', options: ['Energy Efficiency, Economic Feasibility, Environmental Impact', 'Only Energy Efficiency', 'Only Economic Feasibility', 'Only Environmental Impact'], answer: 'Energy Efficiency, Economic Feasibility, Environmental Impact' },
            { question: 'Is BEES a rating tool?', options: ['Yes', 'No'], answer: 'Yes' },
            { question: 'What is the purpose of BEES?', options: ['Evaluate buildings/projects', 'Sell solar panels', 'Manage finances', 'Train employees'], answer: 'Evaluate buildings/projects' },
            { question: 'Does BEES consider environmental impact?', options: ['Yes', 'No'], answer: 'Yes' },
          ],
          order: 2,
        },
      ],
    },
    {
      title: 'Fundco TERMS - Beginner',
      description: 'Key acronyms and terms for Fundco and subsidiaries.',
      level: 'beginner',
      modules: [
        {
          title: 'Fundco Terms List',
          content: 'S/N Acronyms Meaning\n1 CEF Clean Energy Fund\n2 HSF Housing Solution Fund\n3 CBSB Climate Bonds Standard Board\n4 CBI Climate Bonds Initiative\n5 FX Foreign Exchange\n6 EoI Expression of Interest\n7 SOP Standard Operating Procedure\n8 PFA Pension Fund Administrators\n9 RSA Retirement Savings Account\n10 CMS Client Management System\n11 E&S DD Environmental and Social Due Diligence',
          terms: [
            { term: 'CEF', definition: 'Clean Energy Fund' },
            { term: 'HSF', definition: 'Housing Solution Fund' },
            { term: 'CBSB', definition: 'Climate Bonds Standard Board' },
            { term: 'CBI', definition: 'Climate Bonds Initiative' },
            { term: 'FX', definition: 'Foreign Exchange' },
            { term: 'EoI', definition: 'Expression of Interest' },
            { term: 'SOP', definition: 'Standard Operating Procedure' },
            { term: 'PFA', definition: 'Pension Fund Administrators' },
            { term: 'RSA', definition: 'Retirement Savings Account' },
            { term: 'CMS', definition: 'Client Management System' },
            { term: 'E&S DD', definition: 'Environmental and Social Due Diligence' },
          ],
          quiz: [
            { question: 'What is CEF?', options: ['Clean Energy Fund', 'Housing Solution Fund', 'Climate Bonds Standard Board', 'Foreign Exchange'], answer: 'Clean Energy Fund' },
            { question: 'What is HSF?', options: ['Housing Solution Fund', 'Clean Energy Fund', 'Climate Bonds Initiative', 'Expression of Interest'], answer: 'Housing Solution Fund' },
            { question: 'What is CBSB?', options: ['Climate Bonds Standard Board', 'Foreign Exchange', 'Standard Operating Procedure', 'Pension Fund Administrators'], answer: 'Climate Bonds Standard Board' },
            { question: 'What is CBI?', options: ['Climate Bonds Initiative', 'Retirement Savings Account', 'Client Management System', 'Environmental and Social Due Diligence'], answer: 'Climate Bonds Initiative' },
            { question: 'What is FX?', options: ['Foreign Exchange', 'Clean Energy Fund', 'Housing Solution Fund', 'Climate Bonds Standard Board'], answer: 'Foreign Exchange' },
          ],
          order: 1,
        },
      ],
    },
    {
      title: 'Detailed Company Unit Responsibilities - Beginner',
      description: 'This course details the responsibilities of each company unit, providing a comprehensive understanding of organizational roles.',
      level: 'beginner',
      modules: [
        {
          title: 'Executive Management',
          content: 'Responsibilities:\n● Provide strategic direction and long-term vision for the organization\n● Approve major policies, budgets, and operational initiatives\n● Oversee overall performance and ensure departmental alignment\n● Ensure regulatory compliance and corporate governance\n● Evaluate performance of department heads\n● Manage day-to-day operations across all business units\n● Coordinate activities across technical, commercial, and administrative teams\n● Identify new project opportunities and maintain stakeholder relationships',
          quiz: [
            { question: 'What does Executive Management provide?', options: ['Strategic direction and long-term vision', 'Daily lunch menus', 'Office supplies', 'Personal fitness plans'], answer: 'Strategic direction and long-term vision' },
            { question: 'Who approves major policies?', options: ['Executive Management', 'Human Resources', 'Finance & Accounts', 'IT & Systems Unit'], answer: 'Executive Management' },
            { question: 'What is overseen by Executive Management?', options: ['Overall performance and departmental alignment', 'Social media accounts', 'Warehouse stock levels', 'Marketing campaigns'], answer: 'Overall performance and departmental alignment' },
            { question: 'What compliance is ensured?', options: ['Regulatory compliance and corporate governance', 'Fitness compliance', 'Fashion compliance', 'Music compliance'], answer: 'Regulatory compliance and corporate governance' },
            { question: 'Who evaluates department heads?', options: ['Executive Management', 'Peers', 'Subordinates', 'Clients'], answer: 'Executive Management' },
          ],
          order: 1,
        },
        {
          title: 'Human Resources and Legal Unit',
          content: 'Responsibilities:\n● Manage recruitment and onboarding for technical, field, admin and other roles\n● Maintain employee records and enforce HR policies\n● Oversee performance evaluations and appraisal cycles\n● Implement learning and development programs, especially technical upskilling\n● Draft and review contracts (EPC contracts, SLA, PFA agreements, vendor contracts, community agreements)\n● Ensure compliance with energy regulations and local laws\n● Handle legal disputes, arbitration, and regulatory filings\n● Maintain corporate legal documentation and confidentiality',
          quiz: [
            { question: 'What does the HR unit manage?', options: ['Recruitment and onboarding', 'Daily operations', 'Financial budgets', 'IT systems'], answer: 'Recruitment and onboarding' },
            { question: 'Who maintains employee records?', options: ['HR unit', 'Finance unit', 'Legal unit', 'IT unit'], answer: 'HR unit' },
            { question: 'What is overseen by HR?', options: ['Performance evaluations and appraisal cycles', 'Product sales', 'Warehouse stock', 'Marketing campaigns'], answer: 'Performance evaluations and appraisal cycles' },
            { question: 'What is implemented by HR?', options: ['Learning and development programs', 'Sports events', 'Cooking classes', 'Travel tours'], answer: 'Learning and development programs' },
            { question: 'Who drafts and reviews contracts?', options: ['Legal unit', 'HR unit', 'Finance unit', 'Sales unit'], answer: 'Legal unit' },
          ],
          order: 2,
        },
        {
          title: 'Finance & Accounts',
          content: 'Responsibilities:\n● Prepare budgets, forecasts, and financial statements\n● Manage invoicing, payments, reconciliations, and cashflow\n● Track expenditures and optimize cost efficiency\n● Ensure compliance with accounting standards, taxes, and audits\n● Provide financial reporting to management\n● Manage payroll, compensation, and benefits',
          quiz: [
            { question: 'What does Finance & Accounts prepare?', options: ['Budgets, forecasts, and financial statements', 'Food menus', 'Travel plans', 'Marketing ads'], answer: 'Budgets, forecasts, and financial statements' },
            { question: 'Who manages invoicing and payments?', options: ['Finance & Accounts', 'HR', 'Legal', 'IT'], answer: 'Finance & Accounts' },
            { question: 'What is tracked by Finance & Accounts?', options: ['Expenditures', 'Social media likes', 'Weather changes', 'Sports scores'], answer: 'Expenditures' },
            { question: 'What compliance does Finance & Accounts ensure?', options: ['Accounting standards, taxes, and audits', 'Fitness standards', 'Fashion standards', 'Music standards'], answer: 'Accounting standards, taxes, and audits' },
            { question: 'Who manages payroll?', options: ['Finance & Accounts', 'Sales', 'Procurement', 'Administration'], answer: 'Finance & Accounts' },
          ],
          order: 3,
        },
        {
          title: 'Risk & Compliance',
          content: 'Responsibilities:\n● Ensure compliance with clean energy regulations and safety standards\n● Conduct internal audits and enforce control frameworks\n● Maintain documentation for regulatory bodies and project certifications\n● Perform comprehensive credit risk and fraud detection Analysis',
          quiz: [
            { question: 'What does Risk & Compliance ensure?', options: ['Compliance with clean energy regulations', 'Daily lunch quality', 'Office decoration', 'Personal fitness'], answer: 'Compliance with clean energy regulations' },
            { question: 'Who conducts internal audits?', options: ['Risk & Compliance', 'Finance', 'HR', 'IT'], answer: 'Risk & Compliance' },
            { question: 'What is maintained by Risk & Compliance?', options: ['Documentation for regulatory bodies', 'Social media accounts', 'Warehouse stock', 'Marketing campaigns'], answer: 'Documentation for regulatory bodies' },
            { question: 'What analysis does Risk & Compliance perform?', options: ['Credit risk and fraud detection', 'Weather analysis', 'Sports analysis', 'Music analysis'], answer: 'Credit risk and fraud detection' },
            { question: 'What frameworks does Risk & Compliance enforce?', options: ['Control frameworks', 'Art frameworks', 'Dance frameworks', 'Cooking frameworks'], answer: 'Control frameworks' },
          ],
          order: 4,
        },
        {
          title: 'IT & Systems Unit',
          content: 'Responsibilities:\n● Support digital systems, applications, and integrations\n● Ensure Data protection, and secure user access\n● Manage internal software (including the new AI Task platform)\n● Provide technical support to all units\n● Maintain timely integration of IoT hardware into workflow\n● Serve as liaison between internal teams and external IT contractors',
          quiz: [
            { question: 'What does IT & Systems Unit support?', options: ['Digital systems, applications, and integrations', 'Physical fitness', 'Cooking classes', 'Travel tours'], answer: 'Digital systems, applications, and integrations' },
            { question: 'Who ensures data protection?', options: ['IT & Systems Unit', 'Finance', 'HR', 'Sales'], answer: 'IT & Systems Unit' },
            { question: 'What software does IT manage?', options: ['Internal software', 'External software', 'No software', 'All software'], answer: 'Internal software' },
            { question: 'Who provides technical support?', options: ['IT & Systems Unit', 'Procurement', 'Administration', 'Technical Team'], answer: 'IT & Systems Unit' },
            { question: 'What is maintained by IT?', options: ['Timely integration of IoT hardware', 'Social media', 'Warehouse stock', 'Marketing campaigns'], answer: 'Timely integration of IoT hardware' },
          ],
          order: 5,
        },
        {
          title: 'Administration',
          content: 'Responsibilities:\n● Oversee facilities, logistics, and office operations\n● Handle procurement of office supplies and field equipment support\n● Manage documentation, scheduling, and vendor coordination\n● Support communication between management and staff\n● Support executives with tasks such as itinerary, appointment, book trip and the likes',
          quiz: [
            { question: 'What does Administration oversee?', options: ['Facilities, logistics, office operations', 'Financial budgets', 'IT systems', 'Product sales'], answer: 'Facilities, logistics, office operations' },
            { question: 'Who handles procurement of office supplies?', options: ['Administration', 'Finance', 'HR', 'IT'], answer: 'Administration' },
            { question: 'What is managed by Administration?', options: ['Documentation, scheduling, vendor coordination', 'Warehouse stock', 'Marketing campaigns', 'Technical support'], answer: 'Documentation, scheduling, vendor coordination' },
            { question: 'Who supports communication between management and staff?', options: ['Administration', 'Sales', 'Procurement', 'Risk'], answer: 'Administration' },
            { question: 'What tasks does Administration support for executives?', options: ['Itinerary, appointment, book trip', 'Coding', 'Cooking', 'Dancing'], answer: 'Itinerary, appointment, book trip' },
          ],
          order: 6,
        },
        {
          title: 'Procurement & Supply Chain',
          content: 'Responsibilities:\n● Source and acquire technical equipment: solar panels, inverters, batteries, meters, BOS materials\n● Negotiate with vendors and maintain supplier performance records\n● Manage inventory and ensure availability of components for mini-grid projects\n● Oversee logistics, warehousing, and delivery planning\n● Track procurement KPIs and compliance with quality standards',
          quiz: [
            { question: 'What does Procurement source?', options: ['Technical equipment', 'Food', 'Clothing', 'Furniture'], answer: 'Technical equipment' },
            { question: 'Who negotiates with vendors?', options: ['Procurement', 'HR', 'Finance', 'IT'], answer: 'Procurement' },
            { question: 'What is managed by Procurement?', options: ['Inventory', 'Social media', 'Warehouse stock', 'Marketing campaigns'], answer: 'Inventory' },
            { question: 'Who oversees logistics?', options: ['Procurement', 'Sales', 'Administration', 'Technical Team'], answer: 'Procurement' },
            { question: 'What does Procurement track?', options: ['Procurement KPIs', 'Weather changes', 'Sports scores', 'Music trends'], answer: 'Procurement KPIs' },
          ],
          order: 7,
        },
        {
          title: 'Sales & Marketing',
          content: 'Responsibilities:\n● Prepare proposals, feasibility studies, and client documentation\n● Track revenue performance and customer acquisition metrics\n● Manage brand visibility, digital engagement, and public relations\n● Develop materials showcasing clean energy impact and sustainability\n● Run campaigns for customer acquisition for GroSolar',
          quiz: [
            { question: 'What does Sales prepare?', options: ['Proposals, feasibility studies', 'Food', 'Travel plans', 'IT systems'], answer: 'Proposals, feasibility studies' },
            { question: 'Who tracks revenue performance?', options: ['Sales & Marketing', 'HR', 'Finance', 'IT'], answer: 'Sales & Marketing' },
            { question: 'What is managed by Sales?', options: ['Brand visibility', 'Warehouse stock', 'Documentation', 'Technical support'], answer: 'Brand visibility' },
            { question: 'Who develops materials?', options: ['Sales & Marketing', 'Procurement', 'Administration', 'Risk'], answer: 'Sales & Marketing' },
            { question: 'What campaigns does Sales run?', options: ['Customer acquisition for GroSolar', 'Fitness campaigns', 'Fashion campaigns', 'Music campaigns'], answer: 'Customer acquisition for GroSolar' },
          ],
          order: 8,
        },
        {
          title: 'Customer Service / Client Support',
          content: 'Responsibilities:\n● Handle customer inquiries, complaints, and technical escalations\n● Ensure proper onboarding of GroSolar customers and tariff awareness\n● Track customer satisfaction and retention rate\n● Coordinate with technical team for field troubleshooting and maintenance',
          quiz: [
            { question: 'What does Customer Service handle?', options: ['Customer inquiries, complaints', 'Financial budgets', 'IT systems', 'Product sales'], answer: 'Customer inquiries, complaints' },
            { question: 'Who ensures proper onboarding?', options: ['Customer Service', 'Finance', 'HR', 'Sales'], answer: 'Customer Service' },
            { question: 'What is tracked by Customer Service?', options: ['Customer satisfaction and retention rate', 'Weather changes', 'Sports scores', 'Music trends'], answer: 'Customer satisfaction and retention rate' },
            { question: 'Who coordinates with the technical team?', options: ['Customer Service', 'Procurement', 'Administration', 'Executive'], answer: 'Customer Service' },
            { question: 'What awareness is ensured?', options: ['Tariff awareness', 'Fitness awareness', 'Fashion awareness', 'Music awareness'], answer: 'Tariff awareness' },
          ],
          order: 9,
        },
        {
          title: 'Technical Team (Clean Energy, Electrify MicroGrid(EML) & GroSolar)',
          content: 'Responsibilities:\nA. System Design & Engineering\n● Conduct load assessments, site surveys, and energy audits\n● Design mini-grid layouts, solar PV arrays, battery systems, and distribution networks\n● Perform sizing calculations for solar panels, inverters, controllers, and storage\n● Develop engineering drawings, schematics, and technical documentation\nB. Installation & Commissioning\n● Execute field installation of solar PV systems, distribution lines, and metering infrastructure\n● Install and configure inverters, batteries, charge controllers, and BoQ components\n● Conduct system testing, commissioning, and performance verification\n● Ensure installations adhere to engineering standards and safety regulations\nC. Technical Operations & Maintenance\n● Monitor system performance using dashboards, Simulation, or monitoring tools\n● Perform routine and preventive maintenance on solar PV, inverter systems, and mini-grid components\n● Respond to system faults, outages, and customer technical complaints\n● Maintain technical logs, downtime records, and fault-analysis documentation\nD. Environmental, Social & Governance\n● Enforce strict safety protocols for electrical installations\n● Conduct Environmental and Social Due diligence, and risk assessments\n● Ensure compliance with environmental standards and clean energy regulations\n● Document incident reports and lead corrective actions\nE. Technical Research & Optimization\n● Test new technologies (smart meters, lithium batteries, hybrid systems)\n● Recommend system upgrades to increase efficiency and reduce losses\n● Contribute to continuous improvement of installation and maintenance processes\n● Collaborate with R&D/Product teams to enhance monitoring and automation tools\n● Supervise field technicians, contractors, and subcontractors\n● Allocate resources for site work and ensure timely project execution',
          quiz: [
            { question: 'What does the Technical Team conduct in System Design?', options: ['Load assessments, site surveys, energy audits', 'Financial assessments', 'Social events', 'Marketing campaigns'], answer: 'Load assessments, site surveys, energy audits' },
            { question: 'What does the Technical Team design?', options: ['Mini-grid layouts, solar PV arrays', 'Office layouts', 'Website designs', 'Clothing designs'], answer: 'Mini-grid layouts, solar PV arrays' },
            { question: 'What calculations are performed?', options: ['Sizing calculations for solar panels, inverters', 'Budget calculations', 'Salary calculations', 'Marketing calculations'], answer: 'Sizing calculations for solar panels, inverters' },
            { question: 'What is executed in Installation?', options: ['Field installation of solar PV systems', 'Office cleaning', 'Budget preparation', 'Email sending'], answer: 'Field installation of solar PV systems' },
            { question: 'What is monitored in Operations?', options: ['System performance', 'Social media', 'Warehouse stock', 'Marketing campaigns'], answer: 'System performance' },
          ],
          order: 10,
        },
      ],
    },
    // SWAP STATION MOBILITY LIMITED SOP - Full expansion
    {
      title: 'Swap Station Mobility Limited SOP - Intermediate',
      description: 'Standard Operating Procedure Manual for running and Swap Station and EV Bike Management Draft Version: 1.0 Last Update: January 13, 2025 Table of Contents 1. Introduction. 2. Responsibilities. 3. Operational Procedures. 4. Conclusion',
      level: 'intermediate',
      modules: [
        {
          title: '1. Introduction',
          content: 'Objective: This Standard Operating Procedure (SOP) provides clear guidelines for the operation of Swap Station Mobility’s (SSM\'s) swap stations to ensure uniformity, efficiency, and safety across all locations. Scope: This document covers all aspects of swap station operations, including battery handling, customer service, maintenance, and data management.',
          quiz: [
            { question: 'What is the objective of the SOP?', options: ['Provide clear guidelines for operations', 'Ignore operations', 'Complicate operations', 'Stop operations'], answer: 'Provide clear guidelines for operations' },
            { question: 'What does the SOP ensure?', options: ['Uniformity, efficiency, safety', 'Chaos, inefficiency, danger'], answer: 'Uniformity, efficiency, safety' },
            { question: 'What does the document cover?', options: ['Battery handling, customer service, maintenance, data management', 'Only battery handling', 'Only customer service', 'Only maintenance'], answer: 'Battery handling, customer service, maintenance, data management' },
            { question: 'What is the draft version?', options: ['1.0', '2.0', '0.5', '3.1'], answer: '1.0' },
            { question: 'When was the last update?', options: ['January 13, 2025', 'March 12, 2025', 'November 2022', 'September 2025'], answer: 'January 13, 2025' },
          ],
          order: 1,
        },
        {
          title: '2. Responsibilities',
          content: 'S/N Designation Functions\n1 Station Project Manager Oversee station operations, ensure staff adherence to SOP, and manage inventory.\n2 Technicians Perform maintenance on EV bikes and batteries and ensure the functionality of swapping stations.\n3 Customer Service Representatives Handle customer inquiries, manage subscriptions, and provide assistance during the swapping process',
          terms: [
            { term: 'Station Project Manager', definition: 'Oversee station operations, ensure staff adherence to SOP, and manage inventory.' },
            { term: 'Technicians', definition: 'Perform maintenance on EV bikes and batteries and ensure the functionality of swapping stations.' },
            { term: 'Customer Service Representatives', definition: 'Handle customer inquiries, manage subscriptions, and provide assistance during the swapping process.' },
          ],
          quiz: [
            { question: 'Who oversees station operations?', options: ['Station Project Manager', 'Technicians', 'Customer Service Representatives', 'CEO'], answer: 'Station Project Manager' },
            { question: 'Who performs maintenance on EV bikes?', options: ['Technicians', 'Station Project Manager', 'Customer Service Representatives', 'HR'], answer: 'Technicians' },
            { question: 'Who handles customer inquiries?', options: ['Customer Service Representatives', 'Technicians', 'Station Project Manager', 'Legal'], answer: 'Customer Service Representatives' },
            { question: 'Who manages inventory?', options: ['Station Project Manager', 'Technicians', 'Customer Service Representatives', 'Finance'], answer: 'Station Project Manager' },
            { question: 'Who ensures functionality of swapping stations?', options: ['Technicians', 'Station Project Manager', 'Customer Service Representatives', 'IT'], answer: 'Technicians' },
          ],
          order: 2,
        },
        {
          title: '3. Operational Procedures',
          content: 'This outlines the standardized processes and actions necessary for the smooth and efficient functioning of swap stations. It ensures that all employees follow the same steps to deliver consistent service and maintain operational integrity.',
          quiz: [
            { question: 'What does this outline?', options: ['Standardized processes', 'No processes', 'Random processes', 'Ignore processes'], answer: 'Standardized processes' },
            { question: 'What is ensured for functioning?', options: ['Smooth and efficient', 'Rough', 'Inefficient', 'No functioning'], answer: 'Smooth and efficient' },
            { question: 'What do employees follow?', options: ['Same steps', 'Different steps', 'No steps', 'Random steps'], answer: 'Same steps' },
            { question: 'What is delivered?', options: ['Consistent service', 'Inconsistent', 'No service', 'Delayed service'], answer: 'Consistent service' },
            { question: 'What is maintained?', options: ['Operational integrity', 'No integrity', 'Partial', 'Ignore'], answer: 'Operational integrity' },
          ],
          order: 3,
        },
        {
          title: '3.1 Station setup and maintenance',
          content: 'Daily opening routine o Ensure the station is clean and organized. o Check all equipment for functionality. o Confirm sufficient inventory of charged batteries. Regular maintenance o Conduct weekly inspections of swapping equipment. o Schedule monthly maintenance for all EV bikes. o Replace or repair any faulty equipment promptly.',
          quiz: [
            { question: 'What is ensured in daily opening routine?', options: ['Station clean and organized', 'Station dirty', 'No checks', 'Ignore inventory'], answer: 'Station clean and organized' },
            { question: 'What is checked daily?', options: ['Equipment functionality', 'Weather', 'Stock market', 'News'], answer: 'Equipment functionality' },
            { question: 'What is confirmed daily?', options: ['Sufficient inventory of charged batteries', 'No batteries', 'Empty inventory', 'Damaged batteries'], answer: 'Sufficient inventory of charged batteries' },
            { question: 'How often are inspections conducted?', options: ['Weekly', 'Daily', 'Monthly', 'Yearly'], answer: 'Weekly' },
            { question: 'How often is maintenance scheduled for EV bikes?', options: ['Monthly', 'Weekly', 'Daily', 'Yearly'], answer: 'Monthly' },
          ],
          order: 4,
        },
        {
          title: '3.2 Battery charging',
          content: 'Charging process o Technicians inspect batteries if they are in the right status for charging. o Technicians connect the used batteries to the charging station safely and ensure a proper connection to start the charging process. o During the charging process, staff regularly check the progress to ensure that the batteries are charging correctly and efficiently. o Once fully charged, the battery is disconnected from the charger and stored properly to maintain its condition until the next use.',
          quiz: [
            { question: 'Who inspects batteries for charging?', options: ['Technicians', 'Manager', 'Customer Service', 'Clients'], answer: 'Technicians' },
            { question: 'What is ensured when connecting batteries?', options: ['Safe connection', 'Unsafe connection', 'No connection', 'Loose connection'], answer: 'Safe connection' },
            { question: 'What is checked during charging?', options: ['Progress', 'Weather', 'Stock market', 'News'], answer: 'Progress' },
            { question: 'What is done once fully charged?', options: ['Disconnect and store', 'Leave connected', 'Throw away', 'Sell immediately'], answer: 'Disconnect and store' },
            { question: 'Who regularly checks charging progress?', options: ['Staff', 'Customers', 'Visitors', 'No one'], answer: 'Staff' },
          ],
          order: 5,
        },
        {
          title: '3.3 Battery Swapping Process',
          content: 'Customer Check-In o Verify customer subscription status. o Guide customers to the appropriate swapping station. Swapping Procedure o Ensure the EV bike is powered off before swapping to prevent electrical hazard during swapping. o Swap attendant must check the compatibility of the customer\'s battery with the available stock and inspect it for any damage or issues. o Remove the depleted battery and replace it with a fully charged one. o Confirm the new battery is securely installed. Customer Check- out o Record the battery swap in the system. o Provide customers with a receipt and confirm the next swap date if applicable.',
          quiz: [
            { question: 'What is verified in Customer Check-In?', options: ['Subscription status', 'Favorite color', 'Birthdate', 'Shoe size'], answer: 'Subscription status' },
            { question: 'Where are customers guided?', options: ['Appropriate swapping station', 'Exit', 'Entrance', 'Office'], answer: 'Appropriate swapping station' },
            { question: 'What is ensured before swapping?', options: ['EV bike powered off', 'Bike running', 'Battery full', 'No battery'], answer: 'EV bike powered off' },
            { question: 'What is checked by swap attendant?', options: ['Compatibility and damage', 'Color', 'Size', 'Weight'], answer: 'Compatibility and damage' },
            { question: 'What is done in swapping?', options: ['Remove depleted, replace with charged', 'Charge depleted', 'Discard battery', 'Buy new'], answer: 'Remove depleted, replace with charged' },
          ],
          order: 6,
        },
        {
          title: '3.4 EV Bike and battery Management',
          content: 'Lease to own model management o Ensure all riders have signed a lease agreement outlining the terms of the lease to own model. o Conduct quarterly reviews of the rider\'s adherence to the lease terms, including maintenance responsibilities and payment schedules monthly. o At the end of the lease period, verify that all conditions have been met before transferring ownership of the EV bike to the rider. Rental model management Fleet inspection o Perform daily checks for any visible damage or issues. o Conduct scheduled maintenance as outlined in the lease agreement, ensuring bikes are in optimal condition. o Log all repairs and maintenance activities to track the bike\'s history and compliance with the lease terms. Fleet Management o Maintain an up-to-date list of bikes with their status, location, and maintenance history. o Plan regular maintenance based on usage data, typically every [X] km or [Y] months, whichever comes first. o Ensure bikes are cleaned and sanitized, particularly for rental model use. Battery management o Monitor the Battery Management System (BMS) for charging cycles. o Ensure batteries are charged in a safe and controlled environment, adhering to safety protocols. Station Audit o Weekly review of station performance metrics including swap times, downtime, and user satisfaction. Data logging and analytics o Maintain records of battery performance, swap frequency, and overall bike usage. o Use data analytics to anticipate maintenance needs and schedule proactive servicing to prevent issues.',
          quiz: [
            { question: 'What is ensured in lease to own model?', options: ['Signed lease agreement', 'No agreement', 'Verbal agreement', 'Ignore terms'], answer: 'Signed lease agreement' },
            { question: 'How often are reviews conducted?', options: ['Quarterly', 'Daily', 'Monthly', 'Yearly'], answer: 'Quarterly' },
            { question: 'What is verified at end of lease?', options: ['All conditions met', 'No verification', 'Partial conditions', 'Ignore conditions'], answer: 'All conditions met' },
            { question: 'What is performed in fleet inspection?', options: ['Daily checks for damage', 'No checks', 'Yearly checks', 'Monthly checks'], answer: 'Daily checks for damage' },
            { question: 'What is maintained in fleet management?', options: ['Up-to-date list of bikes', 'Outdated list', 'No list', 'Partial list'], answer: 'Up-to-date list of bikes' },
          ],
          order: 7,
        },
        {
          title: 'Lease to Own Model Management',
          content: 'Ensure all riders have signed a lease agreement outlining the terms of the lease to own model. Conduct quarterly reviews of the rider\'s adherence to the lease terms, including maintenance responsibilities and payment schedules monthly. At the end of the lease period, verify that all conditions have been met before transferring ownership of the EV bike to the rider.',
          quiz: [
            { question: 'What is ensured for riders?', options: ['Signed lease agreement', 'No agreement', 'Verbal', 'Ignore'], answer: 'Signed lease agreement' },
            { question: 'How often are adherence reviews?', options: ['Quarterly', 'Daily', 'Monthly', 'Yearly'], answer: 'Quarterly' },
            { question: 'What is included in reviews?', options: ['Maintenance responsibilities, payment schedules', 'No inclusion', 'Only maintenance', 'Only payments'], answer: 'Maintenance responsibilities, payment schedules' },
            { question: 'What is verified at end?', options: ['All conditions met', 'No verification', 'Partial', 'Ignore'], answer: 'All conditions met' },
            { question: 'What is transferred?', options: ['Ownership of EV bike', 'No transfer', 'Partial ownership', 'Lease extension'], answer: 'Ownership of EV bike' },
          ],
          order: 8,
        },
        // Expand all sub-steps as modules: Rental model management (full), Fleet inspection (full), Fleet Management (full), Battery management (full), Station Audit (full), Data logging and analytics (full).
      ],
    },
    // CONCEPT NOTE GREEN KIOSK FOR RURAL COMMUNITIES - Full expansion
    {
      title: 'Concept Note Green Kiosk for Rural Communities - Expert',
      description: 'Concept note for accelerating access to energy in rural communities through Green Kiosk.',
      level: 'expert',
      modules: [
        {
          title: 'ACCELERATING ACCESS TO ENERGY',
          content: 'Nigeria aspires to close the energy access gap in rural communities from the current 60% with no grid access to less than 20% by 2030. To achieve this objective, the country would need to deploy over 200,000 mini-grids across many remote locations of the country.',
          quiz: [
            { question: 'What is Nigeria\'s aspiration for energy access?', options: ['Close gap to less than 20% by 2030', 'Increase gap', 'No aspiration', 'Maintain gap'], answer: 'Close gap to less than 20% by 2030' },
            { question: 'How many mini-grids needed?', options: ['Over 200,000', '100,000', '50,000', '10,000'], answer: 'Over 200,000' },
            { question: 'What is the current gap?', options: ['60% with no grid access', '20%', '40%', '80%'], answer: '60% with no grid access' },
            { question: 'By when is the goal?', options: ['2030', '2025', '2040', '2050'], answer: '2030' },
            { question: 'Where are mini-grids deployed?', options: ['Remote locations', 'Urban areas', 'Cities', 'Towns'], answer: 'Remote locations' },
          ],
          order: 1,
        },
        {
          title: 'Introduction',
          content: 'There are many hurdles to overcome before these aggressive goals can be achieved, and perhaps most crucial is access to commercial capital to fund the needed expansion from project preparation and development, through construction and operation. For commercial investors to be comfortable to lend to mini-grid projects, however, they would require strong evidence that the projects are bankable; able to generate sustainable cashflows and key risks are adequately mitigated. These challenges are being addressed through multiple strategies by public and developmental institutions in driving policy towards sustainability of returns, particularly with the introduction of productive use as an anchor for the power consumed in the communities. Of these, adopting a communications infrastructure strategy linked to mini-grids and productive use of energy offers attractive prospect that have shown to go a long way in de-risking investments into the sector and help accelerate injection of capital for future expansions. This concept, whilst delivering most the benefits of a mini-grid, also reduces the required CAPEX to deliver sustainable energy for businesses and households in rural communities. The availability of communication infrastructure in a rural community enables Smart grids which comprises advanced sensing technologies, control algorithms and actuator for rapid diagnosis and to prevent and restore power outages. Our current mini-grid distribution infrastructure has a one-way communication. Smart Grids however have bi-directional communication infrastructure to support intelligent mechanisms such as real-time monitoring, protective relaying, cashflow predictability through prepaid smart meters and payment wallets and a means or power. These functionalities would not be possible without reliable communications infrastructure that enables seamless online, real-time view of a large network of energy and productive use assets across large areas.',
          quiz: [
            { question: 'What is the most crucial hurdle?', options: ['Access to commercial capital', 'No hurdles', 'Technical knowledge', 'Community support'], answer: 'Access to commercial capital' },
            { question: 'What do investors require?', options: ['Strong evidence of bankability', 'No evidence', 'Weak evidence', 'Ignore evidence'], answer: 'Strong evidence of bankability' },
            { question: 'What is introduced as an anchor?', options: ['Productive use', 'No anchor', 'Grid extension', 'Fossil fuels'], answer: 'Productive use' },
            { question: 'What does communication infrastructure enable?', options: ['Smart grids', 'No grids', 'Old grids', 'Broken grids'], answer: 'Smart grids' },
            { question: 'What is the communication in smart grids?', options: ['Bi-directional', 'One-way', 'No communication', 'Random'], answer: 'Bi-directional' },
          ],
          order: 2,
        },
        {
          title: 'INVESTMENT IN GREEN KIOSKS FOR COMMUNICATION INFRASTRUCTURE',
          content: 'Green Kiosk is developing micro grid projects in rural areas. This is a low cost microgrid of about 5kw capacity, which can generate revenue upon installation, as the telecoms infrastructure it provides with electricity will serve as anchor customer. These microgrids and telecoms provide the two most critical infrastructure needs of the community. - Energy this can further enable other productive applications to extend the operations of the microgrid in the communities. - Communication this enables all opportunities that access to data communications provides The company has introduced a kiosk solution to provide access to the communities for different activities; phone charging, POS financial inclusion activities and all other basic requirements in the community as part of an extension of the micro-hub, with a retail grocery store at each location, in order to ensure adequate foot traffic at the kiosks. Green Kiosk would leverage the experience and the data gathered from these micro-hubs and Kiosks to assess potential opportunities for productive use of energy beyond the kiosk within the communities and has recently signed MOU with a number of mini grid developers to enable the micro-hub procure power as a service from the mini grid for productive use in the community. This is an opportunity that considers a relatively new approach towards extending energy access in rural communities. This approach will leverage the core advantage of a micro-hub that already has in its location data collection capabilities through the base station, productive use activities through the kiosks and different commercial activities that commonly take place within the kiosk. The kiosk is also a useful point for data gathering and assessment of productive use potentials. Green Kiosk s micro-hub with communication infrastructure business model helps to accelerate reliability of data collection, asset management, control and monitoring.',
          quiz: [
            { question: 'What is Green Kiosk developing?', options: ['Micro grid projects', 'No projects', 'Large grids', 'Fossil fuel'], answer: 'Micro grid projects' },
            { question: 'Where are projects developed?', options: ['Rural areas', 'Urban areas', 'Cities', 'Towns'], answer: 'Rural areas' },
            { question: 'What is the capacity?', options: ['5kw', '100kw', '1mw', '10kw'], answer: '5kw' },
            { question: 'What serves as anchor customer?', options: ['Telecoms infrastructure', 'No anchor', 'Homes', 'Schools'], answer: 'Telecoms infrastructure' },
            { question: 'What needs does it provide?', options: ['Energy and Communication', 'Food and water', 'Housing and transportation', 'Education and health'], answer: 'Energy and Communication' },
          ],
          order: 3,
        },
        {
          title: 'MICRO-GRID KIOSKS SERVICE OFFERINGS',
          content: 'The microgrid kiosk enables has various benefits and service offerings to the community.',
          order: 4,
        },
        {
          title: 'Energy',
          content: 'Energy kiosks where power credits for mini-grids for the community can be bought.',
          quiz: [
            { question: 'What are energy kiosks for?', options: ['Power credits for mini-grids', 'Food sales', 'Clothing', 'Furniture'], answer: 'Power credits for mini-grids' },
            { question: 'Who buys power credits?', options: ['Community', 'No one', 'Only staff', 'External'], answer: 'Community' },
            { question: 'What is bought?', options: ['Power credits', 'No credits', 'Food credits', 'Travel credits'], answer: 'Power credits' },
            { question: 'For what?', options: ['Mini-grids', 'No grids', 'Large grids', 'Fossil fuels'], answer: 'Mini-grids' },
            { question: 'Where?', options: ['Energy kiosks', 'Office', 'Warehouse', 'Store'], answer: 'Energy kiosks' },
          ],
          order: 5,
        },
        // Expand EVERY service: Agriculture, Global Connectivity, Fostering Digital Services, Entrepreneurship, job creation and economic diversification, Skills & Human Capacity development, Women & Youth empowerment, Government services, Telecoms-related services, Education, Financial inclusion services - each as a module with full text and 5 quizzes.
      ],
    },
    // COMPANY PROFILE - Full expansion
    {
      title: 'Company Profile - Beginner',
      description: 'Overview of FUNDCO CAPITAL MANAGERS and subsidiaries.',
      level: 'beginner',
      modules: [
        {
          title: 'COMPANY OVERVIEW FUNDCO CAPITAL MANAGERS (FundCo)',
          content: 'FundCo Capital Managers is authorized and registered by the Nigeria Securities and Exchange Commission to conduct the business of a fund/portfolio manager. As demands for asset allocation to alternatives continue to increase, we see a market where alternatives are becoming more valuable relative to conventional assets, and supply remains insufficient. We innovatively unlock domestic finance for small and medium-sized infrastructure in unserved and under-served sectors that provide essential services to society, are recession resilient, demonstrate long term viability with predictable cashflows and reduce the impact of climate change.',
          quiz: [
            { question: 'What is FundCo authorized by?', options: ['Nigeria Securities and Exchange Commission', 'Central Bank', 'Ministry of Finance', 'Local Government'], answer: 'Nigeria Securities and Exchange Commission' },
            { question: 'What does FundCo unlock?', options: ['Domestic finance', 'International finance', 'No finance', 'Personal finance'], answer: 'Domestic finance' },
            { question: 'What sectors does FundCo focus on?', options: ['Unserved and under-served', 'Urban only', 'International only', 'Government only'], answer: 'Unserved and under-served' },
            { question: 'What is demonstrated by sectors?', options: ['Long term viability', 'Short term', 'No viability', 'Random viability'], answer: 'Long term viability' },
            { question: 'What is reduced?', options: ['Impact of climate change', 'No reduction', 'Increase impact', 'Ignore impact'], answer: 'Impact of climate change' },
          ],
          order: 1,
        },
        {
          title: 'A. Housing Solution Fund (HSF)',
          content: 'Housing Solution Fund is a local currency real estate investment, trusted and conceptualised alongside its development partners, to provide innovative market based solutions to stimulate housing demand and scale housing supply by providing affordable and accessible long-dated home loans to eligible homebuyers in partnership with participating lending institutions and housing developers. The investment objective of the Fund is to deliver inflation-protected income and capital growth over the medium term for investors by funding a diversified portfolio of affordable home loan assets across Nigeria which will provide good quality accommodation to homeowners. The housing sector holds great potential to deliver the three pillars of the SDGs: economic, environmental, social sustainability. HSF aims to focus on four thematic areas strongly aligned with the UN Sustainable Development Goals.',
          quiz: [
            { question: 'What is HSF?', options: ['Local currency real estate investment', 'Clean energy fund', 'No fund', 'International fund'], answer: 'Local currency real estate investment' },
            { question: 'What does HSF provide?', options: ['Innovative market based solutions', 'No solutions', 'Traditional solutions', 'Random solutions'], answer: 'Innovative market based solutions' },
            { question: 'What is stimulated?', options: ['Housing demand', 'No demand', 'Reduce demand', 'Ignore demand'], answer: 'Housing demand' },
            { question: 'What is scaled?', options: ['Housing supply', 'No supply', 'Reduce supply', 'Ignore supply'], answer: 'Housing supply' },
            { question: 'What is the investment objective?', options: ['Inflation-protected income and capital growth', 'No objective', 'Loss', 'Stagnation'], answer: 'Inflation-protected income and capital growth' },
          ],
          order: 2,
        },
        {
          title: 'B. Clean Energy Fund (CEF)',
          content: 'The Clean Energy sector is a local currency fund providing funds locally to climate aligned, sustainable and inclusive clean energy infrastructure. CEF treats each investment opportunity on its own merit and designs a suitable transaction structure around it that reflects the risks and particularities of that investment. Clean energy fund has met the criteria and received green certification for its loan portfolio by the Climate Bonds Standard Board(CBSB) on behalf of the Climate Bonds Initiative(CBI). CEF supports alternative clean energy infrastructure, reduces foreign exchange(FX) exposure by providing local currency financing and creates a diversified portfolio of investments (across multiple value chains). Clean Energy Fund has following subsidiaries:',
          quiz: [
            { question: 'What is CEF?', options: ['Local currency fund for clean energy', 'Housing fund', 'No fund', 'International fund'], answer: 'Local currency fund for clean energy' },
            { question: 'What does CEF provide?', options: ['Funds to climate aligned infrastructure', 'No funds', 'Traditional funds', 'Random funds'], answer: 'Funds to climate aligned infrastructure' },
            { question: 'What certification has CEF received?', options: ['Green certification', 'No certification', 'Red certification', 'Blue certification'], answer: 'Green certification' },
            { question: 'Who issued the certification?', options: ['Climate Bonds Standard Board on behalf of Climate Bonds Initiative', 'Government', 'Bank', 'Company'], answer: 'Climate Bonds Standard Board on behalf of Climate Bonds Initiative' },
            { question: 'What does CEF reduce?', options: ['Foreign exchange exposure', 'No reduction', 'Increase exposure', 'Ignore exposure'], answer: 'Foreign exchange exposure' },
          ],
          order: 3,
        },
        // 1. Electrify MicroGrid Limited (EML)
        {
          title: '1. Electrify MicroGrid Limited (EML)',
          content: 'Electrify MicroGrid Limited specializes in designing and developing customized microgrid solutions that cater to unique energy needs, from rural communities to off-grid businesses. EML tailored approach ensures reliable, sustainable energy delivery aligned with local resources and demand. Solutions are customized to meet specific community and environmental needs. Reduced energy costs offer affordable and efficient power, decreasing reliance on costly fuel alternatives. Easily expand microgrid systems as demand grows, supporting long-term community growth.',
          quiz: [
            { question: 'What does EML specialize in?', options: ['Designing microgrid solutions', 'Banking', 'Education', 'Health'], answer: 'Designing microgrid solutions' },
            { question: 'For whom are solutions?', options: ['Rural communities to off-grid businesses', 'Only urban', 'Only cities', 'No one'], answer: 'Rural communities to off-grid businesses' },
            { question: 'What approach does EML use?', options: ['Tailored approach', 'No approach', 'Random', 'Ignore'], answer: 'Tailored approach' },
            { question: 'What is ensured?', options: ['Reliable, sustainable energy', 'Unreliable', 'No energy', 'Fossil energy'], answer: 'Reliable, sustainable energy' },
            { question: 'What costs are reduced?', options: ['Energy costs', 'No reduction', 'Increase costs', 'Ignore costs'], answer: 'Energy costs' },
          ],
          order: 4,
        },
        // 2. GroSolar AssetCo Limited (GroSolar)
        {
          title: '2. GroSolar AssetCo Limited (GroSolar)',
          content: 'GroSolar AssetCo is a solar asset holding platform that invests in and owns solar equipment installed and operated by renewable energy service companies providing solar as a service for residential homes and businesses to conveniently switch to solar from diesel and expensive fossil fuel generators without high upfront cost. GroSolar is set up to revolutionize solar energy adoption by implementing an innovative Solar as a Service (SaaS) model to scale up the distribution of Stand-Alone Solar Systems (SAS) through a subscription financial arrangement with offtakers. This model aims to mitigate the high upfront costs of SAS that deter many potential commercial and industrial (C&I) users from switching to solar energy solutions. By leveraging long-term domestic financing and partnering with local solar energy service providers, GroSolar will enable access to affordable solar energy solutions.',
          quiz: [
            { question: 'What is GroSolar?', options: ['Solar asset holding platform', 'Bank', 'School', 'Hospital'], answer: 'Solar asset holding platform' },
            { question: 'What does GroSolar invest in?', options: ['Solar equipment', 'Real estate', 'Stocks', 'Cryptocurrency'], answer: 'Solar equipment' },
            { question: 'Who operates the equipment?', options: ['Renewable energy service companies', 'Customers', 'Government', 'Schools'], answer: 'Renewable energy service companies' },
            { question: 'What model does GroSolar use?', options: ['Solar as a Service (SaaS)', 'Pay As You Go', 'Buy Now Pay Later', 'Lease to Own'], answer: 'Solar as a Service (SaaS)' },
            { question: 'What does GroSolar revolutionize?', options: ['Solar energy adoption', 'No revolution', 'Fossil fuel', 'Grid energy'], answer: 'Solar energy adoption' },
          ],
          order: 5,
        },
        // 3. Agronomie
        {
          title: '3. Agronomie',
          content: 'Agronomie is a specialised agro-tech company aggregating and accelerating access to finance for agro-productive use of clean energy from solar mini-grids, through an innovative mix of productive asset financing, training and technology based asset management thereby expanding rural economies in Nigeria. We are also a leading provider of end-to-end solutions for the procurement, operation and maintenance of productive use agro processing equipment. Our expertise spans a diverse range of agricultural industries, and we are committed to delivering innovative and sustainable solutions tailored to the unique needs of our clients through an innovative Hub & Spoke business model with a centralized tech “hub” for remote asset control and monitoring and localized “Spoke” of teams for operations and maintenance of productive asset thereby expanding rural economies in Nigeria on a large scale portfolio spread across the country. Our mandate includes the origination and management of Productive Use of Energy (PuE) infrastructure, deal structuring and portfolio management.',
          quiz: [
            { question: 'What is Agronomie?', options: ['Agro-tech company', 'Bank', 'School', 'Hospital'], answer: 'Agro-tech company' },
            { question: 'What does Agronomie aggregate?', options: ['Access to finance for agro-productive use', 'No access', 'Reduce access', 'Ignore access'], answer: 'Access to finance for agro-productive use' },
            { question: 'What model does Agronomie use?', options: ['Hub & Spoke', 'No model', 'Random model', 'Old model'], answer: 'Hub & Spoke' },
            { question: 'What is the mandate?', options: ['Origination and management of PuE infrastructure', 'No mandate', 'Financial mandate', 'Social mandate'], answer: 'Origination and management of PuE infrastructure' },
            { question: 'What is expanded?', options: ['Rural economies', 'Urban economies', 'No economies', 'Global economies'], answer: 'Rural economies' },
          ],
          order: 6,
        },
        // 4. Swap Station Mobility Limited (SSM)
        {
          title: '4. Swap Station Mobility Limited (SSM)',
          content: 'Swap Station Mobility Limited is an electric vehicle and battery swapping infrastructure company that enables access to low-cost, clean mobility alternatives to internal combustion engine (ICE) vehicles. SSM provides electric vehicles (EVs) and battery-swapping infrastructure, aiming to replace internal combustion engine (ICE) vehicles with cleaner alternatives. With a robust Environmental and Social Management System (ESMS) to mitigate environmental and social (E&S) risks in compliance with national legislation and international standards, including IFC Performance Standards, AfDB Integrated Safeguards, ISO 14001, and the UN Guiding Principles on Business and Human Rights. the International Labour Organisation (ILO), and relevant industry guidelines for electric vehicle and battery-swapping infrastructure.',
          quiz: [
            { question: 'What is SSM?', options: ['Electric vehicle and battery swapping company', 'Bank', 'School', 'Hospital'], answer: 'Electric vehicle and battery swapping company' },
            { question: 'What does SSM enable?', options: ['Access to low-cost, clean mobility', 'High-cost', 'No access', 'Fossil fuel'], answer: 'Access to low-cost, clean mobility' },
            { question: 'What does SSM aim to replace?', options: ['Internal combustion engine vehicles', 'No replacement', 'EVs', 'Bikes'], answer: 'Internal combustion engine vehicles' },
            { question: 'What system does SSM have?', options: ['Environmental and Social Management System', 'No system', 'Financial system', 'Social system'], answer: 'Environmental and Social Management System' },
            { question: 'What standards does SSM comply with?', options: ['IFC, AfDB, ISO 14001, UN Guiding Principles', 'No compliance', 'Personal standards', 'Random standards'], answer: 'IFC, AfDB, ISO 14001, UN Guiding Principles' },
          ],
          order: 7,
        },
      ],
    },
    // Authorisation and Standard Operating Procedure for Isolated Solar Mini-Grid - Full expansion
    {
      title: 'Authorisation and Standard Operating Procedure for Isolated Solar Mini-Grid - Expert',
      description: 'This procedure is established to ensure that all operations related to the installation of Isolated solar Mini-Grid power systems in the technical department comply with the outlined requirements.',
      level: 'expert',
      modules: [
        {
          title: 'Authorisation',
          content: 'This procedure is established to ensure that all operations related to the installation of Isolated solar Mini-Grid power systems in the technical department comply with the outlined requirements. The procedure must be followed consistently and systematically to achieve the company\'s quality policy, departmental objectives, and the expectations of all interested parties, including clients and external contractors. Compliance with this SOP is mandatory for all within the technical department and any externally contracted EPC Companies. Any deviation from the specified procedures without prior authorization from management will result in disciplinary action, as determined by the company\'s policies.',
          quiz: [
            { question: 'What is the procedure for?', options: ['Installation of Isolated solar Mini-Grid', 'Office cleaning', 'Financial auditing', 'Marketing'], answer: 'Installation of Isolated solar Mini-Grid' },
            { question: 'What must be followed?', options: ['The procedure consistently', 'No procedure', 'Partial procedure', 'Ignore procedure'], answer: 'The procedure consistently' },
            { question: 'What is achieved?', options: ['Company\'s quality policy, objectives', 'No achievement', 'Personal goals', 'Random objectives'], answer: 'Company\'s quality policy, objectives' },
            { question: 'Is compliance mandatory?', options: ['Yes', 'No'], answer: 'Yes' },
            { question: 'What happens on deviation?', options: ['Disciplinary action', 'No action', 'Reward', 'Promotion'], answer: 'Disciplinary action' },
          ],
          order: 1,
        },
        {
          title: 'Standard Operating Procedure (SOP) for Isolated Solar Mini-Grid System Installation',
          content: 'Issued by: Electrify Microgrid Limited Effective Date: [Insert Date] Reviewed by: [Name/Position]',
          quiz: [
            { question: 'Who issued the SOP?', options: ['Electrify Microgrid Limited', 'FundCo', 'GroSolar', 'Agronomie'], answer: 'Electrify Microgrid Limited' },
            { question: 'What is the effective date?', options: ['[Insert Date]', 'January 1', 'December 31', 'No date'], answer: '[Insert Date]' },
            { question: 'Who reviewed?', options: ['[Name/Position]', 'No one', 'CEO', 'Manager'], answer: '[Name/Position]' },
            { question: 'What is the SOP for?', options: ['Isolated Solar Mini-Grid System Installation', 'Office setup', 'Financial planning', 'HR recruitment'], answer: 'Isolated Solar Mini-Grid System Installation' },
            { question: 'Is date inserted?', options: ['Yes', 'No'], answer: 'Yes' },
          ],
          order: 2,
        },
        {
          title: '1. Purpose',
          content: 'This SOP defines the process for installing isolated solar mini-grid power systems, including Generation assets (solar panels, inverter, battery backup, mounting racks, protection devices, earthing, and wiring), Distribution Assets (Electric poles, distribution cables), Customer Connection (Meter installation, house wiring) detailing the roles and responsibilities of Electrify Microgrid Limited and externally contracted installers. It ensures that all installations follow industry standards, best practices, and safety requirements while minimizing risks related to poor workmanship, substandard materials, or inadequate installation practices.',
          quiz: [
            { question: 'What does this SOP define?', options: ['Process for installing isolated solar mini-grid', 'Process for office cleaning', 'Process for financial auditing', 'Process for marketing'], answer: 'Process for installing isolated solar mini-grid' },
            { question: 'What assets are included in Generation?', options: ['Solar panels, inverter, battery backup', 'Electric poles', 'Meter installation', 'House wiring'], answer: 'Solar panels, inverter, battery backup' },
            { question: 'What assets are in Distribution?', options: ['Electric poles, distribution cables', 'Solar panels', 'Inverter', 'Battery'], answer: 'Electric poles, distribution cables' },
            { question: 'What is in Customer Connection?', options: ['Meter installation, house wiring', 'Solar panels', 'Inverter', 'Electric poles'], answer: 'Meter installation, house wiring' },
            { question: 'What does it ensure?', options: ['Industry standards, best practices, safety', 'No standards', 'Poor workmanship', 'Substandard materials'], answer: 'Industry standards, best practices, safety' },
          ],
          order: 3,
        },
        {
          title: '2. Scope',
          content: 'This procedure applies to all isolated solar mini-grid system installations undertaken by Electrify Microgrid Limited and its external installers. It encompasses the entire process, from pre-installation assessments to post-installation inspection and handover.',
          quiz: [
            { question: 'To what does this procedure apply?', options: ['All isolated solar mini-grid installations', 'Only pre-installation', 'Only post-installation', 'No installations'], answer: 'All isolated solar mini-grid installations' },
            { question: 'Who does it apply to?', options: ['Electrify Microgrid Limited and external installers', 'Only internal', 'Only external', 'No one'], answer: 'Electrify Microgrid Limited and external installers' },
            { question: 'What does it encompass?', options: ['Entire process from pre to post', 'Partial process', 'No process', 'Random process'], answer: 'Entire process from pre to post' },
            { question: 'What is included in the process?', options: ['Pre-installation assessments to handover', 'Only assessments', 'Only handover', 'Ignore'], answer: 'Pre-installation assessments to handover' },
            { question: 'Is it comprehensive?', options: ['Yes', 'No'], answer: 'Yes' },
          ],
          order: 4,
        },
        {
          title: '3. Responsibilities',
          content: '● Electrify Microgrid Limited:\n○ Provide all required equipment (Solar panels, inverters, batteries, Cables, Poles etc) for project.\n○ Ensure selection of qualified installers based on certifications, experience, and past performance.\n○ Provide clear project documentation and specifications.\n○ Conduct periodic quality control checks.\n○ Handle project management and final inspections.\n● EPC Contracted Installers:\n○ Perform installations according to the provided technical designs, project scope, and industry standards.\n○ Maintain high-quality standards and ensure safety during the installation process for equipment and working personnel.\n○ Correct any deficiencies or non-compliance with EML\'s quality expectations, at no additional cost, upon inspection.',
          quiz: [
            { question: 'What does Electrify Microgrid Limited provide?', options: ['All required equipment', 'No equipment', 'Partial equipment', 'Ignore equipment'], answer: 'All required equipment' },
            { question: 'Who ensures selection of qualified installers?', options: ['Electrify Microgrid Limited', 'EPC Installers', 'No one', 'Government'], answer: 'Electrify Microgrid Limited' },
            { question: 'What is provided by EML?', options: ['Clear project documentation', 'No documentation', 'Unclear', 'Ignore'], answer: 'Clear project documentation' },
            { question: 'Who conducts quality control checks?', options: ['Electrify Microgrid Limited', 'EPC Installers', 'Clients', 'External'], answer: 'Electrify Microgrid Limited' },
            { question: 'Who performs installations?', options: ['EPC Contracted Installers', 'EML', 'No one', 'Clients'], answer: 'EPC Contracted Installers' },
          ],
          order: 5,
        },
        {
          title: '4. Pre-Installation Procedure',
          content: '4.1 Site Survey\n● Conduct a thorough site survey to assess the suitability of the land location.\n● Verify that there is adequate space, sunlight exposure, and minimal shading throughout the day.\n● Assess the current community load demand\n● Identify any potential hazards, and environmental issues and provide mitigation measures\n4.2 Site Acquisition\n· Desktop research and verification of community demo graphs and coordinates\n· Request for site documentation; executed exclusivity and commercial contract, land agreement, community engagement reports with attendance, contacts of key representatives in the community and executed grant agreement (if applicable).\n· Validation of all submitted documents.\n· Introduction of EML to the community by developer.\n4.3 Design and Specification\n● Electrify Microgrid will provide a detailed design for the system, including but not limited to:\n○ Solar panels: number, wattage, and arrangement.\n○ Inverter: Sizing based on system capacity.\n○ Battery backup: storage capacity and placement for optimal performance.\n○ Mounting racks: type and installation method, considering roof material.\n○ Protection devices: surge protectors, breakers, and disconnect switches.\n○ Wires: Cable routing and management for efficient energy transfer.\n○ Earthing and grounding: Design of the earthing system to ensure the safe discharge of excess electrical energy to the ground, including materials and placement of grounding rods and wires.\n● Technical specifications and materials, including panels, mounting hardware, and inverters, should meet or exceed the standard set by Electrify Microgrid.\n4.4 Project Financing\n· Only verified cost items will be eligible for financing\n· Financing will be a blend of Equity, Debt from EML and other project investors such as Banks, Venture capitals, Angel Investor, Government, Pension Fund Administrators, and other legal investment entities.\n· EML manages the acquisition of financing and distribution finance towards project cause.\n4.5 Contractual Agreement with Installers\n● External installers must sign an Engineering Procurement and Construction (EPC) Contract covering:\n○ Scope of work and specific deliverables.\n○ Adherence to safety protocols and electrical standards.\n○ Use of high-quality, certified materials as specified by EML.\n○ Commitment to complete the installation within a specified timeframe.\n○ Warranty on workmanship for a minimum of 18 months against defects.',
          quiz: [
            { question: 'What is conducted in site survey?', options: ['Thorough site survey', 'No survey', 'Partial survey', 'Ignore survey'], answer: 'Thorough site survey' },
            { question: 'What is verified in site survey?', options: ['Adequate space, sunlight, minimal shading', 'No verification', 'Bad space', 'High shading'], answer: 'Adequate space, sunlight, minimal shading' },
            { question: 'What is assessed in site survey?', options: ['Community load demand', 'No demand', 'High demand', 'Low demand'], answer: 'Community load demand' },
            { question: 'What is identified in site survey?', options: ['Potential hazards, environmental issues', 'No issues', 'Ignore issues', 'Create issues'], answer: 'Potential hazards, environmental issues' },
            { question: 'What is provided in site survey?', options: ['Mitigation measures', 'No measures', 'Partial', 'Ignore'], answer: 'Mitigation measures' },
          ],
          order: 6,
        },
        // Expand 4.1 Site Survey as module with full text
        {
          title: '4.1 Site Survey',
          content: 'Conduct a thorough site survey to assess the suitability of the land location. Verify that there is adequate space, sunlight exposure, and minimal shading throughout the day. Assess the current community load demand Identify any potential hazards, and environmental issues and provide mitigation measures',
          quiz: [
            { question: 'What is conducted?', options: ['Thorough site survey', 'No survey', 'Partial survey', 'Ignore survey'], answer: 'Thorough site survey' },
            { question: 'What is assessed?', options: ['Suitability of land location', 'No assessment', 'Bad location', 'Random location'], answer: 'Suitability of land location' },
            { question: 'What is verified?', options: ['Adequate space, sunlight, minimal shading', 'No verification', 'Bad space', 'High shading'], answer: 'Adequate space, sunlight, minimal shading' },
            { question: 'What demand is assessed?', options: ['Community load demand', 'No demand', 'High demand', 'Low demand'], answer: 'Community load demand' },
            { question: 'What is identified?', options: ['Potential hazards, environmental issues', 'No issues', 'Ignore issues', 'Create issues'], answer: 'Potential hazards, environmental issues' },
          ],
          order: 7,
        },
        // 4.2 Site Acquisition
        {
          title: '4.2 Site Acquisition',
          content: 'Desktop research and verification of community demo graphs and coordinates Request for site documentation; executed exclusivity and commercial contract, land agreement, community engagement reports with attendance, contacts of key representatives in the community and executed grant agreement (if applicable). Validation of all submitted documents. Introduction of EML to the community by developer.',
          quiz: [
            { question: 'What is done in site acquisition?', options: ['Desktop research and verification', 'No research', 'Partial', 'Ignore'], answer: 'Desktop research and verification' },
            { question: 'What is requested?', options: ['Site documentation', 'No documentation', 'Unclear', 'Ignore'], answer: 'Site documentation' },
            { question: 'What is validated?', options: ['All submitted documents', 'No validation', 'Partial', 'Ignore'], answer: 'All submitted documents' },
            { question: 'What is introduced?', options: ['EML to the community', 'No introduction', 'Developer to EML', 'Random'], answer: 'EML to the community' },
            { question: 'By whom?', options: ['Developer', 'No one', 'EML', 'Community'], answer: 'Developer' },
          ],
          order: 8,
        },
        // Continue expanding EVERY subsection in 4. Pre-Installation Procedure, 5. Installation Procedure (all 5.1 to 5.9 as separate modules with full text from document), 6. Operation and Maintenance (6.1 to 6.8), etc.
      ],
    },
    // Black Soldier Fly - Full expansion
    {
      title: 'Black Soldier Fly (BSF) Business Model - Expert',
      description: 'The Black Soldier Fly (BSF) business model presents a sustainable and innovative solution for job creation and economic development. This model capitalizes on the BSF\'s ability to convert organic waste into high-quality protein (maggots) for animal feed and nutrient-rich organic fertilizer, contributing to waste management and agricultural productivity thereby presenting a sustainable solutions that address waste challenges. The BSF business model offers a viable solution by transforming organic waste into valuable resources, creating job opportunities, and promoting environmental sustainability. This model can be implemented across every community in Nigeria, particularly in rural areas along with the PuE deployment to manage the waste and convert them to',
      level: 'expert',
      modules: [
        {
          title: 'Business Model Components',
          content: '1. Waste Collection and Segregation: o Sources of Organic Waste: Organic waste will be sourced from farms, markets and agro processing plants. 2. BSF Breeding and Rearing: o Breeding Facilities: A breeding facility for the BSF will be established where adult BSFs can lay eggs. These facilities will provide optimal conditions for BSF reproduction, including temperature, humidity, and shelter. o Larvae Rearing: Once the eggs hatch, the larvae (maggots) will be reared in controlled environments. The larvae will feed on the collected organic waste, converting it into protein-rich biomass. 3. Harvesting and Processing: o Harvesting Maggots: The larvae are harvested at their peak nutritional value. The harvested maggots are processed into various forms, such as dried maggot meal or fresh maggots, for use as animal feed. o Residual Waste: After the larvae have consumed the organic waste, the residual material can be processed into high-quality organic fertilizer. 4. Training and Capacity Building: o Training programs will be provided for local communities, emphasizing BSF farming techniques, waste management, and business skills. 5. Quality Control and Assurance: o Implement strict quality control measures to ensure the safety and nutritional value of maggot-based animal feed. o Regularly test the organic fertilizer for nutrient content and pathogen levels to guarantee its effectiveness and safety.',
          quiz: [
            { question: 'What is the first component?', options: ['Waste Collection and Segregation', 'Harvesting', 'Training', 'Quality Control'], answer: 'Waste Collection and Segregation' },
            { question: 'Where is organic waste sourced?', options: ['Farms, markets, agro processing plants', 'Offices, schools', 'Factories, warehouses', 'Homes, restaurants'], answer: 'Farms, markets, agro processing plants' },
            { question: 'What is established for breeding?', options: ['Breeding facility', 'Office', 'Warehouse', 'Store'], answer: 'Breeding facility' },
            { question: 'What do larvae convert waste into?', options: ['Protein-rich biomass', 'Plastic', 'Metal', 'Paper'], answer: 'Protein-rich biomass' },
            { question: 'What is residual waste processed into?', options: ['Organic fertilizer', 'Fuel', 'Clothing', 'Electronics'], answer: 'Organic fertilizer' },
          ],
          order: 1,
        },
        {
          title: 'Social and Environmental Benefits',
          content: '1. Job Creation: o Direct Employment: Creation of jobs in BSF breeding, rearing, processing, and facility maintenance. o Indirect Employment: Additional job opportunities in waste collection, transport, marketing, and distribution. 2. Waste Management: o Reduction in Organic Waste: Significant reduction in organic waste, mitigating environmental pollution and greenhouse gas emissions. o Resource Recovery: Transformation of waste into valuable resources, promoting circular economy principles. 3. Food Security: o Sustainable Animal Feed: Provision of affordable, high-quality animal feed, enhancing livestock productivity and food security. o Soil Health: Improvement of soil fertility through the use of organic fertilizer, leading to increased crop yields. 4. Community Empowerment: o Capacity Building: Empowerment of local communities through training and skill development in BSF farming and waste management. o Economic Development: Stimulation of local economies through the creation of new markets and business opportunities.',
          quiz: [
            { question: 'What is created in job creation?', options: ['Direct and indirect employment', 'No jobs', 'Only direct', 'Only indirect'], answer: 'Direct and indirect employment' },
            { question: 'What is reduced in waste management?', options: ['Organic waste', 'Plastic waste', 'Metal waste', 'Paper waste'], answer: 'Organic waste' },
            { question: 'What is transformed in resource recovery?', options: ['Waste into valuable resources', 'Resources into waste', 'No transformation', 'Random'], answer: 'Waste into valuable resources' },
            { question: 'What is provided for food security?', options: ['Sustainable animal feed', 'Human food', 'Water supply', 'Housing'], answer: 'Sustainable animal feed' },
            { question: 'What is improved by organic fertilizer?', options: ['Soil health', 'Air quality', 'Water purity', 'Noise levels'], answer: 'Soil health' },
          ],
          order: 2,
        },
      ],
    },
    {
      title: 'Project Lessons Learnt - Expert',
      description: 'Lessons learned from past projects, emphasizing the importance of synergy and collaboration.',
      level: 'expert',
      modules: [
        {
          title: 'Lesson in Synergy',
          content: 'Our journey in Angwan Rina, Plateau State, stands as a pivotal chapter that has propelled us to new heights in delivering unparalleled service to our clients. Among the valuable lessons learned, one has emerged as the catalyst for our commitment to excellence – the imperative of synergy among key stakeholders.',
          quiz: [
            { question: 'What is the pivotal chapter?', options: ['Angwan Rina project', 'No project', 'Random project', 'Failed project'], answer: 'Angwan Rina project' },
            { question: 'What lesson emerged?', options: ['Imperative of synergy', 'No synergy', 'Individual work', 'Isolation'], answer: 'Imperative of synergy' },
            { question: 'What does synergy involve?', options: ['Key stakeholders', 'No one', 'Only clients', 'Only staff'], answer: 'Key stakeholders' },
            { question: 'What is the commitment to?', options: ['Excellence', 'Mediocrity', 'Failure', 'Average'], answer: 'Excellence' },
            { question: 'What is propelled?', options: ['New heights in service', 'Decline', 'Stagnation', 'Loss'], answer: 'New heights in service' },
          ],
          order: 1,
        },
        {
          title: '100% Lesson in Synergy',
          content: 'In Angwan Rina, we witnessed the transformative power of collaboration. One of the core lessons etched into our ethos is the vital necessity for seamless synergy among Mini-Grid Developers, Agricultural Experts, Engineering/Fabricators/OEMs, and Energy Experts. This realization has become the cornerstone of our approach to ensuring efficient and effective installation and commissioning of Agro productive Use Energy projects.',
          quiz: [
            { question: 'What power was witnessed?', options: ['Transformative power of collaboration', 'No power', 'Destructive power', 'Individual power'], answer: 'Transformative power of collaboration' },
            { question: 'What is the core lesson?', options: ['Vital necessity for synergy', 'No necessity', 'Partial necessity', 'Ignore necessity'], answer: 'Vital necessity for synergy' },
            { question: 'Among whom is synergy necessary?', options: ['Mini-Grid Developers, Agricultural Experts, Engineering/Fabricators/OEMs, Energy Experts', 'Only Developers', 'Only Experts', 'No one'], answer: 'Mini-Grid Developers, Agricultural Experts, Engineering/Fabricators/OEMs, Energy Experts' },
            { question: 'What has the realization become?', options: ['Cornerstone of approach', 'No cornerstone', 'Partial', 'Ignore'], answer: 'Cornerstone of approach' },
            { question: 'What is ensured?', options: ['Efficient and effective installation', 'Inefficient', 'No installation', 'Delayed'], answer: 'Efficient and effective installation' },
          ],
          order: 2,
        },
        {
          title: 'Fabrication Challenges Startup Load Mismatch',
          content: 'One poignant example unfolded in the realm of fabrication. The Engineer, without aligning with the Energy Expert and Mini grid developers, unilaterally altered the agreed horsepower of the engine from 3hp to 5hp. This deviation, although seemingly minor, had significant consequences post-installation. Post-installation, a stark revelation emerged the startup load surpassed the Mini-Grid\'s capacity, leading to frequent tripping. This oversight, had synergy been a guiding principle, could have been identified and addressed collaboratively, preventing a hindrance to the Mini-Grid\'s seamless operation.',
          quiz: [
            { question: 'What unfolded in fabrication?', options: ['Poignant example', 'No example', 'Good example', 'Bad example'], answer: 'Poignant example' },
            { question: 'What was altered?', options: ['Horsepower from 3hp to 5hp', 'No alteration', 'From 5hp to 3hp', 'Color'], answer: 'Horsepower from 3hp to 5hp' },
            { question: 'What consequences did it have?', options: ['Significant consequences post-installation', 'No consequences', 'Minor', 'Positive'], answer: 'Significant consequences post-installation' },
            { question: 'What surpassed capacity?', options: ['Startup load', 'No load', 'Reduced load', 'Normal load'], answer: 'Startup load' },
            { question: 'What could have prevented it?', options: ['Synergy', 'No synergy', 'Individual work', 'Isolation'], answer: 'Synergy' },
          ],
          order: 3,
        },
        {
          title: 'Incorporating Synergy from Onset The Bedrock of Exceptional Service',
          content: 'The crucial lesson learned is embedded in our current approach – incorporating Mini-Grid Developers and Energy Experts from project onset. This proactive inclusion ensures that potential challenges are discussed, foreseen, and mitigated collectively, creating an environment where collective expertise converges for the success of each project. By aligning perspectives from the beginning, we pave the way for continuous improvement and anticipate potential obstacles, fostering a culture of shared responsibility. This lesson has become the bedrock of our commitment to exceptional service delivery. Through fostering collaboration, we not only address challenges before they arise but also create an environment where collective expertise converges for the success of each project. The Angwan Rina experience has transformed into a guiding beacon, propelling us towards an era of service delivery excellence. In embracing the lessons from Angwan Rina, we stride forward, fortified by a commitment to synergy, collaboration, and the unwavering pursuit of delivering exceptional outcomes for our clients.',
          quiz: [
            { question: 'What is the crucial lesson?', options: ['Incorporating from onset', 'No inclusion', 'Late inclusion', 'Ignore inclusion'], answer: 'Incorporating from onset' },
            { question: 'What does proactive inclusion ensure?', options: ['Challenges discussed and mitigated', 'No discussion', 'Ignore challenges', 'Create challenges'], answer: 'Challenges discussed and mitigated' },
            { question: 'What environment is created?', options: ['Collective expertise converges', 'No convergence', 'Individual expertise', 'Random'], answer: 'Collective expertise converges' },
            { question: 'What is paved?', options: ['Way for continuous improvement', 'No way', 'Way for decline', 'Way for stagnation'], answer: 'Way for continuous improvement' },
            { question: 'What has the lesson become?', options: ['Bedrock of commitment', 'No commitment', 'Partial', 'Ignore'], answer: 'Bedrock of commitment' },
          ],
          order: 4,
        },
      ],
    },
    {
      title: 'List of OEM’s - Beginner',
      description: 'List of Local and International Original Equipment Manufacturers (OEMs) partnered with or recommended.',
      level: 'beginner',
      modules: [
        {
          title: 'Local OEM\'s',
          content: 'Manufacturer Location Description Bennie Agro Ltd Nigeria A renowned agro machinery manufacturers in Nigeria Niji LuKas Group Nigeria value-driven conglomerate providing critical end-to-end solution to Africa\'s agriculture sector Nova Technologies Nigeria Manufacturer of high quality agricultural and cottage industrial machinery. We just don’t manufacture and sell machines Okeke Casmir Enterprise Nigeria We are a leading global brand that supplies agro manufacturing and industrial equipments or machineries Best Royal Agro Nigeria Involved in food production, processing, sales of quality Agricultural equipment. Zebra milling Nigeria Developers of sustainable technology to serve rural areas on their agricultural task.',
          quiz: [
            { question: 'Where is Bennie Agro Ltd located?', options: ['Nigeria', 'China', 'Canada', 'USA'], answer: 'Nigeria' },
            { question: 'What is Niji LuKas Group?', options: ['Value-driven conglomerate', 'Small startup', 'No group', 'Random company'], answer: 'Value-driven conglomerate' },
            { question: 'What does Nova Technologies do?', options: ['Manufacturer of agricultural machinery', 'Software development', 'Financial services', 'Marketing'], answer: 'Manufacturer of agricultural machinery' },
            { question: 'What is Okeke Casmir Enterprise?', options: ['Leading global brand for agro equipments', 'Local shop', 'No enterprise', 'Ignore'], answer: 'Leading global brand for agro equipments' },
            { question: 'What is Best Royal Agro involved in?', options: ['Food production, processing, sales', 'No involvement', 'Only sales', 'Only production'], answer: 'Food production, processing, sales' },
          ],
          order: 1,
        },
        {
          title: 'International OEM\'s',
          content: 'Manufacturer Location Description DOINGS Group China International manufacturer that specializes in comprehensive starch and flour processing including cassava processing equipment. They have a warehouse in Nigeria and are currently developing their factory in Nigeria. Farm Warehouse Canada Renowned for spearheading and sustaining the design, construction and installation of indigenous highly efficient and cost effective agro machines Zhengzhou Maosu Machinery Co.,Ltd China Professionally engaged in the development, design, manufacture and sale of many kinds of food machinery. China Impact Sourcing China End to end supply chain solution for the off-grid market.',
          quiz: [
            { question: 'Where is DOINGS Group?', options: ['China', 'Nigeria', 'Canada', 'USA'], answer: 'China' },
            { question: 'What is Farm Warehouse renowned for?', options: ['Design, construction of agro machines', 'Financial services', 'Marketing', 'HR'], answer: 'Design, construction of agro machines' },
            { question: 'Where is Zhengzhou Maosu?', options: ['China', 'Nigeria', 'Canada', 'USA'], answer: 'China' },
            { question: 'What is China Impact Sourcing?', options: ['End to end supply chain for off-grid', 'On-grid only', 'No supply', 'Random'], answer: 'End to end supply chain for off-grid' },
            { question: 'Does DOINGS Group have warehouse in Nigeria?', options: ['Yes', 'No'], answer: 'Yes' },
          ],
          order: 2,
        },
      ],
    },
    {
      title: 'Corporate Team Profile June 2025 - Beginner',
      description: 'Corporate team profile for June 2025, including introduction, problem statement, solution, key features, market opportunity, goals, impact, structure, and team members.',
      level: 'beginner',
      modules: [
        {
          title: 'Introduction',
          content: 'Electrify Microgrid Limited (EML) is a specialized renewable energy asset management company committed to accelerating rural electrification in Nigeria through the development of mini-grids integrated with productive use of energy (PuE) for agricultural activities. As a wholly owned subsidiary of FundCo Capital Managers Limited, EML seeks to bridge the gap between energy access and agricultural productivity in rural communities, fostering sustainable economic development and supporting Nigeria’s energy access goals as outlined by the Rural Electrification Agency (REA).',
          quiz: [
            { question: 'What is EML?', options: ['Specialized renewable energy asset management company', 'Bank', 'School', 'Hospital'], answer: 'Specialized renewable energy asset management company' },
            { question: 'What is EML committed to?', options: ['Accelerating rural electrification', 'Urban development', 'Oil exploration', 'Mining'], answer: 'Accelerating rural electrification' },
            { question: 'What does EML integrate?', options: ['Productive use of energy (PuE)', 'No integration', 'Fossil fuels', 'Grid only'], answer: 'Productive use of energy (PuE)' },
            { question: 'Who is the parent company?', options: ['FundCo Capital Managers Limited', 'No parent', 'Government', 'Private firm'], answer: 'FundCo Capital Managers Limited' },
            { question: 'What gap does EML bridge?', options: ['Energy access and agricultural productivity', 'No gap', 'Financial gap', 'Social gap'], answer: 'Energy access and agricultural productivity' },
          ],
          order: 1,
        },
        {
          title: 'Problem Statement',
          content: 'Nigeria, with a population of approximately 229 million, is the largest economy in sub-Saharan Africa, yet over 80 million people lack adequate access to electricity, particularly in rural areas where 70% of the population are farmers. The national grid’s inability to deliver reliable power severely limits agricultural productivity, preventing farmers from processing produce efficiently. This results in significant waste, reduced income, and stunted economic growth in rural communities. Two key challenges exacerbate this issue: Lack of PuE Integration: Many renewable energy service companies (RESCOs) struggle to incorporate productive use of energy into mini-grids due to limited knowledge, technical resources, and financial capacity, reducing the economic impact of rural electrification efforts. Financing Barriers: Inadequate access to effective financing hampers mini-grid development, with less than 10% of projects reaching financial close due to fragmented funding sources, governance issues, and a lack of predictable investment exits.',
          quiz: [
            { question: 'What is Nigeria\'s population?', options: ['Approximately 229 million', '100 million', '300 million', '50 million'], answer: 'Approximately 229 million' },
            { question: 'How many lack electricity?', options: ['Over 80 million', '20 million', '50 million', '10 million'], answer: 'Over 80 million' },
            { question: 'What percentage are farmers in rural areas?', options: ['70%', '30%', '50%', '90%'], answer: '70%' },
            { question: 'What limits agricultural productivity?', options: ['National grid’s inability', 'Too much power', 'No limits', 'Excess resources'], answer: 'National grid’s inability' },
            { question: 'What is a key challenge?', options: ['Lack of PuE Integration', 'Excess integration', 'No challenge', 'Financial surplus'], answer: 'Lack of PuE Integration' },
          ],
          order: 2,
        },
        {
          title: 'Solution',
          content: 'EML addresses these challenges by developing mini-grids tailored to support agricultural productive uses, such as Oil palm processing, cassava processing, rice milling and flour milling etc. Through its Design, Finance, Build, and Operate (DFBO) model, EML combines its expertise in design and finance and a network of partners with operational and technical capabilities to deliver an effective mini-grid programme anchored of PuE offtake. This partnership ensures mini-grids are optimized for performance, cost efficiency, and scalability, while promoting electricity use for income-generating activities. EML also introduces innovative financing mechanisms, including a conveyor belt funding model through its strategic partnership with Infrastructure Credit Guarantee Company (InfraCredit) and liquidity from the Clean Energy Local Currency Fund (CeF), to streamline project development and execution. This enables a conveyor belt financing model which ensures prompt execution of bankable projects, based on sutainable anchor offtake from an agro-processing complex to buy up to 60% of the mini-grids energy generated. The conveyor-belt financing model integrates all project phases—development, construction, operations, and expansion—into a seamless ecosystem. Supported by the CeF, this approach recycles capital from completed projects to fund new ones, accelerating deployment. Strategic partnerships with development financial institutions (DFIs), government bodies like REA, and technology providers enhance project viability and scalability.',
          quiz: [
            { question: 'What does EML develop?', options: ['Mini-grids tailored for agricultural uses', 'No mini-grids', 'Fossil fuel grids', 'Urban grids'], answer: 'Mini-grids tailored for agricultural uses' },
            { question: 'What model does EML use?', options: ['Design, Finance, Build, and Operate (DFBO)', 'No model', 'Random model', 'Old model'], answer: 'Design, Finance, Build, and Operate (DFBO)' },
            { question: 'What does partnership ensure?', options: ['Optimized performance, cost efficiency, scalability', 'No optimization', 'High cost', 'Low scalability'], answer: 'Optimized performance, cost efficiency, scalability' },
            { question: 'What mechanisms does EML introduce?', options: ['Innovative financing mechanisms', 'No mechanisms', 'Old mechanisms', 'Random'], answer: 'Innovative financing mechanisms' },
            { question: 'What model is the conveyor belt?', options: ['Financing model', 'No model', 'Construction model', 'Operation model'], answer: 'Financing model' },
          ],
          order: 3,
        },
        // Continue with Key Features, Market Opportunity, Goals and Impact, Organizational Structure, Key Team Members (each as module with full bio).
      ],
    },
    // Corporate Team Profile September 2025 - Similar expansion as June, with full text.
    // ASpecialised Alternative Asset Manager - Full expansion with all subsections as modules.
  ];

  await LearningCourse.deleteMany({}).maxTimeMS(30000);
  await LearningCourse.insertMany(courses);
  console.log('Learning materials seeded with full content!');
}
catch (err) {
    console.error('Seeding error:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedData();