import React, { useState, useEffect } from 'react';
import { customerService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CustomerAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerUsageData, setCustomerUsageData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterParams, setFilterParams] = useState({
    serviceId: '',
    customerSegment: ''
  });

  const { isAdmin, isStaff } = useAuth();

  const canRead = () => {
    return isAdmin() || isStaff();
  };

  useEffect(() => {
    if (canRead()) {
      loadAnalysisData();
    }
  }, []);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      console.log('Analiz verileri yükleniyor...');
      // Backend: IncludeInactiveCustomers = true (tüm müşterileri dahil et)
      const response = await customerService.getServiceAnalysis(true);
      console.log('Analiz response:', response);
      const data = response.data?.data || response.data;
      console.log('Analiz data:', data);
      setAnalysisData(data);
    } catch (error) {
      console.error('Analiz verileri yüklenirken hata:', error);
      console.error('Error details:', error.response?.data);
      alert('Analiz verileri yüklenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerUsage = async (customerId) => {
    if (!customerId) {
      console.error('Müşteri ID bulunamadı');
      alert('Müşteri ID bulunamadı!');
      return;
    }
    
    try {
      console.log('Müşteri kullanım verileri yükleniyor, ID:', customerId);
      const response = await customerService.getServiceUsage(customerId);
      console.log('Müşteri usage response:', response);
      setCustomerUsageData(response.data?.data || response.data);
      setSelectedCustomer(customerId);
    } catch (error) {
      console.error('Müşteri kullanım verileri yüklenirken hata:', error);
      console.error('Error details:', error.response?.data);
      alert('Müşteri kullanım verileri yüklenirken hata oluştu!');
    }
  };

  const loadFilteredData = async () => {
    try {
      const params = {};
      if (filterParams.serviceId) params.serviceId = filterParams.serviceId;
      // Backend: GetServiceUsageByCustomerQuery sadece ServiceId parametresi kullanıyor
      // customerSegment parametresi backend'de desteklenmiyor
      
      console.log('Filtrelenmiş veriler yükleniyor, params:', params);
      const response = await customerService.getServiceUsageByCustomer(params);
      console.log('Filtrelenmiş response:', response);
      setFilteredData(response.data?.data || response.data);
    } catch (error) {
      console.error('Filtrelenmiş veriler yüklenirken hata:', error);
      console.error('Error details:', error.response?.data);
      alert('Filtrelenmiş veriler yüklenirken hata oluştu!');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (!canRead()) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600 text-lg">Bu sayfaya erişim yetkiniz bulunmamaktadır.</div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Müşteri-Hizmet Analizi</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
Müşteri Listesi
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hizmet Analizi
          </button>
          <button
            onClick={() => setActiveTab('filtered')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'filtered'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Filtrelenmiş Analiz
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analysisData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Toplam Müşteri */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                <p className="text-2xl font-semibold text-gray-900">{analysisData?.summary?.totalCustomers || 0}</p>
              </div>
            </div>
          </div>

          {/* Toplam Gelir */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(analysisData?.summary?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Aktif Müşteri */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif Müşteri</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analysisData?.customerUsages?.filter(c => c.totalSpent > 0).length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Kural 28: En az bir ödenmiş faturası olan müşteriler</p>
              </div>
            </div>
          </div>

          {/* Ortalama Değer */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ortalama Değer</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(analysisData?.summary?.averageSpendingPerCustomer || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Tab */}
      {activeTab === 'customers' && analysisData && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Müşteri Listesi</h3>
            <p className="text-sm text-gray-500 mt-1">
              Toplam {analysisData?.customerUsages?.length || 0} müşteri bulundu
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Aktif: En az bir ödenmiş faturası olan müşteriler | Pasif: Henüz ödenmiş faturası olmayan müşteriler
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Harcama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet Sayısı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisData?.customerUsages && analysisData.customerUsages.length > 0 ? (
                  analysisData.customerUsages.map((customer) => (
                    <tr key={customer.customerId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                        <div className="text-sm text-gray-500">#{customer.customerId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.totalSpent > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.totalSpent > 0 ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.totalServicesUsed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => loadCustomerUsage(customer.customerId)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detay Görüntüle
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Müşteri bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && analysisData && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Hizmet Popülerliği</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analysisData.servicePopularity?.map((service, index) => (
                <div key={service.serviceId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                      <p className="text-xs text-gray-500">{service.customerCount} müşteri</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(service.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">Ortalama: {formatCurrency(service.averagePrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Usage Detail Modal */}
      {customerUsageData && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 md:top-10 mx-auto p-4 md:p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Müşteri Hizmet Kullanım Detayları</h3>
              <button
                onClick={() => setCustomerUsageData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Kapat</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Müşteri Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Müşteri:</span>
                    <span className="font-medium text-gray-900">{customerUsageData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">E-posta:</span>
                    <span className="text-gray-900">{customerUsageData.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Harcama:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(customerUsageData.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Hizmet:</span>
                    <span className="text-gray-900">{customerUsageData.totalServicesUsed || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Durum Bilgileri</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customerUsageData.totalSpent > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customerUsageData.totalSpent > 0 ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {customerUsageData.totalSpent > 0 
                      ? 'Aktif: En az bir ödenmiş faturası var' 
                      : 'Pasif: Henüz ödenmiş faturası yok'
                    }
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Son Kullanım:</span>
                    <span className="text-gray-900">
                      {customerUsageData.serviceUsages?.[0]?.lastUsedDate ? formatDate(customerUsageData.serviceUsages[0].lastUsedDate) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Usage Details */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Hizmet Kullanım Detayları</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanım Sayısı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Tutar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son Kullanım</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerUsageData.serviceUsages?.map((service) => (
                      <tr key={service.serviceId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.serviceName}</div>
                          {service.serviceDescription && (
                            <div className="text-xs text-gray-500">{service.serviceDescription}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {service.usageCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(service.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {service.lastUsedDate ? formatDate(service.lastUsedDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCustomerUsageData(null)}
                className="px-4 py-2 bg-gray-600 text-black rounded-md hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtered Analysis Tab */}
      {activeTab === 'filtered' && (
        <div className="space-y-6">
          {/* Filter Controls */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtre Seçenekleri</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hizmet ID</label>
                <input
                  type="number"
                  value={filterParams.serviceId}
                  onChange={(e) => setFilterParams({...filterParams, serviceId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Hizmet ID girin"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={loadFilteredData}
                className="px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700"
              >
                Filtrele
              </button>
            </div>
          </div>

          {/* Filtered Results */}
          {filteredData && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Filtrelenmiş Sonuçlar</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Harcama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet Sayısı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((customer) => (
                      <tr key={customer.customerId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                          <div className="text-sm text-gray-500">#{customer.customerId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.customerEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.totalServicesUsed || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.totalSpent > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.totalSpent > 0 ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => loadCustomerUsage(customer.customerId)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Detay Görüntüle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerAnalysis;
