ActiveAdmin.register Brand do
  permit_params :name, :image_url

  index do
    selectable_column
    id_column
    column :image_url do |brand|
      image_tag brand.image_url, height: '50', style: 'background: #161b22; padding: 5px;' if brand.image_url.present?
    end
    column :name
    column :created_at
    actions
  end

  filter :name
  filter :created_at

  show do
    attributes_table do
      row :id
      row :name
      row :image_url do |brand|
        image_tag brand.image_url, style: 'max-width: 200px; background: #161b22; padding: 10px;' if brand.image_url.present?
      end
      row :created_at
      row :updated_at
    end

    panel "Products by this Brand" do
      table_for brand.products do
        column :name
        column :category
        column :price do |p|
          number_to_currency(p.price)
        end
        column :stock
      end
    end
  end
end
