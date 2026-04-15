module Stores
  class FetchBannersService < ApplicationService
    def initialize(store:)
      @store = store
    end

    def call
      banners = @store.banners.kept.order(created_at: :desc)
      success(banners: banners)
    end
  end
end
