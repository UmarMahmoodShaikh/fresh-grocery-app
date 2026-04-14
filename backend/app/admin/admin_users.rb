ActiveAdmin.register AdminUser do
  permit_params :email, :password, :password_confirmation, :role, :store_id

  # Performance & Security: Scope staff to their own store
  scope_to :current_admin_user, association_method: :admin_users, unless: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }

  index do
    selectable_column
    id_column
    column :email
    column :role do |user|
      status_tag user.role
    end
    column :store, if: proc { current_admin_user.super_admin? }
    column :current_sign_in_at
    column :created_at
    actions
  end

  filter :email
  filter :role, as: :select, collection: AdminUser.roles.keys
  filter :store, if: proc { current_admin_user.super_admin? }

  form do |f|
    f.inputs "Admin Details" do
      f.input :email
      f.input :password if f.object.new_record?
      f.input :password_confirmation if f.object.new_record?
      
      # Role restrictions
      roles = if current_admin_user.super_admin?
                AdminUser.roles.keys
              else
                AdminUser.roles.keys.reject { |r| ["super_admin"].include?(r) }
              end
      f.input :role, as: :select, collection: roles
      
      # Store assignment
      if current_admin_user.super_admin?
        f.input :store
      else
        f.input :store_id, as: :hidden, input_html: { value: current_admin_user.store_id } if f.object.new_record?
      end
    end
    f.actions
  end

  controller do
    def find_resource
      scoped_collection.eager_load(:store).find(params[:id])
    end

    def update
      if params[:admin_user][:password].blank? && params[:admin_user][:password_confirmation].blank?
        params[:admin_user].delete(:password)
        params[:admin_user].delete(:password_confirmation)
      end
      super
    end
  end
end
