import { Link } from "react-router-dom"
import { TrendingUp, PieChart, Users, Shield, Smartphone, BarChart3 } from "lucide-react"

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Take Control of Your
              <span className="text-yellow-300"> Finances</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Track expenses, manage budgets, and split bills with friends. Get insights into your spending habits with
              beautiful charts and analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-lg text-lg transition-colors transform hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link
                to="/about"
                className="border-2 border-white hover:bg-white hover:text-gray-900 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Manage Money
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful features to help you stay on top of your finances
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Expense Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track all your expenses and income in one place with easy categorization
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <PieChart className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Visual Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Beautiful charts and graphs to visualize your spending patterns
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Bill Splitting</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Split expenses with friends and family, track who owes what
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <BarChart3 className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Budget Management</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Set budgets for different categories and track your progress
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <Shield className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-300">Your financial data is encrypted and secure with us</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <Smartphone className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Mobile Friendly</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access your finances anywhere with our responsive design
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Start Your Financial Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already managing their finances better
          </p>
          <Link
            to="/signup"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-lg text-lg transition-colors transform hover:scale-105"
          >
            Sign Up Now - It's Free!
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
