ActiveAdmin.register Order do
  permit_params :user_id, :total, :status, :delivery_address, :delivery_fee

  index do
    selectable_column
    id_column
    column :user
    column :total do |order|
      number_to_currency(order.total)
    end
    column :status do |order|
      status_tag order.status
    end
    column :delivery_address
    column :created_at
    actions
  end

  filter :user
  filter :status, as: :select, collection: Order.statuses.keys
  filter :total
  filter :created_at

  form do |f|
    f.inputs do
      f.input :user
      f.input :total
      f.input :status, as: :select, collection: Order.statuses.keys
      f.input :delivery_address
      f.input :delivery_fee
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
