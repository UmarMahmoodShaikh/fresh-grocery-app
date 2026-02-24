# Admin User for API
User.find_or_create_by!(email: 'admin@trinity.com') do |user|
  user.password = 'Admin@123'
  user.password_confirmation = 'Admin@123'
  user.role = :admin
  user.first_name = 'Admin'
  user.last_name = 'User'
  user.phone = '+33612345678'
end

# Admin User for ActiveAdmin
AdminUser.find_or_create_by!(email: 'admin@trinity.com') do |admin|
  admin.password = 'Admin@123'
  admin.password_confirmation = 'Admin@123'
  admin.role = :admin
end

# Employee User for ActiveAdmin
AdminUser.find_or_create_by!(email: 'employee@trinity.com') do |admin|
  admin.password = 'Admin@123'
  admin.password_confirmation = 'Admin@123'
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
puts "   API Admin: admin@trinity.com / Admin@123"
puts "   ActiveAdmin: admin@trinity.com / Admin@123"