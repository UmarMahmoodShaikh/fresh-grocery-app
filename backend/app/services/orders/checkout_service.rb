module Orders
  class CheckoutService < ApplicationService
    def initialize(user:, store:, cart:, delivery_address: nil, delivery_fee: nil, idempotency_key: nil)
      @user = user
      @store = store
      @cart = cart
      @delivery_address = delivery_address
      @delivery_fee = delivery_fee || @store.delivery_fee
      @idempotency_key = idempotency_key
    end

    def call
      # Fetch cart from global Redis
      cart_key = "cart:#{@user.id}:#{@store.slug}"
      cart_data = $redis.get(cart_key)
      cart_items = cart_data ? JSON.parse(cart_data) : {}

      return failure("Cart is empty", :bad_request) if cart_items.empty?

      # Wrap in a transaction to ensure no partial checkouts if something fails
      Order.transaction do
        # 1. Verify Stock & Calculate Totals
        total = 0.0
        order_items_data = []

        cart_items.each do |product_id, quantity|
          quantity = quantity.to_i
          # PESSIMISTIC LOCK: Lock this row so no other checkout can touch it
          store_product = @store.store_products.lock.find_by(product_id: product_id)
          product = Product.find_by(id: product_id)

          if store_product.nil? || store_product.stock < quantity
            raise ActiveRecord::Rollback, "Product #{product.name} is out of stock in this store"
          end

          # Accumulate total using the effective price
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

        # 2. Minimum Order Verification
        if total < @store.min_order_amount
          raise ActiveRecord::Rollback, "Minimum order amount for #{@store.name} is #{@store.min_order_amount}"
        end

        # 3. Create the Order
        order = Order.create!(
          user: @user,
          store: @store,
          address: @user.addresses.find_by(is_default: true), # Adjust address logic as needed
          delivery_address: @delivery_address || @user.addresses.find_by(is_default: true)&.street,
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
        $redis.del(cart_key)

        return success(order: order)
      end

      # Note: Reaches here if rollback occurred (rescue standard errors if needed)
      failure("Checkout failed due to inventory or minimum order constraints")
    rescue Stripe::CardError => e # Example of dealing with payment failures here
      failure("Payment failed: #{e.message}")
    end
  end
end
