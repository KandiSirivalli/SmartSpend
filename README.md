# SmartSpend 💰

**Your Money, In Focus**

SmartSpend is a personal finance tracking web application designed to help users manage their income and expenses, organize transactions, and understand their spending habits in one place.

🌐 **Live Website:** https://kandisirivalli.github.io/SmartSpend/

## ✨ Features

- **User Authentication:** Create an account and log in securely using Supabase Authentication.
- **Income Tracking:** Record and manage your income.
- **Expense Tracking:** Add expenses and categorize your spending.
- **Transaction Management:** Keep your financial transactions organized.
- **Personalized Accounts:** Each user has their own account.
- **Cloud Database:** Store and retrieve transactions using Supabase.
- **Privacy:** Users can access only their own transactions through database security policies.
- **Responsive Interface:** Access the application through a modern web browser.

## 🛠️ Technologies Used

- React
- TypeScript
- Vite
- CSS
- Supabase Authentication
- Supabase PostgreSQL Database
- Git and GitHub
- GitHub Pages

## 🚀 Getting Started

### Prerequisites

Install the following:

- Node.js
- npm
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/KandiSirivalli/SmartSpend.git
   ```

2. Navigate to the project folder:

   ```bash
   cd SmartSpend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root directory and add your Supabase configuration:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL displayed in your terminal.

## 🔐 Security

- Supabase Authentication manages user sign-in and registration.
- Row Level Security (RLS) policies protect users' transactions.
- Environment variables configure the Supabase connection.
- Never commit your `.env` file or expose your Supabase secret or service-role key.

## 🌍 Deployment

SmartSpend is deployed using GitHub Pages and GitHub Actions. Pushes to the `main` branch trigger the configured build and deployment workflow.

## 📌 Future Enhancements

- Monthly spending reports and visual analytics
- Budget planning and spending limits
- Savings goals and progress tracking
- Downloadable financial reports
- Improved transaction search and filtering

## 👩‍💻 Author

**Kandi Sirivalli**

- GitHub: https://github.com/KandiSirivalli

---

*SmartSpend — Manage your money with clarity and confidence.*
