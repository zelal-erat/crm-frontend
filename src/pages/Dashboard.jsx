import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';

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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsRes = await dashboardService.getStats();
      console.log('Dashboard API response:', statsRes);

      // API response yapısına göre doğru veriyi al
      const payload = statsRes.data?.data || statsRes.data || {};
      setStats(payload.stats || payload || {
        totalCustomers: 0,
        totalInvoices: 0,
        totalServices: 0,
        totalRevenue: 0
      });

      setUpcomingInvoices(payload.upcomingInvoices || []);
      setOverdueInvoices(payload.overdueInvoices || []);
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
    } finally {
      setLoading(false);
    }
  };

  // Backend'de "işlendi" endpoint'i olmadığından bu aksiyon kaldırıldı

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Kontrol Paneli</h1>
      
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Fatura</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <span className="text-2xl">🔧</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Hizmet</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalServices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900">₺{stats.totalRevenue?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Yaklaşan Faturalar */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Yaklaşan Faturalar</h2>
        </div>
        <div className="p-6">
          {upcomingInvoices.length === 0 ? (
            <p className="text-gray-500">Yaklaşan fatura bulunmuyor.</p>
          ) : (
            <div className="space-y-4">
              {upcomingInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.customerName}</p>
                    <p className="text-sm text-gray-600">Vade: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₺{invoice.totalAmount}</p>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gecikmiş Faturalar */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Gecikmiş Faturalar</h2>
        </div>
        <div className="p-6">
          {overdueInvoices.length === 0 ? (
            <p className="text-gray-500">Gecikmiş fatura bulunmuyor.</p>
          ) : (
            <div className="space-y-4">
              {overdueInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.customerName}</p>
                    <p className="text-sm text-red-600">Gecikmiş: {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">₺{invoice.totalAmount}</p>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
