module Api
  module V1
    class ProductsController < ApplicationController
      include Authenticatable
      skip_before_action :verify_authenticity_token
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :require_admin!,      only: [:create, :update, :destroy]
      before_action :set_product,        only: [:show, :update, :destroy]

      # GET /api/v1/products
      # Optional query params: ?brand_id=1  ?category_id=2  ?barcode=X  ?page=1  ?per_page=20
      def index
        brand_id    = params[:brand_id]
        category_id = params[:category_id]
        barcode     = params[:barcode]

        cache_key = ["api/v1/products", brand_id, category_id, barcode, params[:page]].compact.join("/")

        products_json = Rails.cache.fetch(cache_key, expires_in: 30.minutes) do
          scope = Product.includes(:category, :brand).all
          scope = scope.where(brand_id: brand_id)      if brand_id.present?
          scope = scope.where(category_id: category_id) if category_id.present?
          scope = scope.where(barcode: barcode)         if barcode.present?
          scope = scope.page(params[:page]).per(params[:per_page] || 20)

          {
            products: scope.as_json(
              methods: [:stock_label],
              include: {
                category: { only: [:id, :name, :image_url] },
                brand:    { only: [:id, :name, :image_url] }
              }
            ),
            meta: {
              current_page: scope.current_page,
              total_pages:  scope.total_pages,
              total_count:  scope.total_count
            }
          }
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
              brand:    { only: [:id, :name, :image_url] }
            }
          )
        end
        render json: product_json
      end

      # POST /api/v1/products
      def create
        if product_params[:barcode].present?
          @product = Product.find_or_initialize_by(barcode: product_params[:barcode])
          success  = @product.update(product_params)
        else
          @product = Product.new(product_params)
          success  = @product.save
        end

        if success
          bust_product_cache
          render json: @product, status: @product.previously_new_record? ? :created : :ok
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/products/:id
      def update
        if @product.update(product_params)
          bust_product_cache(@product.id)
          render json: @product
        else
          render json: { errors: @product.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/products/:id
      def destroy
        bust_product_cache(@product.id)
        @product.destroy
        head :no_content
      end

      private

      def set_product
        @product = Product.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Product not found" }, status: :not_found
      end

      def product_params
        params.require(:product).permit(:name, :price, :stock, :description, :image_url,
                                        :category_id, :brand_id, :barcode, :nutrition)
      end

      def bust_product_cache(id = nil)
        Rails.cache.delete("api/v1/products")
        Rails.cache.delete("api/v1/products/#{id}") if id
      end
    end
  end
end
