import React, { useState, useEffect } from 'react';
import { dashboardService, invoiceService, customerService, serviceService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    totalServices: 0,
    totalRevenue: 0
  });
  const [upcomingInvoices, setUpcomingInvoices] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const { canCreate, canUpdate, canDelete } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, customersRes, servicesRes] = await Promise.all([
        dashboardService.getStats(),
        customerService.getAll(),
        serviceService.getAll()
      ]);
      
      console.log('Dashboard API response:', statsRes);

      // API response yapısına göre doğru veriyi al
      const payload = statsRes.data?.data || statsRes.data || {};
      console.log('Dashboard payload:', payload);
      
      setStats(payload.stats || payload || {
        totalCustomers: 0,
        totalInvoices: 0,
        totalServices: 0,
        totalRevenue: 0
      });

      setUpcomingInvoices(payload.upcomingInvoices || []);
      setOverdueInvoices(payload.overdueInvoices || []);
      
      // Müşteri ve hizmet verilerini al
      const customersData = Array.isArray(customersRes.data?.data?.items)
        ? customersRes.data.data.items
        : Array.isArray(customersRes.data?.data)
        ? customersRes.data.data
        : Array.isArray(customersRes.data)
        ? customersRes.data
        : [];
      const servicesData = Array.isArray(servicesRes.data?.data?.items)
        ? servicesRes.data.data.items
        : Array.isArray(servicesRes.data?.data)
        ? servicesRes.data.data
        : Array.isArray(servicesRes.data)
        ? servicesRes.data
        : [];
      
      setCustomers(customersData);
      setServices(servicesData);
      
      console.log('Upcoming invoices:', payload.upcomingInvoices);
      console.log('Overdue invoices:', payload.overdueInvoices);
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      // Hata durumunda varsayılan değerler
      setStats({
        totalCustomers: 0,
        totalInvoices: 0,
        totalServices: 0,
        totalRevenue: 0
      });
      setUpcomingInvoices([]);
      setOverdueInvoices([]);
      setCustomers([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    if (window.confirm('Bu faturayı ödenmiş olarak işaretlemek istediğinizden emin misiniz?')) {
      try {
        await invoiceService.markAsPaid(invoiceId);
        alert('Fatura başarıyla ödenmiş olarak işaretlendi!');
        loadDashboardData(); // Verileri yenile
      } catch (error) {
        console.error('Fatura ödeme işaretlenirken hata:', error);
        alert('Fatura ödeme işaretlenirken hata oluştu!');
      }
    }
  };

  const handleViewDetails = async (invoiceId) => {
    try {
      const response = await invoiceService.getById(invoiceId);
      setSelectedInvoice(response.data?.data || response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Fatura detayları yüklenirken hata:', error);
      alert('Fatura detayları yüklenirken hata oluştu!');
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.fullName}` : '';
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Bilinmeyen Hizmet';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Kontrol Paneli</h1>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-xl md:text-2xl">👥</span>
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Toplam Müşteri</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-xl md:text-2xl">📄</span>
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Toplam Fatura</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-xl md:text-2xl">🔧</span>
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Toplam Hizmet</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-xl md:text-2xl">💰</span>
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Toplam Gelir</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">₺{stats.totalRevenue?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Yaklaşan Faturalar */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Yaklaşan Faturalar</h2>
        </div>
        <div className="p-4 md:p-6">
          {upcomingInvoices.length === 0 ? (
            <p className="text-gray-500 text-sm md:text-base">Yaklaşan fatura bulunmuyor.</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {upcomingInvoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => handleViewDetails(invoice.id)}>
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-sm md:text-base">{invoice.customerName}</p>
                    <p className="text-xs md:text-sm text-gray-600">Vade: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-sm md:text-base">₺{invoice.totalAmount}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(invoice.id);
                        }}
                        className="px-2 py-1 bg-blue-600 text-black text-xs rounded-md hover:bg-blue-700 transition-colors"
                        title="Detayları Görüntüle"
                      >
                        👁️
                      </button>
                      {canUpdate() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsPaid(invoice.id);
                          }}
                          className="px-2 py-1 bg-green-600 text-black text-xs rounded-md hover:bg-green-700 transition-colors"
                          title="Ödendi Olarak İşaretle"
                        >
                          ✓ 
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gecikmiş Faturalar */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Gecikmiş Faturalar</h2>
        </div>
        <div className="p-4 md:p-6">
          {overdueInvoices.length === 0 ? (
            <p className="text-gray-500 text-sm md:text-base">Gecikmiş fatura bulunmuyor.</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {overdueInvoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors" onClick={() => handleViewDetails(invoice.id)}>
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-sm md:text-base">{invoice.customerName}</p>
                    <p className="text-xs md:text-sm text-red-600">Gecikmiş: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-red-600 text-sm md:text-base">₺{invoice.totalAmount}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(invoice.id);
                        }}
                        className="px-2 py-1 bg-blue-600 text-black text-xs rounded-md hover:bg-blue-700 transition-colors"
                        title="Detayları Görüntüle"
                      >
                        👁️
                      </button>
                      {canUpdate() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsPaid(invoice.id);
                          }}
                          className="px-2 py-1 bg-green-600 text-black text-xs rounded-md hover:bg-green-700 transition-colors"
                          title="Ödendi Olarak İşaretle"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fatura Detay Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 md:top-10 mx-auto p-4 md:p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Fatura Detayları</h3>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Fatura Genel Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Fatura Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fatura No:</span>
                    <span className="font-medium text-gray-900">#{selectedInvoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      selectedInvoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      selectedInvoice.status === 'Cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedInvoice.status === 'Paid' ? 'Ödendi' :
                       selectedInvoice.status === 'Overdue' ? 'Gecikmiş' :
                       selectedInvoice.status === 'Cancelled' ? 'İptal' :
                       'Bekliyor'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Tutar:</span>
                    <span className="font-bold text-gray-900">₺{selectedInvoice.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Oluşturulma:</span>
                    <span className="text-gray-900">{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString('tr-TR') : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Müşteri Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri:</span>
                    <span className="font-medium text-gray-900">{getCustomerName(selectedInvoice.customerId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Açıklama:</span>
                    <span className="text-gray-900">{selectedInvoice.description || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fatura Kalemleri */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Fatura Kalemleri</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Döngü</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim Fiyat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KDV (%)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ara Toplam</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vade Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.items?.map((item, index) => {
                      const subtotal = (item.price * item.quantity) * (1 + item.vat / 100);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{getServiceName(item.serviceId)}</div>
                            {item.description && (
                              <div className="text-xs text-gray-500">{item.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.renewalCycle === 'Monthly' ? 'Aylık' : 'Yıllık'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">₺{item.price}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">%{item.vat}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₺{subtotal.toFixed(2)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.dueDate && item.dueDate !== '0001-01-01T00:00:00' 
                              ? new Date(item.dueDate).toLocaleDateString('tr-TR') 
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Özet */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Toplam Tutar:</span>
                <span className="text-2xl font-bold text-blue-600">₺{selectedInvoice.totalAmount}</span>
              </div>
            </div>

            {/* Modal Kapatma Butonu */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setShowDetailModal(false); setSelectedInvoice(null); }}
                className="px-6 py-2 bg-gray-600 text-black rounded-md hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
