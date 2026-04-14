module Stores
  class FetchService < ApplicationService
    def initialize(store_slug: nil)
      @store_slug = store_slug
    end

    def call
      if @store_slug
        store = Store.kept.find_by(slug: @store_slug, active: true)
        return failure("Store not found or archived", :not_found) unless store
        success(store: store)
      else
        stores = Store.kept.where(active: true)
        success(stores: stores)
      end
    end
  end
end
