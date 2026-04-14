# 1. Base Users (For Mobile App API Login)
User.find_or_create_by!(email: 'user@example.com') do |user|
  user.password = 'password'
  user.password_confirmation = 'password'
  user.first_name = 'Standard'
  user.last_name = 'User'
  user.phone = '+33612345678'
end

# 2. Global Super Admin (Has access to EVERYTHING in ActiveAdmin)
AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
  admin.password = 'password'
  admin.password_confirmation = 'password'
  admin.role = :super_admin # Changed from 'admin' to our new 'super_admin' mapping
end

# 3. Create Demo Stores
carrefour = Store.find_or_create_by!(slug: 'carrefour-paris') do |store|
  store.name = 'Carrefour Paris'
  store.active = true
  store.delivery_fee = 5.99
  store.min_order_amount = 20.00
end

auchan = Store.find_or_create_by!(slug: 'auchan-lyon') do |store|
  store.name = 'Auchan Lyon'
  store.active = true
  store.delivery_fee = 3.50
  store.min_order_amount = 15.00
end

# 4. Create Categories
fruits = Category.find_or_create_by!(name: 'Fruits & Vegetables')
bakery = Category.find_or_create_by!(name: 'Bakery')
dairy = Category.find_or_create_by!(name: 'Dairy & Eggs')

# Associate Categories with Stores
[carrefour, auchan].each do |store|
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