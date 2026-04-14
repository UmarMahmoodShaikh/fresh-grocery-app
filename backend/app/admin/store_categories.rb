ActiveAdmin.register StoreCategory do
  menu priority: 6, label: "Store Categories"

  permit_params :store_id, :category_id

  scope_to :current_admin_user, association_method: :store_categories, unless: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }

  index do
    selectable_column
    id_column
    column :store if current_admin_user.super_admin? && current_admin_user.store_id.nil?
    column :category
    actions
  end

  form do |f|
    f.inputs do
      f.input :store if current_admin_user.super_admin? && current_admin_user.store_id.nil?
      f.input :store_id, as: :hidden, input_html: { value: current_admin_user.store_id } if current_admin_user.store_id.present?
      
      f.input :category
    end
    f.actions
  end
end
