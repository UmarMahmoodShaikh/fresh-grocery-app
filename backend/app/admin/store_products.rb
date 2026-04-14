ActiveAdmin.register StoreProduct do
  menu priority: 3, label: "Store Inventory"

  permit_params :store_id, :product_id, :price, :discount_price, :stock
  
  includes :store, product: { image_attachment: :blob }

  controller do
    def find_resource
      scoped_collection.eager_load(:store, product: { image_attachment: :blob }).find(params[:id])
    end
  end

  # Scope to only show products for the admin's assigned store
  scope_to :current_admin_user, association_method: :store_products, unless: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }

  index do
    selectable_column
    id_column
    column :store, if: proc { current_admin_user.super_admin? }
    column :product
    column :price do |sp|
      number_to_currency(sp.price)
    end
    column :discount_price do |sp|
      number_to_currency(sp.discount_price) if sp.discount_price
    end
    column :stock
    actions
  end

  filter :store, if: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }
  filter :product
  filter :price
  filter :stock

  form do |f|
    f.inputs do
      # Only show 'store' input if superadmin
      f.input :store if current_admin_user.super_admin? && current_admin_user.store_id.nil?
      
      # Use hidden field for store_admin if not superadmin
      f.input :store_id, as: :hidden, input_html: { value: current_admin_user.store_id } if current_admin_user.store_id.present?

      f.input :product
      f.input :price
      f.input :discount_price
      f.input :stock
    end
    f.actions
  end
end
