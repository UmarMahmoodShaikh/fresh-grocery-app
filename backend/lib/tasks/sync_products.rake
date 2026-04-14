require 'net/http'
require 'json'

namespace :db do
  desc "Sync product data from Open Food Facts with high quality images and proper names"
  task sync_products: :environment do
    puts "Syncing products, categories, and brands without deleting existing data..."

    # 1. Define Categories with generated theme-consistent images
    categories_data = [
      { name: "Fruits & Vegetables", query: "fruits vegetables", img: "/categories/fruits.png" },
      { name: "Dairy & Eggs", query: "dairy eggs", img: "/categories/dairy.png" },
      { name: "Bakery", query: "bakery", img: "/categories/bakery.png" },
      { name: "Meat & Seafood", query: "meat seafood", img: "/categories/meat.png" },
      { name: "Beverages", query: "beverages", img: "/categories/beverages.png" },
      { name: "Snacks", query: "snacks", img: "/categories/snacks.png" },
      { name: "Frozen Foods", query: "frozen", img: "/categories/frozen.png" },
      { name: "Pantry", query: "pantry", img: "/categories/pantry.png" },
      { name: "Household", query: "cleaning", img: "/categories/household.png" }
    ]

    # Pre-defined Brand Logos for major brands
    brand_logos = {
      "Nestle" => "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Nestl%C3%A9_text_logo.svg/2560px-Nestl%C3%A9_text_logo.svg.png",
      "Pepsico" => "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/PepsiCo_logo.svg/2560px-PepsiCo_logo.svg.png",
      "Coca-cola" => "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/2560px-Coca-Cola_logo.svg.png",
      "Unilever" => "https://upload.wikimedia.org/wikipedia/en/thumb/b/b1/Unilever.svg/1200px-Unilever.svg.png",
      "Kraft Heinz" => "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/The_Kraft_Heinz_Company_logo.svg/2560px-The_Kraft_Heinz_Company_logo.svg.png",
      "Kellogg's" => "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Kellogg%27s_logo.svg/2560px-Kellogg%27s_logo.svg.png",
      "Mars" => "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Mars_logo.svg/2560px-Mars_logo.svg.png",
      "Mondelez" => "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mondelez_International_logo.svg/2560px-Mondelez_International_logo.svg.png",
      "Tyson" => "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Tyson_Foods_logo.svg/2560px-Tyson_Foods_logo.svg.png",
      "Danone" => "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/DANONE.svg/2560px-DANONE.svg.png",
      "General Mills" => "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/General_Mills_logo.svg/2560px-General_Mills_logo.svg.png"
    }

    categories = {}
    categories_data.each do |cat|
      c = Category.find_or_initialize_by(name: cat[:name])
      c.image_url = cat[:img]
      c.save!
      categories[cat[:name]] = c
    end

    # 2. Fetch products for each category from Open Food Facts
    categories_data.each do |cat|
      puts "\nFetching products for #{cat[:name]}..."
      url = "https://world.openfoodfacts.org/cgi/search.pl?search_terms=#{cat[:query].gsub(' ', '%20')}&search_simple=1&action=process&json=1&page_size=15"
      
      begin
        uri = URI(url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.verify_mode = OpenSSL::SSL::VERIFY_NONE
        
        request = Net::HTTP::Get.new(uri)
        # Adding User-Agent to comply with Open Food Facts API terms
        request["User-Agent"] = "FreshGroceryApp/1.0 (contact@grocerygo.com)"
        
        response = http.request(request)
        
        if response.content_type != "application/json"
          puts "   Failed (Rate limited or HTML error). Skipping..."
          sleep 2
          next
        end

        data = JSON.parse(response.body)
        products = data['products'] || []
        
        products.each do |p_data|
          next if p_data['product_name'].blank?
          next if p_data['image_url'].blank? && p_data['image_front_url'].blank?
          
          # Brand logic (fixed undefined method `strip' for nil error)
          original_brand_name = (p_data['brands'].to_s.presence || "Generic").split(',').first.to_s.strip
          brand_name = original_brand_name.split(' ').map(&:capitalize).join(' ')
          brand_logo = brand_logos[brand_name] || "https://ui-avatars.com/api/?name=#{ERB::Util.url_encode(brand_name)}&background=10b981&color=fff&size=128"
          
          brand = Brand.find_or_initialize_by(name: brand_name)
          brand.image_url = brand_logo
          brand.save!
          
          # Nutrition Info (Extracting key fields)
          nutriments = p_data['nutriments'] || {}
          nutrition_summary = {
            energy: nutriments['energy-kcal_100g'],
            fat: nutriments['fat_100g'],
            carbs: nutriments['carbohydrates_100g'],
            sugars: nutriments['sugars_100g'],
            proteins: nutriments['proteins_100g']
          }
          
          # Description cleaning
          desc = p_data['generic_name'] || p_data['ingredients_text']
          desc = desc.to_s.truncate(500) if desc.present?
          desc = "A premium quality #{p_data['product_name']} item, carefully selected for our customers." if desc.blank?

          # Upsert Product using barcode as unique key
          barcode = p_data['code'].to_s
          
          # Some products don't have barcodes but we still need a key
          next if barcode.blank?
          
          # Weight/Quantity parsing logic
          quantity_str = p_data['quantity'].to_s.downcase
          weight = nil
          weight_unit = nil
          
          if (match = quantity_str.match(/(\d+[\.,]?\d*)\s*(g|kg|ml|l|cl|pcs|pack)/))
            weight = match[1].gsub(',', '.').to_f
            unit_found = match[2]
            
            # Normalize to our consistent system
            weight_unit = case unit_found
                          when 'l' then 'L'
                          when 'ml' then 'ml'
                          when 'g' then 'g'
                          when 'kg' then 'kg'
                          when 'cl' then 'cl'
                          else unit_found
                          end
          end

          product = Product.find_or_initialize_by(barcode: barcode)
          product.name = p_data['product_name'].split(' ').map(&:capitalize).join(' ')
          product.description = desc
          product.image_url = p_data['image_url'] || p_data['image_front_url']
          product.category = categories[cat[:name]]
          product.brand = brand
          product.nutrition = nutrition_summary
          product.weight = weight
          product.weight_unit = weight_unit
          
          if product.new_record?
            product.price = rand(4.99..45.99).round(2)
            product.stock = rand(10..150)
          end
          
          product.save!
          print "✔"
        end
      rescue => e
        puts "\nError fetching #{cat[:name]}: #{e.message}"
      end
      sleep 1 # Be kind to the free API
    end

    puts "\nDatabase sync complete!"
    puts "Total Products: #{Product.count}"
    puts "Total Categories: #{Category.count}"
    puts "Total Brands: #{Brand.count}"
  end
end
