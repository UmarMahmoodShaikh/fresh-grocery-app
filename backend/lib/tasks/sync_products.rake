require 'net/http'
require 'json'

namespace :db do
  desc "Sync product data from Open Food Facts with high quality images and proper names"
  task sync_products: :environment do
    puts "Clearing existing products, categories, and brands..."
    OrderItem.delete_all
    Product.delete_all
    Category.delete_all
    Brand.delete_all

    # 1. Define Categories with generated theme-consistent images
    categories_data = [
      { name: "Fruits & Vegetables", query: "fruits vegetables", img: "/categories/fruits.png" },
      { name: "Dairy & Eggs", query: "dairy eggs", img: "/categories/dairy.png" },
      { name: "Bakery", query: "bakery", img: "/categories/bakery.png" },
      { name: "Meat & Seafood", query: "meat seafood", img: "/categories/meat.png" },
      { name: "Beverages", query: "beverages", img: "/categories/beverages.png" }, # Need placeholder or generate
      { name: "Snacks", query: "snacks", img: "/categories/snacks.png" },
      { name: "Frozen Foods", query: "frozen", img: "/categories/frozen.png" },
      { name: "Pantry", query: "pantry", img: "/categories/pantry.png" },
      { name: "Household", query: "cleaning", img: "/categories/household.png" }
    ]

    # Pre-defined Brand Logos for major brands (Using more reliable sources)
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
      categories[cat[:name]] = Category.create!(
        name: cat[:name],
        image_url: cat[:img]
      )
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
        response = http.request(request)
        data = JSON.parse(response.body)
        
        products = data['products'] || []
        
        products.each do |p_data|
          next if p_data['product_name'].blank?
          next if p_data['image_url'].blank? && p_data['image_front_url'].blank?
          
          # Brand logic
          original_brand_name = (p_data['brands'] || "Generic").split(',').first.strip
          brand_name = original_brand_name.split(' ').map(&:capitalize).join(' ')
          brand_logo = brand_logos[brand_name] || "https://ui-avatars.com/api/?name=#{ERB::Util.url_encode(brand_name)}&background=10b981&color=fff&size=128"
          
          brand = Brand.find_or_create_by!(name: brand_name) do |b|
            b.image_url = brand_logo
          end
          
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
          desc = desc.to_s.truncate(500) if desc
          desc = "A premium quality #{p_data['product_name']} item, carefully selected for our customers." if desc.blank?

          # Create Product
          Product.create!(
            name: p_data['product_name'].split(' ').map(&:capitalize).join(' '),
            description: desc,
            price: rand(4.99..45.99).round(2),
            stock: rand(10..150),
            image_url: p_data['image_url'] || p_data['image_front_url'],
            barcode: p_data['code'],
            category: categories[cat[:name]],
            brand: brand,
            nutrition: nutrition_summary
          )
          print "✔"
        end
      rescue => e
        puts "\nError fetching #{cat[:name]}: #{e.message}"
      end
    end

    puts "\nDatabase sync complete!"
    puts "Total Products: #{Product.count}"
    puts "Total Categories: #{Category.count}"
    puts "Total Brands: #{Brand.count}"
  end
end
