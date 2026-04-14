ActiveAdmin.register Store do
  permit_params :name, :slug, :logo_url, :banner_url, :active, :opening_hours, :delivery_fee, :min_order_amount, :phone, :address, :latitude, :longitude, :logo, :banner

  index do
    selectable_column
    id_column
    column :logo do |store|
      if store.logo.attached?
        image_tag url_for(store.logo), height: '50'
      elsif store.logo_url.present?
        image_tag store.logo_url, height: '50'
      end
    end
    column :name
    column :slug
    column :active
    column :delivery_fee do |store|
      number_to_currency(store.delivery_fee)
    end
    actions
  end

  filter :name
  filter :slug
  filter :active

  form do |f|
    f.inputs "Store Details" do
      f.input :name
      f.input :slug, hint: "Used for URLs/QR codes"
      f.input :logo, as: :file, hint: (f.object.logo.attached? && f.object.logo.persisted?) ? image_tag(url_for(f.object.logo), height: '50') : "No logo"
      f.input :banner, as: :file, hint: (f.object.banner.attached? && f.object.banner.persisted?) ? image_tag(url_for(f.object.banner), height: '100') : "No banner"
      f.input :active
    end
    f.inputs "Operational Rules" do
      f.input :delivery_fee
      f.input :min_order_amount
      f.input :phone
      f.input :address
    end
    f.actions
  end
end
