require 'rails_helper'

RSpec.describe Product, type: :model do
  let!(:category) { Category.create!(name: "Bakery") }
  let!(:active_product) { Product.create!(name: "Croissant", category: category, price: 1.0) }
  let!(:archived_product) { Product.create!(name: "Old Bread", category: category, price: 0.5) }

  before do
    archived_product.discard # Soft delete
  end

  describe "Discard logic" do
    it "filters out archived products by default using .kept" do
      expect(Product.kept).to include(active_product)
      expect(Product.kept).not_to include(archived_product)
    end

    it "recovers an archived product using .undiscard" do
      archived_product.undiscard
      expect(Product.kept).to include(archived_product)
    end

    it "still exists in the database even when discarded" do
      expect(Product.all).to include(archived_product)
    end
  end
end
