ActiveAdmin.register_page "Dashboard" do
  menu priority: 1, label: "Dashboard"

  content title: "Dashboard" do
    div class: "dashboard-stats", style: "display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;" do
      div class: "stat-card", style: "background: #161b22; border: 1px solid #10b981; border-radius: 8px; padding: 25px;" do
        h4 "TOTAL REVENUE", style: "color: #10b981; font-size: 0.75rem; text-transform: uppercase; margin: 0 0 10px 0; font-weight: 600;"
        h2 number_to_currency(Order.sum(:total)), style: "color: #fff; font-size: 2rem; margin: 0; font-weight: 700;"
      end
      div class: "stat-card", style: "background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 25px;" do
        h4 "TOTAL INVOICES", style: "color: #8b949e; font-size: 0.75rem; text-transform: uppercase; margin: 0 0 10px 0; font-weight: 600;"
        h2 Invoice.count, style: "color: #fff; font-size: 2rem; margin: 0; font-weight: 700;"
      end
      div class: "stat-card", style: "background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 25px;" do
        h4 "CUSTOMERS", style: "color: #8b949e; font-size: 0.75rem; text-transform: uppercase; margin: 0 0 10px 0; font-weight: 600;"
        h2 User.count, style: "color: #fff; font-size: 2rem; margin: 0; font-weight: 700;"
      end
      div class: "stat-card", style: "background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 25px;" do
        h4 "AVG ORDER VALUE", style: "color: #8b949e; font-size: 0.75rem; text-transform: uppercase; margin: 0 0 10px 0; font-weight: 600;"
        h2 number_to_currency(Order.average(:total) || 0), style: "color: #fff; font-size: 1.5rem; margin: 5px 0 0 0; font-weight: 700;"
      end
    end

    columns do
      column span: 3 do
        panel "Revenue Performance (Weekly)" do
          div style: "padding: 20px; background: #161b22; border-radius: 8px;" do
            column_chart Invoice.group_by_week(:created_at).sum(:total), 
                         prefix: "$", 
                         colors: ["#10b981"],
                         library: {
                           plugins: {
                             legend: { display: false }
                           },
                           scales: {
                             y: { ticks: { color: "#8b949e" }, grid: { color: "#30363d" } },
                             x: { ticks: { color: "#8b949e" }, grid: { display: false } }
                           }
                         }
          end
        end
      end
      
      column do
        panel "Orders Summary (This Month)" do
          div style: "padding: 20px; background: #161b22; border-radius: 8px;" do
            pie_chart Order.group(:status).count, 
                      colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b949e"],
                      library: {
                        plugins: {
                          legend: { position: 'bottom', labels: { color: "#8b949e" } }
                        }
                      }
          end
        end
      end
    end

    columns do
      column span: 2 do
        panel "Today's Order Pulse", class: "interactive-orders-panel" do
          div class: "tabs-header", style: "display: flex; gap: 10px; margin-bottom: 20px;" do
            a "Total Today (#{Order.where('created_at >= ?', Time.zone.now.beginning_of_day).count})", 
              href: "#", class: "status-tab active", onclick: "filterOrders('all')",
              style: "padding: 8px 16px; background: #30363d; color: #fff; border-radius: 6px; text-decoration: none; font-size: 0.85rem;"
            
            a "Pending (#{Order.where('created_at >= ?', Time.zone.now.beginning_of_day).where(status: :pending).count})", 
              href: "#", class: "status-tab", onclick: "filterOrders('pending')",
              style: "padding: 8px 16px; background: #161b22; color: #f59e0b; border: 1px solid #f59e0b; border-radius: 6px; text-decoration: none; font-size: 0.85rem;"
            
            a "Completed (#{Order.where('created_at >= ?', Time.zone.now.beginning_of_day).where(status: :delivered).count})", 
              href: "#", class: "status-tab", onclick: "filterOrders('delivered')",
              style: "padding: 8px 16px; background: #161b22; color: #10b981; border: 1px solid #10b981; border-radius: 6px; text-decoration: none; font-size: 0.85rem;"
          end

          div class: "orders-list-today" do
            table_for Order.where('created_at >= ?', Time.zone.now.beginning_of_day).includes(:user).order(created_at: :desc) do
              column("ID") { |order| link_to "##{order.id}", admin_order_path(order) }
              column("User") { |order| order.user&.email }
              column("Total") { |order| number_to_currency(order.total) }
              column("Status") { |order| status_tag order.status }
            end
          end

          script do
            raw <<~JS
              window.filterOrders = function(status) {
                const rows = document.querySelectorAll('.orders-list-today tr');
                const tabs = document.querySelectorAll('.status-tab');
                
                tabs.forEach(t => t.style.background = '#161b22');
                event.target.style.background = '#30363d';

                rows.forEach((row, index) => {
                  if (index === 0) return; // Skip header
                  const statusTag = row.querySelector('.status_tag');
                  if (!statusTag) return;
                  
                  const rowStatus = statusTag.innerText.toLowerCase();
                  if (status === 'all' || rowStatus === status) {
                    row.style.display = '';
                  } else {
                    row.style.display = 'none';
                  }
                });
              }
            JS
          end
        end
      end

      column do
        panel "Top Selling Products" do
          table_for OrderItem.joins(:product).group('products.name').order('count_all desc').limit(5).count do
            column("Product") { |name, count| name }
            column("Sales") { |name, count| count }
          end
        end
      end
    end
  end
end
