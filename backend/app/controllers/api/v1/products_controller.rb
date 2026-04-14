module Api
  module V1
    class ProductsController < ApplicationController
      include Authenticatable
      skip_before_action :verify_authenticity_token
      before_action :authenticate_user!, only: [:create, :update, :destroy]
      before_action :require_admin!,      only: [:create, :update, :destroy]
      before_action :set_deprecation_warning
      before_action :set_default_store
      before_action :set_product,        only: [:show, :update, :destroy]

      # GET /api/v1/products
      def index
        brand_id    = params[:brand_id]
        category_id = params[:category_id]
        barcode     = params[:barcode]

        scope = Product.includes(:category, :brand).all
        scope = scope.where(brand_id: brand_id)      if brand_id.present?
        scope = scope.where(category_id: category_id) if category_id.present?
        scope = scope.where(barcode: barcode)         if barcode.present?
        scope = scope.page(params[:page]).per(params[:per_page] || 20)

        # Fallback to Store.first for stock/price logic in V1
        store_products_lookup = @default_store ? @default_store.store_products.where(product_id: scope.pluck(:id)).index_by(&:product_id) : {}

        products_formatted = scope.map do |product|
          sp = store_products_lookup[product.id]
          product.as_json(
            include: { category: { only: [:id, :name, :image_url] }, brand: { only: [:id, :name, :image_url] } }
          ).merge({
            price: sp&.effective_price || 0.0,
            stock: sp&.stock || 0,
            stock_label: sp&.stock_label || "unavailable"
          })
        end

        render json: {
          products: products_formatted,
          meta: {
            current_page: scope.current_page,
            total_pages:  scope.total_pages,
            total_count:  scope.total_count
          }
        }
      end

      # GET /api/v1/products/:id
      def show
        sp = @default_store ? @default_store.store_products.find_by(product_id: @product.id) : nil
        
        product_formatted = @product.as_json(
            include: { category: { only: [:id, :name, :image_url] }, brand: { only: [:id, :name, :image_url] } }
          ).merge({
            price: sp&.effective_price || 0.0,
            stock: sp&.stock || 0,
            stock_label: sp&.stock_label || "unavailable"
          })

        render json: product_formatted
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

      def set_deprecation_warning
        response.headers['Warning'] = '299 - "API V1 is deprecated and will be removed in the future. Please migrate to V2."'
      end

      def set_default_store
        # Fallback for V1 clients unaware of stores
        @default_store = Store.order(:id).first
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
