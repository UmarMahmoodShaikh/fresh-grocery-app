module Stores
  class FetchCategoriesService < ApplicationService
    def initialize(store:)
      @store = store
    end

    def call
      # Fetch categories available in this store that haven't been archived
      categories = Category.kept.joins(:store_categories).where(store_categories: { store_id: @store.id })
      success(categories: categories)
    end
  end
end
