require 'rails_helper'
require 'rake'

RSpec.describe "db:sync_products", type: :task do
  # Helper to load the rake task
  before :all do
    Rails.application.load_tasks
  end

  let(:rake_task) { Rake::Task["db:sync_products"] }

  before do
    # Clear existing data as the task does
    OrderItem.delete_all
    Product.delete_all
    Category.delete_all
    Brand.delete_all

    # Mock the HTTP response from Open Food Facts
    mock_response = {
      products: [
        {
          product_name: "Mock Apple",
          brands: "MockBrand",
          image_url: "http://example.com/apple.jpg",
          code: "123456789",
          generic_name: "Fresh Red Apple",
          nutriments: {
            "energy-kcal_100g" => 52,
            "fat_100g" => 0.2,
            "carbohydrates_100g" => 14,
            "sugars_100g" => 10,
            "proteins_100g" => 0.3
          }
        }
      ]
    }.to_json

    # Stub Net::HTTP
    http_double = instance_double(Net::HTTP)
    allow(Net::HTTP).to receive(:new).and_return(http_double)
    allow(http_double).to receive(:use_ssl=)
    allow(http_double).to receive(:verify_mode=)
    allow(http_double).to receive(:request).and_return(double(body: mock_response))
  end

  it "clears existing data and syncs new products" do
    # Create some dummy data to ensure it's cleared
    Brand.create!(name: "Old Brand")
    
    # Silence stdout during task execution
    allow($stdout).to receive(:write)

    # Execute the task
    rake_task.invoke
    rake_task.reenable # Allow it to be run again if needed

    # Verification
    expect(Category.count).to eq(9) # Based on categories_data size in rake task
    expect(Brand.count).to eq(1) # Our mock brand
    expect(Product.count).to be >= 1
    
    product = Product.find_by(barcode: "123456789")
    expect(product.name).to eq("Mock Apple")
    expect(product.nutrition["energy"]).to eq(52)
    expect(product.brand.name).to eq("Mockbrand") # Camelized in rake task
  end

  it "handles API errors gracefully" do
    allow(Net::HTTP).to receive(:new).and_raise(StandardError.new("Network failure"))
    allow($stdout).to receive(:write)

    expect { rake_task.invoke }.not_to raise_error
    rake_task.reenable
  end
end
