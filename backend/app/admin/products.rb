ActiveAdmin.register Product do
  permit_params :name, :price, :stock, :description, :image_url, :category_id, :brand_id, :barcode, :nutrition

  index do
    selectable_column
    id_column
    column :image_url do |product|
      image_tag product.image_url, height: '50', width: '50' if product.image_url.present?
    end
    column :name
    column :brand
    column :category
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
  filter :price
  filter :stock
  filter :created_at

  form do |f|
    f.inputs do
      f.input :name
      f.input :brand, as: :select, collection: Brand.all
      f.input :category, as: :select, collection: Category.all
      f.input :description
      f.input :price
      f.input :stock
      f.input :image_url
      f.input :barcode
      f.input :nutrition, as: :text
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :name
      row :brand
      row :category
      row :description
      row :price do |product|
        number_to_currency(product.price)
      end
      row :stock
      row :image_url do |product|
        image_tag product.image_url, height: '100' if product.image_url.present?
      end
      row :barcode
      row :nutrition
      row :created_at
      row :updated_at
    end
  end
end
