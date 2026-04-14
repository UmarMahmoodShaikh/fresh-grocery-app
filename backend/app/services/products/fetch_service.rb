module Products
  class FetchService < ApplicationService
    def initialize(store:, params:)
      @store = store
      @params = params
    end

    def call
      # Only get products that haven't been archived (discarded)
      base_scope = @store.store_products.joins(:product).merge(Product.kept).includes(:product)

      if @params[:id]
        store_product = base_scope.find_by(product_id: @params[:id])
        return failure("Product not found or has been archived", :not_found) unless store_product
        
        success(product: format_product_response(store_product))
      else
        store_products = base_scope
        
        # Optional: Add filters for brand_id and category_id if present in @params
        
        products_response = store_products.map do |sp|
          format_product_response(sp)
        end
        
        success(products: products_response)
      end
    end

    private

    def format_product_response(store_product)
      product = store_product.product
      {
        id: product.id,
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        barcode: product.barcode,
        nutrition: product.nutrition,
        category_id: product.category_id,
        brand_id: product.brand_id,
        price: store_product.price,
        discount_price: store_product.discount_price,
        effective_price: store_product.effective_price,
        stock: store_product.stock,
        stock_label: store_product.stock_label,
        in_stock: store_product.in_stock?
      }
    end
  end
end
