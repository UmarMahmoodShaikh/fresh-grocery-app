require 'open-uri'

namespace :db do
  desc "Migrate all existing product images from external URLs to Cloudinary"
  task migrate_images: :environment do
    puts "🚀 Starting Image Migration to Cloudinary..."
    
    products = Product.where.not(image_url: nil)
    total = products.count
    success_count = 0
    fail_count = 0
    
    puts "📋 Found #{total} products with external image URLs."
    
    products.find_each.with_index(1) do |product, index|
      # Skip if image is already attached via ActiveStorage
      if product.image.attached?
        puts "[#{index}/#{total}] ⏭️ Skipping #{product.name} (Already attached)"
        next
      end

      begin
        puts "[#{index}/#{total}] 🔄 Migrating #{product.name}..."
        
        # Download image from external URL
        downloaded_image = URI.open(product.image_url)
        
        # Attach to Cloudinary via ActiveStorage
        # filename is generated from product ID to ensure uniqueness
        filename = "product_#{product.id}_#{File.basename(product.image_url.split('?').first)}"
        
        product.image.attach(
          io: downloaded_image,
          filename: filename
        )
        
        success_count += 1
        puts "✅ Success!"
      rescue => e
        fail_count += 1
        puts "❌ Failed to migrate #{product.name}: #{e.message}"
      end
    end
    
    puts "----------------------------------------"
    puts "🏁 Migration Finished!"
    puts "✅ Successfully Migrated: #{success_count}"
    puts "❌ Failed: #{fail_count}"
    puts "⏭️  Skipped: #{total - success_count - fail_count}"
    puts "----------------------------------------"
  end
end
