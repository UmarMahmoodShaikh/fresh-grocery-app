module Carts
  class ManageService < ApplicationService
    def initialize(user:, store:)
      @user = user
      @store = store
      @redis = $redis
      
      identifier = @user ? "user:#{@user.id}" : "guest"
      @redis_key = "cart:#{identifier}:#{@store.slug}"
    end

    def add_item(product_id:, quantity: 1)
      current_qty = @redis.hget(@redis_key, product_id).to_i
      @redis.hset(@redis_key, product_id, current_qty + quantity)
      @redis.expire(@redis_key, 7.days.to_i)
      success(message: "Item added to cart")
    end

    def remove_item(product_id:)
      @redis.hdel(@redis_key, product_id)
      success(message: "Item removed from cart")
    end

    def clear
      @redis.del(@redis_key)
      success(message: "Cart cleared")
    end

    def view
      raw_items = @redis.hgetall(@redis_key)
      product_ids = raw_items.keys.map(&:to_i)
      products_by_id = Product.includes(:category).where(id: product_ids).index_by(&:id)
      store_products_by_id = @store.store_products.where(product_id: product_ids).index_by(&:product_id)

      items = []
      total_items = 0

      raw_items.each do |product_id_str, qty|
        product_id = product_id_str.to_i
        product = products_by_id[product_id]
        store_product = store_products_by_id[product_id]
        
        # LOUD DEBUG (Visible in rspec output)
        if product.nil? || store_product.nil?
          puts "--- CART_DEBUG: Store #{@store.id} (#{ @store.slug }) ---"
          puts "--- Product ID: #{product_id} (Found: #{!!product}) ---"
          puts "--- StoreProduct: (Found: #{!!store_product}) ---"
          next
        end

        calories = nil
        if product.nutrition.is_a?(Hash)
          calories = product.nutrition["calories"] || product.nutrition["energy"]
        elsif product.nutrition.is_a?(String)
          begin
            parsed = JSON.parse(product.nutrition)
            calories = parsed["calories"] || parsed["energy"]
          rescue
          end
        end

        items << {
          product_id: product_id,
          name: product.name,
          price: (store_product.price || 0.0).to_f,
          quantity: qty.to_i,
          subtotal: ((store_product.price || 0.0).to_f * qty.to_i).to_f,
          image_url: product.image_url,
          category_id: product.category_id,
          category_name: product.category&.name,
          calories: calories ? calories.to_f : nil
        }
        total_items += qty.to_i
      end

      success(items: items, total_items: total_items)
    end

    private

    def identifier
      @user ? "user:#{@user.id}" : "guest"
    end
  end
end
