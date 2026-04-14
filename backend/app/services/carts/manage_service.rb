module Carts
  class ManageService < ApplicationService
    # Key format: cart:{user_id}:{store_slug}
    def initialize(user:, store:)
      @user = user
      @store = store
      @redis_key = "cart:#{@user.id}:#{@store.slug}"
      @redis = $redis
    end

    def add_item(product_id:, quantity: 1)
      store_product = @store.store_products.find_by(product_id: product_id)
      return failure("Product not available in this store", :not_found) unless store_product
      
      # We check stock but don't "block" it
      return failure("Not enough stock currently available", :unprocessable_entity) if store_product.stock < quantity

      # Get current cart from Redis
      cart_data = get_cart
      cart_data[product_id.to_s] = (cart_data[product_id.to_s] || 0) + quantity
      
      save_cart(cart_data)
      success(message: "Item added to Redis cart")
    end

    def remove_item(product_id:)
      cart_data = get_cart
      if cart_data.delete(product_id.to_s)
        save_cart(cart_data)
        success(message: "Item removed")
      else
        failure("Item not found in cart", :not_found)
      end
    end

    def clear
      @redis.del(@redis_key)
      success(message: "Cart cleared")
    end

    def view
      cart_data = get_cart
      warnings = []
      items = []
      total_items = 0

      cart_data.each do |product_id, quantity|
        product = Product.find_by(id: product_id)
        store_product = @store.store_products.find_by(product_id: product_id)

        if product.nil? || store_product.nil?
          cart_data.delete(product_id)
          warnings << "A product is no longer available and was removed."
          next
        end

        # Late stock validation
        if store_product.stock < quantity
          if store_product.stock <= 0
            cart_data.delete(product_id)
            warnings << "#{product.name} is out of stock and was removed."
          else
            quantity = store_product.stock
            cart_data[product_id] = quantity
            warnings << "Quantity for #{product.name} adjusted to #{quantity}."
          end
        end

        if quantity > 0
          items << { product: product, quantity: quantity, price: store_product.effective_price }
          total_items += quantity
        end
      end

      save_cart(cart_data) if warnings.any?

      success(
        items: items,
        total_items: total_items,
        warnings: warnings
      )
    end

    private

    def get_cart
      data = @redis.get(@redis_key)
      data ? JSON.parse(data) : {}
    end

    def save_cart(data)
      if data.empty?
        @redis.del(@redis_key)
      else
        @redis.set(@redis_key, data.to_json)
        # Set expiration to 7 days of inactivity
        @redis.expire(@redis_key, 7.days.to_i)
      end
    end
  end
end
