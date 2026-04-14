module Api
  module V2
    class BannersController < ApplicationController
      before_action :set_store

      def index
        result = Stores::FetchBannersService.call(store: @store)
        render json: result.payload[:banners], status: :ok
      end

      private

      def set_store
        @store = Store.find_by!(slug: params[:store_slug], active: true)
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Store not found' }, status: :not_found
      end
    end
  end
end
