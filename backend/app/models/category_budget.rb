class CategoryBudget < ApplicationRecord
  belongs_to :budget_profile
  belongs_to :category

  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  validates :category_id, uniqueness: { scope: :budget_profile_id, message: "budget already set in this profile" }

  def self.ransackable_attributes(auth_object = nil)
    ["amount", "budget_profile_id", "category_id", "created_at", "id", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["budget_profile", "category"]
  end
end
