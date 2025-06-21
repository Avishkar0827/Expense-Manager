"use client"
import { useState } from "react"
import { Plus, Tag, Trash2 } from "lucide-react"

const CategoryManager = ({ categories = [], onAddCategory, onDeleteCategory }) => {
  const [newCategory, setNewCategory] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim())
      setNewCategory("")
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manage Categories</h3>
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Enter any category name"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          required
          minLength={2}
          maxLength={30}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
          <Tag className="h-4 w-4 mr-1" />
          Your Categories:
        </h4>
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium">
                  {category}
                </span>
                <button
                  onClick={() => onDeleteCategory(category)}
                  className="ml-1 text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No categories added yet. Start by adding one above!
          </p>
        )}
      </div>
    </div>
  )
}

export default CategoryManager