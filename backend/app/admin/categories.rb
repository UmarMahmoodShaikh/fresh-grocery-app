ActiveAdmin.register Category do
  permit_params :name, :image_url

  index do
    selectable_column
    id_column
    column :image_url do |category|
      image_tag category.image_url, height: '50' if category.image_url.present?
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
      row :image_url do |category|
        image_tag category.image_url, style: 'max-width: 300px' if category.image_url.present?
      end
      row :created_at
      row :updated_at
    end
    
    panel "Products in this Category" do
      table_for category.products do
        column :name
        column :brand
        column :price do |p|
          number_to_currency(p.price)
        end
        column :stock
      end
    end
  end
end
