ActiveAdmin.register Promotion do
  menu priority: 4

  permit_params :store_id, :title, :description, :starts_at, :ends_at

  scope_to :current_admin_user, association_method: :promotions, unless: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }

  index do
    selectable_column
    id_column
    column :store, if: proc { current_admin_user.super_admin? }
    column :title
    column :starts_at
    column :ends_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :store, if: proc { current_admin_user.super_admin? }
      f.input :store_id, as: :hidden, input_html: { value: current_admin_user.store_id } if proc { current_admin_user.store_id.present? }
      
      f.input :title
      f.input :description
      f.input :starts_at, as: :datetime_picker
      f.input :ends_at, as: :datetime_picker
    end
    f.actions
  end
end
