module Api
  module V1
    class CategoriesController < ApplicationController
      # GET /api/v1/categories
      def index
        categories_json = Rails.cache.fetch("api/v1/categories", expires_in: 1.hour) do
          Category.all.as_json
        end
        render json: categories_json
      end

      # GET /api/v1/categories/:id
      def show
        category_json = Rails.cache.fetch("api/v1/categories/#{params[:id]}", expires_in: 1.hour) do
          Category.find(params[:id]).as_json
        end
        render json: category_json
      end
    end
  end
end
