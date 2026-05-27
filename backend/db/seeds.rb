# 1. Base Users (For Mobile App API Login)
[
  { email: 'user@example.com', first_name: 'Standard', last_name: 'User' },
  { email: 'test@example.com', first_name: 'Test', last_name: 'User' },
  { email: 'umar@example.com', first_name: 'Umar', last_name: 'Mahmood' }
].each do |user_data|
  User.find_or_create_by!(email: user_data[:email]) do |user|
    user.password = 'password'
    user.password_confirmation = 'password'
    user.first_name = user_data[:first_name]
    user.last_name = user_data[:last_name]
    user.phone = '+336' + rand(10000000..99999999).to_s
  end
end

# 2. Global Super Admin (Has access to EVERYTHING in ActiveAdmin)
AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
  admin.password = 'password'
  admin.password_confirmation = 'password'
  admin.role = :super_admin # Changed from 'admin' to our new 'super_admin' mapping
end

# 3. Create Demo Stores
carrefour_kremlin = Store.find_or_create_by!(slug: 'carrefour-kremlin') do |store|
  store.name = 'Carrefour - Kremlin Bicetre'
  store.active = true
  store.delivery_fee = 2.99
  store.min_order_amount = 10.00
  store.latitude = 48.8097
  store.longitude = 2.3585
  # A small rectangle around Kremlin Bicetre area
  store.boundary = 'POLYGON((2.3570 48.8080, 2.3600 48.8080, 2.3600 48.8110, 2.3570 48.8110, 2.3570 48.8080))'
end

carrefour = Store.find_or_create_by!(slug: 'carrefour-paris') do |store|
  store.name = 'Carrefour Paris'
  store.active = true
  store.delivery_fee = 5.99
  store.min_order_amount = 20.00
  store.latitude = 48.8738
  store.longitude = 2.2950
  # A small rectangle around the store area (Arc de Triomphe area for demo)
  store.boundary = 'POLYGON((2.2940 48.8730, 2.2960 48.8730, 2.2960 48.8745, 2.2940 48.8745, 2.2940 48.8730))'
end

auchan = Store.find_or_create_by!(slug: 'auchan-lyon') do |store|
  store.name = 'Auchan Lyon'
  store.active = true
  store.delivery_fee = 3.50
  store.min_order_amount = 15.00
  store.latitude = 45.7640
  store.longitude = 4.8357
  # A small rectangle around the store area in Lyon
  store.boundary = 'POLYGON((4.8340 45.7630, 4.8370 45.7630, 4.8370 45.7650, 4.8340 45.7650, 4.8340 45.7630))'
end

# 4. Create Categories
fruits = Category.find_or_create_by!(name: 'Fruits & Vegetables')
bakery = Category.find_or_create_by!(name: 'Bakery')
dairy = Category.find_or_create_by!(name: 'Dairy & Eggs')

# Associate Categories with Stores
[carrefour_kremlin, carrefour, auchan].each do |store|
  [fruits, bakery, dairy].each do |cat|
    StoreCategory.find_or_create_by!(store: store, category: cat)
  end
end

# 5. Create Global Products
banana = Product.find_or_create_by!(name: 'Organic Bananas') do |p|
  p.description = 'Fresh organic bananas from Ecuador.'
  p.category = fruits
end

croissant = Product.find_or_create_by!(name: 'Butter Croissant') do |p|
  p.description = 'Traditional French butter croissant.'
  p.category = bakery
end

milk = Product.find_or_create_by!(name: 'Whole Milk 1L') do |p|
  p.description = 'Fresh whole milk.'
  p.category = dairy
end

# 6. Associate Products with Stores (Store-specific pricing and stock)
# Kremlin Bicetre Prices
StoreProduct.find_or_create_by!(store: carrefour_kremlin, product: banana) { |sp| sp.price = 2.75; sp.stock = 120 }
StoreProduct.find_or_create_by!(store: carrefour_kremlin, product: croissant) { |sp| sp.price = 1.10; sp.stock = 60 }
StoreProduct.find_or_create_by!(store: carrefour_kremlin, product: milk) { |sp| sp.price = 1.45; sp.stock = 250 }

# Carrefour Prices
StoreProduct.find_or_create_by!(store: carrefour, product: banana) { |sp| sp.price = 2.99; sp.stock = 100 }
StoreProduct.find_or_create_by!(store: carrefour, product: croissant) { |sp| sp.price = 1.20; sp.stock = 50 }
StoreProduct.find_or_create_by!(store: carrefour, product: milk) { |sp| sp.price = 1.50; sp.stock = 200 }

# Auchan Prices (Slightly cheaper)
StoreProduct.find_or_create_by!(store: auchan, product: banana) { |sp| sp.price = 2.49; sp.stock = 150 }
StoreProduct.find_or_create_by!(store: auchan, product: croissant) { |sp| sp.price = 0.99; sp.stock = 80 }
StoreProduct.find_or_create_by!(store: auchan, product: milk) { |sp| sp.price = 1.35; sp.stock = 300 }

# 7. Add Banners
Banner.find_or_create_by!(store: carrefour, image_url: 'https://example.com/banners/carrefour_promo.jpg')
Banner.find_or_create_by!(store: auchan, image_url: 'https://example.com/banners/auchan_deals.jpg')

# 8. Admin Roles
AdminUser.find_or_create_by!(email: 'carrefour_manager@example.com') do |admin|
  admin.password = 'password'
  admin.password_confirmation = 'password'
  admin.role = :store_admin
  admin.store = carrefour
end

AdminUser.find_or_create_by!(email: 'carrefour_employee@example.com') do |admin|
  admin.password = 'password'
  admin.password_confirmation = 'password'
  admin.role = :employee
  admin.store = carrefour
end

puts "✅ Seeded Complete Multi-Tenant Environment with Products and Categories!"
puts "Login with:"
puts "-> Global Admin: admin@example.com / password"
puts "-> Store Manager: carrefour_manager@example.com / password"
puts "-> Mobile User: user@example.com / password"