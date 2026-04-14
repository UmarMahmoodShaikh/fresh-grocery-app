module Api
  module V2
    class ProductsController < ApplicationController
      before_action :set_store

      def index
        result = Products::FetchService.call(store: @store, params: params)
        render json: result.payload[:products], status: :ok
      end

      def show
        result = Products::FetchService.call(store: @store, params: params)
        if result.success?
          render json: result.payload[:product], status: :ok
        else
          render json: { error: result.error }, status: result.status
        end
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
