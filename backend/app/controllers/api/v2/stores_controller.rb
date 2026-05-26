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

      def detect
        lat = params[:lat]
        lng = params[:lng]
        
        # We use ST_Contains on the boundary column
        # Geography columns need to be cast to geometry for some ST_ functions or used directly if supported
        store = Store.where("ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geometry)", lng, lat).first
        
        if store
          render json: store, status: :ok
        else
          render json: { error: 'Not within any store premises' }, status: :not_found
        end
      end
    end
  end
end
