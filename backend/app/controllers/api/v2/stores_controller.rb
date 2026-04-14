module Api
  module V2
    class StoresController < ApplicationController
      # skip_before_action :authenticate_request, only: [:index, :show] # Adjust based on your auth logic

      def index
        result = Stores::FetchService.call
        render json: result.payload[:stores], status: :ok
      end

      def show
        result = Stores::FetchService.call(store_slug: params[:slug])
        if result.success?
          render json: result.payload[:store], status: :ok
        else
          render json: { error: result.error }, status: result.status
        end
      end
    end
  end
end
