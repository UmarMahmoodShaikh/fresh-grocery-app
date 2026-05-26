class BudgetProfile < ApplicationRecord
  belongs_to :user
  has_many :category_budgets, dependent: :destroy

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id, message: "already exists for this user" }
  validates :total_budget, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(is_active: true) }

  # Accepts nested attributes for category budgets (create/update/delete in one request)
  accepts_nested_attributes_for :category_budgets, allow_destroy: true

  # Deactivate all other profiles for this user when activating this one
  def activate!
    self.class.where(user_id: user_id).update_all(is_active: false)
    update!(is_active: true)
  end

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "is_active", "name", "total_budget", "updated_at", "user_id"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["category_budgets", "user"]
  end
end
