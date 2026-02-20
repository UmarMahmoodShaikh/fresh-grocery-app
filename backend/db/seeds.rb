# Admin User for API
User.find_or_create_by!(email: 'admin@example.com') do |user|
  user.password = 'password'
  user.password_confirmation = 'password'
  user.role = :admin
end

# Admin User for ActiveAdmin
AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
  admin.password = 'password'
  admin.password_confirmation = 'password'
  admin.role = :admin
end

# Employee User for ActiveAdmin
AdminUser.find_or_create_by!(email: 'employee@example.com') do |admin|
  admin.password = 'password'
  admin.password_confirmation = 'password'
  admin.role = :employee
end

# Sample Products (Commented out as sync:products handles this with the correct schema)
# cat = Category.find_or_create_by!(name: 'Fruits')
# Product.find_or_create_by!(name: 'Apple') do |product|
#   product.price = 1.99
#   product.stock = 100
#   product.description = 'Fresh Apple'
#   product.category = cat
# end

puts "✅ Seeded Admin Users"
puts "   API Admin: admin@example.com / password"
puts "   ActiveAdmin: admin@example.com / password"