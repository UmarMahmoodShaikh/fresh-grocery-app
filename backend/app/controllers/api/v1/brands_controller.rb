module Api
  module V1
    class BrandsController < ApplicationController
      def index
        @brands = Brand.all
        render json: @brands
      end

      def show
        @brand = Brand.find(params[:id])
        render json: @brand
      end
    end
  end
end
