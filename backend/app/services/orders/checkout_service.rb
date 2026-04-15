module Orders
  class CheckoutService < ApplicationService
    def initialize(user:, store:, delivery_address: nil, delivery_fee: nil, idempotency_key: nil)
      @user = user
      @store = store
      @delivery_address = delivery_address
      @delivery_fee = delivery_fee || (@store.respond_to?(:delivery_fee) ? @store.delivery_fee : 0.0)
      @idempotency_key = idempotency_key
      
      # Same key format as ManageService
      identifier = @user ? "user:#{@user.id}" : "guest"
      @redis_key = "cart:#{identifier}:#{@store.slug}"
    end

    def call
      # 1. Fetch Cart from Redis (Hash)
      cart_items = $redis.hgetall(@redis_key)
      return failure("Cart is empty", :bad_request) if cart_items.empty?

      begin
        # Wrap in a transaction to ensure no partial checkouts if something fails
        order = nil
        Order.transaction do
          # 1. Verify Stock & Calculate Totals
          total = 0.0
          order_items_data = []

          cart_items.each do |product_id, quantity|
            quantity = quantity.to_i
            # PESSIMISTIC LOCK: Lock this row so no other checkout can touch it (Milk Race)
            # We use lock(true) for pessimistic write lock
            store_product = @store.store_products.lock.find_by(product_id: product_id)
            product = Product.find_by(id: product_id)

            if store_product.nil? || store_product.stock < quantity
              # Use a deliberate error message the spec expects
              raise "Product #{product&.name || 'Unknown'} is out of stock"
            end

            # Accumulate total
            subtotal = store_product.effective_price * quantity
            total += subtotal

            # Prepare order item data
            order_items_data << {
              product: product,
              quantity: quantity,
              price: store_product.price,
              promotion_price: store_product.discount_price
            }

            # Deduct stock
            store_product.update!(stock: store_product.stock - quantity)
          end

          total += @delivery_fee

          # 2. Minimum Order Verification (if column exists)
          min_amount = @store.respond_to?(:min_order_amount) ? @store.min_order_amount : 0.0
          if total < min_amount
            raise "Minimum order amount is #{min_amount}"
          end

          # 3. Create the Order
          # Ensure there is a default address if none provided
          address = @user&.addresses&.find_by(is_default: true)
          
          order = Order.create!(
            user: @user,
            store: @store,
            address: address,
            delivery_address: @delivery_address || address&.street || "Unknown Address",
            delivery_fee: @delivery_fee,
            total: total,
            status: :pending,
            idempotency_key: @idempotency_key
          )

          # 4. Create Order Items
          order_items_data.each do |item_data|
            order.order_items.create!(item_data)
          end

          # 5. Clear the Cart in Redis
          $redis.del(@redis_key)
        end

        success(order: order)
      rescue => e
        failure("Checkout failed: #{e.message}")
      end
    end
  end
end
