ActiveAdmin.register User do
  permit_params :email, :password, :password_confirmation, :role

  index do
    selectable_column
    id_column
    column :email
    column :role do |user|
      status_tag user.role
    end
    column :created_at
    actions
  end

  filter :email
  filter :role, as: :select, collection: User.roles.keys
  filter :created_at

  form do |f|
    f.inputs do
      f.input :email
      f.input :password
      f.input :password_confirmation
      f.input :role, as: :select, collection: User.roles.keys
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :email
      row :role do |user|
        status_tag user.role
      end
      row :created_at
      row :updated_at
    end

    panel "Orders" do
      table_for user.orders.order(created_at: :desc).limit(10) do
        column :id do |order|
          link_to "##{order.id}", admin_order_path(order)
        end
        column :status do |order|
          status_tag order.status
        end
        column :total do |order|
          number_to_currency(order.total)
        end
        column :created_at
      end
    end
  end
end
