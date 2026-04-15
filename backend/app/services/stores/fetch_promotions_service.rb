module Stores
  class FetchPromotionsService < ApplicationService
    def initialize(store:)
      @store = store
    end

    def call
      now = Time.current
      promotions = @store.promotions.kept.where('starts_at <= ? AND ends_at >= ?', now, now)
      
      # If ends_at/starts_at are nil, we can assume it's always active, adjust logic as per business need:
      # promotions = @store.promotions.where('(starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?)', now, now)
      
      success(promotions: promotions)
    end
  end
end
