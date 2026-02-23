ActiveAdmin.register Invoice do
  permit_params :order_id, :total, :status, :invoice_number

  index do
    selectable_column
    id_column
    column :invoice_number
    column :order
    column :total do |invoice|
      number_to_currency(invoice.total)
    end
    column :status do |invoice|
      status_tag invoice.status
    end
    column :created_at
    actions
  end

  filter :invoice_number
  filter :order
  filter :status, as: :select, collection: Invoice.statuses.keys
  filter :total
  filter :created_at

  form do |f|
    f.inputs do
      f.input :order
      f.input :invoice_number, input_html: { readonly: true }
      f.input :total
      f.input :status, as: :select, collection: Invoice.statuses.keys
    end
    f.actions
  end

  show do
    attributes_table do
      row :id
      row :invoice_number
      row :order
      row :total do |invoice|
        number_to_currency(invoice.total)
      end
      row :status do |invoice|
        status_tag invoice.status
      end
      row :created_at
      row :updated_at
    end
  end
end
