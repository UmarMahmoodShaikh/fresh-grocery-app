module Api
  module V1
    class ProductsController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :set_product, only: [:show, :update, :destroy]

      # GET /api/v1/products
      # Optional query params: ?brand_id=1  ?category_id=2
      def index
        brand_id    = params[:brand_id]
        category_id = params[:category_id]
        barcode     = params[:barcode]

        cache_key = ["api/v1/products", brand_id, category_id, barcode].compact.join("/")

        products_json = Rails.cache.fetch(cache_key, expires_in: 30.minutes) do
          scope = Product.includes(:category, :brand).all
          scope = scope.where(brand_id: brand_id)       if brand_id.present?
          scope = scope.where(category_id: category_id)  if category_id.present?
          scope = scope.where(barcode: barcode)         if barcode.present?
          scope.as_json(
            methods: [:stock_label],
            include: {
              category: { only: [:id, :name, :image_url] },
              brand:    { only: [:id, :name, :image_url] }
            }
          )
        end
        render json: products_json
      end

      # GET /api/v1/products/:id
      def show
        product_json = Rails.cache.fetch("api/v1/products/#{@product.id}", expires_in: 1.hour) do
          @product.as_json(
            methods: [:stock_label],
            include: { 
              category: { only: [:id, :name, :image_url] }, 
              brand: { only: [:id, :name, :image_url] } 
            }
          )
        end
        render json: product_json
      end

      # POST /api/v1/products
      def create
        if product_params[:barcode].present?
          @product = Product.find_or_initialize_by(barcode: product_params[:barcode])
          success = @product.update(product_params)
        else
          @product = Product.new(product_params)
          success = @product.save
        end

        if success
          Rails.cache.delete("api/v1/products")
          render json: @product, status: @product.previously_new_record? ? :created : :ok
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/products/:id
      def update
        if @product.update(product_params)
          Rails.cache.delete("api/v1/products")
          Rails.cache.delete("api/v1/products/#{@product.id}")
          render json: @product
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/products/:id
      def destroy
        Rails.cache.delete("api/v1/products")
        Rails.cache.delete("api/v1/products/#{@product.id}")
        @product.destroy
        head :no_content
      end

      private

      def set_product
        @product = Product.find(params[:id])
      end

      def product_params
        params.require(:product).permit(:name, :price, :stock, :description, :image_url, :category_id, :brand_id, :barcode, :nutrition)
      end

      def authenticate_user!
        token = request.headers['Authorization']&.split(' ')&.last
        return render json: { error: 'Not Authorized' }, status: :unauthorized unless token

        begin
          decoded = JWT.decode(token, Rails.application.credentials.secret_key_base)[0]
          @current_user = User.find(decoded['user_id'])
          render json: { error: 'Forbidden' }, status: :forbidden unless @current_user.admin?
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound
          render json: { error: 'Not Authorized' }, status: :unauthorized
        end
      end

      def current_user
        @current_user
      end
    end
  end
end
