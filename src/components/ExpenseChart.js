import { useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ExpenseChart = ({ transactions = [], formatCurrency }) => {
  // Debug effect
  useEffect(() => {
    console.log("Transactions updated - count:", transactions.length);
    console.log("Sample transactions:", transactions.slice(0, 3));
    console.log("Transaction types:", transactions.map(t => ({id: t._id, type: t.type, category: t.category})));
  }, [transactions]);

  // Process data with dependency on transactions
  const {  pieChartData, barChartData } = useMemo(() => {
    console.log("Recalculating chart data...");
    
    // Filter and process expenses by category - with better type checking
    const expenseTransactions = transactions.filter(t => {
      const isValid = t && 
        t.type === "expense" && 
        t.category && 
        t.category.trim() !== "" &&
        t.amount && 
        !isNaN(parseFloat(t.amount));
      
      if (!isValid && t) {
        console.log("Filtered out transaction:", {
          id: t._id,
          type: t.type,
          category: t.category,
          amount: t.amount,
          reason: !t.type ? 'no type' : 
                  t.type !== 'expense' ? 'not expense' :
                  !t.category ? 'no category' :
                  t.category.trim() === '' ? 'empty category' :
                  !t.amount ? 'no amount' :
                  isNaN(parseFloat(t.amount)) ? 'invalid amount' : 'unknown'
        });
      }
      
      return isValid;
    });
    
    console.log("Valid expense transactions:", expenseTransactions.length);
    console.log("Expense transactions with categories:", expenseTransactions.map(t => ({
      id: t._id,
      category: t.category,
      amount: t.amount
    })));
    
    const expensesByCategory = expenseTransactions.reduce((acc, t) => {
      const amount = parseFloat(t.amount) || 0;
      const category = t.category.trim() || "Uncategorized";
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {});

    console.log("Expenses by category result:", expensesByCategory);

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, a) => sum + a, 0);

    // Process monthly data for both income and expenses - with better validation
    const monthlyData = transactions.reduce((acc, t) => {
      try {
        if (!t || !t.date || !t.amount || !t.type) {
          console.log("Skipping invalid transaction:", t);
          return acc;
        }
        
        const date = new Date(t.date);
        if (isNaN(date.getTime())) {
          console.log("Invalid date for transaction:", t);
          return acc;
        }
        
        const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        const amount = parseFloat(t.amount) || 0;
        
        if (!acc[month]) {
          acc[month] = { month, income: 0, expense: 0 };
        }
        
        // Ensure we're adding to the correct type
        if (t.type === 'income') {
          acc[month].income += amount;
        } else if (t.type === 'expense') {
          acc[month].expense += amount;
        }
        
        console.log(`Added ${t.type} of ${amount} to ${month}`);
      } catch (e) {
        console.error("Date processing error:", e, t);
      }
      return acc;
    }, {});

    console.log("Monthly data result:", monthlyData);

    // Create pie chart data
    const pieChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0
    }));

    // Create bar chart data (sorted by date)
    const barChartData = Object.values(monthlyData)
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    console.log("Final chart data:", {
      pieChartData: pieChartData.length,
      barChartData: barChartData.length,
      totalExpenses
    });

    return { expensesByCategory, monthlyData, pieChartData, barChartData };
  }, [transactions]);

  const colors = [
    "#3B82F6", // blue-500
    "#10B981", // green-500
    "#F59E0B", // yellow-500
    "#EF4444", // red-500
    "#8B5CF6", // purple-500
    "#EC4899", // pink-500
    "#6366F1", // indigo-500
    "#F97316", // orange-500
    "#06B6D4", // cyan-500
    "#84CC16"  // lime-500
  ];

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{data.payload.name}</p>
          <p className="text-gray-600 dark:text-gray-300">
            Amount: {formatCurrency ? formatCurrency(data.value) : `₹${data.value.toFixed(2)}`}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Percentage: {data.payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.dataKey}: {formatCurrency ? formatCurrency(entry.value) : `₹${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Spending Analysis</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses by Category - Pie Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Expenses by Category</h4>
          {pieChartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {transactions.length === 0 
                  ? "No transactions available" 
                  : transactions.filter(t => t.type === 'expense').length === 0
                  ? "No expense transactions found"
                  : "No expense transactions with categories found"}
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Category Legend */}
          {pieChartData.length > 0 && (
            <div className="mt-4 space-y-2">
              {pieChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency ? formatCurrency(item.value) : `₹${item.value.toFixed(2)}`} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Overview - Bar Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">Monthly Overview</h4>
          {barChartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {transactions.length === 0 
                  ? "No transactions available" 
                  : "No valid dated transactions found"}
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6B7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Income" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expense" fill="#EF4444" name="Expense" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Monthly Summary */}
          {barChartData.length > 0 && (
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
              {barChartData.slice(-3).map((item) => {
                const net = item.income - item.expense;
                return (
                  <div key={item.month} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.month}</span>
                    <div className="flex space-x-4">
                      <span className="text-green-600">
                        +{formatCurrency ? formatCurrency(item.income) : `₹${item.income.toFixed(2)}`}
                      </span>
                      <span className="text-red-600">
                        -{formatCurrency ? formatCurrency(item.expense) : `₹${item.expense.toFixed(2)}`}
                      </span>
                      <span className={`font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {net >= 0 ? '+' : ''}{formatCurrency ? formatCurrency(net) : `₹${net.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;