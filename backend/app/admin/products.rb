ActiveAdmin.register Product do
  permit_params :name, :price, :stock, :description, :image_url, :category_id, :brand_id, :barcode, :nutrition, :weight, :weight_unit, :image

  # Soft Delete Scopes
  scope :active, -> { kept }, default: true
  scope :archived, -> { discarded }
  scope :all

  # Custom Actions for Discard
  member_action :discard, method: :put do
    resource.discard
    redirect_to resource_path, notice: "Product archived successfully."
  end

  member_action :undiscard, method: :put do
    resource.undiscard
    redirect_to resource_path, notice: "Product restored successfully."
  end

  action_item :discard, only: :show, if: proc { resource.kept? } do
    link_to 'Archive Product', discard_admin_product_path(resource), method: :put, data: { confirm: 'Are you sure you want to archive this product?' }
  end

  action_item :undiscard, only: :show, if: proc { resource.discarded? } do
    link_to 'Restore Product', undiscard_admin_product_path(resource), method: :put
  end

  # Performance Optimization: Eager Load associations to avoid N+1 queries
  includes :category, :brand, image_attachment: :blob

  controller do
    def find_resource
      scoped_collection.eager_load(:category, :brand, image_attachment: :blob).find(params[:id])
    end
  end

  index do
    selectable_column
    id_column
    column :image do |product|
      if product.image.attached?
        image_tag url_for(product.image), height: '50'
      elsif product.image_url.present?
        image_tag product.image_url, height: '50'
      end
    end
    column :name
    column :brand
    column :category
    column :weight do |product|
      product.display_weight
    end
    column :price do |product|
      number_to_currency(product.price)
    end
    column :stock
    column :created_at
    actions
  end

  filter :name
  filter :brand
  filter :category
  filter :weight
  filter :weight_unit, as: :select, collection: Product::WEIGHT_UNITS.map(&:reverse)
  filter :price
  filter :stock
  filter :created_at

  form do |f|
    f.inputs do
      f.input :name
      f.input :brand, as: :select, collection: Brand.all
      f.input :category, as: :select, collection: Category.all
      f.input :description
      f.input :weight, label: "Weight / Quantity"
      f.input :weight_unit, as: :select, collection: Product::WEIGHT_UNITS, include_blank: "Select Unit"
      f.input :price
      f.input :stock
      f.input :image, as: :file, hint: (f.object.image.attached? && f.object.image.persisted?) ? image_tag(url_for(f.object.image), height: '100') : content_tag(:span, "No image uploaded")
      f.input :image_url, label: "External Image URL", hint: "Fallback if no file is uploaded"
      f.input :barcode
      f.input :nutrition, as: :text
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :image do |product|
        if product.image.attached?
          image_tag url_for(product.image), height: '200'
        elsif product.image_url.present?
          image_tag product.image_url, height: '200'
        end
      end
      row :name
      row :brand
      row :category
      row :description
      row :weight do |p|
        p.display_weight
      end
      row :price do |product|
        number_to_currency(product.price)
      end
      row :stock
      row :barcode
      row :nutrition
      row :created_at
      row :updated_at
    end
  end
end
