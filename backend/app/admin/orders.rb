ActiveAdmin.register Order do
  permit_params :user_id, :store_id, :total, :status, :delivery_address, :delivery_fee

  includes :user, :store

  controller do
    def find_resource
      scoped_collection.eager_load(:user, :store).find(params[:id])
    end
  end

  scope_to :current_admin_user, association_method: :orders, unless: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }

  index do
    selectable_column
    id_column
    column :store, if: proc { current_admin_user.super_admin? }
    column :user
    column :total do |order|
      number_to_currency(order.total)
    end
    column :status do |order|
      status_tag order.status
    end
    column :delivery_address
    column :score do |order|
      order.score ? "#{order.score} / 5" : "-"
    end
    column :created_at
    actions
  end

  filter :store, if: proc { current_admin_user.super_admin? && current_admin_user.store_id.nil? }
  filter :user
  filter :status, as: :select, collection: Order.statuses.keys
  filter :total
  filter :created_at

  form do |f|
    f.inputs do
      f.input :store if current_admin_user.super_admin? && current_admin_user.store_id.nil?
      f.input :store_id, as: :hidden, input_html: { value: current_admin_user.store_id } if current_admin_user.store_id.present?
      
      f.input :user
      f.input :total
      f.input :status, as: :select, collection: Order.statuses.keys
      f.input :delivery_address
      f.input :delivery_fee
      f.input :score
      f.input :comments
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :user
      row :total do |order|
        number_to_currency(order.total)
      end
      row :status do |order|
        status_tag order.status
      end
      row :delivery_address
      row :delivery_fee do |order|
        number_to_currency(order.delivery_fee) if order.delivery_fee
      end
      row :score
      row :comments
      row :created_at
      row :updated_at
    end

    panel "Order Items" do
      table_for order.order_items do
        column :product
        column :quantity
        column :price do |item|
          number_to_currency(item.price)
        end
        column "Total" do |item|
          number_to_currency(item.quantity * item.price)
        end
      end
    end

    panel "Update Status" do
      render partial: 'admin/orders/status_buttons', locals: { order: order }
    end
  end

  member_action :update_status, method: :patch do
    resource.update(status: params[:status])
    redirect_to admin_order_path(resource), notice: "Status updated to #{params[:status]}"
  end
end
